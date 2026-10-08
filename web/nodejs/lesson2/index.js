const greet = require('./gteet');
const math = require('./math');
const os = require('os');
const validator = require('./validator');
const chalk = require('chalk');

console.log(greet('kirill'));
console.log('\n');

console.log(math.add(1, 2));
console.log(math.subtract(1, 2));
console.log('\n');

console.log(`Платформа: ${os.platform()}`);
console.log(`Имя компьютера: ${os.hostname()}`);
console.log(`Домашняя папка: ${os.homedir()}`);
console.log(`Оперативная память: ${os.totalmem() / 1024 ** 3} ГБ`);
console.log('\n');

console.log(validator.isPositive(4));
console.log(validator.isPositive(-2));
console.log(validator.isEven(4));
console.log(validator.isEven(-2)); 
console.log('\n');

console.log(chalk.green('Программа запущена'));
console.log(chalk.yellow(process.platform));
console.log(chalk.red.bold('Программа завершена'));