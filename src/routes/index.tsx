import { createFileRoute } from "@tanstack/react-router";
import Team1QuestTracker from "@/components/Team1QuestTracker";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "team1 Kenya · Mini Hack Quest Tracker" },
      { name: "description", content: "Live leaderboard and quest tracker for the team1 Kenya Mini Hack 2026 on Avalanche." },
      { property: "og:title", content: "team1 Kenya · Mini Hack Quest Tracker" },
      { property: "og:description", content: "Live leaderboard and quest tracker for the team1 Kenya Mini Hack 2026 on Avalanche." },
    ],
  }),
  component: Index,
});

function Index() {
  return <Team1QuestTracker />;
}
