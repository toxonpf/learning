import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom';

function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">Главная</Link>
        <Link to="/posts">Посты</Link>
        <Link to="/about">О блоге</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function HomePage() {
  return <div>{/* твой код здесь */}</div>;
}

function PostsPage() {
  return <div>{/* твой код здесь */}</div>;
}

function PostPage() {
  return <div>{/* твой код здесь */}</div>;
}

function AboutPage() {
  return <div>{/* твой код здесь */}</div>;
}

function NotFoundPage() {
  return <h1>404 — Страница не найдена</h1>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/posts" element={<PostsPage />} />
          <Route path="/posts/:id" element={<PostPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
