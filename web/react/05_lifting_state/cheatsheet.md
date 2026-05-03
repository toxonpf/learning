# Шпаргалка — Поднятие состояния

```tsx
// Родитель хранит состояние и передаёт вниз
function Parent() {
  const [value, setValue] = useState('');
  return (
    <>
      <Input value={value} onChange={setValue} />
      <Display value={value} />
    </>
  );
}

// Дочерний принимает значение и коллбек
function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} />;
}

function Display({ value }: { value: string }) {
  return <p>{value}</p>;
}
```

```tsx
// Правило выбора: где держать состояние?
// Только в одном компоненте → локально в нём
// В двух соседних         → поднять к родителю
// Во всём приложении      → useContext
```
