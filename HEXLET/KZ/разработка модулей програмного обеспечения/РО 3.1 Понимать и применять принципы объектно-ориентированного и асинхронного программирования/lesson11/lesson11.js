// ЛР-11: Таймеры. Вариант 1
// Задания 1, 2, 5 — браузерные (task1.html, task2.html, task5.html)

// Задание 3 — дрейф setInterval
// Тяжёлая работа блокирует поток, колбэки накапливаются и идут подряд после разблокировки.
let runs3 = 0;
const interval3 = setInterval(() => {
    if (runs3 >= 3) { clearInterval(interval3); startTask4(); return; }
    runs3++;
    console.log("[setInterval] start", new Date().toLocaleTimeString());
    const end = Date.now() + 2000;
    while (Date.now() < end) {}
    console.log("[setInterval] end  ", new Date().toLocaleTimeString());
}, 1000);

// Задание 4 — рекурсивный setTimeout
// Новый вызов начинается только после завершения текущего — дрейфа нет.
function startTask4() {
    let runs4 = 0;
    function tick() {
        if (runs4 >= 3) return;
        runs4++;
        console.log("[setTimeout] start", new Date().toLocaleTimeString());
        const end = Date.now() + 2000;
        while (Date.now() < end) {}
        console.log("[setTimeout] end  ", new Date().toLocaleTimeString());
        setTimeout(tick, 1000);
    }
    setTimeout(tick, 1000);
}
