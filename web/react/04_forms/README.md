# Урок 4 — Работа с формами

## Контролируемые компоненты

В React формы управляются через состояние — это называется **контролируемый компонент**. Значение поля живёт в `useState`, а не в DOM.

```tsx
function NameInput() {
  const [name, setName] = useState('');

  return (
    <input
      value={name}                              // значение из state
      onChange={(e) => setName(e.target.value)} // обновляем state при вводе
    />
  );
}
```

---

## Типы полей

```tsx
// Текст
<input type="text" value={text} onChange={(e) => setText(e.target.value)} />

// Число
<input type="number" value={num} onChange={(e) => setNum(Number(e.target.value))} />

// Чекбокс
<input type="checkbox" checked={flag} onChange={(e) => setFlag(e.target.checked)} />

// Радиокнопка
<input type="radio" value="a" checked={choice === 'a'} onChange={(e) => setChoice(e.target.value)} />

// Select
<select value={option} onChange={(e) => setOption(e.target.value)}>
  <option value="a">Вариант А</option>
  <option value="b">Вариант Б</option>
</select>

// Textarea
<textarea value={text} onChange={(e) => setText(e.target.value)} />
```

---

## Форма с объектом состояния

```tsx
interface FormData {
  name: string;
  email: string;
  age: number;
}

function RegistrationForm() {
  const [form, setForm] = useState<FormData>({ name: '', email: '', age: 0 });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // отменяем перезагрузку страницы
    console.log(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={form.name} onChange={handleChange} />
      <input name="email" type="email" value={form.email} onChange={handleChange} />
      <input name="age" type="number" value={form.age} onChange={handleChange} />
      <button type="submit">Отправить</button>
    </form>
  );
}
```

---

## Валидация

```tsx
interface Errors {
  name?: string;
  email?: string;
}

function validate(form: FormData): Errors {
  const errors: Errors = {};
  if (!form.name.trim()) errors.name = 'Имя обязательно';
  if (!form.email.includes('@')) errors.email = 'Некорректный email';
  return errors;
}

function Form() {
  const [form, setForm] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState<Errors>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    // отправляем
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      {errors.name && <p style={{ color: 'red' }}>{errors.name}</p>}

      <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      {errors.email && <p style={{ color: 'red' }}>{errors.email}</p>}

      <button type="submit">Отправить</button>
    </form>
  );
}
```

---

## useRef для фокуса

```tsx
function SearchInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus(); // фокус при монтировании
  }, []);

  return <input ref={inputRef} />;
}
```
