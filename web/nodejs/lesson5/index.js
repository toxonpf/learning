const fs = require('fs').promises;
const path = require('path');

// Задание 1:
async function setup() {
    fs.mkdir(path.join('storage'), { recursive: true }, (err) => {
        if (err) console.log(err);
        return;
    });
    fs.writeFile(path.join('storage', 'status.txt'), 'Система готова', 'utf-8')
}
setup();

// Задание 2:
async function readUpper() {
    fs.readFile(path.join())
}