import { useState, useEffect, useRef } from "react";
import { SLIDES, SURVEY_ID, API, TOTAL_QUESTIONS } from "./slides.js";

const C = {
  cream: "#F5F0E8", green: "#004C54", orange: "#D4691C",
  sand: "#EDE6DA", silver: "#5C5955", deep: "#002B30",
};

// Weather condition code → emoji (WMO codes from Open-Meteo)
function weatherEmoji(code) {
  if (code === 0) return "☀️";
  if (code <= 2) return "⛅";
  if (code === 3) return "☁️";
  if (code <= 49) return "🌫️";
  if (code <= 59) return "🌦️";
  if (code <= 69) return "🌧️";
  if (code <= 79) return "❄️";
  if (code <= 82) return "🌧️";
  if (code <= 84) return "🌨️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}

function weatherCTA(code, temp) {
  const isNice = code <= 3 && temp >= 45;
  return isNice
    ? "Go book a tee time."
    : "Practice your swing in the mirror.";
}

function weatherDesc(code) {
  if (code === 0) return "Clear skies";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code <= 49) return "Foggy";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rainy";
  if (code <= 79) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 84) return "Snow showers";
  if (code <= 99) return "Thunderstorms";
  return "Unknown";
}

// --- Shared UI primitives ---
const Btn = ({ children, onClick, disabled, variant = "primary", style = {} }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      fontFamily: "'Outfit'", fontWeight: 700, fontSize: "15px",
      padding: "14px 32px", borderRadius: "10px", cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      border: variant === "primary" ? "none" : `2px solid ${C.green}30`,
      background: variant === "primary" ? C.orange : "transparent",
      color: variant === "primary" ? "#fff" : C.green,
      transition: "opacity 0.15s, transform 0.1s",
      ...style,
    }}
    onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = "0.85"; }}
    onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.opacity = "1"; }}
  >
    {children}
  </button>
);

// Progress bar
const ProgressBar = ({ answers }) => {
  const answered = SLIDES.filter((s) => s.number !== undefined && answers[s.id] != null).length;
  const pct = Math.round((answered / TOTAL_QUESTIONS) * 100);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "4px", background: `${C.orange}20`, zIndex: 200 }}>
      <div style={{
        height: "100%", background: C.orange,
        width: `${pct}%`, transition: "width 0.5s ease",
      }} />
    </div>
  );
};

// Slide wrapper with fade animation
const SlideWrap = ({ children, dark }) => (
  <div style={{
    minHeight: "100dvh", display: "flex", flexDirection: "column",
    justifyContent: "center", alignItems: "center",
    background: dark ? C.green : C.cream,
    padding: "60px 24px 40px",
    animation: "fadeSlide 0.35s ease forwards",
  }}>
    {children}
  </div>
);

const QuestionLabel = ({ number, total }) => (
  <div style={{
    fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 600,
    letterSpacing: "0.14em", textTransform: "uppercase",
    color: C.orange, marginBottom: "12px",
  }}>
    Question {number} of {total}
  </div>
);

const QuestionText = ({ children, parts, light }) => (
  <h2 style={{
    fontFamily: "'Outfit'", fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 800,
    lineHeight: 1.15, letterSpacing: "-0.025em",
    color: light ? C.cream : C.green,
    margin: "0 0 8px", textAlign: "center", maxWidth: "680px",
  }}>
    {parts
      ? parts.map((p, i) =>
          p.highlight
            ? <span key={i} style={{ color: C.orange }}>{p.text}</span>
            : <span key={i}>{p.text}</span>
        )
      : children}
  </h2>
);

const Hint = ({ children, light }) => (
  <p style={{
    fontFamily: "'DM Sans'", fontSize: "14px", color: light ? `${C.cream}70` : C.silver,
    margin: "0 0 28px", textAlign: "center",
  }}>{children}</p>
);

// --- Slide types ---

function SingleChoice({ slide, value, onChange, onNext }) {
  return (
    <div style={{ width: "100%", maxWidth: "640px" }}>
      {slide.hint && <Hint>{slide.hint}</Hint>}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
        {slide.options.map((opt) => {
          const selected = value === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => { onChange(opt.key); setTimeout(onNext, 320); }}
              style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "16px 20px", borderRadius: "12px",
                border: selected ? `2px solid ${C.orange}` : `2px solid ${C.green}15`,
                background: selected ? `${C.orange}15` : C.sand,
                cursor: "pointer", textAlign: "left", width: "100%",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <span style={{
                fontFamily: "'Outfit'", fontWeight: 700, fontSize: "13px",
                color: selected ? C.orange : C.silver,
                minWidth: "22px",
              }}>{opt.key}</span>
              <span style={{
                fontFamily: "'DM Sans'", fontSize: "15px", fontWeight: 500,
                color: selected ? C.green : C.green,
                lineHeight: 1.4,
              }}>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MultiSelect({ slide, value, onChange, onNext }) {
  const keys = value?.keys ?? (Array.isArray(value) ? value : []);
  const [otherText, setOtherText] = useState(value?.other ?? "");

  const toggle = (key) => {
    const nextKeys = keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key];
    onChange({ keys: nextKeys, other: otherText });
  };
  const canNext = keys.length > 0;

  return (
    <div style={{ width: "100%", maxWidth: "640px" }}>
      {slide.hint && <Hint>{slide.hint}</Hint>}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
        {slide.options.map((opt) => {
          const selected = keys.includes(opt.key);
          return (
            <div key={opt.key}>
              <button
                onClick={() => toggle(opt.key)}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "14px 20px", borderRadius: "10px", width: "100%",
                  border: selected ? `2px solid ${C.orange}` : `2px solid ${C.green}15`,
                  background: selected ? `${C.orange}12` : C.sand,
                  cursor: "pointer", textAlign: "left",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <div style={{
                  width: "20px", height: "20px", borderRadius: "5px", flexShrink: 0,
                  border: selected ? `2px solid ${C.orange}` : `2px solid ${C.silver}50`,
                  background: selected ? C.orange : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {selected && <span style={{ color: "#fff", fontSize: "12px", fontWeight: 800 }}>✓</span>}
                </div>
                <span style={{ fontFamily: "'DM Sans'", fontSize: "15px", fontWeight: 500, color: C.green, lineHeight: 1.4 }}>
                  {opt.label}
                </span>
              </button>
              {opt.hasText && selected && (
                <input
                  placeholder="Tell us more..."
                  value={otherText}
                  onChange={(e) => { setOtherText(e.target.value); onChange({ keys, other: e.target.value }); }}
                  style={{
                    marginTop: "6px", width: "100%", padding: "12px 16px",
                    fontFamily: "'DM Sans'", fontSize: "15px", color: C.green,
                    background: C.cream, border: `1.5px solid ${C.orange}40`,
                    borderRadius: "8px", outline: "none",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <Btn onClick={onNext} disabled={!canNext}>Next →</Btn>
    </div>
  );
}

function NumberPicker({ slide, value, onChange, onNext }) {
  const nums = Array.from({ length: slide.max - slide.min + 1 }, (_, i) => slide.min + i);
  return (
    <div style={{ width: "100%", maxWidth: "520px", textAlign: "center" }}>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginBottom: "32px" }}>
        {nums.map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              onClick={() => { onChange(n); setTimeout(onNext, 320); }}
              style={{
                width: "60px", height: "60px", borderRadius: "12px",
                border: selected ? `2px solid ${C.orange}` : `2px solid ${C.green}20`,
                background: selected ? C.orange : C.sand,
                color: selected ? "#fff" : C.green,
                fontFamily: "'Outfit'", fontWeight: 800, fontSize: "22px",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >{n}</button>
          );
        })}
      </div>
    </div>
  );
}

function ZipInput({ slide, value, onChange, onNext }) {
  const [err, setErr] = useState("");
  const handleNext = () => {
    if (!/^\d{5}$/.test(value)) { setErr("Please enter a valid 5-digit zip code."); return; }
    setErr("");
    onNext();
  };
  return (
    <div style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}>
      <input
        type="text"
        inputMode="numeric"
        maxLength={5}
        value={value || ""}
        onChange={(e) => { onChange(e.target.value.replace(/\D/g, "")); setErr(""); }}
        onKeyDown={(e) => e.key === "Enter" && handleNext()}
        placeholder="19103"
        style={{
          width: "100%", padding: "20px", textAlign: "center",
          fontFamily: "'Outfit'", fontWeight: 800, fontSize: "36px",
          letterSpacing: "0.18em", color: C.green,
          background: C.sand, border: `2px solid ${err ? C.orange : `${C.green}20`}`,
          borderRadius: "14px", outline: "none", marginBottom: "8px",
        }}
        autoFocus
      />
      {err && <p style={{ fontFamily: "'DM Sans'", fontSize: "14px", color: C.orange, marginBottom: "16px" }}>{err}</p>}
      {!err && <div style={{ height: "24px", marginBottom: "16px" }} />}
      <Btn onClick={handleNext}>Next →</Btn>
    </div>
  );
}

function RatingSlide({ slide, value, onChange, onNext }) {
  const ratings = [1, 2, 3, 4, 5];
  return (
    <div style={{ width: "100%", maxWidth: "560px", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
        <span style={{
          fontFamily: "'DM Sans'", fontSize: "13px", color: C.silver,
          lineHeight: 1.4, textAlign: "right", maxWidth: "120px", whiteSpace: "pre-line",
        }}>{slide.leftLabel}</span>
        <div style={{ display: "flex", gap: "10px", flex: 1, justifyContent: "center" }}>
          {ratings.map((r) => {
            const selected = value === r;
            return (
              <button
                key={r}
                onClick={() => { onChange(r); setTimeout(onNext, 320); }}
                style={{
                  width: "52px", height: "52px", borderRadius: "50%",
                  border: selected ? `3px solid ${C.orange}` : `2px solid ${C.green}25`,
                  background: selected ? C.orange : C.sand,
                  color: selected ? "#fff" : C.green,
                  fontFamily: "'Outfit'", fontWeight: 800, fontSize: "18px",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >{r}</button>
            );
          })}
        </div>
        <span style={{
          fontFamily: "'DM Sans'", fontSize: "13px", color: C.silver,
          lineHeight: 1.4, textAlign: "left", maxWidth: "120px", whiteSpace: "pre-line",
        }}>{slide.rightLabel}</span>
      </div>
    </div>
  );
}

function TextInput({ slide, value, onChange, onNext }) {
  return (
    <div style={{ width: "100%", maxWidth: "580px", textAlign: "center" }}>
      {slide.hint && <Hint>{slide.hint}</Hint>}
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer here..."
        rows={4}
        style={{
          width: "100%", padding: "16px", marginBottom: "24px",
          fontFamily: "'DM Sans'", fontSize: "15px", color: C.green, lineHeight: 1.6,
          background: C.sand, border: `2px solid ${C.green}15`,
          borderRadius: "12px", outline: "none", resize: "vertical",
        }}
      />
      <Btn onClick={onNext}>{slide.optional ? "Next →" : "Next →"}</Btn>
    </div>
  );
}

function TransitionSlide({ slide, onNext }) {
  useEffect(() => {
    const t = setTimeout(onNext, 4800);
    return () => clearTimeout(t);
  }, []);

  return (
    <SlideWrap dark>
      <div style={{ textAlign: "center", maxWidth: "600px" }}>
        <div style={{
          fontFamily: "'Outfit'", fontWeight: 800,
          fontSize: "clamp(28px, 6vw, 52px)",
          lineHeight: 1.1, letterSpacing: "-0.03em",
          color: C.cream, marginBottom: "16px",
          whiteSpace: "pre-line",
        }}>{slide.text}</div>
        {slide.sub && (
          <p style={{ fontFamily: "'DM Sans'", fontSize: "18px", color: `${C.cream}70`, margin: "0 0 32px" }}>
            {slide.sub}
          </p>
        )}
        <button
          onClick={onNext}
          style={{
            background: "none", border: `1.5px solid ${C.cream}30`,
            color: `${C.cream}60`, fontFamily: "'DM Sans'", fontSize: "13px",
            padding: "8px 20px", borderRadius: "8px", cursor: "pointer",
          }}
        >Continue</button>
      </div>
    </SlideWrap>
  );
}

function WeatherSlide({ answers, onNext }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const zip = answers.q2;
    if (!zip) { onNext(); return; }

    (async () => {
      try {
        const geo = await fetch(`https://api.zippopotam.us/us/${zip}`).then((r) => r.json());
        const place = geo.places?.[0];
        if (!place) { onNext(); return; }

        const lat = parseFloat(place.latitude);
        const lon = parseFloat(place.longitude);
        const city = place["place name"];
        const state = place["state abbreviation"];

        const wx = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=auto`
        ).then((r) => r.json());

        setData({
          city, state,
          temp: Math.round(wx.current.temperature_2m),
          code: wx.current.weather_code,
        });
      } catch {
        setError(true);
        setTimeout(onNext, 1500);
      }
    })();
  }, []);

  if (error) return (
    <SlideWrap>
      <QuestionText>Couldn't load weather — but the golf is still good.</QuestionText>
      <Btn onClick={onNext} style={{ marginTop: "24px" }}>Continue →</Btn>
    </SlideWrap>
  );

  if (!data) return (
    <SlideWrap>
      <div style={{ fontFamily: "'DM Sans'", fontSize: "16px", color: C.silver, textAlign: "center" }}>
        Checking the forecast...
      </div>
    </SlideWrap>
  );

  const emoji = weatherEmoji(data.code);
  const desc = weatherDesc(data.code);
  const cta = weatherCTA(data.code, data.temp);

  return (
    <SlideWrap>
      <div style={{ textAlign: "center", maxWidth: "480px" }}>
        <div style={{ fontSize: "72px", marginBottom: "16px", lineHeight: 1 }}>{emoji}</div>
        <div style={{
          fontFamily: "'Outfit'", fontWeight: 800, fontSize: "clamp(32px, 6vw, 56px)",
          color: C.green, letterSpacing: "-0.03em", marginBottom: "8px",
        }}>{data.temp}°F</div>
        <div style={{ fontFamily: "'Outfit'", fontWeight: 600, fontSize: "18px", color: C.orange, marginBottom: "6px" }}>
          {desc}
        </div>
        <div style={{ fontFamily: "'DM Sans'", fontSize: "16px", color: C.silver, marginBottom: "20px" }}>
          {data.city}, {data.state}
        </div>
        <div style={{
          fontFamily: "'Outfit'", fontWeight: 700, fontSize: "18px",
          color: C.orange, marginBottom: "32px",
        }}>{cta}</div>
        <Btn onClick={onNext}>Continue →</Btn>
      </div>
    </SlideWrap>
  );
}

function ResultsSlide({ slide, answers, onNext }) {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    fetch(`${API}/results?surveyId=${SURVEY_ID}&questionId=${slide.questionId}`)
      .then((r) => r.json())
      .then((d) => setCounts(d.counts || {}))
      .catch(() => setCounts({}));
  }, []);

  const total = counts ? Object.values(counts).reduce((s, v) => s + v, 0) : 0;

  return (
    <SlideWrap dark>
      <div style={{ width: "100%", maxWidth: "580px", textAlign: "center" }}>
        <div style={{
          fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 600,
          letterSpacing: "0.14em", textTransform: "uppercase",
          color: C.orange, marginBottom: "12px",
        }}>Live Results</div>
        <div style={{
          fontFamily: "'Outfit'", fontWeight: 800, fontSize: "clamp(20px, 3.5vw, 28px)",
          color: C.cream, marginBottom: "32px", letterSpacing: "-0.02em",
        }}>{slide.title}</div>

        {!counts ? (
          <p style={{ fontFamily: "'DM Sans'", fontSize: "16px", color: `${C.cream}60` }}>Loading...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "36px" }}>
            {slide.options.map((opt) => {
              const count = counts[opt.key] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const isYou = answers[slide.questionId] === opt.key;
              return (
                <div key={opt.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {opt.emoji && <span style={{ fontSize: "18px" }}>{opt.emoji}</span>}
                      <span style={{ fontFamily: "'DM Sans'", fontSize: "14px", color: `${C.cream}90` }}>
                        <span style={{ fontFamily: "'Outfit'", fontWeight: 700, color: C.orange, marginRight: "6px" }}>
                          {opt.key}
                        </span>
                        {opt.label}
                      </span>
                      {isYou && (
                        <span style={{
                          fontFamily: "'Outfit'", fontSize: "11px", fontWeight: 700,
                          color: C.green, background: C.orange,
                          padding: "2px 7px", borderRadius: "4px",
                          letterSpacing: "0.04em", textTransform: "uppercase",
                        }}>You</span>
                      )}
                    </div>
                    <span style={{ fontFamily: "'Outfit'", fontWeight: 700, fontSize: "14px", color: isYou ? C.orange : `${C.cream}60` }}>
                      {pct}%
                    </span>
                  </div>
                  <div style={{ height: "8px", background: `${C.cream}15`, borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      background: isYou ? C.orange : `${C.cream}35`,
                      width: `${pct}%`, borderRadius: "4px",
                      transition: "width 0.8s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Btn onClick={onNext}>Continue →</Btn>
      </div>
    </SlideWrap>
  );
}

function DoneSlide() {
  return (
    <SlideWrap dark>
      <div style={{ textAlign: "center", maxWidth: "480px" }}>
        <div style={{ fontSize: "56px", marginBottom: "20px" }}>⚡</div>
        <div style={{
          fontFamily: "'Outfit'", fontWeight: 800, fontSize: "clamp(28px, 5vw, 44px)",
          color: C.cream, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "16px",
        }}>Thanks for being here.</div>
        <p style={{ fontFamily: "'DM Sans'", fontSize: "16px", color: `${C.cream}70`, lineHeight: 1.7, marginBottom: "32px" }}>
          Your responses are in. We'll use them to make the EP better.<br />
          Now go hit some balls.
        </p>
        <div style={{
          fontFamily: "'Outfit'", fontSize: "12px", fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase", color: C.orange,
        }}>Electric Phactory · Est. 2021</div>
      </div>
    </SlideWrap>
  );
}

// --- Main survey controller ---

function getVisibleSlides(answers) {
  return SLIDES.filter((s) => !s.show || s.show(answers));
}

const STORAGE_KEY = `ep-survey-${SURVEY_ID}`;

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function SurveyPage() {
  const saved = loadSaved();
  const [answers, setAnswers] = useState(saved?.answers ?? {});
  const [idx, setIdx] = useState(saved?.idx ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const submitted = useRef(false);

  const visible = getVisibleSlides(answers);
  const slide = visible[idx];

  const setAnswer = (id, value) => setAnswers((prev) => {
    const next = { ...prev, [id]: value };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: next, idx })); } catch {}
    return next;
  });

  const goNext = async () => {
    // Submit when leaving q13
    if (slide.id === "q13" && !submitted.current) {
      submitted.current = true;
      setSubmitting(true);
      try {
        await fetch(`${API}/submit`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ surveyId: SURVEY_ID, answers }),
        });
      } catch { /* best effort */ }
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setSubmitting(false);
    }

    // Recompute visible slides with updated answers for conditional slides
    const nextAnswers = answers;
    const nextVisible = getVisibleSlides(nextAnswers);
    const nextIdx = idx + 1;
    if (nextIdx < nextVisible.length) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, idx: nextIdx })); } catch {}
      setIdx(nextIdx);
    }
  };

  if (!slide) return null;

  // Transition and special slides handle their own layout
  if (slide.type === "transition") {
    return (
      <>
        <style>{`
          @keyframes fadeSlide { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
        `}</style>
        <ProgressBar answers={answers} />
        <TransitionSlide slide={slide} onNext={goNext} />
      </>
    );
  }

  if (slide.type === "weather") {
    return (
      <>
        <style>{`@keyframes fadeSlide { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <ProgressBar answers={answers} />
        <WeatherSlide answers={answers} onNext={goNext} />
      </>
    );
  }

  if (slide.type === "results") {
    return (
      <>
        <style>{`@keyframes fadeSlide { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <ProgressBar answers={answers} />
        <ResultsSlide slide={slide} answers={answers} onNext={goNext} />
      </>
    );
  }

  if (slide.type === "done") {
    return (
      <>
        <style>{`@keyframes fadeSlide { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <DoneSlide />
      </>
    );
  }

  // Standard question slide
  const value = answers[slide.id];
  const canNext = slide.optional || value != null;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap" rel="stylesheet" />
      <style>{`@keyframes fadeSlide { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <ProgressBar answers={answers} />

      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        background: C.cream, padding: "72px 24px 48px",
        animation: "fadeSlide 0.35s ease forwards",
      }}>
        <div style={{ width: "100%", maxWidth: "680px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {slide.number != null && (
            <QuestionLabel number={slide.number} total={TOTAL_QUESTIONS} />
          )}
          <QuestionText parts={slide.questionParts}>{slide.question}</QuestionText>

          <div style={{ height: "24px" }} />

          {slide.type === "single" && (
            <SingleChoice
              slide={slide}
              value={value}
              onChange={(v) => setAnswer(slide.id, v)}
              onNext={goNext}
            />
          )}
          {slide.type === "multi" && (
            <MultiSelect
              slide={slide}
              value={value}
              onChange={(v) => setAnswer(slide.id, v)}
              onNext={goNext}
            />
          )}
          {slide.type === "number" && (
            <NumberPicker
              slide={slide}
              value={value}
              onChange={(v) => setAnswer(slide.id, v)}
              onNext={goNext}
            />
          )}
          {slide.type === "zip" && (
            <ZipInput
              slide={slide}
              value={value}
              onChange={(v) => setAnswer(slide.id, v)}
              onNext={goNext}
            />
          )}
          {slide.type === "rating" && (
            <RatingSlide
              slide={slide}
              value={value}
              onChange={(v) => setAnswer(slide.id, v)}
              onNext={goNext}
            />
          )}
          {slide.type === "text" && (
            <TextInput
              slide={slide}
              value={value}
              onChange={(v) => setAnswer(slide.id, v)}
              onNext={goNext}
            />
          )}

          {/* Explicit next button for types that don't auto-advance */}
          {(slide.type === "text") && null /* already has Next in component */}
          {(slide.type === "multi") && null /* already has Next in component */}
        </div>

        {submitting && (
          <div style={{
            position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
            fontFamily: "'DM Sans'", fontSize: "13px", color: C.silver,
            background: C.sand, padding: "8px 16px", borderRadius: "8px",
          }}>Submitting...</div>
        )}
      </div>
    </>
  );
}
