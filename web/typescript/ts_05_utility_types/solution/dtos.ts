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

// 1. DTO-типы (заполни через утилиты)
type CreateArticleDto = /* твой код */ unknown;
type UpdateArticleDto = /* твой код */ unknown;
type ArticleListItem = /* твой код */ unknown;
type AuthorPreview = /* твой код */ unknown;

// 2. Функции
export function createArticle(dto: CreateArticleDto): Article {
  // твой код здесь
  return {} as Article;
}

export function updateArticle(id: number, changes: UpdateArticleDto): Article {
  // твой код здесь
  return {} as Article;
}

export function getArticleList(articles: Article[]): ArticleListItem[] {
  // твой код здесь
  return [];
}

// 3. Хранилище
type ArticleStore = /* твой код */ unknown;

export function buildStore(articles: Article[]): ArticleStore {
  // твой код здесь
  return {} as ArticleStore;
}
