import { Injectable, Signal, inject } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TodoItem, TodoWritePayload } from '../models/todo.model';

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/todos';

  getTodosResource() {
    return httpResource<TodoItem[]>(() => this.apiUrl);
  }

  getTodoResource(id: Signal<string>) {
    return httpResource<TodoItem>(() => {
      const todoId = id();
      if (!todoId) return undefined;
      return `${this.apiUrl}/${todoId}`;
    });
  }

  createTodo(payload: TodoWritePayload): Observable<TodoItem> {
    return this.http.post<TodoItem>(this.apiUrl, payload);
  }

  updateTodo(id: number, payload: TodoWritePayload): Observable<TodoItem> {
    return this.http.put<TodoItem>(`${this.apiUrl}/${id}`, payload);
  }

  deleteTodo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
