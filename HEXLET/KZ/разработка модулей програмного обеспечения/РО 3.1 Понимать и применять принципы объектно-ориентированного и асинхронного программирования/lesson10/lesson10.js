// ЛР-10: Event Loop, Macro и Microtasks. Вариант 1

// Задание 1
console.log("до таймеров");
setTimeout(() => console.log("таймер 1"), 0);
setTimeout(() => console.log("таймер 2"), 0);
console.log("после таймеров");
// Вывод: "до таймеров" → "после таймеров" → "таймер 1" → "таймер 2"
// Синхронный код выполняется сразу, колбэки setTimeout ждут в очереди макрозадач.

// Задание 2
console.log("синхронный");
setTimeout(() => console.log("200 мс"), 200);
setTimeout(() => console.log("0 мс"), 0);
setTimeout(() => console.log("100 мс"), 100);
// Вывод: "синхронный" → "0 мс" → "100 мс" → "200 мс"
// Event Loop берёт задачу с наименьшей задержкой, а не по порядку регистрации.

// Задание 3
console.log("снаружи");
setTimeout(() => {
    console.log("уровень 1");
    setTimeout(() => {
        console.log("уровень 2");
        setTimeout(() => console.log("уровень 3"), 0);
    }, 0);
}, 0);
// Каждый вложенный таймер регистрируется только при выполнении родителя — отдельный цикл.

// Задание 4
console.log("старт");
queueMicrotask(() => console.log("микрозадача"));
setTimeout(() => console.log("макрозадача"), 0);
console.log("конец");
// Вывод: "старт" → "конец" → "микрозадача" → "макрозадача"
// Микрозадачи выполняются до следующей макрозадачи.

// Задание 5
console.log("1");
setTimeout(() => console.log("2"), 0);
queueMicrotask(() => console.log("3"));
setTimeout(() => console.log("4"), 0);
queueMicrotask(() => console.log("5"));
console.log("6");
// Вывод: 1 → 6 → 3 → 5 → 2 → 4
// Сначала синхронный код, затем все микрозадачи, затем макрозадачи по порядку.
