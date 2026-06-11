import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tally/$formId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const apiKey = process.env.TALLY_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "TALLY_API_KEY not configured on server" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
        const { formId } = params;
        if (!/^[A-Za-z0-9_-]+$/.test(formId)) {
          return new Response(JSON.stringify({ error: "Invalid formId" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        try {
          const res = await fetch(
            `https://api.tally.so/forms/${formId}/submissions?filter=completed&limit=500`,
            { headers: { Authorization: `Bearer ${apiKey}` } },
          );
          const text = await res.text();
          return new Response(text, {
            status: res.status,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          });
        } catch (e) {
          return new Response(
            JSON.stringify({ error: "Upstream fetch failed", detail: String(e) }),
            { status: 502, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
