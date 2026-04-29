import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TodoService } from '../../core/todo.service';
import { TodoItem } from '../../models/todo.model';

@Component({
  selector: 'app-todo-list',
  imports: [FormsModule, RouterLink],
  templateUrl: './todo-list.html',
})
export class TodoList {
  private readonly todoService = inject(TodoService);

  readonly todosResource = this.todoService.getTodosResource();
  readonly newTodoTitle = signal('');
  readonly errorMessage = signal('');
  readonly isSubmitting = signal(false);

  createTodo(): void {
    const title = this.newTodoTitle().trim();
    if (!title) return;

    this.errorMessage.set('');
    this.isSubmitting.set(true);
    this.todoService.createTodo({ title, completed: false }).subscribe({
      next: () => {
        this.newTodoTitle.set('');
        this.isSubmitting.set(false);
        this.todosResource.reload();
      },
      error: () => {
        this.errorMessage.set('Could not create todo.');
        this.isSubmitting.set(false);
      },
    });
  }

  deleteTodo(todo: TodoItem): void {
    if (!confirm(`Delete "${todo.title}"?`)) return;

    this.errorMessage.set('');
    this.todoService.deleteTodo(todo.id).subscribe({
      next: () => this.todosResource.reload(),
      error: () => this.errorMessage.set('Could not delete todo.'),
    });
  }
}
