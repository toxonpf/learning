// Задание 1. Создание класса.
// Задание 2. Инкапсуляция через приватные свойства.
// Задание 4. Метод для проверки возраста книги.
class Book {
    #pages;
    #isOld;

    constructor(title, author, year) {
        this.title = title;
        this.author = author;
        this.year = year;
        this.#pages = 0;
        this.#isOld = 20 < new Date().getFullYear() - year ? true : false;
    }

    get pages() {
        return this.#pages;
    }

    set pages(value) {
        if (value < 0) {
            console.error("Количество страниц не может быть отрицательным.");
        } else {
            this.#pages = value;
        }
    }

    getInfo() {
        return `
            Название: ${this.title}, 
            Автор: ${this.author}, 
            Год: ${this.year}, 
            Старше 20 лет: ${this.#isOld ? "Да" : "Нет"}
        `;
    }
}

// Задание 3. Работа с экземплярами.
const book1 = new Book("Война и мир", "Лев Толстой", 1869);
book1.pages = 1225;
const book2 = new Book("Преступление и наказание", "Федор Достоевский", 1866);
book2.pages = 671;

console.log(book1.getInfo());
console.log(`Количество страниц: ${book1.pages}`);
console.log(book2.getInfo());
console.log(`Количество страниц: ${book2.pages}`);

// Задание 5. Массовая работа с объектами.
const books = [
    new Book("Гарри Поттер и философский камень", "Дж. К. Роулинг", 1997),
    new Book("Гарри Поттер и тайная комната", "Дж. К. Роулинг", 1998),
    new Book("Гарри Поттер и узник Азкабана", "Дж. К. Роулинг", 1999),
    new Book("Гарри Поттер и кубок огня", "Дж. К. Роулинг", 2000),
    new Book("Гарри Поттер и Орден Феникса", "Дж. К. Роулинг", 2003)
];

books.forEach(book => {
    console.log(book.getInfo());
});