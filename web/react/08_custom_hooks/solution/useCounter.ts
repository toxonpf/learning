import { useState } from 'react';

interface CounterOptions {
  initial?: number;
  step?: number;
  min?: number;
  max?: number;
}

interface CounterResult {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export function useCounter(options: CounterOptions = {}): CounterResult {
  const { initial = 0, step = 1, min, max } = options;
  const [count, setCount] = useState(initial);

  // твой код здесь

  return { count, increment: () => {}, decrement: () => {}, reset: () => {} };
}
