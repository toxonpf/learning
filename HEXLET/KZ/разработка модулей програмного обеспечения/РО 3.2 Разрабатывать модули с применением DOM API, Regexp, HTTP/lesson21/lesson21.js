// 1. Проверка имени
function task1() {
    const name = /Anna/;
    console.log(name.test('Anna Petrova'));
    console.log(name.test('Ivan Ivanov'));
}
task1();

// 2. Поиск всех вхождений слова (с учетом и без учёта регистра)
function task2() {
    const text = "Колледж может стать отличным стартом для будущей карьеры. Именно поэтому Иван так усердно готовился к поступлению в этот престижный колледж. Он знал, что учеба поможет ему реализовать все свои мечты, ведь этот колледж славится сильной программой и талантливыми преподавателями."
    const regex = /колледж/gi;

    const matches = text.match(regex);
    console.log(matches.length);
}
task2();

// 3. Проверка email.
function task3() {
    const mail = "student@mail.com";
    const regex = /mail.com/;

    console.log(regex.test(mail));
}
task3();

// 4. Замена домена.
function task4() {
    const emai = ["toxobpf@gmail.com", "serder_doi@gmail.com", "kirik@gmail.com"];
    const emaiChange = [];
    const regex = /gmail.com/;

    emai.forEach(el => emaiChange.push(el.replace(regex, "university.edu")));
    console.log(emaiChange);

}
task4();

// 5. Форматирование телефона
function task5() {
    const phone = "8-777-123-45-67";
    const regex = /-/g;
    console.log(phone.replace(regex, " "));
}
task5();

// 6. Поиск года
function task6() {
    const regex = /\d{4}/g;
    const text = "Event: 2025, Next: 2026";
    console.log(text.match(regex));
}
task6();

// 7. Разделение списка email
function task7() {
    const emails = "anna@mail.com; ivan@mail.com, petr@mail.com";
    const emailList = emails.split(/[,;]/);
    console.log(emailList);
}
task7();    