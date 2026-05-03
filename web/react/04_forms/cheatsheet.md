# Шпаргалка — Формы

```tsx
// Текстовое поле
<input value={val} onChange={(e) => setVal(e.target.value)} />

// Чекбокс
<input type="checkbox" checked={flag} onChange={(e) => setFlag(e.target.checked)} />

// Select
<select value={opt} onChange={(e) => setOpt(e.target.value)}>
  <option value="a">А</option>
</select>

// Универсальный обработчик для объекта формы
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value, type, checked } = e.target;
  setForm((prev) => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value,
  }));
};

// Отправка формы
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // логика отправки
};
<form onSubmit={handleSubmit}>...</form>

// Фокус через ref
const ref = useRef<HTMLInputElement>(null);
useEffect(() => { ref.current?.focus(); }, []);
<input ref={ref} />
```
