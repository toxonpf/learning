// ЛР-20: Перенаправления, HTTPS и современные версии HTTP

import https from 'https';
import http from 'http';

// 1. Перенаправления (3xx) — отследить редирект через http.get
function checkRedirect(url) {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, { maxRedirects: 0 }, (res) => {
            resolve({
                url,
                status: res.statusCode,
                statusMessage: res.statusMessage,
                location: res.headers['location'] || '—'
            });
        });
        req.on('error', (err) => resolve({ url, error: err.message }));
        req.end();
    });
}

async function task1() {
    console.log('1. Перенаправления (3xx):');
    const urls = [
        'http://hexlet.io',
        'http://github.com',
        'http://yandex.kz/',
        'http://youtube.com'
    ];
    for (const url of urls) {
        const r = await checkRedirect(url);
        if (r.error) {
            console.log(` ${r.url} → Ошибка: ${r.error}`);
        } else {
            console.log(` ${r.url}`);
            console.log(`   Статус: ${r.status} — ${r.statusMessage}`);
            console.log(`   Location: ${r.location}`);
        }
    }
    console.log('\nПояснение: 301 — постоянный редирект (http → https).');
    console.log('Браузер автоматически переходит по заголовку Location.');
}

// 2. HTTPS и сертификаты — получить данные сертификата
function getCertInfo(hostname) {
    return new Promise((resolve) => {
        const options = { host: hostname, port: 443, method: 'GET', path: '/' };
        const req = https.request(options, (res) => {
            const cert = res.socket.getPeerCertificate();
            resolve({
                hostname,
                issuer: cert.issuer ? (cert.issuer.O || cert.issuer.CN) : '—',
                subject: cert.subject ? cert.subject.CN : '—',
                validFrom: cert.valid_from,
                validTo: cert.valid_to
            });
        });
        req.on('error', (err) => resolve({ hostname, error: err.message }));
        req.end();
    });
}

async function task2() {
    console.log('\n2. HTTPS и сертификаты:');
    const sites = ['hexlet.io', 'yandex.kz'];
    for (const site of sites) {
        const info = await getCertInfo(site);
        if (info.error) {
            console.log(` ${site} → Ошибка: ${info.error}`);
        } else {
            console.log(` ${info.hostname}:`);
            console.log(`   Выдан: ${info.issuer}`);
            console.log(`   Домен: ${info.subject}`);
            console.log(`   Действует: ${info.validFrom} — ${info.validTo}`);
        }
    }
    console.log('\nПояснение по badssl.com:');
    console.log(' self-signed.badssl.com — сертификат не выдан доверенным CA → браузер не доверяет');
    console.log(' expired.badssl.com — срок действия сертификата истёк → небезопасное соединение');
}

// 3. HTTP версия — определить протокол через заголовки ответа
async function task3() {
    console.log('\n3. HTTP/1.1 vs HTTP/2 vs HTTP/3:');
    try {
        const res = await fetch('https://httpbin.org/get');
        console.log(' Запрос к httpbin.org выполнен, статус:', res.status);
        console.log(' Для просмотра протокола: DevTools → Network → колонка Protocol');
        console.log(' h2 = HTTP/2, h3 = HTTP/3, http/1.1 = HTTP/1.1');
    } catch (err) {
        console.log(' Ошибка:', err.message);
    }
}

(async () => {
    await task1();
    await task2();
    await task3();
})();
