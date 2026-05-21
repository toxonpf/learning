// ЛР-14: Async-Await и обработка ошибок. Вариант 1

function delay(ms, value) {
    return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

// Задание 1
async function hello() {
    return "Hello, async!";
}

hello().then(v => console.log("Задание 1 через .then():", v));

async function task1() {
    const result = await hello();
    console.log("Задание 1 через await:", result);
}

// Задание 2
async function task2() {
    const a = await delay(300, "Значение A");
    console.log("Задание 2:", a);
    const b = await delay(200, "Значение B");
    console.log("Задание 2:", b);
    const c = await delay(100, "Значение C");
    console.log("Задание 2:", c);
}

// Задание 3
async function getHundred() {
    return Promise.resolve(100);
}

getHundred().then(v => console.log("Задание 3:", v));

// Задание 4
function rejectAfterSecond() {
    return new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Промис отклонён")), 1000)
    );
}

async function task4() {
    try {
        await rejectAfterSecond();
    } catch (err) {
        console.error("Задание 4 try/catch:", err.message);
    }
}

// Задание 5 — переписывание с .then на async/await
async function task5() {
    let v = await Promise.resolve("start");
    v = v + " → step1";
    v = v + " → step2";
    console.log("Задание 5:", v);
}

async function run() {
    await task1();
    await task2();
    await task4();
    await task5();
}

run();
