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

// /submit may only write to these surveys; matchplay rows are written solely via the keyed route.
const ALLOWED_SURVEYS = new Set(["2026-ms"]);
const MAX_ANSWERS_BYTES = 10_000;

const MATCHPLAY_SURVEY_ID = "matchplay-2026-27";
const MATCHPLAY_GROUPS = new Set(["SOUTH", "NORTH"]);
const MATCHPLAY_PLAYOFF_SLOTS = { QUARTER: 4, SEMI: 2, FINAL: 1 };

// Holiday whiskey swap sign-ups (/bourbon-swap). Keep CLOSES_AT in sync with the page.
const BOURBON_SURVEY_ID = "bourbon-swap-2026";
const BOURBON_CLOSES_AT = Date.parse("2026-12-01T08:00:00Z");
const BOURBON_SAMPLES = new Set(["6", "12"]);
const BOURBON_STYLES = {
  "answer-key": "Full Answer Key",
  "list": "List of Included Samples",
  "blind": "Pure Blind Taste",
};
const US_STATES = new Set("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" "));
// "Mike Revak" -> "Mike R." (public list never exposes full names or addresses)
const shortName = (n) => {
  const parts = String(n).trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
};

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
    if (!ALLOWED_SURVEYS.has(surveyId)) return respond(400, { error: "Unknown survey" });
    if (typeof answers !== "object" || Array.isArray(answers) || JSON.stringify(answers).length > MAX_ANSWERS_BYTES)
      return respond(400, { error: "Invalid answers" });

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

  // POST /bourbon/signup
  if (method === "POST" && path === "/bourbon/signup") {
    let body;
    try { body = JSON.parse(event.body || "{}"); }
    catch { return respond(400, { error: "Invalid JSON" }); }

    // Spam checks — silent 200 so bots get no signal
    if (body.company) return respond(200, { success: true });
    if (!body.elapsed || Number(body.elapsed) < 3) return respond(200, { success: true });

    if (Date.now() >= BOURBON_CLOSES_AT) return respond(400, { error: "Sign-ups are closed." });

    const f = (k, max) => stripNewlines(body[k]).slice(0, max);
    const name = f("name", 100);
    const street1 = f("street1", 150);
    const street2 = f("street2", 150);
    const city = f("city", 80);
    const state = f("state", 2).toUpperCase();
    const zip = f("zip", 10);
    const samples = String(body.samples ?? "");
    const style = String(body.style ?? "");
    const notes = String(body.notes ?? "").trim().slice(0, 500);

    if (!name) return respond(400, { error: "Name is required." });
    if (!street1 || !city) return respond(400, { error: "Street address and city are required." });
    if (!US_STATES.has(state)) return respond(400, { error: "Pick a state." });
    if (!/^\d{5}(-\d{4})?$/.test(zip)) return respond(400, { error: "ZIP should be 5 digits." });
    if (!BOURBON_SAMPLES.has(samples)) return respond(400, { error: "Pick 6 or 12 samples." });
    if (!(style in BOURBON_STYLES)) return respond(400, { error: "Pick how you want your samples sent." });

    // Deterministic key on the normalized name: resubmitting replaces your entry instead of duplicating it.
    const responseId = name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!responseId) return respond(400, { error: "Name is required." });

    const submittedAt = new Date().toISOString();
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        surveyId: BOURBON_SURVEY_ID,
        responseId,
        name, street1, street2, city, state, zip, samples, style, notes,
        submittedAt,
      },
    }));

    // Heads-up email to the organizer; the sign-up is already saved, so never fail on this.
    if (CONTACT_TO && CONTACT_FROM) {
      try {
        const address = [street1, street2, `${city}, ${state} ${zip}`].filter(Boolean).join("\n");
        await ses.send(new SendEmailCommand({
          Source: `Electric Phactory <${CONTACT_FROM}>`,
          Destination: { ToAddresses: [CONTACT_TO] },
          Message: {
            Subject: { Data: `Whiskey Swap sign-up — ${name}`, Charset: "UTF-8" },
            Body: {
              Text: {
                Data: `${name}
${address}

Samples: ${samples}
Receive as: ${BOURBON_STYLES[style]}
${notes ? `
Notes: ${notes}
` : ""}`,
                Charset: "UTF-8",
              },
            },
          },
        }));
      } catch (err) {
        console.error("bourbon signup email failed", err);
      }
    }

    return respond(200, { success: true });
  }

  // GET /bourbon/signups — public "who's in" list: short names only, never addresses
  if (method === "GET" && path === "/bourbon/signups") {
    let items = [];
    let lastKey;
    do {
      const result = await ddb.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "surveyId = :sid",
        ExpressionAttributeValues: { ":sid": BOURBON_SURVEY_ID },
        ProjectionExpression: "#n, submittedAt",
        ExpressionAttributeNames: { "#n": "name" },
        ExclusiveStartKey: lastKey,
      }));
      items = items.concat(result.Items || []);
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);

    items.sort((a, b) => String(a.submittedAt).localeCompare(String(b.submittedAt)));
    return respond(200, { names: items.map(it => shortName(it.name)) });
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
    if (!ALLOWED_SURVEYS.has(surveyId)) return respond(400, { error: "Unknown survey" });

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
