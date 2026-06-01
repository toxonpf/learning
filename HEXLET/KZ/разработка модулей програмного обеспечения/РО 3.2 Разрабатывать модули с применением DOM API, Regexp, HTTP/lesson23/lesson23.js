// ЛР-23: Якоря. Группы и альтернации. Замены с $1, $2. Вариант 1

// 1. Проверка формата числа — строка состоит только из цифр
function task1() {
    const onlyDigits = /^\d+$/;
    console.log("1. Проверка формата числа:");
    console.log('"2025" →', onlyDigits.test("2025"));       // true
    console.log('"2025abc" →', onlyDigits.test("2025abc")); // false
}
task1();

// 2. Поиск слова "cat" только как отдельного слова (\b — граница слова)
function task2() {
    const str = "cat catalog scatter cat";
    const result = str.match(/\bcat\b/g);
    console.log("\n2. Поиск слова 'cat' с границами:");
    console.log(result);
    // ['cat', 'cat']
}
task2();

// 3. Фамилии с заглавной буквы, только из букв
function task3() {
    const str = "Ivanov college Petrov Sidorov student";
    const result = str.match(/\b[A-Z][a-z]+\b/g);
    console.log("\n3. Фамилии с заглавной буквы:");
    console.log(result);
    // ['Ivanov', 'Petrov', 'Sidorov']
}
task3();

// 4. Альтернация цветов — red, green, blue (с флагом i для Green)
function task4() {
    const str = "I like red, green and blue. Green is my favorite color";
    const result = str.match(/\b(red|green|blue)\b/gi);
    console.log("\n4. Цвета (альтернация):");
    console.log(result);
    // ['red', 'green', 'blue', 'Green']
}
task4();

// 5. Перестановка имени и фамилии с помощью групп и $1, $2
function task5() {
    const str = "Ivan Petrov";
    const result = str.replace(/(\w+)\s+(\w+)/, "$2 $1");
    console.log("\n5. Перестановка имени и фамилии:");
    console.log('"Ivan Petrov" →', result);
    // 'Petrov Ivan'
}
task5();

// 6. Преобразование даты "2025-09-17" → "17.09.2025"
function task6() {
    const date = "2025-09-17";
    const result = date.replace(/(\d{4})-(\d{2})-(\d{2})/, "$3.$2.$1");
    console.log("\n6. Преобразование даты:");
    console.log('"2025-09-17" →', result);
    // '17.09.2025'
}
task6();

// 7. Форматирование номера "87011234567" → "+7 (701) 123-45-67"
function task7() {
    const phone = "87011234567";
    const result = phone.replace(/^8(\d{3})(\d{3})(\d{2})(\d{2})$/, "+7 ($1) $2-$3-$4");
    console.log("\n7. Форматирование номера:");
    console.log('"87011234567" →', result);
    // '+7 (701) 123-45-67'
}
task7();

// 8. Проверка пароля: начинается с буквы, минимум 6 символов (буквы и цифры)
function task8() {
    const validPassword = /^[A-Za-z][A-Za-z0-9]{5,}$/;
    const tests = ["abc123", "a1b2c3", "1abc23", "ab12", "Hello1"];
    console.log("\n8. Проверка пароля:");
    tests.forEach(p => console.log(`"${p}" →`, validPassword.test(p)));
    // 'abc123' → true, 'a1b2c3' → true, '1abc23' → false, 'ab12' → false, 'Hello1' → true
}
task8();
