// 1. Обработка исключений.
console.log("1. Обработка исключений.");

function calculateSquareRoot(number) {
  try {
    if (typeof number !== "number") {
      throw new Error("Переданное значение не является числом");
    }

    if (number < 0) {
      throw new Error("Нельзя вычислить корень из отрицательного числа");
    }

    console.log("Квадратный корень:", Math.sqrt(number));
  } catch (error) {
    console.log("Ошибка:", error.message);
  } finally {
    console.log("Операция завершена");
  }
}

calculateSquareRoot(25);
calculateSquareRoot(-9);
calculateSquareRoot("text");

console.log("\n");


// 2. Паттерн "Фабрика".
console.log("2. Паттерн Фабрика.");

class Circle {
  constructor(radius) {
    this.radius = radius;
  }
}

class Square {
  constructor(side) {
    this.side = side;
  }
}

class ShapeFactory {
  static createShape(type, size) {
    if (type === "circle") {
      return new Circle(size);
    }

    if (type === "square") {
      return new Square(size);
    }

    throw new Error("Неизвестный тип фигуры");
  }
}

console.log("\n");


// 3. Применение паттерна и исключений.
console.log("3. Применение паттерна и исключений.");

try {
  const circle = ShapeFactory.createShape("circle", 5);
  const square = ShapeFactory.createShape("square", 10);

  console.log("Круг:", circle);
  console.log("Квадрат:", square);

  const triangle = ShapeFactory.createShape("triangle", 7);
  console.log("Треугольник:", triangle);
} catch (error) {
  console.log("Ошибка:", error.message);
}