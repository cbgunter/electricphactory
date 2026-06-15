import { useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const C = {
  cream: "#F5F0E8", green: "#004C54", orange: "#D4691C",
  sand: "#EDE6DA", silver: "#5C5955", deep: "#002B30",
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

const mapCourses = [
  { name: "Wyncote Golf Club", lat: 39.804, lng: -75.978 },
  { name: "Jeffersonville Golf Club", lat: 40.138, lng: -75.432 },
  { name: "Glen Mills Golf Course", lat: 39.893, lng: -75.497 },
  { name: "Broad Run Golfers Club", lat: 39.960, lng: -75.665 },
  { name: "Paxon Hollow CC", lat: 39.918, lng: -75.397 },
  { name: "Town & Country Golf Links", lat: 39.653, lng: -75.332 },
  { name: "Rock Manor Golf Club", lat: 39.756, lng: -75.573 },
  { name: "Makefield Highlands", lat: 40.228, lng: -74.887 },
];

// Survey member zip codes (PA only, excluding NJ & out-of-area)
const memberZips = [
  { zip: "19147", lat: 39.9526, lng: -75.1652, count: 2 },
  { zip: "19711", lat: 39.8235, lng: -75.5847, count: 1 },
  { zip: "19380", lat: 39.8900, lng: -75.3289, count: 2 },
  { zip: "19072", lat: 39.8812, lng: -75.4950, count: 1 },
  { zip: "19007", lat: 39.9389, lng: -75.5089, count: 1 },
  { zip: "19067", lat: 39.8945, lng: -75.4512, count: 1 },
  { zip: "19390", lat: 40.1245, lng: -75.4967, count: 1 },
  { zip: "19335", lat: 39.8745, lng: -75.4189, count: 1 },
  { zip: "19428", lat: 40.2134, lng: -75.3850, count: 1 },
  { zip: "19810", lat: 39.7834, lng: -75.3945, count: 1 },
  { zip: "19014", lat: 39.8134, lng: -75.3278, count: 1 },
  { zip: "19038", lat: 40.0234, lng: -75.1456, count: 1 },
];

const RegionMap = () => (
  <MapContainer
    center={[39.94, -75.43]}
    zoom={9}
    scrollWheelZoom={false}
    zoomControl={true}
    style={{ height: "400px", width: "100%", borderRadius: "12px" }}
  >
    <TileLayer
      url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      subdomains="abcd"
      maxZoom={19}
    />
    {memberZips.map((z, i) => (
      <CircleMarker
        key={i}
        center={[z.lat, z.lng]}
        radius={z.count > 1 ? 7 : 5}
        fillColor={C.sand}
        fillOpacity={0.4}
        color={C.silver}
        weight={1}
      >
        <Tooltip direction="top" offset={[0, -6]}>Zip {z.zip} ({z.count} member{z.count > 1 ? 's' : ''})</Tooltip>
      </CircleMarker>
    ))}
    {mapCourses.map((c, i) => (
      <CircleMarker
        key={i}
        center={[c.lat, c.lng]}
        radius={8}
        fillColor={C.orange}
        fillOpacity={0.85}
        color="#fff"
        weight={1.5}
      >
        <Tooltip direction="top" offset={[0, -6]}>{c.name}</Tooltip>
      </CircleMarker>
    ))}
    <CircleMarker
      center={[39.9526, -75.1652]}
      radius={10}
      fillColor={C.green}
      fillOpacity={0.95}
      color="#fff"
      weight={2}
    >
      <Tooltip permanent direction="right" offset={[8, 0]} opacity={1}>
        <span style={{ fontFamily: "'Outfit'", fontWeight: 700, fontSize: "13px" }}>Philadelphia</span>
      </Tooltip>
    </CircleMarker>
  </MapContainer>
);

const Container = ({ children }) => (
  <div style={{ maxWidth: "1100px", margin: "0 auto", width: "100%" }}>
    {children}
  </div>
);

const Section = ({ children, bg, id }) => (
  <div id={id} style={{ background: bg || C.cream, padding: "64px 32px" }}>
    <Container>{children}</Container>
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{
    fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 600,
    letterSpacing: "0.14em", textTransform: "uppercase",
    color: C.orange, marginBottom: "10px",
  }}>{children}</div>
);

const H2 = ({ children, light }) => (
  <h2 style={{
    fontFamily: "'Outfit'", fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 800,
    lineHeight: 1.1, letterSpacing: "-0.03em",
    margin: "0 0 16px", color: light ? C.cream : C.green,
  }}>{children}</h2>
);

const Body = ({ children, light }) => (
  <p style={{
    fontFamily: "'DM Sans'", fontSize: "16px", lineHeight: 1.75,
    color: light ? `${C.cream}90` : C.silver,
    margin: "0 0 16px",
  }}>{children}</p>
);

const EventCard = ({ event }) => (
  <div style={{
    background: C.sand, borderRadius: "10px", padding: "16px",
    display: "flex", gap: "14px", alignItems: "flex-start",
    borderLeft: `3px solid ${event.tag === "Individual" ? C.green : C.orange}50`,
    marginBottom: "8px",
  }}>
    <div style={{
      background: C.green, borderRadius: "6px", padding: "8px 10px",
      textAlign: "center", flexShrink: 0, minWidth: "50px",
    }}>
      <div style={{ fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 600, color: C.orange, letterSpacing: "0.06em" }}>
        {event.date.split(" ")[0]}
      </div>
      <div style={{ fontFamily: "'Outfit'", fontSize: "18px", fontWeight: 800, color: C.cream, lineHeight: 1.1 }}>
        {event.date.split(" ")[1]}
      </div>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: "'Outfit'", fontSize: "15px", fontWeight: 700, color: C.green, marginBottom: "3px" }}>
        {event.name}
      </div>
      <div style={{ fontFamily: "'DM Sans'", fontSize: "13px", color: C.silver, marginBottom: "6px" }}>
        {event.format}
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{
          fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 600,
          background: event.tag === "Individual" ? `${C.green}15` : `${C.orange}18`,
          color: event.tag === "Individual" ? C.green : C.orange,
          padding: "3px 8px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.04em",
          whiteSpace: "nowrap",
        }}>{event.tag}</span>
        {event.hang !== "TBD" && (
          <span style={{ fontFamily: "'DM Sans'", fontSize: "12px", color: C.silver }}>
            🍺 {event.hang}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default function App() {
  const [eventsTab, setEventsTab] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);

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

      {/* NAV */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/logo.png" alt="Electric Phactory" style={{ width: "34px", height: "34px", objectFit: "contain" }} />
            <span style={{ fontFamily: "'Outfit'", fontWeight: 700, fontSize: "14px", letterSpacing: "0.04em" }}>
              ELECTRIC PHACTORY
            </span>
          </div>
          <div className="ep-nav-links">
            {["Events", "About", "Join"].map((n) => (
              <a key={n} href={`#${n.toLowerCase()}`} style={{
                fontFamily: "'DM Sans'", fontSize: "14px", color: C.silver,
                textDecoration: "none", fontWeight: 500,
              }}>{n}</a>
            ))}
            <Link to="/matchplay" style={{
              fontFamily: "'DM Sans'", fontSize: "14px", color: C.orange,
              textDecoration: "none", fontWeight: 600,
            }}>Match Play</Link>
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
            {[["Events", "#events"], ["About", "#about"], ["Join", "#join"]].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)} style={{
                fontFamily: "'DM Sans'", fontSize: "16px", color: C.silver,
                textDecoration: "none", fontWeight: 500,
              }}>{label}</a>
            ))}
            <Link to="/matchplay" onClick={() => setMenuOpen(false)} style={{
              fontFamily: "'DM Sans'", fontSize: "16px", color: C.orange,
              textDecoration: "none", fontWeight: 600,
            }}>Match Play</Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <Section>
        <div className="ep-hero-grid">
          {/* Left: headline + CTA */}
          <div>
            <div style={{
              display: "inline-block", fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 600,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: C.orange, background: `${C.orange}12`,
              padding: "6px 12px", borderRadius: "4px", marginBottom: "20px",
            }}>
              Est. 2021 · No Laying Up Roost · Philly / DE
            </div>
            <h1 style={{
              fontFamily: "'Outfit'", fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 800,
              lineHeight: 1.02, letterSpacing: "-0.04em",
              margin: "0 0 20px", color: C.green,
            }}>
              Meaningless<br />competition.<br />
              <span style={{ color: C.orange }}>Meaningful people.</span>
            </h1>
            <p style={{
              fontFamily: "'DM Sans'", fontSize: "17px", lineHeight: 1.7,
              color: C.silver, margin: "0 0 28px", maxWidth: "480px",
            }}>
              335 avid golfers across the Greater Philadelphia region. Structured events, post-round hangs, and the kind of competition that makes Saturday tee times worth protecting.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <a href="#events" style={{ textDecoration: "none" }}>
                <button style={{
                  fontFamily: "'Outfit'", fontWeight: 700, fontSize: "14px",
                  background: C.orange, color: "#fff",
                  border: "none", borderRadius: "8px", padding: "14px 28px", cursor: "pointer",
                }}>2026 Schedule</button>
              </a>
              <a href="#join" style={{ textDecoration: "none" }}>
                <button style={{
                  fontFamily: "'Outfit'", fontWeight: 600, fontSize: "14px",
                  background: "none", color: C.green,
                  border: `1.5px solid ${C.green}30`, borderRadius: "8px",
                  padding: "14px 28px", cursor: "pointer",
                }}>Join the EP</button>
              </a>
            </div>
          </div>

          {/* Right: logo + stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{
              background: C.green, borderRadius: "16px", padding: "32px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <img src="/logo.png" alt="EP Logo" style={{ width: "140px", height: "140px", objectFit: "contain" }} />
            </div>
            <div style={{ display: "flex", background: C.green, borderRadius: "12px", overflow: "hidden" }}>
              {[
                { num: "335", label: "Members" },
                { num: "5th", label: "Season" },
                { num: "93%", label: "10+ Rounds/yr" },
                { num: "1st", label: "RCC Champs" },
              ].map((s, i) => (
                <div key={i} style={{
                  flex: 1, padding: "16px 8px", textAlign: "center",
                  borderRight: i < 3 ? `1px solid ${C.deep}` : "none",
                }}>
                  <div style={{
                    fontFamily: "'Outfit'", fontSize: "clamp(16px, 2.5vw, 22px)", fontWeight: 800,
                    color: C.orange, letterSpacing: "-0.02em",
                  }}>{s.num}</div>
                  <div style={{
                    fontFamily: "'DM Sans'", fontSize: "12px",
                    color: `${C.cream}70`, marginTop: "3px",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ABOUT */}
      <Section bg={C.sand} id="about">
        <div className="ep-about-grid">
          {/* Left: text */}
          <div>
            <SectionLabel>About the EP</SectionLabel>
            <H2>Golf is better with your people.</H2>
            <Body>
              The Electric Phactory is a No Laying Up Roost based in the greater Philadelphia and Delaware region. We were founded in 2021 and won the inaugural Roost Club Championship in 2022. We're three-time Northeast Regional winners and the home of "The Race to the Steeplechase" — our season-long points competition.
            </Body>
            <Body>
              We run 8 scored events per season plus match play, a Ryder Cup, and our annual Roost Major. Every event has a planned post-round hang — because sometimes that's the best part. 50% of every $5 entry goes to Philabundance. The other 50% goes to the winners.
            </Body>
          </div>
          {/* Right: feature grid */}
          <div className="ep-feature-grid">
            {[
              { icon: "⚡", title: "Structured Competition", desc: "Net quota, Pick-a-Pro, match play, scrambles — real formats with real points on the line." },
              { icon: "🍺", title: "Post-Round Hangs", desc: "Watch parties, brewery outings, and always a plan for after. The hang is the product." },
              { icon: "🤝", title: "All Skill Levels", desc: "Net scoring levels the playing field. 60% join to meet new golfers. No gatekeeping." },
              { icon: "🏆", title: "Stakes That Matter", desc: "Race to the Steeplechase points → Regional Team → Roost Club Championship at Sweetens Cove." },
            ].map((item, i) => (
              <div key={i} style={{ background: C.cream, borderRadius: "12px", padding: "18px" }}>
                <div style={{ fontSize: "22px", marginBottom: "8px" }}>{item.icon}</div>
                <div style={{ fontFamily: "'Outfit'", fontSize: "14px", fontWeight: 700, color: C.green, marginBottom: "5px" }}>
                  {item.title}
                </div>
                <div style={{ fontFamily: "'DM Sans'", fontSize: "14px", color: C.silver, lineHeight: 1.6 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* REGION MAP */}
      <Section>
        <SectionLabel>Our Region</SectionLabel>
        <H2>Greater Philly, Delaware & South Jersey.</H2>
        <Body>
          We're based in the Greater Philadelphia area and draw members from across Delaware and southern New Jersey. If you can make the drive and stay for a beer, you're in range.
        </Body>
        <div style={{ borderRadius: "12px", overflow: "hidden", boxShadow: `0 2px 12px ${C.green}18` }}>
          <RegionMap />
        </div>
        <p style={{ fontFamily: "'DM Sans'", fontSize: "12px", color: C.silver, marginTop: "10px", textAlign: "center", opacity: 0.7 }}>
          Beige markers show where our crew is
        </p>
      </Section>

      {/* EVENTS */}
      <Section bg={C.sand} id="events">
        <SectionLabel>2026 Season — The Race to the Steeplechase</SectionLabel>
        <H2>8 events. Every one has a hang.</H2>
        <Body>
          We trimmed from 12 to 8 events to keep energy high all season. Every event has a defined post-round plan — watch parties, brewery visits, or dinner at the course.
        </Body>

        <div style={{ display: "flex", marginBottom: "20px", borderBottom: `1px solid ${C.cream}` }}>
          {[
            { id: "all", label: "All Events" },
            { id: "team", label: "Team" },
            { id: "indiv", label: "Individual" },
          ].map((t) => (
            <button key={t.id} onClick={() => setEventsTab(t.id)} style={{
              fontFamily: "'Outfit'", fontSize: "13px",
              fontWeight: eventsTab === t.id ? 600 : 400,
              color: eventsTab === t.id ? C.orange : C.silver,
              background: "none", border: "none",
              borderBottom: eventsTab === t.id ? `2px solid ${C.orange}` : "2px solid transparent",
              padding: "10px 16px", cursor: "pointer",
            }}>{t.label}</button>
          ))}
        </div>

        {filteredEvents.map((e, i) => <EventCard key={i} event={e} />)}

        <div style={{
          marginTop: "20px", padding: "16px 18px",
          background: `${C.green}08`, borderRadius: "10px",
          borderLeft: `3px solid ${C.green}30`,
        }}>
          <p style={{ fontFamily: "'DM Sans'", fontSize: "14px", color: C.green, margin: 0, lineHeight: 1.6 }}>
            <strong>$5 entry per event</strong> via Unknown Golf. Registration opens one month prior. 50% donated to Philabundance, 50% to event winners. Can't make the date? Play the same format within the calendar month with a fellow member for make-up points (90% handicap).
          </p>
        </div>
      </Section>

      {/* SPECIAL EVENTS */}
      <Section>
        <SectionLabel>Beyond the Season</SectionLabel>
        <H2>The big ones.</H2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {specialEvents.map((e, i) => (
            <div key={i} style={{
              background: C.sand, borderRadius: "12px", padding: "20px",
              display: "flex", gap: "16px", alignItems: "flex-start",
              borderLeft: i === 0 ? `3px solid ${C.orange}` : `3px solid ${C.green}25`,
            }}>
              <div style={{
                fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 700,
                color: i === 0 ? C.orange : C.green,
                minWidth: "64px", paddingTop: "2px", flexShrink: 0,
              }}>{e.date}</div>
              <div>
                <div style={{ fontFamily: "'Outfit'", fontSize: "16px", fontWeight: 700, color: C.green, marginBottom: "4px" }}>
                  {e.name}
                </div>
                <div style={{ fontFamily: "'DM Sans'", fontSize: "14px", color: C.silver, lineHeight: 1.6 }}>
                  {e.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* HOW IT WORKS */}
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
            <div key={i} className="ep-path-row" style={{ background: `${C.cream}08` }}>
              <span style={{ fontFamily: "'Outfit'", fontSize: "14px", fontWeight: 600, color: C.cream }}>
                {p.path}
              </span>
              <span style={{ fontFamily: "'DM Sans'", fontSize: "13px", color: C.orange }}>
                → {p.reward}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "28px", padding: "20px", background: `${C.cream}10`, borderRadius: "10px" }}>
          <div style={{
            fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 600,
            color: C.orange, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px",
          }}>Match Play</div>
          <p style={{ fontFamily: "'DM Sans'", fontSize: "14px", color: `${C.cream}80`, margin: 0, lineHeight: 1.65 }}>
            32-player bracket. Four geographic groups, five matches each in group play. Top 2 from each group advance to single-elimination playoffs. The champion earns a Regional Team spot.
          </p>
        </div>
      </Section>

      {/* MERCH */}
      <Section>
        <SectionLabel>The Gear</SectionLabel>
        <H2>Rep the Phactory.</H2>
        <Body>
          We partnered with Holderness & Bourne for our first run of EP-branded merchandise. More drops coming from their Spring 2026 collection. Stay tuned on Unknown Golf.
        </Body>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {["Holderness & Bourne Collab", "EP Ball Markers", "Rope Hats — Coming Soon"].map((item, i) => (
            <div key={i} style={{
              background: C.sand, borderRadius: "10px", padding: "14px 20px",
              fontFamily: "'Outfit'", fontSize: "14px", fontWeight: 600, color: C.green,
            }}>{item}</div>
          ))}
        </div>
      </Section>

      {/* JOIN */}
      <Section bg={C.sand} id="join">
        <SectionLabel>Get Involved</SectionLabel>
        <H2>Join the Electric Phactory.</H2>
        <Body>
          Find us on the NLU Refuge Philly/DE Roll Call thread, join us on Unknown Golf, and show up to an event. No dues. $5 per event entry. That's it.
        </Body>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a href="https://refuge.nolayingup.com/t/philadelphia/6998/1192" target="_blank" rel="noopener noreferrer" style={{
            fontFamily: "'Outfit'", fontWeight: 700, fontSize: "14px",
            background: C.orange, color: "#fff",
            border: "none", borderRadius: "8px", padding: "14px 28px", cursor: "pointer",
            textDecoration: "none", display: "inline-block",
          }}>Join the Refuge Roll Call</a>
          <a href="https://league.unknowngolf.com/index.jsp" target="_blank" rel="noopener noreferrer" style={{
            fontFamily: "'Outfit'", fontWeight: 600, fontSize: "14px",
            background: "none", color: C.green,
            border: `1.5px solid ${C.green}30`, borderRadius: "8px",
            padding: "14px 28px", cursor: "pointer",
            textDecoration: "none", display: "inline-block",
          }}>Find Us on Unknown Golf</a>
        </div>
      </Section>

      {/* FOOTER */}
      <div style={{ background: C.deep, padding: "40px 32px 28px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <img src="/logo.png" alt="" style={{ width: "26px", height: "26px", objectFit: "contain", opacity: 0.8 }} />
            <div style={{
              fontFamily: "'Outfit'", fontWeight: 800, fontSize: "15px",
              color: C.cream, letterSpacing: "0.04em",
            }}>ELECTRIC PHACTORY</div>
          </div>
          <div style={{
            fontFamily: "'Outfit'", fontSize: "11px", fontWeight: 500,
            color: C.orange, letterSpacing: "0.06em", marginBottom: "16px",
          }}>EST. 2021 · PHILADELPHIA · A NO LAYING UP ROOST</div>
          <p style={{
            fontFamily: "'DM Sans'", fontSize: "13px", lineHeight: 1.7,
            color: `${C.cream}50`, margin: "0 0 20px", maxWidth: "400px",
          }}>
            Inaugural Roost Club Champions. Three-time Northeast Regional winners. 335 members and counting. There's something beautiful about meaningless — but structured — competition between peers.
          </p>
          <div style={{ display: "flex", gap: "24px", marginBottom: "20px", flexWrap: "wrap" }}>
            {[["Schedule", "#events"], ["Join", "#join"]].map(([label, href]) => (
              <a key={label} href={href} style={{
                fontFamily: "'Outfit'", fontSize: "13px", fontWeight: 600,
                color: C.orange, textDecoration: "none",
              }}>{label}</a>
            ))}
            <Link to="/matchplay" style={{
              fontFamily: "'Outfit'", fontSize: "13px", fontWeight: 600,
              color: C.orange, textDecoration: "none",
            }}>Match Play</Link>
          </div>
          <div style={{ borderTop: `1px solid ${C.cream}10`, paddingTop: "14px" }}>
            <span style={{ fontFamily: "'DM Sans'", fontSize: "11px", color: `${C.cream}35` }}>
              © 2026 Electric Phactory · 50% of entry fees donated to Philabundance
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
