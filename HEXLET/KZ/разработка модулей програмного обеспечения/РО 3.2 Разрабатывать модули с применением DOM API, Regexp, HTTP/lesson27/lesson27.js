// ЛР-27: Поиск элементов и работа с коллекциями. Вариант 1

// Задание 1
function task1() {
    const mainTitle = document.getElementById('main-title');
    mainTitle.textContent = 'Лабораторная работа';

    const textItems = document.getElementsByClassName('text-item');
    console.log('Задание 1 количество .text-item:', textItems.length);

    const listItems = document.getElementsByTagName('li');
    if (listItems.length > 0) {
        listItems[0].style.color = 'blue';
    }
}

// Задание 2
function task2() {
    const firstBtn = document.querySelector('.btn');
    firstBtn.classList.add('highlight');

    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        console.log('Задание 2 заголовок товара:', card.querySelector('h3').textContent);
    });

    const activeInContent = document.querySelector('.content-block .active');
    activeInContent.textContent = 'Активный элемент';
}

// Задание 3
function task3() {
    const paragraphsCollection = document.getElementsByTagName('p');
    const paragraphsArray = Array.from(paragraphsCollection);
    paragraphsArray.forEach((p, index) => {
        p.textContent = `${index + 1}. ${p.textContent}`;
    });
}

// Задание 4
function task4() {
    const highPriorityItems = document.querySelectorAll('[data-priority="high"]');
    highPriorityItems.forEach(item => item.classList.add('highlight'));

    const saveBtn = document.querySelector('[data-action="save"]');
    saveBtn.textContent = 'Сохранено!';

    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        console.log('Задание 4 data-id:', card.dataset.id);
    });
}

// Задание 5
function task5() {
    const cards = document.querySelectorAll('.product-card');
    let maxPrice = -Infinity;
    let mostExpensiveCard = null;

    cards.forEach(card => {
        const price = Number(card.dataset.price);
        console.log('Задание 5 data-price:', price);
        if (price > maxPrice) {
            maxPrice = price;
            mostExpensiveCard = card;
        }
    });

    if (mostExpensiveCard) {
        mostExpensiveCard.classList.add('highlight');
    }

    const cardById102 = document.querySelector('.product-card[data-id="102"]');
    cardById102.dataset.status = 'popular';
}

// Задание 6
function filterProducts(minPrice, maxPrice) {
    const allCards = document.querySelectorAll('.product-card');
    let count = 0;

    allCards.forEach(card => {
        const price = Number(card.dataset.price);
        if (price >= minPrice && price <= maxPrice) {
            card.classList.add('active');
            card.classList.remove('hidden');
            count++;
        } else {
            card.classList.add('hidden');
            card.classList.remove('active');
        }
    });

    return count;
}

function task6() {
    const found = filterProducts(1000, 2000);
    console.log('Задание 6 найдено товаров (1000-2000):', found);
}

task1();
task2();
task3();
task4();
task5();
task6();
