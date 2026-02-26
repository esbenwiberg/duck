import { Hono } from "hono";
import { store } from "./store.ts";
import type { CreateTodoRequest, UpdateTodoRequest } from "./types.ts";

/**
 * Todo API routes mounted at /api/todos.
 *
 * @route GET    /api/todos          List all todos
 * @route POST   /api/todos          Create a todo
 * @route GET    /api/todos/:id      Get a single todo
 * @route PATCH  /api/todos/:id      Update a todo (title and/or completed)
 * @route DELETE /api/todos/:id      Delete a todo
 */
export const todoRoutes = new Hono();

todoRoutes.get("/", (c) => {
  return c.json({ data: store.list(), ok: true });
});

todoRoutes.post("/", async (c) => {
  const body = await c.req.json<CreateTodoRequest>();
  if (!body.title?.trim()) {
    return c.json({ error: "title is required", ok: false }, 400);
  }
  const todo = store.create(body.title.trim());
  return c.json({ data: todo, ok: true }, 201);
});

todoRoutes.get("/:id", (c) => {
  const todo = store.get(c.req.param("id"));
  if (!todo) return c.json({ error: "not found", ok: false }, 404);
  return c.json({ data: todo, ok: true });
});

todoRoutes.patch("/:id", async (c) => {
  const body = await c.req.json<UpdateTodoRequest>();
  const todo = store.update(c.req.param("id"), body);
  if (!todo) return c.json({ error: "not found", ok: false }, 404);
  return c.json({ data: todo, ok: true });
});

todoRoutes.delete("/:id", (c) => {
  const deleted = store.delete(c.req.param("id"));
  if (!deleted) return c.json({ error: "not found", ok: false }, 404);
  return c.json({ data: null, ok: true });
});

// Test-only reset endpoint — clears all todos for screenshot scenarios
todoRoutes.delete("/", (c) => {
  store.clear();
  return c.json({ data: null, ok: true });
});
