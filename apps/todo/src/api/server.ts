import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { todoRoutes } from "./routes.ts";

const app = new Hono();

app.route("/api/todos", todoRoutes);

// Serve built UI in production
app.use("/*", serveStatic({ root: "./dist/ui" }));

const PORT = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Todo API running on http://localhost:${PORT}`);
});

export default app;
