// Задание 1. Синхронный код и порядок выполнения.
console.log('first');
(() => {console.log('first f');})();
console.log('second');
(() => {console.log('second f');})(); 
console.log('third');
(() => {console.log('third f');})();
console.log('fourth');
(() => {console.log('fourth f');})();
console.log('fifth');
(() => {console.log('fifth f');})();
// код выполняется последовательно, так как действия сверху относяться к call-stack.

// Задание 2. Call Stack — цепочка вызовов.
function start() {
    process();
    console.trace();
}

function process() {
    finish();
    console.trace();
}

function finish() {
    console.trace();
}

start();
// Порядок попадания в стек:
// 1. start()   — вызывается первой, ложится на дно стека
// 2. process() — вызывается из start(), ложится поверх
// 3. finish()  — вызывается из process(), ложится сверху

// Порядок выхода из стека (последний вошёл — первый вышел):
// 1. finish()  — trace внутри finish(): стек [finish → process → start]
//finish() завершается и выходит первой
// 2. process() — trace внутри process() (после finish()): стек [process → start]
//process() завершается и выходит второй
// 3. start()   — trace внутри start() (после process()): стек [start]
//start() завершается и выходит последней

// Задание 3. Call Stack при рекурсии.
function count(num) {
    if (num === 0) {
        console.trace();
        return;
    }
    count(num - 1);
}

count(3);
// Порядок попадания в стек:
// 1. count(3) — вызывается первой, ложится на дно стека
// 2. count(2) — вызывается из count(3), ложится поверх
// 3. count(1) — вызывается из count(2), ложится поверх
// 4. count(0) — вызывается из count(1), ложится поверх

// Задание 4. Блокировка потока.
function heavyTask() {
    for (let i = 0; i < 1e9; i++) {}
}

console.log('до тяжёлой задачи', Date.now());
const start4 = Date.now();

heavyTask();

const end4 = Date.now();
console.log('после тяжёлой задачи', end4);
console.log(`Время выполнения: ${end4 - start4} мс`);

// Задание 5. Асинхронный код через события.
console.log('1. до регистрации обработчика');

document.addEventListener('click', () => {
    console.log('3. клик обработан (асинхронно)');
});

console.log('2. после регистрации обработчика');

// Порядок вывода при запуске:
// 1. до регистрации обработчика
// 2. после регистрации обработчика
// ждём клик
// 3. клик обработан
