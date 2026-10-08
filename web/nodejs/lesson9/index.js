require('dotenv').config();

const events = require('./events');
const { checkTransfer } = require('./monitor');

// Задание 1:
let limit = Number(process.env.LIMIT);

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
    let sum = Math.floor(Math.random() * 100000) + 1;
    checkTransfer(sum, limit);
}

console.log('Мониторинг переводов запущен');
transfer();
setInterval(transfer, 3000);