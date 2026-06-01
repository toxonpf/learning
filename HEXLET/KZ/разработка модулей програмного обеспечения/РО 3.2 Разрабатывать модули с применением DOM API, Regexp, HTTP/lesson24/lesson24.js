// ЛР-24: Жадные и ленивые совпадения. Lookahead/Lookbehind. Вариант 1

// 1. Жадность и ленивость — найти все теги отдельно (ленивый квантификатор)
function task1() {
    const str = "<p>Text</p><div>More</div>";
    const greedy = str.match(/<.+>/g);
    const lazy   = str.match(/<.+?>/g);
    console.log("1. Жадный квантификатор:");
    console.log(greedy);
    // ['<p>Text</p><div>More</div>']
    console.log("1. Ленивый квантификатор:");
    console.log(lazy);
    // ['<p>', '</p>', '<div>', '</div>']
}
task1();

// 2. Цены в долларах — lookahead (?=\$)
function task2() {
    const str = "350000тг, 5000$, 1500тг, 20$";
    const result = str.match(/\d+(?=\$)/g);
    console.log("\n2. Цены в долларах (lookahead):");
    console.log(result);
    // ['5000', '20']
}
task2();

// 3. Цены НЕ в долларах — negative lookahead (?!\$)
function task3() {
    const str = "350000тг, 5000$, 1500тг, 20$";
    const result = str.match(/\d+(?!\d)(?!\$)/g);
    console.log("\n3. Цены не в долларах (negative lookahead):");
    console.log(result);
    // ['350000', '1500']
}
task3();

// 4. Пароль с буквами и цифрами — минимум 6 символов, хотя бы одна буква и одна цифра
function task4() {
    function isValidPassword(p) {
        return p.length >= 6 && /[A-Za-z]/.test(p) && /\d/.test(p);
    }
    const tests = ["abc123", "aaaaaa", "123456", "Ab1", "Pass1word"];
    console.log("\n4. Проверка пароля (буква + цифра + мин. 6 символов):");
    tests.forEach(p => console.log(`"${p}" →`, isValidPassword(p)));
    // abc123→true, aaaaaa→false, 123456→false, Ab1→false, Pass1word→true
}
task4();

// 5. E-mail: домен — lookbehind (?<=@)
function task5() {
    const email = "student@mail.com";
    const result = email.match(/(?<=@).+/);
    console.log("\n5. Домен из e-mail (lookbehind):");
    console.log(result ? result[0] : null);
    // 'mail.com'
}
task5();

// 6. Телефоны с кодом страны +7
function task6() {
    const str = "+7-701-123-45-67, +3-544-435-12-23, +7-905-654-67-98, +5-765-982-37-61";
    const result = str.match(/\+7-\d{3}-\d{3}-\d{2}-\d{2}/g);
    console.log("\n6. Телефоны с кодом +7:");
    console.log(result);
    // ['+7-701-123-45-67', '+7-905-654-67-98']
}
task6();

// 7. Файлы по расширению — только .doc и .xls
function task7() {
    const str = "report.doc, photo.png, music.mp3, data.xls";
    const result = str.match(/\w+\.(doc|xls)/g);
    console.log("\n7. Документы (.doc и .xls):");
    console.log(result);
    // ['report.doc', 'data.xls']
}
task7();

// 8. Цитаты — содержимое кавычек «» без самих кавычек (lookbehind + lookahead)
function task8() {
    const str = "«JavaScript» и «RegExp»";
    const result = str.match(/(?<=«)[^»]+(?=»)/g);
    console.log("\n8. Содержимое кавычек:");
    console.log(result);
    // ['JavaScript', 'RegExp']
}
task8();
