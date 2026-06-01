document.addEventListener("DOMContentLoaded", () => {
    setupForms();
    setupTabs();
});

function setupForms() {
    document.getElementById("login-form").innerHTML = `
        <h2>Вход</h2>
        <div id="login-error" class="form-error" style="display:none;"></div>
        <label>Email<input type="email" id="login-email" placeholder="example@mail.com"></label>
        <label>Пароль<input type="password" id="login-password" placeholder="Введите пароль"></label>
        <button type="button" id="btn-login">Войти</button>
    `;

    document.getElementById("register-form").innerHTML = `
        <h2>Регистрация</h2>
        <div id="register-error" class="form-error" style="display:none;"></div>
        <label>Имя<input type="text" id="reg-name" placeholder="Ваше имя"></label>
        <label>Email<input type="email" id="reg-email" placeholder="example@mail.com"></label>
        <label>Пароль (мин. 6 символов)<input type="password" id="reg-password" placeholder="Придумайте пароль"></label>
        <button type="button" id="btn-register">Зарегистрироваться</button>
    `;

    document.getElementById("btn-login").addEventListener("click", handleLogin);
    document.getElementById("btn-register").addEventListener("click", handleRegister);
}

function setupTabs() {
    const showLogin = document.getElementById("show-login");
    const showRegister = document.getElementById("show-register");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    showLogin.addEventListener("click", () => {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
        showLogin.classList.add("active");
        showRegister.classList.remove("active");
    });

    showRegister.addEventListener("click", () => {
        registerForm.style.display = "block";
        loginForm.style.display = "none";
        showRegister.classList.add("active");
        showLogin.classList.remove("active");
    });

    showLogin.click();
}

function handleLogin() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        showFormError("login-error", "Заполните все поля");
        return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userData = users.find(u => u.email === email);

    if (!userData) {
        showFormError("login-error", "Пользователь с таким email не найден");
        return;
    }

    const user = new User(userData.name, userData.email, userData.password);
    if (!user.checkPassword(password)) {
        showFormError("login-error", "Неверный пароль");
        return;
    }

    setCurrentUser(user);
    window.location.href = "index.html";
}

function handleRegister() {
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    if (!name || !email || !password) {
        showFormError("register-error", "Заполните все поля");
        return;
    }

    if (password.length < 6) {
        showFormError("register-error", "Пароль должен быть не менее 6 символов");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showFormError("register-error", "Введите корректный email");
        return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.find(u => u.email === email)) {
        showFormError("register-error", "Пользователь с таким email уже зарегистрирован");
        return;
    }

    const user = new User(name, email, password);
    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));
    setCurrentUser(user);
    window.location.href = "index.html";
}

function showFormError(id, message) {
    const el = document.getElementById(id);
    el.textContent = message;
    el.style.display = "block";
}
