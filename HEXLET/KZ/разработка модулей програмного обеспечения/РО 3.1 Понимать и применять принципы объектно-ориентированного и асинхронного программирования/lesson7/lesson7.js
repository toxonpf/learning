// Задание 1. Реализация класса Person.
class Person {
    #name;
    #age;

    constructor(name, age) {
        this.#name = name;
        this.#age = age;
    }

    toString() {
        return `${this.#name}, ${this.#age} years old`;
    }

    valueOf() {
        return this.#age;
    }
}

const person = new Person('Alice', 30);
console.log(person.toString());
console.log(`Возраст: ${person.valueOf()}`);
console.log(`Через год: ${person + 1}`);

console.log('');

// Задание 2. Упаковка и распаковка примитивов.
let primitiveNum = 42;
let boxedNum = new Number(primitiveNum);

console.log('Примитив:', primitiveNum, typeof primitiveNum);
console.log('Упакованный объект:', boxedNum, typeof boxedNum);

let unboxedNum = boxedNum.valueOf();
console.log('Распакованное значение:', unboxedNum, typeof unboxedNum);

console.log('');

// Задание 3. Применение методов toString() и valueOf().
const people = [
    new Person('Alice', 30),
    new Person('Bob', 25),
    new Person('Charlie', 35),
];

people.forEach(p => {
    console.log(p.toString());
});

const totalAge = people.reduce((sum, p) => sum + p.valueOf(), 0);
console.log(`Общий возраст: ${totalAge}`);
