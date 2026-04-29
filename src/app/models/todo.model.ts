export interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
}

export type TodoWritePayload = Omit<TodoItem, 'id'>;
