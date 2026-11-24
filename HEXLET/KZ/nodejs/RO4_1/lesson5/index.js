const fs = require('fs').promises;
const path = require('path');

// Задание 1: все пути относятся к каталогу лабораторной.
async function setup() {
    try {
        await fs.mkdir(path.join(__dirname, 'storage'), { recursive: true });
        await fs.writeFile(path.join(__dirname, 'storage', 'status.txt'), 'Система готова', 'utf8');
    } catch (error) { throw new Error(`Подготовка хранилища: ${error.message}`); }
}

// Задание 2: отсутствие tasks.txt не завершает программу аварийно.
async function readUpper() {
    try {
        const content = await fs.readFile(path.join(__dirname, 'tasks.txt'), 'utf8');
        console.log(content.toUpperCase());
        return content.toUpperCase();
    } catch (error) {
        if (error.code === 'ENOENT') { console.log('Файл задач не найден'); return null; }
        throw error;
    }
}

// Задание 3: appendFile сохраняет предыдущие записи журнала.
async function addLog(message) {
    try {
        await fs.appendFile(path.join(__dirname, 'storage', 'activity.log'),
            `${new Date().toISOString()} ${message}\n`, 'utf8');
    } catch (error) { throw new Error(`Запись журнала: ${error.message}`); }
}

// Задание 4: оригинал удаляется только после успешной записи копии.
async function makeCopy() {
    try {
        const source = path.join(__dirname, 'source.txt');
        const content = await fs.readFile(source, 'utf8');
        await fs.writeFile(path.join(__dirname, 'copy.txt'), content, 'utf8');
        await fs.unlink(source);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') { console.log('Исходный файл не найден'); return false; }
        throw error;
    }
}

// Задание 5: access необходимо ожидать внутри try, иначе catch не сработает.
async function checkFiles(files = ['copy.txt', 'index.js', 'tasks.txt', 'missing.txt']) {
    const result = await Promise.all(files.map(async file => {
        try {
            await fs.access(path.join(__dirname, file));
            return { file, exists: true };
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
            return { file, exists: false };
        }
    }));
    result.forEach(({ file, exists }) => console.log(`${file}: ${exists ? 'существует' : 'не существует'}`));
    return result;
}

async function start() {
    await setup();
    await readUpper();
    await addLog('Программа запущена');
    await makeCopy();
    await checkFiles();
}

module.exports = { setup, readUpper, addLog, makeCopy, checkFiles };
if (require.main === module) start().catch(error => { console.error(error.message); process.exitCode = 1; });
