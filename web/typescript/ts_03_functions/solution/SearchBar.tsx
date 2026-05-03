interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onSubmit, onClear, placeholder }: SearchBarProps) {
  return (
    <div>
      {/* твой код здесь */}
    </div>
  );
}
