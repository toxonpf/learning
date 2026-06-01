// ЛР-19: Cookie. Вариант 1

// Задание 2: Установка, чтение и удаление куки через document.cookie с RegExp

function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name) {
    const regex = new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)');
    const match = document.cookie.match(regex);
    return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

function refreshCookieDisplay() {
    const nameInput = document.getElementById('cookie-name').value.trim() || 'user';
    document.getElementById('all-cookies').textContent = document.cookie || '(нет кук)';
    const val = getCookie(nameInput);
    document.getElementById('found-cookie').textContent = val !== null
        ? `Куки "${nameInput}" = "${val}"`
        : `Куки "${nameInput}" не найдена`;
}

document.getElementById('set-cookie-btn').addEventListener('click', function () {
    const name = document.getElementById('cookie-name').value.trim();
    const value = document.getElementById('cookie-value').value.trim();
    if (!name) return;
    setCookie(name, value, 1);
    refreshCookieDisplay();
});

document.getElementById('get-cookie-btn').addEventListener('click', refreshCookieDisplay);

document.getElementById('del-cookie-btn').addEventListener('click', function () {
    const name = document.getElementById('cookie-name').value.trim();
    if (!name) return;
    deleteCookie(name);
    refreshCookieDisplay();
});

// Задание 5: Fetch-запросы к API + счётчик запросов в куки

function incrementCounter() {
    const count = parseInt(getCookie('requestCount') || '0') + 1;
    setCookie('requestCount', String(count), 7);
    document.getElementById('request-counter').textContent = `Всего запросов: ${count}`;
}

function updateCookiesAfter() {
    document.getElementById('cookies-after').textContent = document.cookie || '(нет кук)';
}

document.getElementById('fetch-joke-btn').addEventListener('click', function () {
    document.getElementById('api-result').textContent = 'Загрузка...';
    fetch('https://v2.jokeapi.dev/joke/Any?type=single')
        .then(res => res.json())
        .then(data => {
            document.getElementById('api-result').textContent = JSON.stringify(data, null, 2);
            incrementCounter();
            updateCookiesAfter();
        })
        .catch(err => {
            document.getElementById('api-result').textContent = 'Ошибка: ' + err.message;
        });
});

document.getElementById('fetch-dog-btn').addEventListener('click', function () {
    document.getElementById('api-result').textContent = 'Загрузка...';
    fetch('https://dog.ceo/api/breeds/image/random')
        .then(res => res.json())
        .then(data => {
            document.getElementById('api-result').textContent = JSON.stringify(data, null, 2);
            incrementCounter();
            updateCookiesAfter();
        })
        .catch(err => {
            document.getElementById('api-result').textContent = 'Ошибка: ' + err.message;
        });
});

// Показать текущие куки при загрузке страницы
refreshCookieDisplay();
document.getElementById('request-counter').textContent =
    'Всего запросов: ' + (getCookie('requestCount') || '0');
