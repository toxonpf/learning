# Шпаргалка — React Router

```tsx
// Установка
npm install react-router-dom

// Обернуть приложение
<BrowserRouter><App /></BrowserRouter>

// Маршруты
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/users/:id" element={<User />} />
  <Route path="*" element={<NotFound />} />
</Routes>

// Ссылки
<Link to="/about">О нас</Link>
<NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>О нас</NavLink>

// Хуки
const { id } = useParams<{ id: string }>();           // параметры маршрута
const navigate = useNavigate();                        // программная навигация
const [params, setParams] = useSearchParams();         // query string
const location = useLocation();                        // текущий URL

navigate('/page');                    // вперёд
navigate(-1);                         // назад
navigate('/page', { replace: true }); // без записи в историю

// Вложенные маршруты
<Route path="/dashboard" element={<Layout />}>
  <Route index element={<Home />} />
  <Route path="profile" element={<Profile />} />
</Route>
// В Layout:
<Outlet />

// Защищённый маршрут
if (!user) return <Navigate to="/login" replace />;
```
