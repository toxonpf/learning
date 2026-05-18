// 1. Глобальный контекст.
function task1() {
    function normal() {
        console.log(this);
    }
    normal();

    function strictMode() {
        "use strict";
        console.log(this);
    }
    strictMode();

    // В браузере `this` в глобальной области всегда равен `window`, а разница между обычным и строгим режимом проявляется только в функциях: в обычном `this = window`, в строгом — `undefined`.
}

// 2. Метод объекта.
function task2() {
    const user = {
        name: "John",
        sayName() {
            console.log(this.name);
        }
    }
    user.sayName();
}

//3. Потеря контекста.
function task3() {
    const user = {
        name: "John",
        sayName() {
            console.log(this.name);
        }
    }

    const method = user.sayName;

    console.log(method);
    method();

    // Метод теряет `this`, потому что при сохранении в переменную он вызывается без объекта, и контекст больше не привязан.
}

// 4. Стрелочная функция.
function task4() {
    const user = {
        name: "John",
        sayName: () => {
            console.log(this.name);
        }
    }
    user.sayName();

    // Стрелочные функции не имеют собственного `this`, они наследуют его из окружающего контекста. В данном случае `this` будет указывать на глобальный объект, а не на `user`, поэтому `this.name` будет `undefined`.
}

// 5. Использование bind.
function task5() {
    const user = {
        name: "John",
        sayName() {
            console.log(this.name);
        }
    }

    const method = user.sayName.bind(user);
    method();
}