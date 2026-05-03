# Шпаргалка — useContext

```tsx
// 1. Создать контекст
const MyContext = createContext<MyType | null>(null);

// 2. Провайдер
export function MyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initial);
  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  );
}

// 3. Кастомный хук
export function useMyContext() {
  const ctx = useContext(MyContext);
  if (!ctx) throw new Error('useMyContext must be used within MyProvider');
  return ctx;
}

// 4. Обернуть приложение
<MyProvider>
  <App />
</MyProvider>

// 5. Использовать в любом компоненте
function AnyChild() {
  const { state, setState } = useMyContext();
}
```
