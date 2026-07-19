import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

// useEffect never runs during renderToString, so leaflet (browser-only) never loads server-side
function RegionMap() {
  const [Map, setMap] = useState(null);
  useEffect(() => { import("./RegionMap.jsx").then(m => setMap(() => m.default)); }, []);
  if (!Map) return <div style={{ height: "400px", borderRadius: "12px" }} />;
  return <Map />;
}

const API = "https://iaatvn44bj.execute-api.us-east-1.amazonaws.com";

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
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "", company: "" });
  const [contactStatus, setContactStatus] = useState("idle"); // idle | sending | sent | error
  const contactMountedAt = useRef(Date.now());

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
            {[["Schedule", "schedule"], ["About", "about"], ["Join", "join"], ["Contact", "contact"]].map(([n, id]) => (
              <a key={n} href={`#${id}`} style={{
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
            {[["Schedule", "#schedule"], ["About", "#about"], ["Join", "#join"], ["Contact", "#contact"]].map(([label, href]) => (
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

      <main>
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
              Philadelphia Golf Group · Est. 2021
            </div>
            <h1 style={{
              fontFamily: "'Outfit'", fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 800,
              lineHeight: 1.02, letterSpacing: "-0.04em",
              margin: "0 0 20px", color: C.green,
            }}>
              Golf is better<br />with your people.<br />
              <span style={{ color: C.orange }}>Find yours here.</span>
            </h1>
            <p style={{
              fontFamily: "'DM Sans'", fontSize: "17px", lineHeight: 1.7,
              color: C.silver, margin: "0 0 28px", maxWidth: "480px",
            }}>
              335+ golfers across Philadelphia, Delaware, and South Jersey. Rounds, post-round hangs, and a group that makes Saturday tee times worth protecting.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <a href="#schedule" style={{ textDecoration: "none" }}>
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
            <H2>A Philadelphia golf group that actually shows up.</H2>
            <Body>
              The Electric Phactory started in 2021 as a crew of Philly-area golfers who wanted something more than just random tee times — a real group with real events and real people to grab a beer with after. We've grown to 335+ members across Philadelphia, Delaware, and South Jersey.
            </Body>
            <Body>
              We run 8 scored events per season across courses from Wyncote to Makefield to Town &amp; Country. Every event has a defined post-round plan — watch parties, brewery visits, dinner at the course. No dues. $5 per event, and half of that goes to Philabundance.
            </Body>
          </div>
          {/* Right: feature grid */}
          <div className="ep-feature-grid">
            {[
              { icon: "🏌️", title: "Great Courses", desc: "8 events per season across the best public and semi-private courses in the greater Philly area." },
              { icon: "🍺", title: "Post-Round Hangs", desc: "Watch parties, brewery outings, and always a plan for after. The hang is the product." },
              { icon: "🤝", title: "All Skill Levels", desc: "Net scoring levels the playing field. 60% join to meet new golfers. No gatekeeping." },
              { icon: "📍", title: "Rooted in Philly", desc: "Members from across Philadelphia, Delaware, and South Jersey. If you can make the drive, you're in range." },
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
        <H2>Philadelphia Golf League covering Greater Philly, Delaware & South Jersey.</H2>
        <Body>
          The Electric Phactory is based in the Greater Philadelphia area and draws members from across Delaware and southern New Jersey. Whether you're in Philadelphia, Wilmington, or South Jersey, if you can make the drive and stay for a beer, you're in range for our golf tournaments and events.
        </Body>
        <div style={{ borderRadius: "12px", overflow: "hidden", boxShadow: `0 2px 12px ${C.green}18` }}>
          <RegionMap />
        </div>
        <p style={{ fontFamily: "'DM Sans'", fontSize: "12px", color: C.silver, marginTop: "10px", textAlign: "center", opacity: 0.7 }}>
          Green markers show where our crew is
        </p>
      </Section>

      {/* EVENTS */}
      <Section bg={C.sand} id="schedule">
        <SectionLabel>2026 Schedule</SectionLabel>
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

      {/* THE COMPETITIVE SIDE / NLU */}
      <Section bg={C.green}>
        <SectionLabel>The Competitive Side</SectionLabel>
        <H2 light>A No Laying Up Roost since 2021.</H2>
        <Body light>
          The EP is part of the No Laying Up Roost network — a national community of golf groups. We won the inaugural Roost Club Championship in 2022 and are three-time Northeast Regional winners. Our season-long points race, match play bracket, and marquee events give members something to chase all year.
        </Body>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px", marginBottom: "24px" }}>
          {[
            { path: "Season Points Leader", reward: "Regional Team spot" },
            { path: "Match Play Champion", reward: "Regional Team spot" },
            { path: "Top performers at The Steeplechase", reward: "Final 2 Regional Team spots" },
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

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {specialEvents.map((e, i) => (
            <div key={i} style={{
              background: `${C.cream}08`, borderRadius: "12px", padding: "18px 20px",
              display: "flex", gap: "16px", alignItems: "flex-start",
              borderLeft: i === 0 ? `3px solid ${C.orange}` : `3px solid ${C.cream}20`,
            }}>
              <div style={{
                fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 700,
                color: i === 0 ? C.orange : `${C.cream}60`,
                minWidth: "64px", paddingTop: "2px", flexShrink: 0,
              }}>{e.date}</div>
              <div>
                <div style={{ fontFamily: "'Outfit'", fontSize: "15px", fontWeight: 700, color: C.cream, marginBottom: "4px" }}>
                  {e.name}
                </div>
                <div style={{ fontFamily: "'DM Sans'", fontSize: "13px", color: `${C.cream}70`, lineHeight: 1.6 }}>
                  {e.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "20px" }}>
          <Link to="/matchplay" style={{
            fontFamily: "'Outfit'", fontWeight: 600, fontSize: "14px",
            color: C.orange, textDecoration: "none",
          }}>View Match Play bracket →</Link>
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

      {/* CONTACT */}
      <Section bg={C.cream} id="contact">
        <SectionLabel>Get in Touch</SectionLabel>
        <H2>Drop us a line.</H2>
        <Body>Questions about joining, events, or anything else? We'd love to hear from you.</Body>
        {contactStatus === "sent" ? (
          <div style={{
            background: `${C.green}12`, border: `1.5px solid ${C.green}25`,
            borderRadius: "12px", padding: "24px 28px",
            fontFamily: "'DM Sans'", fontSize: "16px", lineHeight: 1.75, color: C.green,
          }}>
            Thanks — we'll be in touch.
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setContactStatus("sending");
              try {
                const res = await fetch(`${API}/contact`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    ...contactForm,
                    elapsed: (Date.now() - contactMountedAt.current) / 1000,
                  }),
                });
                const data = await res.json();
                if (res.ok && data.success) {
                  setContactStatus("sent");
                } else {
                  setContactStatus("error");
                }
              } catch {
                setContactStatus("error");
              }
            }}
            style={{ maxWidth: "520px" }}
          >
            {/* Honeypot — hidden from real users */}
            <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
              <input
                type="text"
                name="company"
                value={contactForm.company}
                onChange={(e) => setContactForm(f => ({ ...f, company: e.target.value }))}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontFamily: "'Outfit'", fontSize: "13px", fontWeight: 600, color: C.green, display: "block", marginBottom: "6px" }}>
                Name
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={contactForm.name}
                onChange={(e) => setContactForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                style={{
                  width: "100%", padding: "12px 16px", boxSizing: "border-box",
                  fontFamily: "'DM Sans'", fontSize: "15px", color: C.green,
                  background: C.sand, border: `1.5px solid ${C.green}20`,
                  borderRadius: "8px", outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontFamily: "'Outfit'", fontSize: "13px", fontWeight: 600, color: C.green, display: "block", marginBottom: "6px" }}>
                Email
              </label>
              <input
                type="email"
                required
                maxLength={200}
                value={contactForm.email}
                onChange={(e) => setContactForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                style={{
                  width: "100%", padding: "12px 16px", boxSizing: "border-box",
                  fontFamily: "'DM Sans'", fontSize: "15px", color: C.green,
                  background: C.sand, border: `1.5px solid ${C.green}20`,
                  borderRadius: "8px", outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontFamily: "'Outfit'", fontSize: "13px", fontWeight: 600, color: C.green, display: "block", marginBottom: "6px" }}>
                Message
              </label>
              <textarea
                required
                minLength={10}
                maxLength={5000}
                rows={4}
                value={contactForm.message}
                onChange={(e) => setContactForm(f => ({ ...f, message: e.target.value }))}
                placeholder="What's on your mind?"
                style={{
                  width: "100%", padding: "12px 16px", boxSizing: "border-box",
                  fontFamily: "'DM Sans'", fontSize: "15px", color: C.green, lineHeight: 1.6,
                  background: C.sand, border: `1.5px solid ${C.green}20`,
                  borderRadius: "8px", outline: "none", resize: "vertical",
                }}
              />
            </div>

            {contactStatus === "error" && (
              <p style={{ fontFamily: "'DM Sans'", fontSize: "14px", color: C.orange, margin: "0 0 16px" }}>
                Something went wrong — please try again.
              </p>
            )}

            <button
              type="submit"
              disabled={contactStatus === "sending"}
              style={{
                fontFamily: "'Outfit'", fontWeight: 700, fontSize: "14px",
                background: C.orange, color: "#fff",
                border: "none", borderRadius: "8px", padding: "14px 28px",
                cursor: contactStatus === "sending" ? "not-allowed" : "pointer",
                opacity: contactStatus === "sending" ? 0.6 : 1,
              }}
            >
              {contactStatus === "sending" ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}
      </Section>

      {/* FAQ */}
      <Section bg={C.sand} id="faq">
        <SectionLabel>Common Questions</SectionLabel>
        <H2>Frequently asked about the EP.</H2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {[
            {
              q: "How do I join a golf league in Philadelphia?",
              a: "Join the Electric Phactory by posting on the NLU Refuge Philly/DE Roll Call thread or finding us on Unknown Golf. Show up to any event — there are no dues, just $5 entry per event.",
            },
            {
              q: "What areas of Philadelphia does the Electric Phactory cover?",
              a: "We draw members from across Greater Philadelphia, Delaware, and South Jersey. Our courses run from Wyncote and Paxon Hollow in the western suburbs to Makefield in Bucks County and Town & Country in Delaware. If you can make the drive, you're in range.",
            },
            {
              q: "Do I need to be a good golfer to join?",
              a: "No. We use net scoring with GHIN handicaps, so all skill levels compete on a level playing field. Over 60% of our members joined specifically to meet new golfers — not to win.",
            },
            {
              q: "How much does it cost to join a Philadelphia golf group?",
              a: "There are no annual dues or membership fees. Entry is $5 per event through Unknown Golf, and 50% of every entry fee is donated to Philabundance.",
            },
            {
              q: "What kind of golf events and tournaments does the Electric Phactory run?",
              a: "We run 8 scored events per season across the best public and semi-private courses in the greater Philly area — team scrambles, alternate shot, best ball, and individual quota formats. Every event includes a post-round hang: watch parties, brewery visits, or dinner at the course.",
            },
          ].map((item, i, arr) => (
            <div key={i} style={{
              borderBottom: i < arr.length - 1 ? `1px solid ${C.cream}` : "none",
              padding: "20px 0",
            }}>
              <div style={{
                fontFamily: "'Outfit'", fontSize: "16px", fontWeight: 700,
                color: C.green, marginBottom: "8px",
              }}>{item.q}</div>
              <div style={{
                fontFamily: "'DM Sans'", fontSize: "15px", lineHeight: 1.7,
                color: C.silver,
              }}>{item.a}</div>
            </div>
          ))}
        </div>
      </Section>

      </main>

      {/* FOOTER */}
      <footer style={{ background: C.deep, padding: "40px 32px 28px" }}>
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
          }}>EST. 2021 · PHILADELPHIA, PA · DELAWARE · SOUTH JERSEY</div>
          <p style={{
            fontFamily: "'DM Sans'", fontSize: "13px", lineHeight: 1.7,
            color: `${C.cream}50`, margin: "0 0 20px", maxWidth: "400px",
          }}>
            A Philadelphia golf group built on great courses, great people, and great post-round hangs. 335+ members across Philadelphia, Delaware, and South Jersey. Part of the No Laying Up Roost network — inaugural Roost Club Champions and three-time Northeast Regional winners.
          </p>
          <div style={{ display: "flex", gap: "24px", marginBottom: "20px", flexWrap: "wrap" }}>
            {[["Schedule", "#schedule"], ["Join", "#join"], ["Contact", "#contact"]].map(([label, href]) => (
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
      </footer>
    </div>
  );
}
