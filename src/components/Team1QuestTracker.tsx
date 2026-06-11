import { useState, useEffect, useCallback } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const COHORTS = [
  {
    id: "c1",
    label: "Cohort 1",
    theme: "Payments on Avalanche",
    color: "#FF394A",
    accent: "#ff6b78",
    bg: "#fff1f2",
    border: "#fecdd3",
    status: "active",
    quests: [
      { id: "GxbeoL", label: "Quest 1", title: "Builder Registration", description: "Register as a builder and set up your Core Wallet", points: 20, url: "https://tally.so/r/GxbeoL", week: 1 },
      { id: "rjv4Zo", label: "Quest 2", title: "Smart Contract Deployment", description: "Deploy your first smart contract to Fuji testnet", points: 20, url: "https://tally.so/r/rjv4Zo", week: 2 },
      { id: "lbzkqp", label: "Quest 3", title: "Payment Integration", description: "Build and submit your payment integration on Avalanche", points: 20, url: "https://tally.so/r/lbzkqp", week: 3 },
    ],
  },
  {
    id: "c2",
    label: "Cohort 2",
    theme: "Gaming & Gamification",
    color: "#7C3AED",
    accent: "#9f67ff",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    status: "upcoming",
    quests: [
      { id: null, label: "Quest 4", title: "Game Loop Design", description: "Design an on-chain game loop using Avalanche", points: 20, url: null, week: 5 },
      { id: null, label: "Quest 5", title: "NFT Integration", description: "Mint and transfer NFTs within your game", points: 20, url: null, week: 6 },
      { id: null, label: "Quest 6", title: "Leaderboard Contract", description: "Deploy an on-chain leaderboard smart contract", points: 20, url: null, week: 7 },
    ],
  },
  {
    id: "c3",
    label: "Cohort 3",
    theme: "Agentic AI Systems",
    color: "#0891B2",
    accent: "#22b8d1",
    bg: "#f0fdff",
    border: "#a5f3fc",
    status: "upcoming",
    quests: [
      { id: null, label: "Quest 7", title: "Agent Architecture", description: "Design an autonomous agent that interacts on-chain", points: 20, url: null, week: 9 },
      { id: null, label: "Quest 8", title: "On-Chain AI Action", description: "Deploy an agent that executes real transactions", points: 20, url: null, week: 10 },
      { id: null, label: "Quest 9", title: "Agentic Product Demo", description: "Ship a working agentic product on Avalanche", points: 20, url: null, week: 12 },
    ],
  },
] as const;

const LINKS = [
  { label: "Programme Site", url: "https://team1-kenya-hackathon.vercel.app", icon: "🌐" },
  { label: "X / Twitter", url: "https://x.com/avaxafrica", icon: "𝕏" },
  { label: "Telegram", url: "https://t.me/avaxDAOAfrica", icon: "✈" },
  { label: "WhatsApp Group", url: "https://chat.whatsapp.com/JEOKw9yjlKcGbbdRlC5d12", icon: "💬" },
  { label: "Session Recordings", url: "https://futuristic-dog-9aa.notion.site", icon: "📹" },
  { label: "Tally API Docs", url: "https://developers.tally.so/api-reference/introduction", icon: "📄" },
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

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function timeSince(dateStr: string | Date) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
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

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Team1QuestTracker() {
  const [activeCohort, setActiveCohort] = useState("c1");
  const [activeTab, setActiveTab] = useState<"leaderboard" | "quests" | "links">("leaderboard");
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, any>>({});
  const [questionsMap, setQuestionsMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [loadingFormId, setLoadingFormId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLinks, setShowLinks] = useState(false);

  const cohort = COHORTS.find((c) => c.id === activeCohort)!;

  const buildLeaderboard = useCallback(() => {
    const registry: Record<string, any> = {};
    COHORTS[0].quests.forEach((quest, qi) => {
      if (!quest.id) return;
      const data = submissionsMap[quest.id];
      const questions = questionsMap[quest.id] || [];
      if (!data?.submissions) return;
      data.submissions.forEach((sub: AnyObj) => {
        const name = extractName(sub.responses, questions) || `Builder #${sub.id?.slice(-4)}`;
        const email = extractEmail(sub.responses, questions) || sub.respondentId;
        const key = email || sub.respondentId;
        if (!registry[key]) {
          registry[key] = { name, email: key, questsDone: [], totalPoints: 0, lastActivity: sub.submittedAt };
        }
        if (!registry[key].questsDone.includes(qi)) {
          registry[key].questsDone.push(qi);
          registry[key].totalPoints += quest.points;
        }
        if (new Date(sub.submittedAt) > new Date(registry[key].lastActivity)) {
          registry[key].lastActivity = sub.submittedAt;
        }
      });
    });
    return Object.values(registry)
      .sort((a: any, b: any) => b.totalPoints - a.totalPoints || b.questsDone.length - a.questsDone.length)
      .map((b: any, i) => ({ ...b, rank: i + 1 }));
  }, [submissionsMap, questionsMap]);

  const leaderboard = buildLeaderboard();
  const allQuestsDone = leaderboard.filter(
    (b: any) => b.questsDone.length >= COHORTS[0].quests.filter((q) => q.id).length,
  );

  const fetchAllForms = useCallback(async () => {
    setLoading(true);
    setError(null);
    const activeQuests = cohort.quests.filter((q) => q.id) as { id: string }[];
    for (const quest of activeQuests) {
      setLoadingFormId(quest.id);
      const data = await fetchTally(quest.id);
      if (data && !data.error) {
        setSubmissionsMap((prev) => ({ ...prev, [quest.id]: data }));
        setQuestionsMap((prev) => ({ ...prev, [quest.id]: data.questions || [] }));
      } else {
        setError(
          data?.error
            ? `Server: ${data.error}. Make sure TALLY_API_KEY is set.`
            : `Could not fetch form ${quest.id}.`,
        );
      }
    }
    setLoadingFormId(null);
    setLastRefresh(new Date());
    setLoading(false);
  }, [cohort]);

  useEffect(() => {
    fetchAllForms();
    const interval = setInterval(fetchAllForms, 60000);
    return () => clearInterval(interval);
  }, [fetchAllForms]);

  // ─── STYLES ──────────────────────────────────────────────────────────────
  const s: Record<string, any> = {
    wrap: { fontFamily: "'Arial', sans-serif", background: "#0f0f10", minHeight: "100vh", color: "#f0f0f2", paddingBottom: 60 },
    header: { background: "#161617", borderBottom: "1px solid #2a2a2c", padding: "0 20px" },
    headerInner: { maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, gap: 12 },
    logo: { display: "flex", alignItems: "center", gap: 10 },
    logoMark: { width: 28, height: 28, background: "#FF394A", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "white", flexShrink: 0 },
    logoText: { fontSize: 15, fontWeight: 700, color: "white", letterSpacing: "-0.3px" },
    logoSub: { fontSize: 11, color: "#666", marginLeft: 4 },
    liveChip: { fontSize: 10, background: "#12B76A22", color: "#12B76A", border: "1px solid #12B76A44", padding: "2px 8px", borderRadius: 20, fontWeight: 700, letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 4 },
    liveDot: { width: 6, height: 6, borderRadius: "50%", background: "#12B76A", animation: "pulse 1.5s infinite" },
    hero: { background: "linear-gradient(135deg, #1a0810 0%, #161617 50%, #0a1520 100%)", borderBottom: "1px solid #2a2a2c", padding: "28px 20px 24px" },
    heroInner: { maxWidth: 960, margin: "0 auto" },
    heroEyebrow: { fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#FF394A", marginBottom: 8 },
    heroTitle: { fontSize: 26, fontWeight: 800, color: "white", lineHeight: 1.2, marginBottom: 6 },
    heroSub: { fontSize: 13, color: "#888", lineHeight: 1.6, maxWidth: 560 },
    heroPrize: { marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, background: "#FFD70022", border: "1px solid #FFD70044", borderRadius: 8, padding: "8px 14px" },
    heroPrizeText: { fontSize: 13, color: "#FFD700", fontWeight: 700 },
    cohortBar: { background: "#161617", borderBottom: "1px solid #2a2a2c", padding: "0 20px", overflowX: "auto" },
    cohortBarInner: { maxWidth: 960, margin: "0 auto", display: "flex", gap: 4, alignItems: "center", height: 48 },
    cohortTab: (active: boolean, color: string, status: string) => ({
      padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: status === "upcoming" ? "default" : "pointer",
      background: active ? color + "22" : "transparent",
      color: active ? color : status === "upcoming" ? "#444" : "#888",
      border: active ? `1px solid ${color}44` : "1px solid transparent",
      transition: "all 0.15s", whiteSpace: "nowrap",
      opacity: status === "upcoming" ? 0.6 : 1,
    }),
    cohortTabBadge: (color: string) => ({ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: color + "33", color, marginLeft: 4, fontWeight: 700, textTransform: "uppercase" }),
    body: { maxWidth: 960, margin: "0 auto", padding: "20px" },
    navTabs: { display: "flex", gap: 4, marginBottom: 20, background: "#1a1a1c", border: "1px solid #2a2a2c", borderRadius: 10, padding: 4 },
    navTab: (active: boolean) => ({
      flex: 1, padding: "8px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "center",
      background: active ? "#FF394A" : "transparent",
      color: active ? "white" : "#666",
      border: "none",
      transition: "all 0.15s",
    }),
    statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginBottom: 20 },
    statCard: { background: "#1a1a1c", border: "1px solid #2a2a2c", borderRadius: 10, padding: "12px 14px" },
    statNum: { fontSize: 24, fontWeight: 800, color: "white", lineHeight: 1 },
    statLabel: { fontSize: 11, color: "#555", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },
    lb: { background: "#1a1a1c", border: "1px solid #2a2a2c", borderRadius: 12, overflow: "hidden" },
    lbHeader: { display: "grid", gridTemplateColumns: "40px 1fr repeat(4, 60px)", gap: 8, padding: "10px 16px", background: "#141414", borderBottom: "1px solid #2a2a2c", fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 },
    lbRow: (rank: number) => ({
      display: "grid", gridTemplateColumns: "40px 1fr repeat(4, 60px)", gap: 8, padding: "10px 16px",
      borderBottom: "1px solid #1e1e20", alignItems: "center",
      background: rank === 1 ? "#FFD70008" : rank === 2 ? "#C0C0C008" : rank === 3 ? "#CD7F3208" : "transparent",
    }),
    lbRank: (rank: number) => ({
      fontSize: 13, fontWeight: 800, textAlign: "center",
      color: rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : rank === 3 ? "#CD7F32" : "#555",
    }),
    avatar: (color: string) => ({
      width: 28, height: 28, borderRadius: "50%", background: color + "33",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 700, color, flexShrink: 0, border: `1px solid ${color}44`,
    }),
    builderName: { fontSize: 13, fontWeight: 600, color: "#e0e0e2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    builderEmail: { fontSize: 10, color: "#555", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    pts: (pts: number) => ({ fontSize: 13, fontWeight: 800, color: pts > 0 ? "#FF394A" : "#333", textAlign: "center" }),
    questPips: { display: "flex", gap: 3, justifyContent: "center" },
    pip: (done: boolean) => ({ width: 7, height: 7, borderRadius: "50%", background: done ? "#12B76A" : "#2a2a2c" }),
    tierBadge: (tier: string) => {
      const map: Record<string, { bg: string; color: string }> = {
        "Ship-Ready": { bg: "#FF394A22", color: "#FF394A" },
        Active: { bg: "#12B76A22", color: "#12B76A" },
        Learning: { bg: "#F59E0B22", color: "#F59E0B" },
        "At Risk": { bg: "#ef444422", color: "#ef4444" },
      };
      const t = map[tier] || map["At Risk"];
      return { fontSize: 9, padding: "2px 6px", borderRadius: 4, background: t.bg, color: t.color, fontWeight: 700, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.3 };
    },
    questGrid: { display: "grid", gap: 12 },
    questCard: (active: boolean, color: string) => ({
      background: "#1a1a1c", border: `1px solid ${active ? color + "44" : "#2a2a2c"}`,
      borderRadius: 12, padding: "16px", transition: "border-color 0.2s",
    }),
    questHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
    questLabel: (color: string) => ({ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color }),
    questTitle: { fontSize: 15, fontWeight: 700, color: "white", marginBottom: 4 },
    questDesc: { fontSize: 12, color: "#666", lineHeight: 1.5 },
    questMeta: { display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" },
    questChip: { fontSize: 11, color: "#555", display: "flex", alignItems: "center", gap: 4 },
    questCountBadge: (color: string) => ({ fontSize: 11, fontWeight: 700, background: color + "22", color, padding: "2px 8px", borderRadius: 4 }),
    questBtn: (color: string) => ({
      display: "inline-block", padding: "7px 14px", background: color, color: "white",
      borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: "none", marginTop: 10,
      cursor: "pointer", border: "none",
    }),
    linkGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 },
    linkCard: { background: "#1a1a1c", border: "1px solid #2a2a2c", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit", cursor: "pointer" },
    linkIcon: { fontSize: 18, flexShrink: 0 },
    linkLabel: { fontSize: 13, fontWeight: 600, color: "#ccc" },
    empty: { textAlign: "center", padding: "40px 20px", color: "#444", fontSize: 13 },
    loadingBar: { background: "#FF394A22", borderRadius: 4, height: 3, overflow: "hidden", marginBottom: 16 },
    loadingFill: { height: "100%", background: "#FF394A", animation: "loading 1.2s ease-in-out infinite alternate", borderRadius: 4 },
  };

  function getTier(points: number) {
    if (points >= 300) return "Ship-Ready";
    if (points >= 150) return "Active";
    if (points >= 50) return "Learning";
    return "At Risk";
  }

  const totalSubmissions = cohort.quests.reduce(
    (sum, q) => sum + (q.id ? submissionsMap[q.id]?.totalNumberOfSubmissionsPerFilter?.completed || 0 : 0),
    0,
  );

  return (
    <div style={s.wrap}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes loading { 0%{width:20%} 100%{width:90%} }
        a:hover { opacity:0.85 }
      `}</style>

      <div style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logo}>
            <div style={s.logoMark}>t1</div>
            <div>
              <span style={s.logoText}>team1</span>
              <span style={s.logoSub}>Kenya</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={s.liveChip}>
              <div style={s.liveDot} />
              LIVE
            </div>
            {lastRefresh && (
              <span style={{ fontSize: 10, color: "#444" }}>Updated {timeSince(lastRefresh)}</span>
            )}
            <button onClick={() => setShowLinks((l) => !l)} style={{ background: "none", border: "1px solid #2a2a2c", borderRadius: 6, padding: "4px 10px", color: "#888", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
              Links {showLinks ? "▲" : "▼"}
            </button>
            <button onClick={() => fetchAllForms()} disabled={loading} style={{ background: "none", border: "1px solid #2a2a2c", borderRadius: 6, padding: "4px 10px", color: "#FF394A", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>
              {loading ? "..." : "↻ Refresh"}
            </button>
          </div>
        </div>
      </div>

      {showLinks && (
        <div style={{ background: "#141414", borderBottom: "1px solid #2a2a2c", padding: "16px 20px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Quick Links</div>
            <div style={s.linkGrid}>
              {LINKS.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noreferrer" style={s.linkCard}>
                  <span style={s.linkIcon}>{l.icon}</span>
                  <span style={s.linkLabel}>{l.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroEyebrow}>Mini Hack 2026 · Quest Tracker</div>
          <h1 style={s.heroTitle}>Build. Ship. Earn. 🔺</h1>
          <div style={s.heroSub}>Complete quests, climb the leaderboard, and ship real products on Avalanche. Track your progress and compete with builders from across Kenya.</div>
          <div style={s.heroPrize}>
            <span style={{ fontSize: 18 }}>🏆</span>
            <span style={s.heroPrizeText}>$50–$60 Giveaway — Complete all Cohort 1 quests to qualify</span>
          </div>
        </div>
      </div>

      <div style={s.cohortBar}>
        <div style={s.cohortBarInner}>
          {COHORTS.map((c) => (
            <button key={c.id} style={s.cohortTab(activeCohort === c.id, c.color, c.status)} onClick={() => c.status !== "upcoming" && setActiveCohort(c.id)}>
              {c.label}
              <span style={{ marginLeft: 4, fontSize: 10, color: activeCohort === c.id ? c.color : "#555" }}>· {c.theme}</span>
              {c.status === "active" && <span style={s.cohortTabBadge(c.color)}>Live</span>}
              {c.status === "upcoming" && <span style={{ ...s.cohortTabBadge("#555"), background: "#22222244", color: "#555" }}>Soon</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={s.body}>
        {error && (
          <div style={{ background: "#ef444422", border: "1px solid #ef444444", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#ef4444" }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={s.loadingBar}>
            <div style={s.loadingFill} />
          </div>
        )}
        {loadingFormId && (
          <div style={{ fontSize: 11, color: "#666", marginBottom: 10 }}>Fetching {loadingFormId}…</div>
        )}

        <div style={s.statsRow}>
          <div style={s.statCard}>
            <div style={s.statNum}>{leaderboard.length}</div>
            <div style={s.statLabel}>Builders</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statNum}>{totalSubmissions}</div>
            <div style={s.statLabel}>Submissions</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statNum, color: "#FFD700" }}>{allQuestsDone.length}</div>
            <div style={s.statLabel}>All Quests ✓</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statNum, color: "#12B76A" }}>
              {cohort.quests.filter((q) => q.id && (submissionsMap[q.id]?.totalNumberOfSubmissionsPerFilter?.completed || 0) > 0).length}/{cohort.quests.filter((q) => q.id).length}
            </div>
            <div style={s.statLabel}>Quests Active</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statNum, color: "#FF394A" }}>{leaderboard[0]?.totalPoints || 0}</div>
            <div style={s.statLabel}>Top Score</div>
          </div>
        </div>

        <div style={s.navTabs}>
          {(["leaderboard", "quests", "links"] as const).map((t) => (
            <button key={t} style={s.navTab(activeTab === t)} onClick={() => setActiveTab(t)}>
              {t === "leaderboard" ? "🏆 Leaderboard" : t === "quests" ? "📋 Quests" : "🔗 Links & Resources"}
            </button>
          ))}
        </div>

        {activeTab === "leaderboard" && (
          <div>
            {leaderboard.length === 0 ? (
              <div style={s.empty}>
                {loading ? "Loading submissions…" : "No submissions yet. Be the first to complete a quest! 🚀"}
              </div>
            ) : (
              <div style={s.lb}>
                <div style={s.lbHeader}>
                  <div>#</div>
                  <div>Builder</div>
                  <div style={{ textAlign: "center" }}>Quests</div>
                  <div style={{ textAlign: "center" }}>Pts</div>
                  <div style={{ textAlign: "center" }}>Tier</div>
                  <div style={{ textAlign: "center" }}>Last</div>
                </div>
                {leaderboard.map((b: any) => {
                  const colors = ["#FF394A", "#7C3AED", "#0891B2", "#F59E0B", "#12B76A", "#EC4899", "#06B6D4"];
                  const color = colors[b.rank % colors.length];
                  const activeQuestCount = cohort.quests.filter((q) => q.id).length;
                  return (
                    <div key={b.email} style={s.lbRow(b.rank)}>
                      <div style={s.lbRank(b.rank)}>
                        {b.rank === 1 ? "🥇" : b.rank === 2 ? "🥈" : b.rank === 3 ? "🥉" : b.rank}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <div style={s.avatar(color)}>{getInitials(b.name)}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={s.builderName}>{b.name}</div>
                          <div style={s.builderEmail}>{b.email?.includes("@") ? b.email : "—"}</div>
                        </div>
                      </div>
                      <div>
                        <div style={s.questPips}>
                          {Array.from({ length: activeQuestCount }, (_, i) => (
                            <div key={i} style={s.pip(b.questsDone.includes(i))} />
                          ))}
                        </div>
                        <div style={{ fontSize: 10, color: "#555", textAlign: "center", marginTop: 2 }}>{b.questsDone.length}/{activeQuestCount}</div>
                      </div>
                      <div style={s.pts(b.totalPoints)}>{b.totalPoints}</div>
                      <div>
                        <span style={s.tierBadge(getTier(b.totalPoints))}>{getTier(b.totalPoints)}</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#444", textAlign: "center" }}>{timeSince(b.lastActivity)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {allQuestsDone.length > 0 && (
              <div style={{ marginTop: 16, background: "#FFD70011", border: "1px solid #FFD70033", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#FFD700", marginBottom: 8 }}>🏆 Giveaway Qualifiers — {allQuestsDone.length} builder{allQuestsDone.length !== 1 ? "s" : ""} completed all quests</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {allQuestsDone.map((b: any) => (
                    <div key={b.email} style={{ background: "#FFD70022", border: "1px solid #FFD70044", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#FFD700", fontWeight: 600 }}>
                      {b.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "quests" && (
          <div>
            {cohort.status === "upcoming" && (
              <div style={{ background: "#1a1a1c", border: "1px solid #2a2a2c", borderRadius: 10, padding: "16px", marginBottom: 16, textAlign: "center", color: "#555", fontSize: 13 }}>
                🔒 {cohort.label} quests unlock when {COHORTS.find((c) => parseInt(c.id.slice(1)) === parseInt(cohort.id.slice(1)) - 1)?.label} ends
              </div>
            )}
            <div style={s.questGrid}>
              {cohort.quests.map((quest, qi) => {
                const count = quest.id ? submissionsMap[quest.id]?.totalNumberOfSubmissionsPerFilter?.completed || 0 : 0;
                const isActive = !!quest.id && cohort.status === "active";
                return (
                  <div key={quest.id || qi} style={s.questCard(isActive, cohort.color)}>
                    <div style={s.questHeader}>
                      <div style={s.questLabel(cohort.color)}>{quest.label} · Week {quest.week}</div>
                      {isActive && <span style={s.questCountBadge(cohort.color)}>{count} submitted</span>}
                      {!isActive && <span style={{ fontSize: 10, color: "#333", fontWeight: 700 }}>LOCKED</span>}
                    </div>
                    <div style={s.questTitle}>{quest.title}</div>
                    <div style={s.questDesc}>{quest.description}</div>
                    <div style={s.questMeta}>
                      <span style={s.questChip}><span style={{ color: "#FF394A", fontWeight: 800 }}>+{quest.points} pts</span></span>
                      {quest.url && <span style={s.questChip}><span style={{ color: "#555" }}>tally.so/r/{quest.id}</span></span>}
                    </div>
                    {quest.url ? (
                      <a href={quest.url} target="_blank" rel="noreferrer" style={s.questBtn(cohort.color)}>
                        Submit Quest →
                      </a>
                    ) : (
                      <span style={{ ...s.questBtn("#333"), opacity: 0.5, cursor: "not-allowed" }}>Coming in {cohort.label}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "links" && (
          <div style={s.questGrid}>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Programme Resources</div>
            <div style={s.linkGrid}>
              {LINKS.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noreferrer" style={s.linkCard}>
                  <span style={s.linkIcon}>{l.icon}</span>
                  <div>
                    <div style={s.linkLabel}>{l.label}</div>
                    <div style={{ fontSize: 10, color: "#444", marginTop: 1 }}>{l.url.replace("https://", "")}</div>
                  </div>
                </a>
              ))}
            </div>
            <div style={{ marginTop: 8, background: "#1a1a1c", border: "1px solid #2a2a2c", borderRadius: 10, padding: "16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Direct Quest Links — Cohort 1</div>
              {COHORTS[0].quests.map((q) => (
                <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1e1e20" }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#ccc" }}>{q.label}: {q.title}</span>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 2, fontFamily: "monospace" }}>{q.url}</div>
                  </div>
                  <a href={q.url!} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 700, color: "#FF394A", textDecoration: "none", flexShrink: 0, marginLeft: 12 }}>Open →</a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 28, textAlign: "center", fontSize: 11, color: "#333" }}>
          team1 Kenya · Mini Hack 2026 · Powered by Tally + Avalanche C-Chain ·{" "}
          <a href="https://team1-kenya-hackathon.vercel.app" target="_blank" rel="noreferrer" style={{ color: "#FF394A" }}>team1-kenya-hackathon.vercel.app</a>
        </div>
      </div>
    </div>
  );
}
