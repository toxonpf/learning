import { useState, useMemo, useCallback, memo } from 'react';

interface Person {
  id: number;
  name: string;
  age: number;
  city: string;
}

type SortKey = keyof Omit<Person, 'id'>;
type SortDir = 'asc' | 'desc';

const CITIES = ['Москва', 'СПб', 'Казань', 'Екатеринбург', 'Новосибирск'];
const NAMES = ['Алексей', 'Мария', 'Иван', 'Анна', 'Дмитрий', 'Елена'];

const DATA: Person[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: NAMES[i % NAMES.length],
  age: 20 + (i % 40),
  city: CITIES[i % CITIES.length],
}));

const TableRow = memo(function TableRow({
  person,
  isSelected,
  onSelect,
}: {
  person: Person;
  isSelected: boolean;
  onSelect: (id: number) => void;
}) {
  return (
    <tr
      onClick={() => onSelect(person.id)}
      style={{ background: isSelected ? '#e0f0ff' : 'transparent' }}
    >
      {/* твой код здесь */}
    </tr>
  );
});

export function DataTable() {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    // твой код здесь
    return DATA;
  }, [query, sortKey, sortDir]);

  const handleSelect = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  return (
    <div>
      {/* твой код здесь */}
    </div>
  );
}
