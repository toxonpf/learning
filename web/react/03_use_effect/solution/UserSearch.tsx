import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
}

export function UserSearch() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);

  // загрузка пользователей

  // загрузка постов при выборе пользователя

  return (
    <div>
      {/* твой код здесь */}
    </div>
  );
}
