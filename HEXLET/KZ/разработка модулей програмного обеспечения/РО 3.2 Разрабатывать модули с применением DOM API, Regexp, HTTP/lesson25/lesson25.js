// ЛР-25: JavaScript в браузере. Вариант 1

// Задание 2
function task2() {
    console.log("Задание 2 location.href:", location.href);
    console.log("Задание 2 navigator.userAgent:", navigator.userAgent);
    console.log("Задание 2 history.length:", history.length);
}

// Задание 3
function task3() {
    const container = document.getElementById("container");
    console.log("Задание 3 container:", container);
    console.log("Задание 3 container.childNodes:", container.childNodes);
}

// Задание 4
function task4() {
    const container = document.getElementById("container");
    console.log("Задание 4 childNodes:", container.childNodes);
    console.log("Задание 4 children:", container.children);
    console.log("Задание 4 children.length:", container.children.length, "— только <p>");
    console.log("Задание 4 childNodes.length:", container.childNodes.length, "— текст, элемент, комментарий");
}

// Задание 5
function task5() {
    console.log("Задание 5: выбери <div id='container'> в панели Elements");
    console.log("  $0.childNodes — все узлы (текст, элемент, комментарий)");
    console.log("  $0.children   — только дочерние теги");
}

// Задание 6
function task6() {
    console.dir(document);
    console.log("Задание 6 document.URL:", document.URL);
    console.log("Задание 6 document.title:", document.title);
    console.log("Задание 6 document.body:", document.body);
    document.title = "Новый заголовок";
    console.log("Задание 6 title изменён на:", document.title);
}

// Задание 7
function task7() {
    console.dir(window);
    console.dir(document);
    // window — глобальный объект браузера: содержит alert, location, history, document и др.
    // document — объект текущей страницы (DOM): содержит URL, title, body, querySelector и др.
    // document доступен через window.document, т.к. document — свойство объекта window
    // document.alert("test") → TypeError: document.alert is not a function (alert принадлежит window)
}

task2();
task3();
task4();
task5();
task6();
task7();