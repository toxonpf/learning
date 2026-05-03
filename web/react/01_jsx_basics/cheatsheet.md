# Шпаргалка — JSX и компоненты

## JSX

```tsx
// Переменные и выражения
<p>{name}</p>
<p>{2 + 2}</p>
<p>{isAdmin ? 'Админ' : 'Гость'}</p>

// Атрибуты
<div className="card" onClick={handleClick}>
<img src={url} alt="фото" />

// Fragment — когда нужен один корень без лишнего тега
<>
  <h1>Заголовок</h1>
  <p>Текст</p>
</>
```

## Компонент

```tsx
type Props = {
  name: string;
  count?: number;  // ? = необязательный prop
};

function MyComponent({ name, count = 0 }: Props) {
  return <p>{name}: {count}</p>;
}

<MyComponent name="Счётчик" count={5} />
```

## Список

```tsx
{items.map((item) => (
  <li key={item.id}>{item.name}</li>
))}
```

## Условный рендер

```tsx
{isOnline ? '🟢 Онлайн' : '🔴 Офлайн'}   // одно или другое
{hasError && <p>Ошибка!</p>}               // только если true
```

## Props — быстрая памятка

| Тип | TypeScript | Синтаксис JSX |
|-----|-----------|---------------|
| Строка | `name: string` | `name="Алексей"` |
| Число | `age: number` | `age={25}` |
| Булево | `isOnline: boolean` | `isOnline={true}` или просто `isOnline` |
| Массив | `items: string[]` | `items={['a', 'b']}` |
| Функция | `onClick: () => void` | `onClick={handleClick}` |
| Необязательный | `bio?: string` | можно не передавать |
