// 1. Написать фабричную функцию createBook(title, author), возвращающую объект книги с полями title, author и методом getInfo().
function createBook(title, author) {
    return {
        title: title,
        author: author,
        getInfo() {
            return `${this.title} by ${this.author}`;
        }
    };
}

// 2. Реализовать функцию-конструктор User(name, age) с методом sayHello(). Создать 2 экземпляра
// 3. Проверить проблему дублирования методов у разных объектов, созданных через конструктор (сравнить ссылки на метод).
function User(name, age) {
    this.name = name;
    this.age = age;
    this.sayHello = function() {
        return `Hello, my name is ${this.name} and I am ${this.age} years old.`;
    };
}

const user1 = new User('Alice', 30);
const user2 = new User('Bob', 25);

console.log(user1.sayHello === user2.sayHello); // false, так как методы создаются для каждого экземпляра отдельно

// 4. Создать объект даты с помощью конструктора Date, вывести текущий год и месяц
const currentDate = new Date();
console.log(currentDate.getFullYear()); 
console.log(currentDate.getMonth() + 1);

// 5. Использовать конструктор Function для динамического создания функции сложения чисел и протестировать её.
const add = new Function('a', 'b', 'return a + b;');
console.log(add(5, 10));