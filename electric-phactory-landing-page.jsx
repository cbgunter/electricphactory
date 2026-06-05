import { useState } from "react";

const C = {
  cream: "#F5F0E8", green: "#004C54", orange: "#D4691C",
  sand: "#EDE6DA", silver: "#B8B5AF", deep: "#002B30",
};

const teamEvents = [
  { date: "MAR 22", name: "Opening Event at Town & Country", format: "Two-Man Scramble", hang: "March Madness at Farmers & Bankers Brewing", tag: "Team" },
  { date: "APR 12", name: "Magnolias & Makefield Madness", format: "Two-Man Alternate Shot", hang: "Masters Watch Party at Makefield Public House", tag: "Team" },
  { date: "MAY 30", name: "Rumble at the Rock (Manor)", format: "Two-Man Best Ball", hang: "TBD", tag: "Team" },
  { date: "JUN 13", name: "The Gamble at Jeffersonville", format: "Two-Man 20 Ball", hang: "Burgess Restaurant", tag: "Team" },
];

const indivEvents = [
  { date: "APR 25", name: "The Battle at Broad Run", format: "Individual Quota", hang: "TBD", tag: "Individual" },
  { date: "MAY 3", name: "The Tussle at Glen Mills", format: "Individual Quota", hang: "TBD", tag: "Individual" },
  { date: "MAY 16", name: "PGA Pick 'Em at Paxon Hollow", format: "Pick-a-Pro + PGA Championship", hang: "Watch Party at Anthony's", tag: "Individual" },
  { date: "JUN 28", name: "The EP Open at Wyncote", format: "Pick-a-Pro + U.S. Open", hang: "Watch Party at The Terrace", tag: "Individual" },
];

const specialEvents = [
  { date: "JUL", name: "The Steeplechase", sub: "Annual Roost Major at Jeffersonville — NIT qualifier, Regional Team selection, open to public" },
  { date: "AUG 1–2", name: "Northeast Regionals", sub: "Bethpage Yellow & Green vs. RACDG NYC, Charm City, Boston Tee Party" },
  { date: "OCT 2", name: "Roost Club Championship", sub: "Sweetens Cove, Tennessee — Regional winners compete for eternal glory" },
  { date: "FALL", name: "EP Ryder Cup", sub: "Foursomes, four-ball, and singles over a full weekend" },
];

const mapCities = [
  { name: "Philadelphia", x: 310, y: 165, main: true },
  { name: "Lancaster", x: 55, y: 110, main: false },
  { name: "Newtown", x: 370, y: 55, main: false },
  { name: "Glassboro", x: 340, y: 320, main: false },
  { name: "Wilmington", x: 225, y: 280, main: false },
  { name: "Oxford", x: 130, y: 265, main: false },
];

const mapCourses = [
  { name: "Wyncote", x: 330, y: 120 },
  { name: "Jeffersonville", x: 265, y: 100 },
  { name: "Glen Mills", x: 250, y: 200 },
  { name: "Broad Run", x: 185, y: 170 },
  { name: "Paxon Hollow", x: 290, y: 165 },
  { name: "Town & Country", x: 340, y: 75 },
  { name: "Rock Manor", x: 230, y: 270 },
];

const RegionMap = () => (
  <svg viewBox="0 0 460 380" style={{ width: "100%", maxWidth: "460px" }}>
    <defs>
      <radialGradient id="heatGrad" cx="65%" cy="45%" r="55%">
        <stop offset="0%" stopColor={C.orange} stopOpacity="0.35" />
        <stop offset="50%" stopColor={C.green} stopOpacity="0.18" />
        <stop offset="100%" stopColor={C.green} stopOpacity="0.06" />
      </radialGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <polygon
      points="55,110 370,55 340,320 225,280 130,265"
      fill="url(#heatGrad)"
      stroke={C.green}
      strokeWidth="1.5"
      strokeOpacity="0.3"
      strokeDasharray="6,4"
    />
    {mapCourses.map((c, i) => (
      <g key={i}>
        <circle cx={c.x} cy={c.y} r="4" fill={C.orange} opacity="0.7" />
        <text x={c.x + 7} y={c.y + 3} fontSize="8" fill={C.silver} fontFamily="'DM Sans'">{c.name}</text>
      </g>
    ))}
    {mapCities.map((c, i) => (
      <g key={i}>
        <circle cx={c.x} cy={c.y} r={c.main ? 7 : 4} fill={c.main ? C.orange : C.green} filter={c.main ? "url(#glow)" : undefined} />
        <text x={c.x + (c.main ? 12 : 8)} y={c.y + 4} fontSize={c.main ? "12" : "10"} fontWeight={c.main ? "700" : "400"} fill={c.main ? C.green : C.silver} fontFamily="'Outfit'">{c.name}</text>
      </g>
    ))}
    <text x="10" y="370" fontSize="8" fill={C.silver} fontFamily="'DM Sans'" opacity="0.5">Coverage area — zip code heatmap coming soon</text>
  </svg>
);

const Section = ({ children, bg, id }) => (
  <div id={id} style={{ background: bg || C.cream, padding: "48px 20px" }}>{children}</div>
);

const SectionLabel = ({ children }) => (
  <div style={{
    fontFamily: "'Outfit'", fontSize: "10px", fontWeight: 600,
    letterSpacing: "0.14em", textTransform: "uppercase",
    color: C.orange, marginBottom: "8px",
  }}>{children}</div>
);

const H2 = ({ children, light }) => (
  <h2 style={{
    fontFamily: "'Outfit'", fontSize: "26px", fontWeight: 800,
    lineHeight: 1.1, letterSpacing: "-0.03em",
    margin: "0 0 14px", color: light ? C.cream : C.green,
  }}>{children}</h2>
);

const Body = ({ children, light }) => (
  <p style={{
    fontFamily: "'DM Sans'", fontSize: "14px", lineHeight: 1.7,
    color: light ? `${C.cream}80` : C.silver, margin: "0 0 16px", maxWidth: "520px",
  }}>{children}</p>
);

const EventCard = ({ event }) => (
  <div style={{
    background: C.sand, borderRadius: "10px", padding: "14px",
    display: "flex", gap: "12px", alignItems: "flex-start",
    borderLeft: `3px solid ${event.tag === "Individual" ? C.green : C.orange}40`,
    marginBottom: "8px",
  }}>
    <div style={{
      background: C.green, borderRadius: "6px", padding: "6px 8px",
      textAlign: "center", flexShrink: 0, minWidth: "44px",
    }}>
      <div style={{ fontFamily: "'Outfit'", fontSize: "9px", fontWeight: 600, color: C.orange, letterSpacing: "0.06em" }}>
        {event.date.split(" ")[0]}
      </div>
      <div style={{ fontFamily: "'Outfit'", fontSize: "16px", fontWeight: 800, color: C.cream, lineHeight: 1.1 }}>
        {event.date.split(" ")[1]}
      </div>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: "'Outfit'", fontSize: "13px", fontWeight: 700, color: C.green, marginBottom: "2px" }}>
        {event.name}
      </div>
      <div style={{ fontFamily: "'DM Sans'", fontSize: "12px", color: C.silver, marginBottom: "5px" }}>
        {event.format}
      </div>
      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{
          fontFamily: "'Outfit'", fontSize: "9px", fontWeight: 600,
          background: event.tag === "Individual" ? `${C.green}12` : `${C.orange}14`,
          color: event.tag === "Individual" ? C.green : C.orange,
          padding: "2px 7px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.04em",
        }}>{event.tag}</span>
        {event.hang !== "TBD" && (
          <span style={{ fontFamily: "'DM Sans'", fontSize: "10px", color: `${C.silver}cc` }}>
            🍺 {event.hang}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default function LandingPage() {
  const [eventsTab, setEventsTab] = useState("all");

  const allEvents = [...teamEvents, ...indivEvents].sort((a, b) => {
    const months = { MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8 };
    const mA = months[a.date.split(" ")[0]];
    const mB = months[b.date.split(" ")[0]];
    if (mA !== mB) return mA - mB;
    return parseInt(a.date.split(" ")[1]) - parseInt(b.date.split(" ")[1]);
  });

  const filteredEvents = eventsTab === "all" ? allEvents
    : eventsTab === "team" ? teamEvents : indivEvents;

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: C.cream, color: C.green }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap" rel="stylesheet" />

      {/* ── NAV ── */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 20px", borderBottom: `1px solid ${C.sand}`,
        position: "sticky", top: 0, background: `${C.cream}ee`, zIndex: 100,
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "28px", height: "28px", background: C.green, borderRadius: "6px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: C.orange, fontFamily: "'Outfit'", fontWeight: 800, fontSize: "15px",
          }}>P</div>
          <span style={{ fontFamily: "'Outfit'", fontWeight: 700, fontSize: "13px", letterSpacing: "0.04em" }}>
            ELECTRIC PHACTORY
          </span>
        </div>
        <div style={{ display: "flex", gap: "16px" }}>
          {["Events", "About", "Join"].map((n) => (
            <a key={n} href={`#${n.toLowerCase()}`} style={{
              fontFamily: "'DM Sans'", fontSize: "12px", color: C.silver,
              textDecoration: "none",
            }}>{n}</a>
          ))}
        </div>
      </nav>

      {/* ── HERO ── */}
      <Section>
        <div style={{ padding: "20px 0 8px" }}>
          <div style={{
            display: "inline-block", fontFamily: "'Outfit'", fontSize: "10px", fontWeight: 600,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: C.orange, background: `${C.orange}10`,
            padding: "5px 10px", borderRadius: "4px", marginBottom: "16px",
          }}>
            Est. 2021 · No Laying Up Roost · Philly / DE
          </div>
          <h1 style={{
            fontFamily: "'Outfit'", fontSize: "36px", fontWeight: 800,
            lineHeight: 1.06, letterSpacing: "-0.035em",
            margin: "0 0 16px", color: C.green,
          }}>
            Meaningless<br />competition.<br />
            <span style={{ color: C.orange }}>Meaningful people.</span>
          </h1>
          <p style={{
            fontFamily: "'DM Sans'", fontSize: "15px", lineHeight: 1.6,
            color: C.silver, margin: "0 0 24px", maxWidth: "340px",
          }}>
            335 avid golfers across the Greater Philadelphia region. Structured events, post-round hangs, and the kind of competition that makes Saturday tee times worth protecting.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "32px" }}>
            <button style={{
              fontFamily: "'Outfit'", fontWeight: 700, fontSize: "13px",
              background: C.orange, color: "#fff",
              border: "none", borderRadius: "8px", padding: "13px 24px", cursor: "pointer",
            }}>2026 Schedule</button>
            <button style={{
              fontFamily: "'Outfit'", fontWeight: 600, fontSize: "13px",
              background: "none", color: C.green,
              border: `1.5px solid ${C.green}25`, borderRadius: "8px",
              padding: "13px 24px", cursor: "pointer",
            }}>Join the EP</button>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{
          display: "flex", background: C.green, borderRadius: "10px", overflow: "hidden",
        }}>
          {[
            { num: "335", label: "Members" },
            { num: "5th", label: "Season" },
            { num: "93%", label: "10+ Rounds/yr" },
            { num: "1st", label: "RCC Champs" },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: "14px 6px", textAlign: "center",
              borderRight: i < 3 ? `1px solid ${C.deep}` : "none",
            }}>
              <div style={{
                fontFamily: "'Outfit'", fontSize: "18px", fontWeight: 800,
                color: C.orange, letterSpacing: "-0.02em",
              }}>{s.num}</div>
              <div style={{
                fontFamily: "'DM Sans'", fontSize: "9px",
                color: `${C.cream}60`, marginTop: "2px",
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── ABOUT ── */}
      <Section bg={C.sand} id="about">
        <SectionLabel>About the EP</SectionLabel>
        <H2>Golf is better with your people.</H2>
        <Body>
          The Electric Phactory is a No Laying Up Roost based in the greater Philadelphia and Delaware region. We were founded in 2021 and won the inaugural Roost Club Championship in 2022. We're three-time Northeast Regional winners and the home of "The Race to the Steeplechase" — our season-long points competition.
        </Body>
        <Body>
          We run 8 scored events per season plus match play, a Ryder Cup, and our annual Roost Major. Every event has a planned post-round hang — because sometimes that's the best part. 50% of every $5 entry goes to Philabundance. The other 50% goes to the winners.
        </Body>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "20px",
        }}>
          {[
            { icon: "⚡", title: "Structured Competition", desc: "Net quota, Pick-a-Pro, match play, scrambles — real formats with real points on the line." },
            { icon: "🍺", title: "Post-Round Hangs", desc: "Watch parties, brewery outings, and always a plan for after. The hang is the product." },
            { icon: "🤝", title: "All Skill Levels", desc: "Net scoring levels the playing field. 60% join to meet new golfers. No gatekeeping." },
            { icon: "🏆", title: "Stakes That Matter", desc: "Race to the Steeplechase points → Regional Team → Roost Club Championship at Sweetens Cove." },
          ].map((item, i) => (
            <div key={i} style={{
              background: C.cream, borderRadius: "10px", padding: "14px",
            }}>
              <div style={{ fontSize: "20px", marginBottom: "6px" }}>{item.icon}</div>
              <div style={{ fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 700, color: C.green, marginBottom: "3px" }}>
                {item.title}
              </div>
              <div style={{ fontFamily: "'DM Sans'", fontSize: "11px", color: C.silver, lineHeight: 1.5 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── REGION MAP ── */}
      <Section>
        <SectionLabel>Our Region</SectionLabel>
        <H2>From Lancaster to the Shore.</H2>
        <Body>
          We cover southeastern Pennsylvania, northern Delaware, and southern New Jersey. Members play courses from Oxford to Newtown, Wilmington to Glassboro — anywhere within driving distance of a post-round beer.
        </Body>
        <div style={{
          background: C.sand, borderRadius: "12px", padding: "20px",
          display: "flex", justifyContent: "center",
        }}>
          <RegionMap />
        </div>
        <div style={{
          display: "flex", gap: "16px", marginTop: "12px", justifyContent: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.orange }} />
            <span style={{ fontFamily: "'DM Sans'", fontSize: "10px", color: C.silver }}>2026 Courses</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.green }} />
            <span style={{ fontFamily: "'DM Sans'", fontSize: "10px", color: C.silver }}>Boundary Cities</span>
          </div>
        </div>
      </Section>

      {/* ── EVENTS ── */}
      <Section bg={C.sand} id="events">
        <SectionLabel>2026 Season — The Race to the Steeplechase</SectionLabel>
        <H2>8 events. Every one has a hang.</H2>
        <Body>
          We trimmed from 12 to 8 events to keep energy high all season. Every event has a defined post-round plan — watch parties, brewery visits, or dinner at the course.
        </Body>

        <div style={{ display: "flex", gap: "0", marginBottom: "16px", borderBottom: `1px solid ${C.cream}` }}>
          {[
            { id: "all", label: "All Events" },
            { id: "team", label: "Team" },
            { id: "indiv", label: "Individual" },
          ].map((t) => (
            <button key={t.id} onClick={() => setEventsTab(t.id)} style={{
              fontFamily: "'Outfit'", fontSize: "12px",
              fontWeight: eventsTab === t.id ? 600 : 400,
              color: eventsTab === t.id ? C.orange : C.silver,
              background: "none", border: "none",
              borderBottom: eventsTab === t.id ? `2px solid ${C.orange}` : "2px solid transparent",
              padding: "10px 14px", cursor: "pointer",
            }}>{t.label}</button>
          ))}
        </div>

        {filteredEvents.map((e, i) => <EventCard key={i} event={e} />)}

        {/* Registration info */}
        <div style={{
          marginTop: "16px", padding: "12px 14px",
          background: `${C.green}08`, borderRadius: "8px",
          borderLeft: `3px solid ${C.green}30`,
        }}>
          <p style={{ fontFamily: "'DM Sans'", fontSize: "12px", color: C.green, margin: 0, lineHeight: 1.5 }}>
            <strong>$5 entry per event</strong> via Unknown Golf. Registration opens one month prior. 50% donated to Philabundance, 50% to event winners. Can't make the date? Play the same format within the calendar month with a fellow member for make-up points (90% handicap).
          </p>
        </div>
      </Section>

      {/* ── SPECIAL EVENTS ── */}
      <Section>
        <SectionLabel>Beyond the Season</SectionLabel>
        <H2>The big ones.</H2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {specialEvents.map((e, i) => (
            <div key={i} style={{
              background: C.sand, borderRadius: "10px", padding: "16px",
              display: "flex", gap: "14px", alignItems: "flex-start",
              borderLeft: i === 0 ? `3px solid ${C.orange}` : `3px solid ${C.green}25`,
            }}>
              <div style={{
                fontFamily: "'Outfit'", fontSize: "11px", fontWeight: 700,
                color: i === 0 ? C.orange : C.green,
                minWidth: "56px", paddingTop: "2px",
              }}>{e.date}</div>
              <div>
                <div style={{ fontFamily: "'Outfit'", fontSize: "14px", fontWeight: 700, color: C.green, marginBottom: "3px" }}>
                  {e.name}
                </div>
                <div style={{ fontFamily: "'DM Sans'", fontSize: "12px", color: C.silver, lineHeight: 1.5 }}>
                  {e.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section bg={C.green}>
        <SectionLabel>How It Works</SectionLabel>
        <H2 light>Race to the Steeplechase.</H2>
        <Body light>
          Every event earns you points toward the season-long Race. More players in the field means more points available — events crossing 25 players become "Signature Events" with a boosted points table. The points leader earns a spot on the Regional Team.
        </Body>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          {[
            { path: "Season Points Leader", reward: "Regional Team spot" },
            { path: "Match Play Champion", reward: "Regional Team spot" },
            { path: "Top performers at Steeplechase", reward: "Final 2 Regional Team spots" },
            { path: "Regional Team wins", reward: "Roost Club Championship at Sweetens Cove" },
          ].map((p, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 14px", background: `${C.cream}08`, borderRadius: "8px",
            }}>
              <span style={{ fontFamily: "'Outfit'", fontSize: "13px", fontWeight: 600, color: C.cream }}>
                {p.path}
              </span>
              <span style={{ fontFamily: "'DM Sans'", fontSize: "11px", color: C.orange, textAlign: "right" }}>
                → {p.reward}
              </span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: "24px", padding: "14px",
          background: `${C.cream}10`, borderRadius: "8px",
        }}>
          <div style={{
            fontFamily: "'Outfit'", fontSize: "11px", fontWeight: 600,
            color: C.orange, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px",
          }}>Match Play</div>
          <p style={{
            fontFamily: "'DM Sans'", fontSize: "12px", color: `${C.cream}70`, margin: 0, lineHeight: 1.5,
          }}>
            32-player bracket. Four geographic groups, five matches each in group play. Top 2 from each group advance to single-elimination playoffs. The champion earns a Regional Team spot.
          </p>
        </div>
      </Section>

      {/* ── MERCH / CULTURE ── */}
      <Section>
        <SectionLabel>The Gear</SectionLabel>
        <H2>Rep the Phactory.</H2>
        <Body>
          We partnered with Holderness & Bourne for our first run of EP-branded merchandise. More drops coming from their Spring 2026 collection. Stay tuned on Slack.
        </Body>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["Holderness & Bourne Collab", "EP Ball Markers", "Rope Hats — Coming Soon"].map((item, i) => (
            <div key={i} style={{
              background: C.sand, borderRadius: "8px", padding: "12px 16px",
              fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 600, color: C.green,
            }}>{item}</div>
          ))}
        </div>
      </Section>

      {/* ── JOIN ── */}
      <Section bg={C.sand} id="join">
        <SectionLabel>Get Involved</SectionLabel>
        <H2>Join the Electric Phactory.</H2>
        <Body>
          Find us on the NLU Refuge Philly/DE Roll Call thread, join our Slack, and show up to an event. No dues. $5 per event entry. That's it.
        </Body>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button style={{
            fontFamily: "'Outfit'", fontWeight: 700, fontSize: "13px",
            background: C.orange, color: "#fff",
            border: "none", borderRadius: "8px", padding: "13px 24px", cursor: "pointer",
          }}>Join the Refuge Roll Call</button>
          <button style={{
            fontFamily: "'Outfit'", fontWeight: 600, fontSize: "13px",
            background: "none", color: C.green,
            border: `1.5px solid ${C.green}25`, borderRadius: "8px",
            padding: "13px 24px", cursor: "pointer",
          }}>Join Slack</button>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <div style={{ background: C.deep, padding: "28px 20px 20px" }}>
        <div style={{
          fontFamily: "'Outfit'", fontWeight: 800, fontSize: "14px",
          color: C.cream, letterSpacing: "0.04em", marginBottom: "4px",
        }}>ELECTRIC PHACTORY</div>
        <div style={{
          fontFamily: "'Outfit'", fontSize: "10px", fontWeight: 500,
          color: C.orange, letterSpacing: "0.06em", marginBottom: "14px",
        }}>EST. 2021 · PHILADELPHIA · A NO LAYING UP ROOST</div>
        <p style={{
          fontFamily: "'DM Sans'", fontSize: "12px", lineHeight: 1.6,
          color: `${C.cream}45`, margin: "0 0 18px", maxWidth: "320px",
        }}>
          Inaugural Roost Club Champions. Three-time Northeast Regional winners. 335 members and counting. There's something beautiful about meaningless — but structured — competition between peers.
        </p>
        <div style={{ display: "flex", gap: "18px", marginBottom: "18px", flexWrap: "wrap" }}>
          {["Schedule", "Join", "Leaderboard", "Match Play", "Refuge"].map((link) => (
            <span key={link} style={{
              fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 600,
              color: C.orange, cursor: "pointer",
            }}>{link}</span>
          ))}
        </div>
        <div style={{
          borderTop: `1px solid ${C.cream}10`, paddingTop: "12px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontFamily: "'DM Sans'", fontSize: "10px", color: `${C.cream}30` }}>
            © 2026 Electric Phactory · 50% of entry fees donated to Philabundance
          </span>
        </div>
      </div>
    </div>
  );
}
