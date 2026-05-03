import { useState, lazy, Suspense } from 'react';

const ProfileCardDemo  = lazy(() => import('./demos/ProfileCardDemo').then(m => ({ default: m.ProfileCardDemo })));
const TodoList         = lazy(() => import('../../02_use_state/solution/TodoList').then(m => ({ default: m.TodoList })));
const UserSearch       = lazy(() => import('../../03_use_effect/solution/UserSearch').then(m => ({ default: m.UserSearch })));
const RegistrationForm = lazy(() => import('../../04_forms/solution/RegistrationForm').then(m => ({ default: m.RegistrationForm })));
const Shop             = lazy(() => import('../../05_lifting_state/solution/Shop').then(m => ({ default: m.Shop })));
const CartApp          = lazy(() => import('../../07_use_reducer/solution/CartApp').then(m => ({ default: m.CartApp })));
const DataTable        = lazy(() => import('../../10_optimization/solution/DataTable').then(m => ({ default: m.DataTable })));

const LESSONS = [
  { id: '01', label: '01 — JSX: Карточка профиля',      component: <ProfileCardDemo /> },
  { id: '02', label: '02 — useState: Список задач',      component: <TodoList /> },
  { id: '03', label: '03 — useEffect: Поиск юзеров',    component: <UserSearch /> },
  { id: '04', label: '04 — Формы: Регистрация',          component: <RegistrationForm /> },
  { id: '05', label: '05 — Lifting state: Магазин',      component: <Shop /> },
  { id: '07', label: '07 — useReducer: Корзина',         component: <CartApp /> },
  { id: '10', label: '10 — Оптимизация: Таблица',        component: <DataTable /> },
] as const;

type LessonId = (typeof LESSONS)[number]['id'];

export function App() {
  const [active, setActive] = useState<LessonId>('01');
  const lesson = LESSONS.find((l) => l.id === active)!;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{
        width: 260,
        borderRight: '1px solid #e0e0e0',
        padding: '16px 0',
        background: '#fafafa',
        flexShrink: 0,
        overflowY: 'auto',
      }}>
        <div style={{ padding: '0 16px 12px', fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
          Уроки
        </div>
        {LESSONS.map((l) => (
          <button
            key={l.id}
            onClick={() => setActive(l.id)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '10px 16px',
              border: 'none',
              background: active === l.id ? '#e8f0fe' : 'transparent',
              color: active === l.id ? '#1a73e8' : '#333',
              fontWeight: active === l.id ? 600 : 400,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {l.label}
          </button>
        ))}
      </nav>

      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        <Suspense fallback={<p style={{ color: '#999' }}>Загрузка...</p>}>
          {lesson.component}
        </Suspense>
      </main>
    </div>
  );
}
