const fs = require('fs');
const path = require('path');

console.log('\n Задание 1:');
try {
    fs.mkdirSync(path.join(__dirname, 'data'));
} catch (err) {
    console.log("папка уже создана");
}
try {
    fs.writeFileSync(
        path.join(__dirname, 'data', 'inventory.txt'),
        'Название товара: Количество',
        'utf8'
    );
    console.log("файл создан и записан");
} catch (err) { console.log(err) }

console.log('\n Задание 2:');
const inventoryFile = path.join(__dirname, 'data', 'inventory.txt');
try {
    if (fs.existsSync(inventoryFile) && fs.readFileSync(inventoryFile, 'utf-8') != "") {
        console.log(fs.readFileSync(inventoryFile, 'utf-8'));
    } else {
        console.log('Инвентарь не инициализирован');
    }
} catch (err) { console.log(err) }

console.log('\n Задание 3:');
function append(thing) {
    try {
        fs.writeFileSync(
            path.join(__dirname, 'data', 'inventory.txt'),
            ("\n" + thing),
            { flag: "a" }
        )
    } catch (err) { console.log(err) }

}
append('Монитор: 10');

console.log('\n Задание 4:');
try {
    console.log(`всего файлов: ${fs.readdirSync(path.join(__dirname, 'data')).length}`);
    fs.readdirSync(path.join(__dirname, 'data')).forEach((el) => {
        console.log(el);
    });
} catch (err) { console.log(err) }

console.log('\n Задание 5:');
if (fs.existsSync(path.join(__dirname, 'data', 'temp_log.txt'))) {
    try {
        fs.unlinkSync(path.join(__dirname, 'data', 'temp_log.txt'))
    } catch (err) { console.log(err) }
}
try {
    fs.renameSync(
        path.join(__dirname, 'data', 'inventory.txt'),
        path.join(__dirname, 'data', 'inventory_final.txt'),
    )
} catch (err) { console.log(err) }