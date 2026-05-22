// ЛР-26: DOM. Структура и навигация. Вариант 1

// Задание 1
function task1() {
    console.log("Задание 1:", document.body.childNodes);

    document.body.childNodes.forEach((node, i) => {
        if (node.nodeType === Node.TEXT_NODE) {
            console.log(`  [${i}] Текстовый узел (перенос строки/пробелы)`);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            console.log(`  [${i}] Элемент: <${node.tagName.toLowerCase()}>`);
        }
    });
}

// Задание 2
function task2() {
    const ul = document.querySelector("#list2");
    console.log("Задание 2 firstElementChild:", ul.firstElementChild);
    console.log("Задание 2 lastElementChild:", ul.lastElementChild);
}

// Задание 3
function task3() {
    const secondP = document.querySelectorAll(".para")[1];
    console.log("Задание 3 previousElementSibling:", secondP.previousElementSibling);
    console.log("Задание 3 nextElementSibling:", secondP.nextElementSibling);
}

// Задание 4
function task4() {
    const p = document.querySelector("#task4 p");
    console.log("Задание 4 parentNode:", p.parentNode);
    console.log("Задание 4 parentElement:", p.parentElement);
    console.log("Задание 4 равны?", p.parentNode === p.parentElement);

    console.log("Задание 4 documentElement.parentNode:", document.documentElement.parentNode);
    console.log("Задание 4 documentElement.parentElement:", document.documentElement.parentElement);
}

// Задание 5
function task5() {
    const ul = document.querySelector("#list5");
    for (const li of ul.children) {
        li.style.border = "1px solid red";
    }
    console.log("Задание 5: рамка добавлена", ul.children.length, "элементам");
}

task1();
task2();
task3();
task4();
task5();