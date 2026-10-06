const path = require('path');

console.log('\n Задание 5:');
let file = path.join(__dirname, '..', 'config', 'app.json');
console.log(path.basename(file), path.extname(file));