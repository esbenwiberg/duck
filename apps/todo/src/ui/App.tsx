import { useState, useEffect, useRef } from "react";
import type { Todo } from "../api/types.ts";
import { listTodos, createTodo, toggleTodo, deleteTodo } from "./api.ts";

export function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listTodos().then((data) => {
      setTodos(data);
      setLoading(false);
    });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = input.trim();
    if (!title) return;
    const todo = await createTodo(title);
    setTodos((prev) => [todo, ...prev]);
    setInput("");
    inputRef.current?.focus();
  }

  async function handleToggle(todo: Todo) {
    const updated = await toggleTodo(todo.id, !todo.completed);
    setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function handleDelete(id: string) {
    await deleteTodo(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Todos</h1>
        {!loading && (
          <span className="count" data-testid="remaining-count">
            {remaining} remaining
          </span>
        )}
      </header>

      <form className="add-form" onSubmit={handleAdd}>
        <input
          ref={inputRef}
          className="add-input"
          type="text"
          placeholder="What needs to be done?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          data-testid="add-input"
        />
        <button className="add-btn" type="submit" data-testid="add-btn">
          Add
        </button>
      </form>

      <main className="todo-list">
        {loading && <p className="empty">Loading…</p>}

        {!loading && todos.length === 0 && (
          <p className="empty" data-testid="empty-state">
            No todos yet. Add one above!
          </p>
        )}

        {todos.map((todo) => (
          <div
            key={todo.id}
            className={`todo-item ${todo.completed ? "completed" : ""}`}
            data-testid="todo-item"
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggle(todo)}
              data-testid="todo-checkbox"
            />
            <span className="todo-title">{todo.title}</span>
            <button
              className="delete-btn"
              onClick={() => handleDelete(todo.id)}
              aria-label={`Delete ${todo.title}`}
              data-testid="todo-delete"
            >
              ×
            </button>
          </div>
        ))}
      </main>
    </div>
  );
}
