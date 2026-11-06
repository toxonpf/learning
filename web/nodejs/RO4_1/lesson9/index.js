const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const events = require('./events');
const { checkTransfer } = require('./monitor');

// Задание 1:
let limit = Number(process.env.LIMIT);
const intervalMs = Number(process.env.INTERVAL_MS || 3000);
const maxAmount = Number(process.env.MAX_AMOUNT || 100000);
if (!Number.isFinite(limit) || limit <= 0 || !Number.isSafeInteger(intervalMs) || intervalMs <= 0 || !Number.isSafeInteger(maxAmount) || maxAmount <= 0) {
    console.error('Задайте положительный LIMIT и корректные INTERVAL_MS/MAX_AMOUNT в .env (образец: .env.example)');
    process.exit(1);
}

console.log(`Лимит перевода: ${limit}`);

// Задание 2:
events.on('transfer', (amount) => {
    console.log(`Успешный перевод: ${amount}`);
});

events.on('fraud-alert', (amount) => {
    console.log(`[ALARM] Подозрительная активность: ${amount}!`);
});

// Задание 3:
function transfer() {
    let sum = Math.floor(Math.random() * maxAmount) + 1;
    checkTransfer(sum, limit);
}

console.log('Мониторинг переводов запущен');
transfer();
setInterval(transfer, intervalMs);
