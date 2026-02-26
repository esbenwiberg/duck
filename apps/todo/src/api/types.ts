/**
 * Represents a single todo item.
 */
export interface Todo {
  /** Unique identifier */
  id: string;
  /** Display text of the todo */
  title: string;
  /** Whether the todo has been completed */
  completed: boolean;
  /** ISO timestamp when the todo was created */
  createdAt: string;
}

/**
 * Request body for creating a new todo.
 */
export interface CreateTodoRequest {
  title: string;
}

/**
 * Request body for updating an existing todo.
 */
export interface UpdateTodoRequest {
  title?: string;
  completed?: boolean;
}

/**
 * Standard API response envelope.
 */
export interface ApiResponse<T> {
  data: T;
  ok: true;
}

/**
 * Standard API error envelope.
 */
export interface ApiError {
  error: string;
  ok: false;
}
