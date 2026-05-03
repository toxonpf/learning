# Урок 9 — React Router

## Установка

```bash
npm install react-router-dom
```

---

## Основные концепции

React Router позволяет строить **SPA** (Single Page Application) — навигация без перезагрузки страницы, каждый URL показывает нужный компонент.

---

## Базовая настройка

```tsx
// main.tsx
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

```tsx
// App.tsx
import { Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <div>
      <nav>
        <Link to="/">Главная</Link>
        <Link to="/about">О нас</Link>
        <Link to="/users">Пользователи</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}
```

---

## Динамические маршруты

```tsx
// Маршрут с параметром
<Route path="/users/:id" element={<UserPage />} />

// Получение параметра в компоненте
import { useParams } from 'react-router-dom';

function UserPage() {
  const { id } = useParams<{ id: string }>();
  return <p>Пользователь: {id}</p>;
}

// Ссылка с параметром
<Link to={`/users/${user.id}`}>{user.name}</Link>
```

---

## useNavigate — программная навигация

```tsx
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login();
    navigate('/dashboard');      // перейти вперёд
    navigate(-1);                // назад (как кнопка браузера)
    navigate('/login', { replace: true }); // заменить запись в истории
  };
}
```

---

## useSearchParams — query string

```tsx
import { useSearchParams } from 'react-router-dom';

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') ?? 'all';

  return (
    <div>
      <button onClick={() => setSearchParams({ category: 'electronics' })}>
        Электроника
      </button>
      <p>Категория: {category}</p>
    </div>
  );
}
// URL: /products?category=electronics
```

---

## Вложенные маршруты + Outlet

```tsx
// Layout-компонент с Outlet для дочерних маршрутов
function DashboardLayout() {
  return (
    <div>
      <aside>
        <Link to="profile">Профиль</Link>
        <Link to="settings">Настройки</Link>
      </aside>
      <main>
        <Outlet /> {/* здесь рендерятся дочерние маршруты */}
      </main>
    </div>
  );
}

// Конфигурация маршрутов
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<DashboardHome />} />         {/* /dashboard */}
  <Route path="profile" element={<ProfilePage />} />  {/* /dashboard/profile */}
  <Route path="settings" element={<SettingsPage />} />{/* /dashboard/settings */}
</Route>
```

---

## Защищённые маршруты

```tsx
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Использование
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```
