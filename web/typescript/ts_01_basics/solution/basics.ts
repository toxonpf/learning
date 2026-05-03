// 1. Переменные
const username: string = '';
const score: number = 0;
const isActive: boolean = false;
const tags: string[] = [];
const coords: [number, number] = [0, 0];

// 2. Union-тип для статуса
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

function getStatusLabel(status: OrderStatus): string {
  // твой код здесь
  return '';
}

// 3. Сужение типов
function formatId(id: string | number): string {
  // твой код здесь
  return '';
}

// 4. Функция с unknown
function safeLength(value: unknown): number {
  // твой код здесь
  return 0;
}
