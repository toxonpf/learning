import { ReactNode } from 'react';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

interface TableProps<T extends { id: number }> {
  data: T[];
  columns: Column<T>[];
}

export function Table<T extends { id: number }>({ data, columns }: TableProps<T>) {
  return (
    <table>
      <thead>
        <tr>
          {/* твой код здесь */}
        </tr>
      </thead>
      <tbody>
        {/* твой код здесь */}
      </tbody>
    </table>
  );
}
