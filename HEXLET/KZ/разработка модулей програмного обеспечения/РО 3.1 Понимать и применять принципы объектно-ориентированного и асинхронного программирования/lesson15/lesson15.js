// ЛР-15: HTTP-запросы: XMLHttpRequest и fetch. Вариант 1

const BASE = "https://jsonplaceholder.typicode.com";

// Задание 1 — XMLHttpRequest
const xhr = new XMLHttpRequest();
xhr.open("GET", `${BASE}/posts/1`);
xhr.onload = function () {
    const post = JSON.parse(xhr.responseText);
    console.log("Задание 1 (XHR) title:", post.title);
};
xhr.send();

// Задание 2 — fetch
fetch(`${BASE}/posts/1`)
    .then(response => response.json())
    .then(post => console.log("Задание 2 (fetch) title:", post.title));

// Задание 3 — Chaining
fetch(`${BASE}/users/2`)
    .then(response => response.json())
    .then(user => fetch(`${BASE}/albums?userId=${user.id}`))
    .then(response => response.json())
    .then(albums => console.log("Задание 3: альбомов найдено:", albums.length));

// Задание 4 — .text()
fetch("https://httpbin.org/robots.txt")
    .then(response => response.text())
    .then(text => console.log("Задание 4 (robots.txt):\n" + text));

// Задание 5 — Сетевая ошибка
fetch("https://not-exists-12345.com")
    .catch(() => console.log("Задание 5: Произошла ошибка соединения"));
