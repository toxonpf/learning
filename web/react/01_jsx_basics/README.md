# Урок 1 — JSX и первый компонент

## Что такое React?

React — библиотека для построения UI. Вместо того чтобы напрямую манипулировать DOM,
ты описываешь **как должен выглядеть интерфейс**, а React сам обновляет страницу.

---

## JSX

JSX — это синтаксический сахар над `React.createElement`. Выглядит как HTML, но живёт в TS.

```tsx
// Это JSX
const element = <h1>Привет, мир!</h1>;

// Под капотом это превращается в:
const element = React.createElement('h1', null, 'Привет, мир!');
```

### Правила JSX

| Правило | Пример |
|--------|--------|
| Один корневой элемент | `<><p>A</p><p>B</p></>` — используй Fragment |
| Атрибуты в camelCase | `className` вместо `class`, `onClick` вместо `onclick` |
| JS-выражения в `{}` | `<p>{2 + 2}</p>` → выведет `4` |
| Самозакрывающие теги | `<img />`, `<br />` |

```tsx
const name: string = 'Алексей';

const element = (
  <div className="card">
    <h2>Привет, {name}!</h2>
    <p>Сейчас: {new Date().toLocaleTimeString()}</p>
  </div>
);
```

---

## Компонент

Компонент — функция, которая возвращает JSX. Имя начинается с **заглавной буквы**.

```tsx
function Greeting(): JSX.Element {
  return <h1>Привет!</h1>;
}

// Используется как тег:
<Greeting />
```

### Props — входные данные компонента

```tsx
type GreetingProps = {
  name: string;
  age: number;
};

function Greeting({ name, age }: GreetingProps): JSX.Element {
  return (
    <p>
      Привет, {name}! Тебе {age} лет.
    </p>
  );
}

// Использование:
<Greeting name="Алексей" age={25} />
```

- Props передаются как атрибуты
- Строки — в кавычках `name="Алексей"`
- Всё остальное — в фигурных скобках `age={25}`
- Внутри компонента props — **только для чтения**, их нельзя менять

---

## Рендер списков

Для вывода массива используй `.map()`. Каждый элемент должен иметь уникальный `key`.

```tsx
const fruits: string[] = ['Яблоко', 'Банан', 'Вишня'];

function FruitList(): JSX.Element {
  return (
    <ul>
      {fruits.map((fruit) => (
        <li key={fruit}>{fruit}</li>
      ))}
    </ul>
  );
}
```

---

## Условный рендер

```tsx
type StatusProps = { isOnline: boolean };
type NotificationProps = { hasMessage: boolean };

function Status({ isOnline }: StatusProps): JSX.Element {
  return (
    <span>
      {isOnline ? '🟢 Онлайн' : '🔴 Офлайн'}
    </span>
  );
}

// Или через &&
function Notification({ hasMessage }: NotificationProps): JSX.Element {
  return (
    <div>
      {hasMessage && <p>У вас новое сообщение!</p>}
    </div>
  );
}
```

---

## Итог

- JSX — HTML-подобный синтаксис внутри TS
- Компонент — функция с заглавной буквы, возвращает JSX
- Props описываются через `type` или `interface`, передаются как атрибуты, неизменяемы
- `.map()` для списков, обязателен `key`
- Условный рендер через `? :` или `&&`
