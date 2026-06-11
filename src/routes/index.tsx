import { createFileRoute } from "@tanstack/react-router";
import Team1QuestTracker from "@/components/Team1QuestTracker";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "team¹ Kenya · Mini Hack 2026 — Quest Tracker" },
      { name: "description", content: "Live quest tracker and leaderboard for team¹ Kenya's Mini Hack 2026 on Avalanche. Complete quests across Payments, Gaming, and Agentic AI cohorts and climb the board." },
      { property: "og:title", content: "team¹ Kenya · Mini Hack 2026 — Quest Tracker" },
      { property: "og:description", content: "Live quest tracker and leaderboard for team¹ Kenya's Mini Hack 2026 on Avalanche. Complete quests across Payments, Gaming, and Agentic AI cohorts and climb the board." },
      { property: "og:url", content: "https://minihacktracker.vercel.app" },
      { property: "og:image", content: "https://minihacktracker.vercel.app/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "team¹ Kenya · Mini Hack 2026 — Quest Tracker" },
      { name: "twitter:description", content: "Live quest tracker and leaderboard for team¹ Kenya's Mini Hack 2026 on Avalanche. Complete quests, earn points, climb the board." },
      { name: "twitter:image", content: "https://minihacktracker.vercel.app/og-image.png" },
    ],
  }),
  component: Index,
});

function Index() {
  return <Team1QuestTracker />;
}
