# ДЗ TS 5 — Utility Types на практике

Свои решения клади в папку `solution/`.

---

## Исходные интерфейсы

```ts
interface Article {
  id: number;
  title: string;
  content: string;
  authorId: number;
  tags: string[];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Author {
  id: number;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
}
```

---

## Задание

### 1. Создай DTO-типы через утилиты (без написания полей вручную)

```ts
// Для создания статьи (без серверных полей: id, createdAt, updatedAt)
type CreateArticleDto = ???

// Для обновления статьи (всё опционально, без id и дат)
type UpdateArticleDto = ???

// Публичный список статей (только id, title, authorId, publishedAt)
type ArticleListItem = ???

// Превью автора для отображения рядом со статьёй
type AuthorPreview = ???  // только id и name, оба readonly
```

### 2. Функции

```ts
// Принимает CreateArticleDto, возвращает полный Article (симуляция создания)
function createArticle(dto: CreateArticleDto): Article

// Принимает id и UpdateArticleDto, возвращает обновлённый Article
function updateArticle(id: number, changes: UpdateArticleDto): Article

// Возвращает список ArticleListItem[]
function getArticleList(articles: Article[]): ArticleListItem[]
```

### 3. Типизируй хранилище статей

```ts
// Используй Record для хранилища: ключ — id, значение — Article
type ArticleStore = ???

// Напиши функцию buildStore(articles: Article[]): ArticleStore
```

---

## Требования

- [ ] Все DTO-типы созданы через `Partial`, `Omit`, `Pick`, `Readonly` — без дублирования полей
- [ ] Функции типизированы корректно
- [ ] `ArticleStore` использует `Record`
