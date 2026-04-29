import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';

interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
}

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.html',
})
export class TodoList {
  readonly todosResource = httpResource<TodoItem[]>(() => '/api/todos');
}
