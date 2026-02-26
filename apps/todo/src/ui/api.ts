import type { Todo, ApiResponse } from "../api/types.ts";

const BASE = "/api/todos";

export async function listTodos(): Promise<Todo[]> {
  const res = await fetch(BASE);
  const json: ApiResponse<Todo[]> = await res.json();
  return json.data;
}

export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const json: ApiResponse<Todo> = await res.json();
  return json.data;
}

export async function toggleTodo(id: string, completed: boolean): Promise<Todo> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed }),
  });
  const json: ApiResponse<Todo> = await res.json();
  return json.data;
}

export async function deleteTodo(id: string): Promise<void> {
  await fetch(`${BASE}/${id}`, { method: "DELETE" });
}
