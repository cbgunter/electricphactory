import { useState } from "react";
import { API, REGIONS, ALL_PLAYERS, PLAYOFF_ROUNDS, displayName } from "./data.js";

const C = {
  cream: "#F5F0E8", green: "#004C54", orange: "#D4691C",
  sand: "#EDE6DA", silver: "#5C5955", deep: "#002B30",
};

const ROUND_OPTIONS = [
  { value: "SOUTH", label: "Group — South" },
  { value: "NORTH", label: "Group — North" },
  { value: "QUARTER", label: "Quarterfinal" },
  { value: "SEMI", label: "Semifinal" },
  { value: "FINAL", label: "Final" },
];

function getKey() {
  try { return localStorage.getItem("ep_matchplay_key") || ""; } catch { return ""; }
}
function setKey(k) {
  try { localStorage.setItem("ep_matchplay_key", k); } catch { /* ignore */ }
}

const inputStyle = {
  width: "100%", fontFamily: "'DM Sans'", fontSize: "15px", color: C.green,
  background: C.cream, border: `1px solid ${C.silver}40`, borderRadius: "8px",
  padding: "10px 12px", boxSizing: "border-box",
};
const labelStyle = {
  display: "block", fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 700,
  letterSpacing: "0.06em", textTransform: "uppercase", color: C.silver, marginBottom: "6px",
};

export default function MatchPlayAdmin() {
  const [passcode, setPasscode] = useState(getKey());
  const [round, setRound] = useState("SOUTH");
  const [slot, setSlot] = useState(0);
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [winner, setWinner] = useState("");
  const [differential, setDifferential] = useState("");
  const [status, setStatus] = useState(null); // { ok: bool, msg: string }
  const [submitting, setSubmitting] = useState(false);

  const isPlayoff = round in PLAYOFF_ROUNDS;
  const playerPool = isPlayoff ? ALL_PLAYERS : REGIONS[round].players;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!player1 || !player2 || player1 === player2) {
      setStatus({ ok: false, msg: "Pick two different players." });
      return;
    }
    if (!winner) {
      setStatus({ ok: false, msg: "Pick a winner (or tie)." });
      return;
    }
    if (winner !== "TIE" && !differential) {
      setStatus({ ok: false, msg: "Enter the margin (holes)." });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    setKey(passcode);

    try {
      const res = await fetch(`${API}/matchplay/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: passcode,
          group: round,
          slot: isPlayoff ? slot : undefined,
          player1, player2, winner,
          differential: winner === "TIE" ? 0 : differential,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ ok: false, msg: data.error || "Something went wrong." });
      } else {
        setStatus({ ok: true, msg: "Match saved." });
        setPlayer1(""); setPlayer2(""); setWinner(""); setDifferential("");
      }
    } catch {
      setStatus({ ok: false, msg: "Network error — try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: C.cream, color: C.green, minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "48px 24px 64px" }}>
        <h1 style={{ fontFamily: "'Outfit'", fontSize: "24px", fontWeight: 800, margin: "0 0 4px" }}>
          Match Play — Enter Result
        </h1>
        <p style={{ fontFamily: "'DM Sans'", fontSize: "13px", color: C.silver, margin: "0 0 28px" }}>
          Not linked anywhere — bookmark this page.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={labelStyle}>Round</label>
            <select
              value={round}
              onChange={e => { setRound(e.target.value); setSlot(0); setPlayer1(""); setPlayer2(""); setWinner(""); }}
              style={inputStyle}
            >
              {ROUND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {isPlayoff && (
            <div>
              <label style={labelStyle}>
                {PLAYOFF_ROUNDS[round].label}{PLAYOFF_ROUNDS[round].slots > 1 ? " Slot" : ""}
              </label>
              <select value={slot} onChange={e => setSlot(Number(e.target.value))} style={inputStyle}>
                {Array.from({ length: PLAYOFF_ROUNDS[round].slots }, (_, i) => (
                  <option key={i} value={i}>
                    {PLAYOFF_ROUNDS[round].slots > 1
                      ? `${round === "QUARTER" ? "QF" : "SF"}${i + 1}`
                      : "Final"}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Player 1</label>
              <select value={player1} onChange={e => { setPlayer1(e.target.value); setWinner(""); }} style={inputStyle}>
                <option value="">Select…</option>
                {playerPool.filter(p => p !== player2).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Player 2</label>
              <select value={player2} onChange={e => { setPlayer2(e.target.value); setWinner(""); }} style={inputStyle}>
                <option value="">Select…</option>
                {playerPool.filter(p => p !== player1).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {player1 && player2 && (
            <div>
              <label style={labelStyle}>Winner</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[player1, player2, "TIE"].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setWinner(opt)}
                    style={{
                      flex: 1, fontFamily: "'Outfit'", fontSize: "13px", fontWeight: 600,
                      padding: "10px 8px", borderRadius: "8px", cursor: "pointer",
                      border: `1px solid ${winner === opt ? C.orange : `${C.silver}40`}`,
                      background: winner === opt ? `${C.orange}18` : C.cream,
                      color: winner === opt ? C.orange : C.green,
                    }}
                  >
                    {opt === "TIE" ? "Tie" : displayName(opt)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {winner && winner !== "TIE" && (
            <div>
              <label style={labelStyle}>Margin (holes up, e.g. 5&amp;3 → 5)</label>
              <input
                type="number" min="1" max="18" inputMode="numeric"
                value={differential} onChange={e => setDifferential(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Passcode</label>
            <input
              type="password" value={passcode} onChange={e => setPasscode(e.target.value)}
              style={inputStyle}
            />
          </div>

          {status && (
            <div style={{
              fontFamily: "'DM Sans'", fontSize: "13px", padding: "10px 12px", borderRadius: "8px",
              background: status.ok ? `${C.green}10` : `${C.orange}15`,
              color: status.ok ? C.green : C.orange,
            }}>
              {status.msg}
            </div>
          )}

          <button
            type="submit" disabled={submitting}
            style={{
              fontFamily: "'Outfit'", fontSize: "15px", fontWeight: 700, color: C.cream,
              background: C.green, border: "none", borderRadius: "8px",
              padding: "13px", cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Saving…" : "Save Match"}
          </button>
        </form>
      </div>
    </div>
  );
}
