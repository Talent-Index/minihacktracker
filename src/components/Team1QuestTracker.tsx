import { useState, useEffect, useCallback, useMemo } from "react";

// ─── BRAND ────────────────────────────────────────────────────────────────────
// From team1 Branding Guidelines 2026:
//   #FF394A Ava Red (primary), #161617 Dark Grey, #F5F5F9 Light Gray
//   Typography: Kanit (primary), Inter (body)
//   Logo: lowercase "team" + superscript "1"  ->  team¹
const BRAND = {
  red: "#FF394A",
  redSoft: "#FFE4E7",
  redDeep: "#D11F30",
  ink: "#161617",
  inkSoft: "#3a3a3d",
  mute: "#8a8a90",
  line: "#e8e6ea",
  bg: "#F5F5F9",
  card: "#ffffff",
};

// ─── COHORTS / QUESTS ────────────────────────────────────────────────────────
const COHORTS = [
  {
    id: "c1",
    label: "Cohort 1",
    theme: "Payments",
    category: "Payments",
    emoji: "💳",
    status: "active" as const,
    quests: [
      { id: "GxbeoL", title: "Builder Registration", description: "Register as a builder and set up your Core Wallet to start the Mini Hack.", points: 20, url: "https://tally.so/r/GxbeoL", week: 1, emoji: "🚀" },
      { id: "rjv4Zo", title: "Smart Contract Deployment", description: "Deploy your first smart contract to the Avalanche Fuji testnet.", points: 20, url: "https://tally.so/r/rjv4Zo", week: 2, emoji: "⚙️" },
      { id: "lbzkqp", title: "Payment Integration", description: "Build and submit a working payment integration on Avalanche.", points: 20, url: "https://tally.so/r/lbzkqp", week: 3, emoji: "💸" },
    ],
  },
  {
    id: "c2",
    label: "Cohort 2",
    theme: "Gaming",
    category: "Gaming",
    emoji: "🎮",
    status: "upcoming" as const,
    quests: [
      { id: null, title: "Game Loop Design", description: "Design an on-chain game loop using Avalanche subnets.", points: 20, url: null, week: 5, emoji: "🕹️" },
      { id: null, title: "NFT Integration", description: "Mint and transfer NFTs from within your game.", points: 20, url: null, week: 6, emoji: "🖼️" },
      { id: null, title: "Leaderboard Contract", description: "Deploy an on-chain leaderboard smart contract.", points: 20, url: null, week: 7, emoji: "🏅" },
    ],
  },
  {
    id: "c3",
    label: "Cohort 3",
    theme: "Agentic AI",
    category: "Agentic AI",
    emoji: "🤖",
    status: "upcoming" as const,
    quests: [
      { id: null, title: "Agent Architecture", description: "Design an autonomous agent that interacts on-chain.", points: 20, url: null, week: 9, emoji: "🧠" },
      { id: null, title: "On-Chain AI Action", description: "Deploy an agent that executes real transactions.", points: 20, url: null, week: 10, emoji: "⚡" },
      { id: null, title: "Agentic Product Demo", description: "Ship a working agentic product on Avalanche.", points: 20, url: null, week: 12, emoji: "🛰️" },
    ],
  },
];

const LINKS = [
  { label: "Programme Site", url: "https://team1-kenya-hackathon.vercel.app" },
  { label: "X / Twitter", url: "https://x.com/avaxafrica" },
  { label: "Telegram", url: "https://t.me/avaxDAOAfrica" },
  { label: "WhatsApp", url: "https://chat.whatsapp.com/JEOKw9yjlKcGbbdRlC5d12" },
  { label: "Recordings", url: "https://futuristic-dog-9aa.notion.site" },
];

// ─── UTILITIES ───────────────────────────────────────────────────────────────
type AnyObj = Record<string, any>;

function extractName(responses: AnyObj[] | undefined, questions: AnyObj[] | undefined) {
  if (!responses || !questions) return null;
  const nameQ = questions.find((q) => q.title && /name|full.?name|your.?name/i.test(q.title));
  if (!nameQ) return null;
  const r = responses.find((r) => r.questionId === nameQ.id);
  return r?.formattedAnswer || r?.answer || null;
}
function extractEmail(responses: AnyObj[] | undefined, questions: AnyObj[] | undefined) {
  if (!responses || !questions) return null;
  const emailQ = questions.find((q) => q.type === "EMAIL" || (q.title && /email/i.test(q.title)));
  if (!emailQ) return null;
  const r = responses.find((r) => r.questionId === emailQ.id);
  return r?.formattedAnswer || r?.answer || null;
}
function firstName(name: string | null) {
  if (!name) return "—";
  const trimmed = String(name).trim().split(/\s+/)[0];
  return trimmed.length > 14 ? trimmed.slice(0, 13) + "…" : trimmed;
}
function getInitial(name: string | null) {
  if (!name) return "?";
  return name.trim()[0]?.toUpperCase() || "?";
}
const AVATAR_COLORS = ["#FF394A", "#3055B3", "#12B76A", "#7C3AED", "#F59E0B", "#0891B2", "#EC4899", "#0EA5E9"];
function colorFor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function timeSince(d: string | Date) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

async function fetchTally(formId: string) {
  try {
    const res = await fetch(`/api/tally/${formId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── LOGO ────────────────────────────────────────────────────────────────────
function Team1Wordmark({ size = 32, color = BRAND.ink }: { size?: number; color?: string }) {
  // Per brand guide: lowercase "team" + superscript "1", Kanit Medium, never "TEAM1".
  return (
    <span
      style={{
        fontFamily: "'Kanit', sans-serif",
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1,
        color,
        letterSpacing: "-0.02em",
        display: "inline-flex",
        alignItems: "flex-start",
      }}
    >
      team
      <sup style={{ fontSize: size * 0.55, fontWeight: 600, lineHeight: 1, marginLeft: 1, top: "0.05em", position: "relative" }}>1</sup>
    </span>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
type Builder = { name: string; email: string; key: string; questsDone: Set<string>; points: number; last: string };

export default function Team1QuestTracker() {
  const [view, setView] = useState<"quests" | "leaderboard">("quests");
  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, any>>({});
  const [questionsMap, setQuestionsMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allQuests = useMemo(
    () => COHORTS.flatMap((c) => c.quests.map((q) => ({ ...q, cohortId: c.id, cohortLabel: c.label, category: c.category, cohortEmoji: c.emoji, cohortStatus: c.status }))),
    [],
  );
  const activeQuests = useMemo(() => allQuests.filter((q) => q.id), [allQuests]);
  const categories = useMemo(() => ["All", ...Array.from(new Set(allQuests.map((q) => q.category)))], [allQuests]);

  // ─── FETCH ─────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const results = await Promise.all(
      activeQuests.map(async (q) => ({ id: q.id!, data: await fetchTally(q.id!) })),
    );
    const subs: Record<string, any> = {};
    const qs: Record<string, any[]> = {};
    let hadError = false;
    for (const r of results) {
      if (r.data && !r.data.error) {
        subs[r.id] = r.data;
        qs[r.id] = r.data.questions || [];
      } else if (r.data?.error) {
        hadError = true;
      }
    }
    setSubmissionsMap(subs);
    setQuestionsMap(qs);
    if (hadError) setError("Some forms could not be fetched. Verify TALLY_API_KEY is configured.");
    setLastRefresh(new Date());
    setLoading(false);
  }, [activeQuests]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  // ─── PER-QUEST SIGN-UPS ────────────────────────────────────────────────────
  const questSignups = useMemo(() => {
    const out: Record<string, { name: string; key: string; email: string }[]> = {};
    for (const quest of activeQuests) {
      const data = submissionsMap[quest.id!];
      const qs = questionsMap[quest.id!] || [];
      if (!data?.submissions) {
        out[quest.id!] = [];
        continue;
      }
      const seen = new Set<string>();
      const list: { name: string; key: string; email: string }[] = [];
      for (const sub of data.submissions) {
        const name = extractName(sub.responses, qs) || `Builder ${sub.id?.slice(-4) || ""}`;
        const email = extractEmail(sub.responses, qs) || sub.respondentId || sub.id;
        const key = (email || "").toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({ name, key, email });
      }
      out[quest.id!] = list;
    }
    return out;
  }, [activeQuests, submissionsMap, questionsMap]);

  // ─── LEADERBOARD ───────────────────────────────────────────────────────────
  const leaderboard = useMemo(() => {
    const registry = new Map<string, Builder>();
    for (const quest of activeQuests) {
      const data = submissionsMap[quest.id!];
      const qs = questionsMap[quest.id!] || [];
      if (!data?.submissions) continue;
      for (const sub of data.submissions) {
        const name = extractName(sub.responses, qs) || `Builder ${sub.id?.slice(-4) || ""}`;
        const email = extractEmail(sub.responses, qs) || sub.respondentId || sub.id;
        const key = (email || "").toLowerCase();
        let b = registry.get(key);
        if (!b) {
          b = { name, email, key, questsDone: new Set(), points: 0, last: sub.submittedAt };
          registry.set(key, b);
        }
        if (!b.questsDone.has(quest.id!)) {
          b.questsDone.add(quest.id!);
          b.points += quest.points;
        }
        if (new Date(sub.submittedAt) > new Date(b.last)) b.last = sub.submittedAt;
      }
    }
    return Array.from(registry.values())
      .sort((a, b) => b.points - a.points || b.questsDone.size - a.questsDone.size)
      .map((b, i) => ({ ...b, rank: i + 1 }));
  }, [activeQuests, submissionsMap, questionsMap]);

  const totalCompletions = activeQuests.reduce(
    (s, q) => s + (submissionsMap[q.id!]?.totalNumberOfSubmissionsPerFilter?.completed || 0),
    0,
  );

  // ─── FILTERED QUESTS ───────────────────────────────────────────────────────
  const visibleQuests = useMemo(() => {
    let list = allQuests;
    if (filter !== "All") list = list.filter((q) => q.category === filter);
    return list;
  }, [allQuests, filter]);

  const filteredLeaderboard = useMemo(() => {
    if (!search.trim()) return leaderboard;
    const s = search.toLowerCase();
    return leaderboard.filter((b) => b.name.toLowerCase().includes(s) || b.email.toLowerCase().includes(s));
  }, [leaderboard, search]);

  return (
    <div style={{ background: BRAND.bg, minHeight: "100vh", color: BRAND.ink, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes shine { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        .t1-card { transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
        .t1-card:hover { transform: translateY(-2px); box-shadow: 0 12px 28px -16px rgba(22,22,23,.18); border-color:${BRAND.red}55; }
        .t1-link:hover { color:${BRAND.red}; }
        .t1-chip:hover { background:${BRAND.redSoft}; }
      `}</style>

      {/* HEADER */}
      <header style={{ background: "#fff", borderBottom: `1px solid ${BRAND.line}` }}>
        <div style={wrapStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Team1Wordmark size={36} color={BRAND.ink} />
              <div style={{ height: 28, width: 1, background: BRAND.line }} />
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span style={{ fontFamily: "'Kanit', sans-serif", fontWeight: 600, fontSize: 15, color: BRAND.ink, letterSpacing: "-0.01em" }}>
                  Kenya · Mini Hack 2026
                </span>
                <span style={{ fontSize: 12, color: BRAND.mute, marginTop: 2 }}>Quest Tracker</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#12B76A14", border: "1px solid #12B76A40", padding: "5px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "#0d8a4f", letterSpacing: 0.4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#12B76A", animation: "pulseDot 1.6s infinite" }} />
                LIVE
              </div>
              {lastRefresh && (
                <span style={{ fontSize: 11, color: BRAND.mute }}>Updated {timeSince(lastRefresh)}</span>
              )}
              <button
                onClick={fetchAll}
                disabled={loading}
                style={{
                  background: "#fff", border: `1px solid ${BRAND.line}`, borderRadius: 999,
                  padding: "6px 14px", fontSize: 12, fontWeight: 600, color: BRAND.ink, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {loading ? "Refreshing…" : "↻ Refresh"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO + VIEW SWITCH */}
      <section style={wrapStyle}>
        <div style={{ padding: "32px 0 12px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: BRAND.red, textTransform: "uppercase", marginBottom: 8 }}>
              Build · Ship · Earn
            </div>
            <h1 style={{ fontFamily: "'Kanit', sans-serif", fontWeight: 700, fontSize: 40, lineHeight: 1.05, letterSpacing: "-0.02em", margin: 0, color: BRAND.ink }}>
              See who's tackling quests and where the leaderboard stands.
            </h1>
            <p style={{ marginTop: 12, fontSize: 14, color: BRAND.inkSoft, lineHeight: 1.6 }}>
              Real-time submissions from Tally, aggregated across every Mini Hack quest. Complete a quest, climb the board.
            </p>
          </div>
          <div style={{ display: "inline-flex", background: "#fff", border: `1px solid ${BRAND.line}`, borderRadius: 12, padding: 4 }}>
            {(["quests", "leaderboard"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "8px 18px", fontFamily: "'Kanit', sans-serif", fontWeight: 600, fontSize: 13,
                  textTransform: "capitalize", letterSpacing: "0.01em",
                  background: view === v ? BRAND.red : "transparent",
                  color: view === v ? "#fff" : BRAND.inkSoft,
                  border: "none", borderRadius: 8, cursor: "pointer",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 18 }}>
          <StatCard label="Quests" value={activeQuests.length} accent={BRAND.ink} />
          <StatCard label="Total Quest Completions" value={totalCompletions} accent="#12B76A" />
          <StatCard label="Participants" value={leaderboard.length} accent={BRAND.red} />
        </div>

        {error && (
          <div style={{ marginTop: 16, background: "#FFF1F2", border: "1px solid #FECDD3", color: BRAND.redDeep, padding: "10px 14px", borderRadius: 10, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* SEARCH + FILTERS */}
        {view === "quests" ? (
          <div style={{ marginTop: 22 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className="t1-chip"
                  style={{
                    padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                    fontFamily: "inherit", cursor: "pointer",
                    background: filter === c ? BRAND.red : "#fff",
                    color: filter === c ? "#fff" : BRAND.inkSoft,
                    border: `1px solid ${filter === c ? BRAND.red : BRAND.line}`,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 22 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              style={{
                width: "100%", padding: "14px 18px", borderRadius: 12,
                border: `1px solid ${BRAND.line}`, background: "#fff",
                fontSize: 14, fontFamily: "inherit", color: BRAND.ink, outline: "none",
              }}
            />
          </div>
        )}
      </section>

      {/* MAIN CONTENT */}
      <main style={{ ...wrapStyle, paddingTop: 20, paddingBottom: 60 }}>
        {view === "quests" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
            {visibleQuests.map((q, idx) => {
              const signups = q.id ? questSignups[q.id] || [] : [];
              const count = q.id ? submissionsMap[q.id]?.totalNumberOfSubmissionsPerFilter?.completed || 0 : 0;
              const locked = !q.id;
              return (
                <article
                  key={(q.id || "locked") + idx}
                  className="t1-card"
                  style={{
                    background: BRAND.card, border: `1px solid ${BRAND.line}`, borderRadius: 16,
                    padding: 20, display: "flex", flexDirection: "column", gap: 12,
                    opacity: locked ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 12, background: BRAND.redSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                      {q.emoji}
                    </div>
                    <span style={{ background: "#FFE9D6", color: "#B45309", fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 999 }}>
                      {q.points} pts
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: BRAND.red, textTransform: "uppercase", marginBottom: 6 }}>
                      {q.category} · Week {q.week}
                    </div>
                    <h3 style={{ fontFamily: "'Kanit', sans-serif", fontWeight: 600, fontSize: 18, margin: 0, lineHeight: 1.25, color: BRAND.ink }}>
                      {q.title}
                    </h3>
                    <p style={{ margin: "8px 0 0", fontSize: 13, color: BRAND.inkSoft, lineHeight: 1.5 }}>{q.description}</p>
                  </div>

                  {!locked && (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#12B76A" }}>
                        {count} signed up
                      </div>
                      {signups.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {signups.slice(0, 14).map((p) => (
                            <SignupPill key={p.key} name={p.name} colorKey={p.key} />
                          ))}
                          {signups.length > 14 && (
                            <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 999, background: BRAND.bg, color: BRAND.inkSoft, fontSize: 11, fontWeight: 600 }}>
                              +{signups.length - 14} more
                            </span>
                          )}
                        </div>
                      )}
                      <a
                        href={q.url!}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          marginTop: "auto", textAlign: "center", padding: "10px 14px",
                          background: BRAND.ink, color: "#fff", borderRadius: 10,
                          fontFamily: "'Kanit', sans-serif", fontWeight: 500, fontSize: 13,
                          textDecoration: "none", letterSpacing: "0.02em",
                        }}
                      >
                        Submit quest →
                      </a>
                    </>
                  )}
                  {locked && (
                    <div style={{ marginTop: "auto", textAlign: "center", padding: "10px 14px", border: `1px dashed ${BRAND.line}`, borderRadius: 10, fontSize: 12, color: BRAND.mute, fontWeight: 600 }}>
                      🔒 Unlocks in {q.cohortLabel}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <Leaderboard data={filteredLeaderboard} activeQuests={activeQuests} />
        )}

        {/* FOOTER */}
        <footer style={{ marginTop: 50, borderTop: `1px solid ${BRAND.line}`, paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Team1Wordmark size={20} color={BRAND.ink} />
            <span style={{ fontSize: 12, color: BRAND.mute }}>Kenya · Mini Hack 2026 · Powered by Tally + Avalanche</span>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {LINKS.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="t1-link" style={{ fontSize: 12, color: BRAND.inkSoft, textDecoration: "none", fontWeight: 500 }}>
                {l.label}
              </a>
            ))}
          </div>
        </footer>
      </main>
    </div>
  );
}

// ─── SUBCOMPONENTS ───────────────────────────────────────────────────────────
const wrapStyle: React.CSSProperties = { maxWidth: 1120, margin: "0 auto", padding: "0 24px" };

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BRAND.line}`, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.mute, textTransform: "uppercase", letterSpacing: 1.2 }}>{label}</div>
      <div style={{ fontFamily: "'Kanit', sans-serif", fontWeight: 700, fontSize: 36, color: accent, marginTop: 8, lineHeight: 1, letterSpacing: "-0.02em" }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function SignupPill({ name, colorKey }: { name: string; colorKey: string }) {
  const c = colorFor(colorKey);
  return (
    <span
      title={name}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "3px 10px 3px 3px", borderRadius: 999,
        background: c + "18", color: c, fontSize: 11, fontWeight: 600,
      }}
    >
      <span style={{ width: 20, height: 20, borderRadius: "50%", background: c, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
        {getInitial(name)}
      </span>
      {firstName(name)}
    </span>
  );
}

function Leaderboard({ data, activeQuests }: { data: (Builder & { rank: number })[]; activeQuests: { id: string | null; title: string }[] }) {
  if (data.length === 0) {
    return (
      <div style={{ background: "#fff", border: `1px solid ${BRAND.line}`, borderRadius: 14, padding: 60, textAlign: "center", color: BRAND.mute, fontSize: 14 }}>
        No submissions yet. Be the first to complete a quest. 🚀
      </div>
    );
  }
  return (
    <div style={{ background: "#fff", border: `1px solid ${BRAND.line}`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px 100px 110px", padding: "14px 20px", borderBottom: `1px solid ${BRAND.line}`, fontSize: 11, fontWeight: 700, color: BRAND.mute, letterSpacing: 1.2, textTransform: "uppercase", background: BRAND.bg }}>
        <div>Rank</div><div>Builder</div><div>Quests</div><div>Points</div><div style={{ textAlign: "right" }}>Last activity</div>
      </div>
      {data.map((b) => {
        const c = colorFor(b.key);
        return (
          <div key={b.key} style={{
            display: "grid", gridTemplateColumns: "60px 1fr 120px 100px 110px",
            padding: "14px 20px", borderBottom: `1px solid ${BRAND.line}`, alignItems: "center",
            background: b.rank === 1 ? "#FFFBEB" : b.rank === 2 ? "#F8FAFC" : b.rank === 3 ? "#FFF7ED" : "#fff",
          }}>
            <div style={{ fontFamily: "'Kanit', sans-serif", fontWeight: 700, fontSize: 18, color: b.rank <= 3 ? BRAND.red : BRAND.ink }}>
              {b.rank === 1 ? "🥇" : b.rank === 2 ? "🥈" : b.rank === 3 ? "🥉" : `#${b.rank}`}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <span style={{ width: 36, height: 36, borderRadius: "50%", background: c, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{getInitial(b.name)}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: BRAND.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>
                <div style={{ fontSize: 11, color: BRAND.mute, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.email.includes("@") ? b.email : "—"}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {activeQuests.map((q) => (
                <span key={q.id!} title={q.title} style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: b.questsDone.has(q.id!) ? "#12B76A" : BRAND.line,
                }} />
              ))}
              <span style={{ marginLeft: 6, fontSize: 12, color: BRAND.mute, fontWeight: 600 }}>{b.questsDone.size}/{activeQuests.length}</span>
            </div>
            <div style={{ fontFamily: "'Kanit', sans-serif", fontWeight: 700, fontSize: 18, color: BRAND.red }}>{b.points}</div>
            <div style={{ fontSize: 12, color: BRAND.mute, textAlign: "right" }}>{timeSince(b.last)}</div>
          </div>
        );
      })}
    </div>
  );
}
