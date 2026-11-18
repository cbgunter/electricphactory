import { useEffect, useRef, useState } from "react";

const API = "https://iaatvn44bj.execute-api.us-east-1.amazonaws.com";

// Sign-ups close at the end of Nov 30 (covers every US time zone); draw is 12/1, ship by 12/15.
// Keep in sync with BOURBON_CLOSES_AT in lambda/index.mjs.
const CLOSES_AT = new Date("2026-12-01T08:00:00Z");

const C = {
  cream: "#F5F0E8", green: "#004C54", orange: "#D4691C",
  sand: "#EDE6DA", silver: "#5C5955", deep: "#002B30",
};

const SAMPLE_OPTIONS = [
  { value: "6", label: "6 samples" },
  { value: "12", label: "12 samples" },
];

const STYLE_OPTIONS = [
  {
    value: "answer-key",
    label: "Full Answer Key",
    desc: "Each bottle is labeled. Just sip and enjoy.",
  },
  {
    value: "list",
    label: "List of Included Samples",
    desc: "You get the list of what's in the box, but not which bottle is which. Match them up.",
  },
  {
    value: "blind",
    label: "Pure Blind Taste",
    desc: "No list, no labels. Good luck.",
  },
];

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME",
  "MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI",
  "SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const TIMELINE = [
  { date: "Nov 30", text: "Sign-ups close" },
  { date: "Dec 1", text: "Random draw: you find out who you're shipping to" },
  { date: "Dec 15", text: "Samples shipped (or face public shaming in Slack)" },
];

const inputStyle = {
  width: "100%", fontFamily: "'DM Sans'", fontSize: "16px", color: C.green,
  background: C.cream, border: `1px solid ${C.silver}55`, borderRadius: "8px",
  padding: "11px 12px", boxSizing: "border-box",
};
const labelStyle = {
  display: "block", fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 700,
  letterSpacing: "0.06em", textTransform: "uppercase", color: C.silver, marginBottom: "6px",
};
const bodyStyle = {
  fontFamily: "'DM Sans'", fontSize: "16px", lineHeight: 1.75, color: C.silver, margin: 0,
};

const EMPTY = { name: "", email: "", street1: "", street2: "", city: "", state: "", zip: "", samples: "", style: "", notes: "" };

function ChoiceButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        textAlign: "left", width: "100%", cursor: "pointer", borderRadius: "10px",
        padding: "12px 14px", fontFamily: "'DM Sans'",
        border: `1.5px solid ${selected ? C.orange : `${C.silver}40`}`,
        background: selected ? `${C.orange}14` : C.cream,
        color: C.green,
      }}
    >
      {children}
    </button>
  );
}

function WhosIn({ signups }) {
  if (!signups) return null;
  return (
    <div style={{ marginTop: "40px" }}>
      <h2 style={{ fontFamily: "'Outfit'", fontSize: "18px", fontWeight: 700, margin: "0 0 10px" }}>
        Who's in ({signups.length})
      </h2>
      {signups.length === 0 ? (
        <p style={bodyStyle}>Nobody yet. Be the first.</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {signups.map((n, i) => (
            <span key={i} style={{
              fontFamily: "'DM Sans'", fontSize: "14px", color: C.green, background: C.sand,
              borderRadius: "999px", padding: "5px 12px",
            }}>{n}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BourbonSwapPage() {
  const [form, setForm] = useState(EMPTY);
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState(null); // { ok, msg }
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [signups, setSignups] = useState(null);
  const startedAt = useRef(Date.now());
  const closed = Date.now() >= CLOSES_AT.getTime();

  useEffect(() => { document.title = "Holiday Whiskey Swap — Electric Phactory"; }, []);

  async function loadSignups() {
    try {
      const res = await fetch(`${API}/bourbon/signups`);
      if (res.ok) setSignups((await res.json()).names || []);
    } catch { /* list is a nice-to-have */ }
  }
  useEffect(() => { loadSignups(); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const missing = [];
    if (!form.name.trim()) missing.push("name");
    if (!form.email.trim()) missing.push("email");
    if (!form.street1.trim() || !form.city.trim() || !form.state || !form.zip.trim()) missing.push("full shipping address");
    if (!form.samples) missing.push("6 or 12 samples");
    if (!form.style) missing.push("how you want to receive your samples");
    if (missing.length) { setStatus({ ok: false, msg: `Still need: ${missing.join(", ")}.` }); return; }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setStatus({ ok: false, msg: "That email doesn't look right." }); return; }
    if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) { setStatus({ ok: false, msg: "ZIP should be 5 digits." }); return; }

    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/bourbon/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          hp_x7: company,
          elapsed: Math.round((Date.now() - startedAt.current) / 1000),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ ok: false, msg: data.error || "Something went wrong. Try again." });
      } else {
        setDone(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        loadSignups();
      }
    } catch {
      setStatus({ ok: false, msg: "Network error. Try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const styleLabel = STYLE_OPTIONS.find(o => o.value === form.style)?.label;

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: C.cream, color: C.green, minHeight: "100vh" }}>
      <div style={{ background: C.green, color: C.cream }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "48px 20px 40px" }}>
          <div style={{ fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: "10px" }}>
            Electric Phactory · Members Only
          </div>
          <h1 style={{ fontFamily: "'Outfit'", fontSize: "34px", lineHeight: 1.15, fontWeight: 800, margin: "0 0 14px" }}>
            Holiday Whiskey Swap
          </h1>
          <p style={{ ...bodyStyle, color: C.sand }}>
            Fill a box with 2 oz. samples and ship it to another EP member. Someone else fills
            one for you. Bourbon, rye, scotch, Irish, whatever. Everything is fair game, as long
            as it's in the name of trying something new.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 20px 64px" }}>
        <ol style={{ listStyle: "none", padding: 0, margin: "0 0 36px", display: "grid", gap: "10px" }}>
          {TIMELINE.map(t => (
            <li key={t.date} style={{ display: "flex", gap: "14px", alignItems: "baseline" }}>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 700, fontSize: "15px", color: C.orange, minWidth: "64px" }}>{t.date}</span>
              <span style={{ ...bodyStyle, color: C.green }}>{t.text}</span>
            </li>
          ))}
        </ol>

        {closed ? (
          <div style={{ background: C.sand, borderRadius: "12px", padding: "24px" }}>
            <h2 style={{ fontFamily: "'Outfit'", fontSize: "20px", fontWeight: 700, margin: "0 0 6px" }}>Sign-ups are closed</h2>
            <p style={bodyStyle}>The draw is done. Check #bourbon-swap in Slack for your match.</p>
          </div>
        ) : done ? (
          <div style={{ background: C.sand, borderRadius: "12px", padding: "24px" }}>
            <h2 style={{ fontFamily: "'Outfit'", fontSize: "22px", fontWeight: 800, margin: "0 0 8px" }}>You're in. Cheers.</h2>
            <p style={{ ...bodyStyle, marginBottom: "12px" }}>
              You signed up for <strong style={{ color: C.green }}>{form.samples} samples</strong>, sent
              as <strong style={{ color: C.green }}>{styleLabel}</strong>. You'll find out who you're
              shipping to on Dec 1.
            </p>
            <p style={bodyStyle}>
              The link for the sample bottles and the shipping instructions are in #bourbon-swap on Slack.
              Need to change your address or anything else? Message Corey in Slack.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div>
              <label htmlFor="bs-name" style={labelStyle}>Name</label>
              <input id="bs-name" value={form.name} onChange={set("name")} autoComplete="name" maxLength={100} style={inputStyle} />
            </div>

            <div>
              <label htmlFor="bs-email" style={labelStyle}>Email</label>
              <input id="bs-email" type="email" value={form.email} onChange={set("email")} autoComplete="email" inputMode="email" maxLength={200} style={inputStyle} />
              <p style={{ ...bodyStyle, fontSize: "14px", lineHeight: 1.6, marginTop: "8px" }}>
                Only used for swap updates, like letting you know who you drew. Never shown on this page.
              </p>
            </div>

            <fieldset style={{ border: "none", padding: 0, margin: 0, display: "grid", gap: "10px" }}>
              <legend style={{ ...labelStyle, padding: 0 }}>Shipping address</legend>
              <input aria-label="Street address" placeholder="Street address" value={form.street1} onChange={set("street1")} autoComplete="address-line1" maxLength={150} style={inputStyle} />
              <input aria-label="Apt, suite, etc. (optional)" placeholder="Apt, suite, etc. (optional)" value={form.street2} onChange={set("street2")} autoComplete="address-line2" maxLength={150} style={inputStyle} />
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.3fr)", gap: "10px" }}>
                <input aria-label="City" placeholder="City" value={form.city} onChange={set("city")} autoComplete="address-level2" maxLength={80} style={inputStyle} />
                <select aria-label="State" value={form.state} onChange={set("state")} autoComplete="address-level1" style={{ ...inputStyle, paddingRight: "4px" }}>
                  <option value="">State</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input aria-label="ZIP" placeholder="ZIP" value={form.zip} onChange={set("zip")} autoComplete="postal-code" inputMode="numeric" maxLength={10} style={inputStyle} />
              </div>
            </fieldset>

            <div>
              <span style={labelStyle}>How many samples?</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {SAMPLE_OPTIONS.map(o => (
                  <ChoiceButton key={o.value} selected={form.samples === o.value} onClick={() => setForm(f => ({ ...f, samples: o.value }))}>
                    <span style={{ fontFamily: "'Outfit'", fontSize: "16px", fontWeight: 700 }}>{o.label}</span>
                  </ChoiceButton>
                ))}
              </div>
              <p style={{ ...bodyStyle, fontSize: "14px", lineHeight: 1.6, marginTop: "8px" }}>
                This is how many you'll send, and how many you'll get back.
              </p>
            </div>

            <div>
              <span style={labelStyle}>How do you want your samples sent to you?</span>
              <div style={{ display: "grid", gap: "10px" }}>
                {STYLE_OPTIONS.map(o => (
                  <ChoiceButton key={o.value} selected={form.style === o.value} onClick={() => setForm(f => ({ ...f, style: o.value }))}>
                    <div style={{ fontFamily: "'Outfit'", fontSize: "16px", fontWeight: 700, marginBottom: "2px" }}>{o.label}</div>
                    <div style={{ fontSize: "14px", lineHeight: 1.5, color: C.silver }}>{o.desc}</div>
                  </ChoiceButton>
                ))}
              </div>
              <p style={{ ...bodyStyle, fontSize: "14px", lineHeight: 1.6, marginTop: "8px" }}>
                Whoever draws you will see this, so when you're drawn, check what <em>your</em> person picked before you pack.
              </p>
            </div>

            <div>
              <label htmlFor="bs-notes" style={labelStyle}>Notes for your sender (optional)</label>
              <textarea
                id="bs-notes" value={form.notes} onChange={set("notes")} maxLength={500} rows={3}
                placeholder="e.g. Want to try scotch. Not a fan of peat. Allergic to moss."
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
              />
            </div>

            {/* Honeypot: hidden from people, bots fill it in. No label/name an autofill engine
                recognizes (a "Company" label got autofilled from a saved address). */}
            <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}>
              <input name="hp_x7" tabIndex={-1} autoComplete="off" value={company} onChange={e => setCompany(e.target.value)} />
            </div>

            {status && (
              <div role="alert" style={{
                fontFamily: "'DM Sans'", fontSize: "14px", padding: "10px 12px", borderRadius: "8px",
                background: status.ok ? `${C.green}10` : `${C.orange}18`,
                borderLeft: `3px solid ${status.ok ? C.green : C.orange}`,
                color: C.deep,
              }}>
                {status.msg}
              </div>
            )}

            <button
              type="submit" disabled={submitting}
              style={{
                fontFamily: "'Outfit'", fontSize: "16px", fontWeight: 700, color: C.cream,
                background: C.orange, border: "none", borderRadius: "8px",
                padding: "14px", cursor: submitting ? "default" : "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Signing you up…" : "Count me in"}
            </button>
          </form>
        )}

        <WhosIn signups={signups} />
      </div>
    </div>
  );
}
