import { createFileRoute } from "@tanstack/react-router";

// Streams listing photos out of the private storage bucket. Photo paths are
// validated; the storage object is fetched with the server-side client.
export const Route = createFileRoute("/api/public/photos/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const raw = decodeURIComponent(
          new URL(request.url).pathname.replace(/^\/api\/public\/photos\//, ""),
        );

        if (!/^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/.test(raw) || raw.includes("..")) {
          return new Response("Invalid photo path", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage
          .from("listing-photos")
          .download(raw);

        if (error || !data) {
          return new Response("Photo not found", { status: 404 });
        }

        const contentType = data.type || "image/jpeg";
        return new Response(data, {
          status: 200,
          headers: {
            "content-type": contentType,
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
