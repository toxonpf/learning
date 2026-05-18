// ЛР-16: Обработка асинхронных запросов с использованием async/await. Вариант 1

const BASE = "https://jsonplaceholder.typicode.com";

// Задание 1 — Профиль пользователя
async function task1() {
    const response = await fetch(`${BASE}/users/3`);
    const user = await response.json();
    console.log("Задание 1:");
    console.log("  Имя:", user.name);
    console.log("  Email:", user.email);
    console.log("  Компания:", user.company.name); 
}

// Задание 2 — Список дел (JSONPlaceholder)
async function task2() {
    const response = await fetch(`${BASE}/todos?userId=1`);
    const todos = await response.json();
    const pending = todos.filter(t => !t.completed).map(t => t.title);
    console.log("Задание 2 — незавершённые задачи:");
    pending.forEach(title => console.log(" -", title));
}

// Задание 3 — Случайные факты о котах (Cat Facts API)
async function task3() {
    const response = await fetch("https://catfact.ninja/fact");
    const data = await response.json();
    console.log("Задание 3:", data.fact);
    console.log(data.fact.length > 100 ? "Длинный факт" : "Короткий факт");
}

// Задание 4. Информация о конкретной стране (REST Countries)
async function task4() {
    const response = await fetch("https://restcountries.com/v3.1/name/germany");
    const data = await response.json();
    const country = data[0];
    console.log("Задание 4:");
    console.log("  Столица:", country.capital[0]);
    console.log("  Население:", country.population);
}
// Задание 5. Комплексная обработка ошибок
async function task5() {
    try {
        const response = await fetch(`${BASE}/posts/999`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const post = await response.json();
        console.log("Задание 5:", post.title);
    } catch (err) {
        console.log("Задание 5: Запрос не удался:", err.message);
    }
}

async function run() {
    await task1();
    await task2();
    await task3();
    await task4();
    await task5();
}
run();