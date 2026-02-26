import type { Todo } from "./types.ts";
import { randomUUID } from "crypto";

/**
 * In-memory store for todo items.
 * In a real app this would be backed by a database.
 */
export class TodoStore {
  private todos: Map<string, Todo> = new Map();

  /** Return all todos, newest first. */
  list(): Todo[] {
    return [...this.todos.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /** Find a single todo by id. Returns undefined if not found. */
  get(id: string): Todo | undefined {
    return this.todos.get(id);
  }

  /** Create a new todo with the given title. */
  create(title: string): Todo {
    const todo: Todo = {
      id: randomUUID(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.todos.set(todo.id, todo);
    return todo;
  }

  /**
   * Update an existing todo's title and/or completed state.
   * Returns the updated todo, or undefined if not found.
   */
  update(id: string, patch: { title?: string; completed?: boolean }): Todo | undefined {
    const todo = this.todos.get(id);
    if (!todo) return undefined;
    const updated: Todo = { ...todo, ...patch };
    this.todos.set(id, updated);
    return updated;
  }

  /** Delete a todo by id. Returns true if it existed. */
  delete(id: string): boolean {
    return this.todos.delete(id);
  }

  /** Remove all todos. Used by the test-reset endpoint. */
  clear(): void {
    this.todos.clear();
  }
}

export const store = new TodoStore();
