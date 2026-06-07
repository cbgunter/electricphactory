import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

const C = {
  cream: "#F5F0E8", green: "#004C54", orange: "#D4691C",
  sand: "#EDE6DA", silver: "#5C5955", deep: "#002B30",
};

// ── Data ────────────────────────────────────────────────────────────────────

const GROUPS = {
  THEJAWNS: {
    name: "The Jawns",
    players: ["Andy Flexon","Craig Boge","Athanasi Kourkoulis","Evan Cannon","Eamon Mccarren","Alan Miteer","Michael Schiliro","Matthew Romond"],
  },
  YOUSEGUNNAS: {
    name: "Youse Gunnas",
    players: ["Mike Revak","Ryan Fogelsong","Corey Gunter","Vishal Kadamandla","Ryan DeAscanis","Brendan Hoover","Bob Taylor","Andrew Crowe"],
  },
  DOWNASHORE: {
    name: "Down a Shore",
    players: ["Ben Chambers","Riley Krupen","Wesley Davis","William James","Kevin Reynolds","Adam Yoder","Jason Bullock","Jeff Grace"],
  },
  WOODERHAZARD: {
    name: "The Wooder Hazards",
    players: ["Matt Tyblewski","Colm Parrish","Adam Bucci","Kiaran Leary","Justin Gannon","Brian Armour","Jake Borer","Jared Keating"],
  },
};

// ── Logic ────────────────────────────────────────────────────────────────────

function parseMatches(text) {
  return text.split("\n").reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return acc;
    const parts = trimmed.split("|").map(p => p.trim());
    if (parts.length === 5) {
      const [group, player1, player2, winner, differential] = parts;
      acc.push({ group, player1, player2, winner, differential: parseInt(differential, 10) || 0, isTie: winner === "TIE" });
    }
    return acc;
  }, []);
}

function calculateStandings(groupKey, players, matches) {
  const standings = players.map(name => ({ name, played: 0, won: 0, tied: 0, lost: 0, points: 0, differential: 0 }));
  matches.filter(m => m.group === groupKey).forEach(match => {
    const p1 = standings.find(s => s.name === match.player1);
    const p2 = standings.find(s => s.name === match.player2);
    if (!p1 || !p2) return;
    p1.played++; p2.played++;
    if (match.isTie) {
      p1.tied++; p2.tied++; p1.points++; p2.points++;
    } else {
      const winner = match.winner === match.player1 ? p1 : p2;
      const loser = match.winner === match.player1 ? p2 : p1;
      winner.won++; winner.points += 3; winner.differential += match.differential;
      loser.lost++; loser.differential -= match.differential;
    }
  });
  standings.sort((a, b) => b.points - a.points || b.differential - a.differential || b.won - a.won);
  standings.forEach((s, i) => {
    s.rank = i + 1;
    const maxPossible = s.points + 3 * Math.max(0, 5 - s.played);
    s.eliminated = standings.filter(o => o.name !== s.name && o.points > maxPossible).length >= 2;
  });
  return standings;
}

function calculateAllStandings(matches) {
  return Object.fromEntries(
    Object.entries(GROUPS).map(([key, g]) => [key, calculateStandings(key, g.players, matches)])
  );
}

function generateBracket(allStandings, matches) {
  const q = key => ({ first: allStandings[key]?.[0]?.name || "TBD", second: allStandings[key]?.[1]?.name || "TBD" });
  const qualified = { THEJAWNS: q("THEJAWNS"), YOUSEGUNNAS: q("YOUSEGUNNAS"), DOWNASHORE: q("DOWNASHORE"), WOODERHAZARD: q("WOODERHAZARD") };

  const byRound = round => matches.filter(m => m.group === round);
  const quarterMatches = byRound("QUARTER");
  const semiMatches = byRound("SEMI");
  const finalMatches = byRound("FINAL");

  function resolveMatch(arr, idx, defaultP1, defaultP2) {
    const m = arr[idx];
    if (m) return { player1: m.player1, player2: m.player2, winner: m.winner === "TBD" ? null : m.winner, differential: m.differential, isTie: m.isTie, completed: !m.isTie && m.winner !== "TBD" };
    return { player1: defaultP1, player2: defaultP2, winner: null, differential: 0, isTie: false, completed: false };
  }

  const bracket = {
    quarters: [
      resolveMatch(quarterMatches, 0, qualified.THEJAWNS.first, qualified.YOUSEGUNNAS.second),
      resolveMatch(quarterMatches, 1, qualified.YOUSEGUNNAS.first, qualified.THEJAWNS.second),
      resolveMatch(quarterMatches, 2, qualified.DOWNASHORE.first, qualified.WOODERHAZARD.second),
      resolveMatch(quarterMatches, 3, qualified.WOODERHAZARD.first, qualified.DOWNASHORE.second),
    ],
    semis: [
      resolveMatch(semiMatches, 0, "TBD", "TBD"),
      resolveMatch(semiMatches, 1, "TBD", "TBD"),
    ],
    final: resolveMatch(finalMatches, 0, "TBD", "TBD"),
  };

  if (bracket.quarters[0].winner && bracket.quarters[1].winner) {
    bracket.semis[0].player1 = bracket.quarters[0].winner;
    bracket.semis[0].player2 = bracket.quarters[1].winner;
  }
  if (bracket.quarters[2].winner && bracket.quarters[3].winner) {
    bracket.semis[1].player1 = bracket.quarters[2].winner;
    bracket.semis[1].player2 = bracket.quarters[3].winner;
  }
  if (bracket.semis[0].winner && bracket.semis[1].winner) {
    bracket.final.player1 = bracket.semis[0].winner;
    bracket.final.player2 = bracket.semis[1].winner;
  }

  return bracket;
}

function fmtDiff(d) { return d === 0 ? "0" : d > 0 ? `+${d}` : `${d}`; }

function displayName(name) {
  if (!name || name === "TBD") return name;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

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
                    {match.differential > 0 ? `${match.differential} up` : "W"}
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
          {match.isTie ? "Halved" : `${displayName(match.winner)} wins${match.differential > 0 ? ` ${match.differential} up` : ""}`}
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

function GroupCard({ groupKey, standings, matches }) {
  const groupData = GROUPS[groupKey];
  const groupMatches = matches.filter(m => m.group === groupKey);
  const totalPlayed = standings.reduce((s, p) => s + p.played, 0) / 2;

  return (
    <div style={{ background: C.sand, borderRadius: "12px", overflow: "hidden" }}>
      <div style={{ background: C.green, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'Outfit'", fontSize: "15px", fontWeight: 700, color: C.cream }}>
          {groupData.name}
        </div>
        <div style={{ fontFamily: "'DM Sans'", fontSize: "12px", color: `${C.cream}70` }}>
          {totalPlayed} of 20 matches
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: `${C.deep}08` }}>
            {["#", "Player", "P", "W", "T", "L", "Pts", "Diff"].map((h, i) => (
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
            const isQ = i < 2;
            const isE = !isQ && s.eliminated;
            return (
              <tr key={s.name} style={{
                background: isQ ? `${C.orange}10` : "transparent",
                opacity: isE ? 0.45 : 1,
                borderBottom: `1px solid ${C.cream}60`,
              }}>
                <td style={{ fontFamily: "'Outfit'", fontSize: "13px", fontWeight: 600, color: isQ ? C.orange : C.silver, padding: "8px 10px", textAlign: "center" }}>
                  {s.rank}
                </td>
                <td style={{ fontFamily: "'Outfit'", fontSize: "13px", fontWeight: isQ ? 700 : 500, color: C.green, padding: "8px 12px 8px 8px" }}>
                  {displayName(s.name)}
                  {isQ && <span style={{ marginLeft: "6px", fontFamily: "'Outfit'", fontSize: "10px", fontWeight: 700, color: C.orange, background: `${C.orange}18`, padding: "1px 5px", borderRadius: "3px" }}>Q</span>}
                  {isE && <span style={{ marginLeft: "6px", fontFamily: "'Outfit'", fontSize: "10px", fontWeight: 700, color: C.silver, background: `${C.silver}18`, padding: "1px 5px", borderRadius: "3px" }}>E</span>}
                </td>
                {[s.played, s.won, s.tied, s.lost, s.points].map((v, ci) => (
                  <td key={ci} style={{ fontFamily: "'DM Sans'", fontSize: "13px", color: C.silver, padding: "8px 10px", textAlign: "center" }}>{v}</td>
                ))}
                <td style={{
                  fontFamily: "'DM Sans'", fontSize: "13px", fontWeight: 600,
                  color: s.differential > 0 ? C.orange : s.differential < 0 ? C.silver : C.silver,
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
            © 2026 Electric Phactory · 50% of entry fees donated to Philabundance
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
    fetch("/matchplay/matches.txt")
      .then(r => r.text())
      .then(text => { setMatches(parseMatches(text)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const allStandings = useMemo(() => calculateAllStandings(matches), [matches]);
  const bracket = useMemo(() => generateBracket(allStandings, matches), [allStandings, matches]);

  const groupPlayComplete = Object.values(allStandings).every(standings =>
    standings.slice(0, 2).every(p => p.played >= 5)
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
            August 2025 – July 2026
          </div>
          <h1 style={{
            fontFamily: "'Outfit'", fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800,
            lineHeight: 1.05, letterSpacing: "-0.04em",
            margin: "0 0 14px", color: C.cream,
          }}>
            EP Match Play
          </h1>
          <p style={{ fontFamily: "'DM Sans'", fontSize: "16px", lineHeight: 1.7, color: `${C.cream}80`, margin: 0, maxWidth: "560px" }}>
            32-player bracket. Four geographic groups, five matches each. Top 2 from each group advance to single-elimination playoffs. Matches at 80% handicap.
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

      {/* ── Bracket ── */}
      <div style={{ background: C.cream, padding: "48px 32px" }}>
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
              : "Bracket seeded from group standings. Quarterfinal slots update as group play finishes."}
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
              <strong>Tiebreakers:</strong> Points → Match Differential → Wins → Head-to-head · Highlighted rows (Q) qualify; faded rows (E) are statistically eliminated.
            </p>
          </div>
        </div>
      </div>

      {/* ── Group Standings ── */}
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
            Round-Robin Standings
          </h2>
          <p style={{ fontFamily: "'DM Sans'", fontSize: "14px", color: C.silver, margin: "0 0 28px", lineHeight: 1.6 }}>
            Each player competes in 5 matches within their group. Top 2 advance to playoffs.
          </p>

          {loading ? (
            <div style={{ fontFamily: "'DM Sans'", color: C.silver, fontSize: "14px" }}>Loading standings…</div>
          ) : (
            <div className="ep-groups-grid">
              {Object.keys(GROUPS).map(key => (
                <GroupCard key={key} groupKey={key} standings={allStandings[key] || []} matches={matches} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
