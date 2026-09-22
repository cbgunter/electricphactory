import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { API, REGIONS, MIN_MATCHES, calculateAllStandings, generateBracket, fmtDiff, displayName } from "./data.js";

const C = {
  cream: "#F5F0E8", green: "#004C54", orange: "#D4691C",
  sand: "#EDE6DA", silver: "#5C5955", deep: "#002B30",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function BracketMatchCard({ match, label, isFinal }) {
  const tbd = match.player1 === "TBD" && match.player2 === "TBD";
  return (
    <div style={{
      background: isFinal ? C.green : C.sand,
      border: isFinal ? `2px solid ${C.orange}` : `1px solid ${C.cream}`,
      borderRadius: "10px",
      padding: "14px 16px",
      minWidth: 0,
    }}>
      {label && (
        <div style={{
          fontFamily: "'Outfit'", fontSize: "10px", fontWeight: 700,
          color: isFinal ? C.orange : C.orange,
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px",
        }}>{label}</div>
      )}
      {tbd ? (
        <div style={{ fontFamily: "'DM Sans'", fontSize: "13px", color: isFinal ? `${C.cream}60` : `${C.silver}80`, fontStyle: "italic" }}>
          Awaiting qualifiers
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {[match.player1, match.player2].map((player, i) => {
            const isWinner = match.completed && match.winner === player;
            const isLoser = match.completed && match.winner && match.winner !== player && !match.isTie;
            return (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "5px 8px", borderRadius: "5px",
                background: isWinner ? `${C.orange}22` : isLoser ? "transparent" : "transparent",
                opacity: isLoser ? 0.5 : 1,
              }}>
                <span style={{
                  fontFamily: "'Outfit'", fontSize: "14px", fontWeight: isWinner ? 700 : 500,
                  color: isFinal ? (isWinner ? C.orange : C.cream) : (isWinner ? C.orange : C.green),
                }}>
                  {displayName(player)}
                </span>
                {isWinner && (
                  <span style={{ fontFamily: "'DM Sans'", fontSize: "11px", color: C.orange, marginLeft: "8px", whiteSpace: "nowrap" }}>
                    W
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {match.completed && !tbd && (
        <div style={{
          marginTop: "8px", paddingTop: "8px",
          borderTop: `1px solid ${isFinal ? `${C.cream}20` : `${C.green}15`}`,
          fontFamily: "'DM Sans'", fontSize: "11px",
          color: isFinal ? `${C.cream}60` : C.silver,
        }}>
          {match.isTie ? "Halved" : `${displayName(match.winner)} wins`}
        </div>
      )}
    </div>
  );
}

function BracketConnector() {
  return (
    <div className="ep-bracket-connector">
      <span style={{ fontFamily: "'Outfit'", fontSize: "18px", color: C.orange, opacity: 0.5 }}>→</span>
    </div>
  );
}

function RoundLabel({ children }) {
  return (
    <div style={{
      fontFamily: "'Outfit'", fontSize: "11px", fontWeight: 700,
      letterSpacing: "0.12em", textTransform: "uppercase",
      color: C.orange, marginBottom: "12px",
    }}>{children}</div>
  );
}

function RegionCard({ regionKey, standings, matches }) {
  const regionData = REGIONS[regionKey];
  const regionMatches = matches.filter(m => m.group === regionKey);

  return (
    <div style={{ background: C.sand, borderRadius: "12px", overflow: "hidden" }}>
      <div style={{ background: C.green, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'Outfit'", fontSize: "15px", fontWeight: 700, color: C.cream }}>
          {regionData.name}
        </div>
        <div style={{ fontFamily: "'DM Sans'", fontSize: "12px", color: `${C.cream}70` }}>
          {regionMatches.length} match{regionMatches.length === 1 ? "" : "es"} played
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: `${C.deep}08` }}>
            {["#", "Player", "P", "W", "T", "L", "Diff"].map((h, i) => (
              <th key={h} style={{
                fontFamily: "'Outfit'", fontSize: "11px", fontWeight: 700,
                color: C.silver, letterSpacing: "0.06em",
                padding: i === 1 ? "8px 12px 8px 8px" : "8px 10px",
                textAlign: i <= 1 ? "left" : "center",
                borderBottom: `1px solid ${C.cream}`,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const isQ = i < 4;
            return (
              <tr key={s.name} style={{
                background: isQ ? `${C.orange}10` : "transparent",
                borderBottom: `1px solid ${C.cream}60`,
              }}>
                <td style={{ fontFamily: "'Outfit'", fontSize: "13px", fontWeight: 600, color: isQ ? C.orange : C.silver, padding: "8px 10px", textAlign: "center" }}>
                  {s.rank}
                </td>
                <td style={{ fontFamily: "'Outfit'", fontSize: "13px", fontWeight: isQ ? 700 : 500, color: C.green, padding: "8px 12px 8px 8px" }}>
                  {displayName(s.name)}
                  {isQ && <span style={{ marginLeft: "6px", fontFamily: "'Outfit'", fontSize: "10px", fontWeight: 700, color: C.orange, background: `${C.orange}18`, padding: "1px 5px", borderRadius: "3px" }}>Q</span>}
                  {s.totalPlayed > s.played && (
                    <span style={{ marginLeft: "6px", fontFamily: "'DM Sans'", fontSize: "10px", color: C.silver }}>
                      (best {s.played} of {s.totalPlayed})
                    </span>
                  )}
                </td>
                {[s.played, s.won, s.tied, s.lost].map((v, ci) => (
                  <td key={ci} style={{ fontFamily: "'DM Sans'", fontSize: "13px", color: C.silver, padding: "8px 10px", textAlign: "center" }}>{v}</td>
                ))}
                <td style={{
                  fontFamily: "'DM Sans'", fontSize: "13px", fontWeight: 600,
                  color: s.differential > 0 ? C.orange : C.silver,
                  padding: "8px 10px", textAlign: "center",
                }}>{fmtDiff(s.differential)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RuleItem({ children }) {
  return (
    <li style={{ fontFamily: "'DM Sans'", fontSize: "14px", lineHeight: 1.75, color: C.green, marginBottom: "8px" }}>
      {children}
    </li>
  );
}

// ── Nav / Footer helpers ──────────────────────────────────────────────────────

function Nav({ menuOpen, setMenuOpen }) {
  return (
    <nav style={{
      borderBottom: `1px solid ${C.sand}`,
      position: "sticky", top: 0, background: `${C.cream}ee`, zIndex: 100,
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
    }}>
      <div style={{
        maxWidth: "1100px", margin: "0 auto",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 32px",
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <img src="/logo.png" alt="Electric Phactory" style={{ width: "34px", height: "34px", objectFit: "contain" }} />
          <span style={{ fontFamily: "'Outfit'", fontWeight: 700, fontSize: "14px", letterSpacing: "0.04em", color: C.green }}>
            ELECTRIC PHACTORY
          </span>
        </Link>
        <div className="ep-nav-links">
          {[["Events", "/#events"], ["About", "/#about"], ["Join", "/#join"]].map(([label, href]) => (
            <a key={label} href={href} style={{
              fontFamily: "'DM Sans'", fontSize: "14px", color: C.silver,
              textDecoration: "none", fontWeight: 500,
            }}>{label}</a>
          ))}
          <span style={{
            fontFamily: "'DM Sans'", fontSize: "14px", color: C.orange,
            fontWeight: 700, borderBottom: `2px solid ${C.orange}`, paddingBottom: "1px",
          }}>Match Play</span>
        </div>
        <button className="ep-hamburger" onClick={() => setMenuOpen(m => !m)} aria-label="Toggle menu">
          <span className="ep-hamburger-line" style={{ background: C.green }} />
          <span className="ep-hamburger-line" style={{ background: C.green }} />
          <span className="ep-hamburger-line" style={{ background: C.green }} />
        </button>
      </div>
      {menuOpen && (
        <div style={{
          borderTop: `1px solid ${C.sand}`, padding: "16px 32px",
          display: "flex", flexDirection: "column", gap: "18px",
          background: `${C.cream}f8`,
        }}>
          {[["Events", "/#events"], ["About", "/#about"], ["Join", "/#join"]].map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)} style={{
              fontFamily: "'DM Sans'", fontSize: "16px", color: C.silver,
              textDecoration: "none", fontWeight: 500,
            }}>{label}</a>
          ))}
          <span style={{ fontFamily: "'DM Sans'", fontSize: "16px", color: C.orange, fontWeight: 700 }}>
            Match Play
          </span>
        </div>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <div style={{ background: C.deep, padding: "40px 32px 28px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <img src="/logo.png" alt="" style={{ width: "26px", height: "26px", objectFit: "contain", opacity: 0.8 }} />
          <div style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: "15px", color: C.cream, letterSpacing: "0.04em" }}>
            ELECTRIC PHACTORY
          </div>
        </div>
        <div style={{ fontFamily: "'Outfit'", fontSize: "11px", fontWeight: 500, color: C.orange, letterSpacing: "0.06em", marginBottom: "16px" }}>
          EST. 2021 · PHILADELPHIA · A NO LAYING UP ROOST
        </div>
        <div style={{ display: "flex", gap: "24px", marginBottom: "20px", flexWrap: "wrap" }}>
          <Link to="/" style={{ fontFamily: "'Outfit'", fontSize: "13px", fontWeight: 600, color: C.orange, textDecoration: "none" }}>Home</Link>
          <a href="/#events" style={{ fontFamily: "'Outfit'", fontSize: "13px", fontWeight: 600, color: C.orange, textDecoration: "none" }}>Schedule</a>
          <a href="/#join" style={{ fontFamily: "'Outfit'", fontSize: "13px", fontWeight: 600, color: C.orange, textDecoration: "none" }}>Join</a>
        </div>
        <div style={{ borderTop: `1px solid ${C.cream}10`, paddingTop: "14px" }}>
          <span style={{ fontFamily: "'DM Sans'", fontSize: "11px", color: `${C.cream}35` }}>
            © 2026 Electric Phactory · Entry fees split between the champion's prize and a charity of their choosing
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MatchPlayPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch(`${API}/matchplay/matches`)
      .then(r => r.json())
      .then(data => { setMatches(data.matches || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const allStandings = useMemo(() => calculateAllStandings(matches), [matches]);
  const bracket = useMemo(() => generateBracket(allStandings, matches), [allStandings, matches]);

  const groupPlayComplete = Object.values(allStandings).every(standings =>
    standings.slice(0, 4).every(p => p.totalPlayed >= MIN_MATCHES)
  );

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: C.cream, color: C.green, minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap" rel="stylesheet" />

      <Nav menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {/* Page header */}
      <div style={{ background: C.green, padding: "48px 32px 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{
            display: "inline-block", fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 600,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: C.orange, background: `${C.orange}18`,
            padding: "6px 12px", borderRadius: "4px", marginBottom: "16px",
          }}>
            August 2026 – July 2027
          </div>
          <h1 style={{
            fontFamily: "'Outfit'", fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800,
            lineHeight: 1.05, letterSpacing: "-0.04em",
            margin: "0 0 14px", color: C.cream,
          }}>
            EP Match Play
          </h1>
          <p style={{ fontFamily: "'DM Sans'", fontSize: "16px", lineHeight: 1.7, color: `${C.cream}80`, margin: 0, maxWidth: "580px" }}>
            North vs. South. Play 5–10 matches within your region — your best 5 results count. Top 4 from each region advance to a single-elimination bracket. Matches at 80% handicap.
          </p>
          <div style={{ display: "flex", gap: "24px", marginTop: "24px", flexWrap: "wrap" }}>
            {[
              { label: "Win", value: "3 pts" },
              { label: "Tie", value: "1 pt" },
              { label: "Loss", value: "0 pts" },
              { label: "Handicap", value: "80%" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontFamily: "'Outfit'", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", color: `${C.cream}50`, textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontFamily: "'Outfit'", fontSize: "20px", fontWeight: 800, color: C.orange }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Format & Rules ── */}
      <div style={{ background: C.cream, padding: "40px 32px 8px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{
            fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 600,
            letterSpacing: "0.14em", textTransform: "uppercase",
            color: C.orange, marginBottom: "8px",
          }}>Quick Reference</div>
          <h2 style={{
            fontFamily: "'Outfit'", fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800,
            letterSpacing: "-0.03em", margin: "0 0 18px", color: C.green,
          }}>
            Format & Rules
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }} className="ep-groups-grid">
            <div>
              <div style={{ fontFamily: "'Outfit'", fontSize: "13px", fontWeight: 700, color: C.orange, marginBottom: "8px" }}>Group Play</div>
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                <RuleItem>Play 5 matches within your region, never facing the same opponent twice.</RuleItem>
                <RuleItem>Once you've played 5, you can play up to 5 more (10 max) — your worst results are thrown out.</RuleItem>
                <RuleItem>Scoring: win = 3 pts, tie = 1 pt, loss = 0 pts.</RuleItem>
                <RuleItem>Tiebreakers: points → match differential → total matches played.</RuleItem>
              </ul>
            </div>
            <div>
              <div style={{ fontFamily: "'Outfit'", fontSize: "13px", fontWeight: 700, color: C.orange, marginBottom: "8px" }}>Playing a Match</div>
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                <RuleItem>Matches are played at 80% handicap for a more equitable field.</RuleItem>
                <RuleItem>Players are responsible for properly assessing strokes using GHIN.</RuleItem>
                <RuleItem>Either player posts the result in #match-play on Slack in a timely manner.</RuleItem>
                <RuleItem>Entry is $10 via Venmo — half to a charity of the champion's choosing, half to the champion as a cash prize.</RuleItem>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bracket ── */}
      <div style={{ background: C.cream, padding: "40px 32px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{
            fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 600,
            letterSpacing: "0.14em", textTransform: "uppercase",
            color: C.orange, marginBottom: "8px",
          }}>Playoff Bracket</div>
          <h2 style={{
            fontFamily: "'Outfit'", fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800,
            letterSpacing: "-0.03em", margin: "0 0 6px", color: C.green,
          }}>
            Quarterfinals → Semifinals → Championship
          </h2>
          <p style={{ fontFamily: "'DM Sans'", fontSize: "14px", color: C.silver, margin: "0 0 28px", lineHeight: 1.6 }}>
            {groupPlayComplete
              ? "Group play complete. Bracket seeded and ready."
              : "Bracket seeded from region standings. Quarterfinal slots update as group play finishes."}
          </p>

          {loading ? (
            <div style={{ fontFamily: "'DM Sans'", color: C.silver, fontSize: "14px" }}>Loading bracket…</div>
          ) : (
            <div className="ep-bracket-grid">
              {/* Quarterfinals */}
              <div className="ep-bracket-round" style={{ flex: 3, gap: "10px" }}>
                <RoundLabel>Quarterfinals</RoundLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {bracket.quarters.slice(0, 2).map((match, i) => (
                    <BracketMatchCard key={i} match={match} label={`QF${i + 1}`} />
                  ))}
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                  {bracket.quarters.slice(2, 4).map((match, i) => (
                    <BracketMatchCard key={i + 2} match={match} label={`QF${i + 3}`} />
                  ))}
                </div>
              </div>

              <BracketConnector />

              {/* Semifinals */}
              <div className="ep-bracket-round" style={{ flex: 3, justifyContent: "space-around" }}>
                <RoundLabel>Semifinals</RoundLabel>
                {bracket.semis.map((match, i) => (
                  <BracketMatchCard key={i} match={match} label={`SF${i + 1}`} />
                ))}
              </div>

              <BracketConnector />

              {/* Final */}
              <div className="ep-bracket-round" style={{ flex: 3, justifyContent: "center" }}>
                <RoundLabel>Championship</RoundLabel>
                <BracketMatchCard match={bracket.final} label="Final" isFinal />
                {bracket.final.completed && bracket.final.winner && (
                  <div style={{
                    marginTop: "16px", padding: "16px", background: C.green,
                    borderRadius: "10px", textAlign: "center",
                    border: `2px solid ${C.orange}`,
                  }}>
                    <div style={{ fontFamily: "'Outfit'", fontSize: "11px", fontWeight: 700, color: C.orange, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>
                      Tournament Champion
                    </div>
                    <div style={{ fontFamily: "'Outfit'", fontSize: "22px", fontWeight: 800, color: C.cream }}>
                      {displayName(bracket.final.winner)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tiebreaker note */}
          <div style={{ marginTop: "20px", padding: "14px 18px", background: `${C.green}08`, borderRadius: "10px", borderLeft: `3px solid ${C.green}30` }}>
            <p style={{ fontFamily: "'DM Sans'", fontSize: "13px", color: C.green, margin: 0, lineHeight: 1.6 }}>
              <strong>Tiebreakers:</strong> Points → Match Differential → Total Matches Played · Highlighted rows (Q) hold a playoff spot — top 4 per region advance.
            </p>
          </div>
        </div>
      </div>

      {/* ── Region Standings ── */}
      <div style={{ background: C.sand, padding: "48px 32px 56px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{
            fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 600,
            letterSpacing: "0.14em", textTransform: "uppercase",
            color: C.orange, marginBottom: "8px",
          }}>Group Play</div>
          <h2 style={{
            fontFamily: "'Outfit'", fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800,
            letterSpacing: "-0.03em", margin: "0 0 6px", color: C.green,
          }}>
            Regional Standings
          </h2>
          <p style={{ fontFamily: "'DM Sans'", fontSize: "14px", color: C.silver, margin: "0 0 28px", lineHeight: 1.6 }}>
            Each player's best 5 results within their region count toward the standings. Top 4 advance to the playoffs.
          </p>

          {loading ? (
            <div style={{ fontFamily: "'DM Sans'", color: C.silver, fontSize: "14px" }}>Loading standings…</div>
          ) : (
            <div className="ep-groups-grid">
              {Object.keys(REGIONS).map(key => (
                <RegionCard key={key} regionKey={key} standings={allStandings[key] || []} matches={matches} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
