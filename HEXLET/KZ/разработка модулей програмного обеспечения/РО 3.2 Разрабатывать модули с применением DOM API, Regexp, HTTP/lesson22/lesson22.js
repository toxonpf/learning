// ЛР-22: Метасимволы. Символьные классы. Квантификаторы. Вариант 1

// 1. Имена в тексте — фрагменты только из букв (латиница или кириллица)
function task1() {
    const str = "Иван, Anna, r2d2, Max123, Oleg_2025, cat";
    const result = str.match(/[A-Za-zА-Яа-яЁё]+/g);
    console.log("1. Имена в тексте:");
    console.log(result);
    // ['Иван', 'Anna', 'r', 'd', 'Max', 'Oleg', 'cat']
}
task1();

// 2. Возраст студентов — все числа
function task2() {
    const str = "Петр — 25 лет, Анна — 19 лет, Иван — 7 лет";
    const result = str.match(/\d+/g);
    console.log("\n2. Возраст студентов:");
    console.log(result);
    // ['25', '19', '7']
}
task2();

// 3. Фамилии — начинаются с заглавной буквы, только буквы
// Примечание: \b не работает с кириллицей в JS, поэтому используем символьный класс напрямую
function task3() {
    const str = "Иванов, Петров, R2D2, студент, Сидоров, Smith, колледж";
    const result = str.match(/[А-ЯA-Z][А-Яа-яA-Za-z]+/g);
    console.log("\n3. Фамилии:");
    console.log(result);
    // ['Иванов', 'Петров', 'Сидоров', 'Smith']
}
task3();

// 4. Телефонные группы — все группы цифр
function task4() {
    const str = "Телефон: +7-701-123-45-67";
    const result = str.match(/\d+/g);
    console.log("\n4. Телефонные группы:");
    console.log(result);
    // ['7', '701', '123', '45', '67']
}
task4();

// 5. Цены в тенге — число + тг
function task5() {
    const str = "Ноутбук — 350000тг, Iphone15 - 1000$, Кофе — 1500тг, macbook air - 120000руб, Мышь — 5000тг";
    const result = str.match(/\d+тг/g);
    console.log("\n5. Цены в тенге:");
    console.log(result);
    // ['350000тг', '1500тг', '5000тг']
}
task5();

// 6. Числа и единицы измерения
function task6() {
    const str = "12kg 30min 100km";
    const numbers = str.match(/\d+/g);
    const units = str.match(/[a-z]+/g);
    console.log("\n6. Числа и единицы измерения:");
    console.log(numbers);
    // ['12', '30', '100']
    console.log(units);
    // ['kg', 'min', 'km']
}
task6();

// 7. Год — все четырёхзначные числа
function task7() {
    const str = "В 2023 Иван поступил в колледж. Сейчас он на 3 курсе. Он закончит колледж в 2026 году";
    const result = str.match(/\d{4}/g);
    console.log("\n7. Годы:");
    console.log(result);
    // ['2023', '2026']
}
task7();
