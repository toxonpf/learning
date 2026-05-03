# ДЗ TS 4 — Дженерики

Свои решения клади в папку `solution/`.

---

## Задание

### 1. Типизированное хранилище

Создай дженерик-класс `Store<T>`:

```ts
class Store<T extends { id: number }> {
  // Методы:
  // getAll(): T[]
  // getById(id: number): T | undefined
  // add(item: T): void
  // update(id: number, changes: Partial<T>): void
  // remove(id: number): void
}

// Должно работать так:
const userStore = new Store<User>();
userStore.add({ id: 1, name: 'Алексей' });
const user = userStore.getById(1); // User | undefined
```

### 2. Дженерик-компонент `Table`

```tsx
interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface TableProps<T extends { id: number }> {
  data: T[];
  columns: Column<T>[];
}

function Table<T extends { id: number }>({ data, columns }: TableProps<T>) {
  // рендерит таблицу по данным и описанию колонок
}
```

Пример использования:
```tsx
<Table
  data={users}
  columns={[
    { key: 'name', header: 'Имя' },
    { key: 'age', header: 'Возраст' },
    {
      key: 'isAdmin',
      header: 'Роль',
      render: (val) => val ? 'Админ' : 'Пользователь',
    },
  ]}
/>
```

### 3. Утилитарная функция `pick`

```ts
// pick — взять только указанные поля из объекта
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>

// Пример:
const user = { id: 1, name: 'Алексей', password: 'secret', role: 'admin' };
const safe = pick(user, ['id', 'name', 'role']); // { id, name, role } — без password
```

---

## Требования

- [ ] `Store` работает с любым типом у которого есть `id: number`
- [ ] `Table` принимает любые данные, колонки типизированы через `keyof T`
- [ ] `pick` возвращает именно `Pick<T, K>`, не просто `object`
