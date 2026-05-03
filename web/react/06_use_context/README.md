# Урок 6 — useContext

## Проблема: prop drilling

Когда состояние нужно на нескольких уровнях вложенности — приходится передавать props через промежуточные компоненты, которые сами их не используют.

```
App (theme)
 └── Layout (theme) ← не использует, просто передаёт
      └── Sidebar (theme) ← не использует
           └── Button (theme) ← использует
```

Это называется **prop drilling** и делает код хрупким.

---

## Решение: Context

Context — глобальное хранилище, доступное любому компоненту в дереве без передачи через props.

### Шаг 1: Создать контекст

```tsx
// theme-context.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);
```

### Шаг 2: Создать провайдер

```tsx
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Шаг 3: Кастомный хук для удобного доступа

```tsx
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

### Шаг 4: Обернуть приложение и использовать

```tsx
// main.tsx / App.tsx
function App() {
  return (
    <ThemeProvider>
      <Layout />
    </ThemeProvider>
  );
}

// В любом вложенном компоненте
function Button() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      style={{ background: theme === 'dark' ? '#333' : '#fff' }}
    >
      Переключить тему
    </button>
  );
}
```

---

## Пример: авторизация

```tsx
interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <AuthContext.Provider value={{
      user,
      login: setUser,
      logout: () => setUser(null),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Использование
function Header() {
  const { user, logout } = useAuth();
  return user ? <button onClick={logout}>Выйти, {user.name}</button> : <a href="/login">Войти</a>;
}
```

---

## Когда использовать Context?

| Используй Context | Не используй Context |
|------------------|---------------------|
| Тема (тёмная/светлая) | Состояние одной формы |
| Авторизованный пользователь | Данные одного компонента |
| Язык/локаль | Список элементов |
| Настройки приложения | Временные UI-состояния |

Context хорош для данных, которые меняются редко. При частых изменениях рассмотри внешние стейт-менеджеры (Zustand, Redux).
