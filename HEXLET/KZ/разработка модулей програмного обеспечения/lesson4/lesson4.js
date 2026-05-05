// 1. Функция-конструктор Animal с методом speak в прототипе.
function Animal(species) {
    this.species = species;
}

Animal.prototype.speak = function() {
    console.log(`The ${this.species} makes a sound.`);
};

const cat = new Animal('cat');
cat.speak();

const dog = new Animal('dog');
dog.speak();

console.log('cat:', cat);
console.log('dog:', dog);

console.log("\n");


// 2. Прототипное наследование: Vehicle в Car, переопределение метода start.
function Vehicle(brand) {
    this.brand = brand;
}

Vehicle.prototype.start = function() {
    console.log(`The ${this.brand} vehicle is starting.`);
};

function Car(brand, model) {
    Vehicle.call(this, brand);
    this.model = model;
}

Car.prototype = Object.create(Vehicle.prototype);
Car.prototype.constructor = Car;

Car.prototype.start = function() {
    console.log(`The ${this.brand} car model ${this.model} is starting.`);
};