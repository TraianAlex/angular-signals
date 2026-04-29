import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TodoService } from '../../core/todo.service';

@Component({
  selector: 'app-todo-details',
  imports: [FormsModule, RouterLink],
  templateUrl: './todo-details.html',
})
export class TodoDetails {
  private readonly todoService = inject(TodoService);

  readonly id = input.required<string>();
  readonly todoResource = this.todoService.getTodoResource(this.id);

  readonly title = signal('');
  readonly completed = signal(false);
  readonly saveError = signal('');
  readonly saveSuccess = signal('');
  readonly saving = signal(false);

  constructor() {
    effect(() => {
      const todo = this.todoResource.value();
      if (!todo) return;
      this.title.set(todo.title);
      this.completed.set(todo.completed);
    });
  }

  saveTodo(): void {
    const todo = this.todoResource.value();
    if (!todo) return;

    const title = this.title().trim();
    if (!title) {
      this.saveError.set('Title is required.');
      this.saveSuccess.set('');
      return;
    }

    this.saving.set(true);
    this.saveError.set('');
    this.saveSuccess.set('');
    this.todoService.updateTodo(todo.id, { title, completed: this.completed() }).subscribe({
      next: () => {
        this.saving.set(false);
        this.saveSuccess.set('Todo updated.');
        this.todoResource.reload();
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('Could not update todo.');
      },
    });
  }
}
