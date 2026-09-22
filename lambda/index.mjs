import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { randomUUID } from "crypto";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
const ses = new SESClient({ region: "us-east-1" });
const TABLE = "ep-surveys";

const CONTACT_TO = process.env.CONTACT_TO;
const CONTACT_FROM = process.env.CONTACT_FROM;
const MATCHPLAY_ADMIN_KEY = process.env.MATCHPLAY_ADMIN_KEY;

const MATCHPLAY_SURVEY_ID = "matchplay-2026-27";
const MATCHPLAY_GROUPS = new Set(["SOUTH", "NORTH"]);
const MATCHPLAY_PLAYOFF_SLOTS = { QUARTER: 4, SEMI: 2, FINAL: 1 };

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Content-Type": "application/json",
};

const respond = (status, body) => ({
  statusCode: status,
  headers: cors,
  body: JSON.stringify(body),
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const stripNewlines = (s) => String(s ?? "").replace(/[\r\n]/g, " ").trim();

export const handler = async (event) => {
  const method = event.requestContext?.http?.method ?? event.httpMethod;
  const path = event.rawPath ?? event.path;

  if (method === "OPTIONS") return respond(200, {});

  // POST /submit
  if (method === "POST" && path === "/submit") {
    let body;
    try { body = JSON.parse(event.body || "{}"); }
    catch { return respond(400, { error: "Invalid JSON" }); }

    const { surveyId, answers } = body;
    if (!surveyId || !answers) return respond(400, { error: "Missing surveyId or answers" });

    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        surveyId,
        responseId: randomUUID(),
        answers,
        submittedAt: new Date().toISOString(),
      },
    }));
    return respond(200, { success: true });
  }

  // POST /contact
  if (method === "POST" && path === "/contact") {
    let body;
    try { body = JSON.parse(event.body || "{}"); }
    catch { return respond(400, { error: "Invalid JSON" }); }

    const { name, email, message, company, elapsed } = body;

    // Spam checks — silent 200 so bots get no signal
    if (company) return respond(200, { success: true });
    if (!elapsed || Number(elapsed) < 3) return respond(200, { success: true });

    // Validation
    const trimName = stripNewlines(name);
    const trimEmail = stripNewlines(email);
    const trimMsg = (message ?? "").trim();

    if (!trimName || trimName.length > 100)
      return respond(400, { error: "Name is required (max 100 chars)" });
    if (!trimEmail || !EMAIL_RE.test(trimEmail) || trimEmail.length > 200)
      return respond(400, { error: "Valid email is required" });
    if (!trimMsg || trimMsg.length < 10 || trimMsg.length > 5000)
      return respond(400, { error: "Message must be 10–5000 characters" });

    await ses.send(new SendEmailCommand({
      Source: `Electric Phactory <${CONTACT_FROM}>`,
      Destination: { ToAddresses: [CONTACT_TO] },
      ReplyToAddresses: [trimEmail],
      Message: {
        Subject: { Data: `EP Contact — ${trimName}`, Charset: "UTF-8" },
        Body: {
          Text: {
            Data: `Name: ${trimName}\nEmail: ${trimEmail}\n\n${trimMsg}`,
            Charset: "UTF-8",
          },
        },
      },
    }));

    return respond(200, { success: true });
  }

  // POST /matchplay/submit
  if (method === "POST" && path === "/matchplay/submit") {
    let body;
    try { body = JSON.parse(event.body || "{}"); }
    catch { return respond(400, { error: "Invalid JSON" }); }

    const { key, group, slot, player1, player2, winner, differential } = body;
    if (!MATCHPLAY_ADMIN_KEY || key !== MATCHPLAY_ADMIN_KEY) return respond(403, { error: "Invalid key" });

    const isPlayoff = group in MATCHPLAY_PLAYOFF_SLOTS;
    if (!MATCHPLAY_GROUPS.has(group) && !isPlayoff) return respond(400, { error: "Invalid group" });
    if (!player1 || !player2 || player1 === player2) return respond(400, { error: "Invalid players" });
    if (winner !== "TIE" && winner !== player1 && winner !== player2) return respond(400, { error: "Winner must be player1, player2, or TIE" });

    const diff = winner === "TIE" ? 0 : Math.max(0, parseInt(differential, 10) || 0);

    let responseId;
    if (isPlayoff) {
      const slotNum = parseInt(slot, 10);
      if (!(slotNum >= 0 && slotNum < MATCHPLAY_PLAYOFF_SLOTS[group])) return respond(400, { error: "Invalid slot" });
      responseId = `${group}#slot${slotNum}`;
    } else {
      const [a, b] = [player1, player2].sort();
      responseId = `${group}#${a}#${b}`;
    }

    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        surveyId: MATCHPLAY_SURVEY_ID,
        responseId,
        group, player1, player2, winner, differential: diff,
        updatedAt: new Date().toISOString(),
      },
    }));
    return respond(200, { success: true });
  }

  // GET /matchplay/matches
  if (method === "GET" && path === "/matchplay/matches") {
    let items = [];
    let lastKey;
    do {
      const result = await ddb.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "surveyId = :sid",
        ExpressionAttributeValues: { ":sid": MATCHPLAY_SURVEY_ID },
        ExclusiveStartKey: lastKey,
      }));
      items = items.concat(result.Items || []);
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);

    const matches = items.map(it => {
      const slotMatch = /#slot(\d+)$/.exec(it.responseId || "");
      return {
        group: it.group,
        player1: it.player1,
        player2: it.player2,
        winner: it.winner,
        differential: it.differential,
        isTie: it.winner === "TIE",
        slot: slotMatch ? parseInt(slotMatch[1], 10) : null,
      };
    });

    return respond(200, { matches });
  }

  // GET /results
  if (method === "GET" && path === "/results") {
    const { surveyId, questionId } = event.queryStringParameters || {};
    if (!surveyId || !questionId) return respond(400, { error: "Missing surveyId or questionId" });

    let items = [];
    let lastKey;
    do {
      const result = await ddb.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "surveyId = :sid",
        ExpressionAttributeValues: { ":sid": surveyId },
        ExclusiveStartKey: lastKey,
      }));
      items = items.concat(result.Items || []);
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);

    const counts = {};
    for (const item of items) {
      const ans = item.answers?.[questionId];
      const arr = Array.isArray(ans) ? ans : ans != null ? [ans] : [];
      for (const a of arr) counts[a] = (counts[a] || 0) + 1;
    }
    return respond(200, { counts, total: items.length });
  }

  return respond(404, { error: "Not found" });
};
