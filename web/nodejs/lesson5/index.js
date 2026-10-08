const fs = require('fs').promises;
const path = require('path');

// Задание 1:
async function setup() {
    fs.mkdir(path.join('storage'), { recursive: true }, (err) => {
        if (err) console.log(err);
        return;
    });
    fs.writeFile(path.join('storage', 'status.txt'), 'Система готова', 'utf-8')
} setup();

// Задание 2:
async function readUpper() {
    try {
        let content = await fs.readFile(
            path.join(__dirname, 'tasks.txt'),
            'utf-8'
        );
        console.log(content.toUpperCase());
    } catch (err) { console.log(err) }
} readUpper();

// Задание 3:
async function addLog(message) {
    try {
        await fs.writeFile(
            path.join(__dirname, 'storage', 'activity.log'),
            '\n' + message,
            { flag: "a" },
            'utf-8'
        );
    } catch (err) { console.log(err) }
} addLog("test");

// Задание 4:
async function makeCopy() {
    try {
        let content = await fs.readFile(
            path.join(__dirname, 'source.txt'),
            'utf-8'
        );
        await fs.unlink(path.join(__dirname, 'source.txt'))
        await fs.writeFile(
            path.join(__dirname, 'copy.txt'),
            content,
            'utf-8'
        );
    } catch (err) { console.log(err) }
} makeCopy();

// Задание 5:
async function checkFiles() {
    let filesList = [
        'copy.txt',
        'index.js',
        'tasks.txt'
    ];

    let checked = filesList.map(async (file) => {
        try {
            fs.access(path.join(__dirname, file));

            return {
                file,
                exists: true
            };
        } catch (err) {
            return {
                file,
                exists: false
            };
        }
    });

    const result = await Promise.all(checked);
    result.forEach(({file, exists}) => {
        console.log(`${file}: ${exists ? "существует" : "не существует"}`);
    });
} checkFiles();