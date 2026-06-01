// ЛР-18: Тело запроса. Вариант 1

// 1. GET с query string — список пользователей (страница 2, limit=5)
// Reqres.in теперь требует API-ключ, используем DummyJSON
async function task1() {
    const res = await fetch('https://dummyjson.com/users?limit=5&skip=5');
    const data = await res.json();
    console.log('1. GET ?limit=5&skip=5 — пользователи (страница 2):');
    console.log('Всего:', data.total, '| Показано:', data.limit);
    data.users.forEach(u => console.log(` id=${u.id} ${u.firstName} ${u.lastName}`));
}

// 2. GET с параметрами — почасовая температура в Берлине (Open Meteo)
async function task2() {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=temperature_2m';
    const res = await fetch(url);
    const data = await res.json();
    console.log('\n2. GET погода Берлин — первые 5 значений:');
    for (let i = 0; i < 5; i++) {
        console.log(` ${data.hourly.time[i]}: ${data.hourly.temperature_2m[i]}°C`);
    }
}

// 3. POST с x-www-form-urlencoded
async function task3() {
    const body = new URLSearchParams({ username: 'neo', password: 'trinity' });
    const res = await fetch('https://httpbin.org/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
    });
    const data = await res.json();
    console.log('\n3. POST x-www-form-urlencoded — раздел form:');
    console.log(data.form);
}

// 4. POST с JSON
async function task4() {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Matrix', body: 'There is no spoon', userId: 1 })
    });
    const data = await res.json();
    console.log('\n4. POST JSON — созданный объект:');
    console.log(data);
}

// 5. GET — случайная собака (Dog API)
async function task5() {
    const res = await fetch('https://dog.ceo/api/breeds/image/random');
    const data = await res.json();
    console.log('\n5. GET Dog API — поле message:');
    console.log(data.message);
}

// 6. POST с multipart/form-data
async function task6() {
    const formData = new FormData();
    const blob = new Blob(['Hello from JS!'], { type: 'text/plain' });
    formData.append('file', blob, 'test.txt');

    const res = await fetch('https://httpbin.org/post', {
        method: 'POST',
        body: formData
    });
    const data = await res.json();
    console.log('\n6. POST multipart/form-data — раздел files:');
    console.log(data.files);
}

(async () => {
    try {
        await task1();
        await task2();
        await task3();
        await task4();
        await task5();
        await task6();
    } catch (err) {
        console.error('Ошибка:', err.message);
    }
})();
