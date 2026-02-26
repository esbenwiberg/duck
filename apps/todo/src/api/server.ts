import { Hono } from "hono";
import { todoRoutes } from "./routes.ts";

const app = new Hono();

app.route("/api/todos", todoRoutes);

const PORT = Number(process.env.PORT ?? 3001);

export default {
  port: PORT,
  fetch: app.fetch,
};
