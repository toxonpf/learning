const fs = require('fs');
const path = require('path');

console.log('\n Задание 1:');
try{
    fs.mkdirSync(path.join(__dirname, 'data'))
    fs.writeFileSync(path.join(__dirname, 'data', 'inventory.txt'), 'Название товара: Количество', 'utf8')
}catch(err){
    console.log(err);
}