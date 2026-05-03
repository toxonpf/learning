export class Store<T extends { id: number }> {
  private items: T[] = [];

  getAll(): T[] {
    // твой код здесь
    return [];
  }

  getById(id: number): T | undefined {
    // твой код здесь
    return undefined;
  }

  add(item: T): void {
    // твой код здесь
  }

  update(id: number, changes: Partial<T>): void {
    // твой код здесь
  }

  remove(id: number): void {
    // твой код здесь
  }
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  // твой код здесь
  return {} as Pick<T, K>;
}
