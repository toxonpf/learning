import { useState } from 'react';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  return (
    <div>
      {/* твой код здесь */}
    </div>
  );
}
