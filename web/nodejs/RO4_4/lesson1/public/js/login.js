const form = document.querySelector('#login-form');
const message = document.querySelector('#auth-message');
form.addEventListener('submit', async event => {
    event.preventDefault();
    try {
        const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.elements.email.value, password: form.elements.password.value }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message);
        message.textContent = `Здравствуйте, ${data.user.name}!`;
        form.elements.password.value = '';
    } catch (error) { message.textContent = `Ошибка: ${error.message}`; }
});
