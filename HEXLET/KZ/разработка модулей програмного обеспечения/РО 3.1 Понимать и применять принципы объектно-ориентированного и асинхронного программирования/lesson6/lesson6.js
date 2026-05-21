// Задание 1. Создание класса.
class Rectangle {
    #width;
    #height;
    // Задание 5. Статический счётчик.
    static count = 0;
    constructor(width, height) {
        this.#width = width;
        this.#height = height;
        Rectangle.count++;
    }

    // Задание 3. Сеттер.
    set size({ width, height }) {
        if (width >= 0) this.#width = width;
        else console.error("Ширина должна быть положительной.");

        if (height >= 0) this.#height = height;
        else console.error("Высота должна быть положительной.");
    }

    // Задание 2. Геттеры.
    get perimeter() {
        return 2 * (this.#width + this.#height);
    }

    get info() {
        return `Прямоугольник ${this.#width}x${this.#height}, площадь: ${this.Area()}, периметр: ${this.perimeter}`;
    }

    Area() {
        return this.#width * this.#height;
    }

    // Задание 4. Статические методы.
    static compare(a, b) {
        return (a.Area() >= b.Area()) ? a : b;
    }

    static isSquare(rect) {
        return rect.#width === rect.#height;
    }

    getCount() {
        return Rectangle.count;
    }
}

const rect1 = new Rectangle(5, 10);
console.log(rect1.info);
const rect2 = new Rectangle(3, 7);
console.log(rect2.info);
const rect3 = new Rectangle(4, 4);
console.log(rect3.info);

console.log("");

console.log('Больший прямоугольник:', Rectangle.compare(rect1, rect2).info);
console.log('rect1 — квадрат?', Rectangle.isSquare(rect1));
console.log('rect3 — квадрат?', Rectangle.isSquare(rect3));
console.log('Количество прямоугольников:', rect1.getCount());