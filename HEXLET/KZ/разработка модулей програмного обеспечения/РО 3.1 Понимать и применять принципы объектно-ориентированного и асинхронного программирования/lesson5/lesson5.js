// Задание 1.
// Задание 2.
// Задание 3.
class Car {
    constructor(brand, model, year, speed) {
        this.brand = brand;
        this.model = model;
        this.year = year;
        this.speed = speed;
    }

    getInfo() {
        return `Car: ${this.brand} ${this.model}, Year: ${this.year}`;
    }

    accelerate(n) {
        this.speed += n;
    }

    brake(n) {
        this.speed = Math.max(0, this.speed - n);
    }
}

console.log("\n Car Information:");
const car1 = new Car('Changan', 'CS55', 2020, 50);
console.log(car1);
console.log(car1.getInfo());

const car2 = new Car('Toyota', 'Camry', 2021, 70);
console.log(car2);
console.log(car2.getInfo());

console.log("\n Car Speed:");
car1.accelerate(50);
console.log(car1.speed);
car1.brake(30);
console.log(car1.speed);
car1.brake(100);
console.log(car1.speed);

// Задание 4.
// Задание 5.
class Garage {
    constructor(owner) {
        this.owner = owner;
        this.cars = [];
    }

    addCar(car) {
        this.cars.push(car);
    }

    showCars() {
        this.cars.forEach(car => {
            console.log(car.getInfo());
        });
    }

    findByBrand(brand) {
        return this.cars.filter(car => car.brand === brand);
    }
}

const garage = new Garage('Alice');
garage.addCar(car1);
garage.addCar(car2);
garage.addCar(car2);

console.log("\n Garage Cars:");
garage.showCars();

const toyotaCars = garage.findByBrand('Toyota');
console.log('\nToyota cars:');
toyotaCars.forEach(car => console.log(car.getInfo()));