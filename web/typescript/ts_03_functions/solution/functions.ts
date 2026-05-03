// 1. Утилиты для массивов

export function filter<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  // твой код здесь
  return [];
}

export function map<T, R>(arr: T[], transform: (item: T) => R): R[] {
  // твой код здесь
  return [];
}

export function groupBy<T>(arr: T[], getKey: (item: T) => string): Record<string, T[]> {
  // твой код здесь
  return {};
}

// 3. Перегрузки
export function formatDate(date: Date): string;
export function formatDate(date: Date, time: true): string;
export function formatDate(date: Date, time?: true): string {
  // твой код здесь
  return '';
}
