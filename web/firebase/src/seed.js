// src/seed.js
// Run this in browser console after logging in as admin, or use as a one-time script.
// Import in browser: copy-paste or use a temporary page.
// Usage: import { seedProducts } from './src/seed.js'; seedProducts();

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';
import { generateNameTokens } from './utils/tokens.js';

const PRODUCTS = [
  // Electronics
  { name: 'Беспроводные наушники AirMax Pro', category: 'electronics', price: 12990, stock: 45, description: 'Профессиональные наушники с активным шумоподавлением, 30 ч. автономной работы и Hi-Fi качеством звука.', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', rating: 4.7 },
  { name: 'Смарт-часы WatchX Ultra', category: 'electronics', price: 24500, stock: 20, description: 'Умные часы с AMOLED-дисплеем, GPS, мониторингом здоровья и 7 днями работы от батареи.', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80', rating: 4.5 },
  { name: 'Механическая клавиатура KeyForce', category: 'electronics', price: 8499, stock: 30, description: 'Компактная 75% клавиатура с RGB-подсветкой и переключателями Cherry MX Red.', imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80', rating: 4.8 },
  { name: 'Портативная колонка BoomBox Mini', category: 'electronics', price: 5990, stock: 60, description: 'Водонепроницаемая Bluetooth-колонка с 360° звуком и 12 ч. воспроизведения.', imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80', rating: 4.3 },
  { name: 'Игровая мышь ProClick X9', category: 'electronics', price: 3990, stock: 80, description: '16000 DPI, 7 программируемых кнопок, RGB-подсветка и эргономичный дизайн.', imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80', rating: 4.6 },
  { name: 'Монитор UltraView 27" 4K', category: 'electronics', price: 49900, stock: 10, description: 'IPS-панель 4K, 144 Гц, HDR600, идеален для профессиональной работы и гейминга.', imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80', rating: 4.9 },

  // Clothing
  { name: 'Минималистичная худи Oversize', category: 'clothing', price: 4290, stock: 100, description: 'Мягкий хлопок 100%, оверсайз крой, доступна в 8 цветах. Идеальна для повседневного образа.', imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80', rating: 4.4 },
  { name: 'Кроссовки Urban Runner', category: 'clothing', price: 7800, stock: 55, description: 'Легкие беговые кроссовки с адаптивной подошвой и дышащей сеткой. Подходят для города и трейла.', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', rating: 4.6 },
  { name: 'Джинсы Slim Stretch Premium', category: 'clothing', price: 5490, stock: 70, description: 'Эластичный деним, зауженный крой, идеально сидит. Коллекция осень-зима 2024.', imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80', rating: 4.2 },
  { name: 'Куртка WindBreaker Pro', category: 'clothing', price: 11900, stock: 35, description: 'Ветрозащитная куртка с водоотталкивающим покрытием, съемным капюшоном, 3 кармана.', imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&q=80', rating: 4.5 },

  // Home
  { name: 'Диффузор Aroma Mist 500ml', category: 'home', price: 2990, stock: 90, description: 'Ультразвуковой ароматический диффузор с LED-подсветкой, таймером и режимом тумана.', imageUrl: 'https://images.unsplash.com/photo-1602928309468-1b0e4861994f?w=600&q=80', rating: 4.4 },
  { name: 'Настольная лампа Glow Arc', category: 'home', price: 4590, stock: 40, description: 'Светодиодная лампа с регулировкой яркости и цвета, гибкий arm, USB-зарядка.', imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80', rating: 4.7 },
  { name: 'Набор кастрюль Titanium Set 5 шт.', category: 'home', price: 15900, stock: 25, description: 'Титановое покрытие, подходит для всех видов плит включая индукцию. Безопасны для посудомойки.', imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80', rating: 4.8 },
  { name: 'Плед Cozy Knit 140x200', category: 'home', price: 3490, stock: 65, description: 'Мягкий вязаный плед из гипоаллергенного материала. Идеален для уютных вечеров.', imageUrl: 'https://images.unsplash.com/photo-1494400519-4fadb9ccde52?w=600&q=80', rating: 4.6 },

  // Sports
  { name: 'Гантели регулируемые 5-25 кг', category: 'sports', price: 18990, stock: 15, description: 'Компактные регулируемые гантели, заменяют 9 пар. Прочное покрытие, эргономичные рукоятки.', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80', rating: 4.7 },
  { name: 'Коврик для йоги EcoGrip 6mm', category: 'sports', price: 2890, stock: 75, description: 'Экологичный TPE коврик с антискользящим покрытием, размер 183×61 см.', imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80', rating: 4.3 },
  { name: 'Велосипедный шлем SafeRide Pro', category: 'sports', price: 6500, stock: 30, description: 'Сертифицированный шлем EN1078, 18 вентиляционных отверстий, удобный крепеж.', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', rating: 4.5 },
  { name: 'Скакалка Speed Rope Pro', category: 'sports', price: 1490, stock: 120, description: 'Стальной трос, алюминиевые ручки с подшипниками, регулируемая длина.', imageUrl: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&q=80', rating: 4.4 },

  // Books
  { name: 'Атомные привычки — Джеймс Клир', category: 'books', price: 890, stock: 200, description: 'Бестселлер о маленьких изменениях, ведущих к большим результатам. More than 8 млн. копий продано.', imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80', rating: 4.9 },
  { name: 'Думай медленно, решай быстро', category: 'books', price: 990, stock: 150, description: 'Даниэль Канеман о двух системах мышления. Нобелевская премия по экономике.', imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80', rating: 4.7 },
  { name: 'Clean Code — Роберт Мартин', category: 'books', price: 1290, stock: 80, description: 'Классика для каждого программиста. Как писать читаемый, поддерживаемый код.', imageUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&q=80', rating: 4.8 },
  { name: 'Sapiens: Краткая история человечества', category: 'books', price: 790, stock: 180, description: 'Юваль Ной Харари о пути человека от саванны до цифровой эры. Мировой бестселлер.', imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80', rating: 4.6 },
];

export async function seedProducts(onProgress = null) {
  console.log(`Seeding ${PRODUCTS.length} products...`);
  const total = PRODUCTS.length;
  let count = 0;
  for (const product of PRODUCTS) {
    const nameTokens = generateNameTokens(product.name);
    await addDoc(collection(db, 'products'), {
      ...product,
      nameTokens,
      reviewCount: 0,
      createdAt: serverTimestamp(),
    });
    count++;
    console.log(`✓ ${count}/${total} — ${product.name}`);
    if (onProgress) onProgress(product.name, count, total);
  }
  console.log('✅ Seed complete!');
}

// Auto-run if imported directly
// seedProducts().catch(console.error);
