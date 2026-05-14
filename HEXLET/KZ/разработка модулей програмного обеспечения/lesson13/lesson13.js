// ЛР-13: Цепочки промисов. Вариант 1

// Задание 1
Promise.resolve(5)
    .then(x => x * 2)
    .then(x => x + 3)
    .then(x => console.log("Задание 1:", x)); // 13

// Задание 2
function delay(ms, value) {
    return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

delay(500, "Шаг 1")
    .then(v => { console.log("Задание 2:", v); return delay(500, "Шаг 2"); })
    .then(v => { console.log("Задание 2:", v); return delay(500, "Шаг 3"); })
    .then(v => console.log("Задание 2:", v));

// Задание 3
const p1 = new Promise(resolve => setTimeout(() => resolve("результат 1"), 1000));
const p2 = new Promise(resolve => setTimeout(() => resolve("результат 2"), 2000));
const p3 = new Promise(resolve => setTimeout(() => resolve("результат 3"), 3000));

Promise.all([p1, p2, p3])
    .then(values => console.log("Задание 3 Promise.all:", values));

// Задание 4
Promise.resolve("начало")
    .then(() => { throw new Error("Ошибка на 2-м шаге"); })
    .catch(err => { console.error("Задание 4 перехвачено:", err.message); return "запасное значение"; })
    .then(v => console.log("Задание 4 продолжение:", v));

// Задание 5
const fast = new Promise(resolve => setTimeout(() => resolve("Быстрый"), 1000));
const slow = new Promise(resolve => setTimeout(() => resolve("Медленный"), 3000));

Promise.race([fast, slow])
    .then(result => console.log("Задание 5 Promise.race:", result));
