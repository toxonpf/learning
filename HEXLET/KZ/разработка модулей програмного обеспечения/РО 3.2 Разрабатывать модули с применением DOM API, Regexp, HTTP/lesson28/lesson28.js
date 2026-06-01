// ЛР-28: Манипуляции с DOM. Вариант 1

// Задание 1
function task1() {
    document.getElementById('add-note-btn').addEventListener('click', function () {
        const input = document.getElementById('note-input');
        const text = input.value.trim();
        if (!text) return;

        const li = document.createElement('li');
        li.className = 'item';
        li.textContent = text + ' ';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.textContent = 'Удалить';
        deleteBtn.addEventListener('click', function () { li.remove(); });
        li.appendChild(deleteBtn);

        document.getElementById('notes-list').append(li);
        input.value = '';
    });
}

// Задание 2
function task2() {
    document.getElementById('add-image-btn').addEventListener('click', function () {
        const title = document.getElementById('image-title').value.trim() || 'Без названия';
        const url = document.getElementById('image-url').value.trim() || 'https://via.placeholder.com/150';

        const card = document.createElement('div');
        card.className = 'card';

        const h4 = document.createElement('h4');
        h4.textContent = title;

        const img = document.createElement('img');
        img.src = url;
        img.alt = title;
        img.style.width = '100%';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.textContent = 'Удалить';
        deleteBtn.addEventListener('click', function () { card.remove(); });

        card.appendChild(h4);
        card.appendChild(img);
        card.appendChild(deleteBtn);

        document.getElementById('image-gallery').prepend(card);
        document.getElementById('image-title').value = '';
    });

    document.querySelector('#image-gallery .btn-danger').addEventListener('click', function () {
        this.closest('.card').remove();
    });
}

// Задание 3
function task3() {
    const existingComment = document.querySelector('#comments-container .item');
    existingComment.querySelector('.btn-warning').addEventListener('click', function () {
        document.getElementById('comments-container').prepend(existingComment);
    });

    document.getElementById('add-comment-btn').addEventListener('click', function () {
        const author = document.getElementById('author-input').value.trim() || 'Аноним';
        const text = document.getElementById('comment-text').value.trim();
        if (!text) return;

        const div = document.createElement('div');
        div.className = 'item';

        const strong = document.createElement('strong');
        strong.textContent = author + ':';
        div.appendChild(strong);
        div.appendChild(document.createTextNode(' ' + text + ' '));

        const moveUpBtn = document.createElement('button');
        moveUpBtn.className = 'btn btn-warning';
        moveUpBtn.textContent = 'Переместить вверх';
        moveUpBtn.addEventListener('click', function () {
            document.getElementById('comments-container').prepend(div);
        });

        const duplicateBtn = document.createElement('button');
        duplicateBtn.className = 'btn btn-success';
        duplicateBtn.textContent = 'Дублировать';
        duplicateBtn.addEventListener('click', function () {
            const clone = div.cloneNode(true);
            div.after(clone);
        });

        div.appendChild(moveUpBtn);
        div.appendChild(duplicateBtn);

        const firstComment = document.querySelector('#comments-container .item');
        firstComment.after(div);

        document.getElementById('author-input').value = '';
        document.getElementById('comment-text').value = '';
    });
}

// Задание 4
function task4() {
    document.querySelectorAll('#notes-list .item').forEach(function (li) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.textContent = 'Удалить';
        deleteBtn.addEventListener('click', function () { li.remove(); });
        li.appendChild(deleteBtn);
    });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn-danger';
    clearBtn.textContent = 'Очистить все заметки';
    clearBtn.addEventListener('click', function () {
        document.getElementById('notes-list').innerHTML = '';
    });
    document.getElementById('notes-section').querySelector('div').appendChild(clearBtn);

    document.querySelectorAll('#comments-container .item').forEach(function (div) {
        const moveToEndBtn = document.createElement('button');
        moveToEndBtn.className = 'btn';
        moveToEndBtn.textContent = 'В конец';
        moveToEndBtn.addEventListener('click', function () {
            document.getElementById('comments-container').append(div);
        });
        div.appendChild(moveToEndBtn);
    });
}

// Задание 5
function task5() {
    document.querySelector('#comments-container .btn-success').addEventListener('click', function () {
        const original = this.closest('.item');
        const clone = original.cloneNode(true);
        original.after(clone);
    });

    document.querySelectorAll('#image-gallery .card').forEach(function (card) {
        const duplicateBtn = document.createElement('button');
        duplicateBtn.className = 'btn btn-success';
        duplicateBtn.textContent = 'Дублировать';
        duplicateBtn.addEventListener('click', function () {
            const clone = card.cloneNode(true);
            clone.querySelector('h4').textContent += ' (копия)';
            card.after(clone);
        });
        card.appendChild(duplicateBtn);
    });
}

// Задание 6
function task6() {
    const types = ['info', 'warning', 'error'];
    const messages = {
        info: 'Данные успешно загружены',
        warning: 'Внимание: срок действия сессии истекает',
        error: 'Ошибка подключения к серверу'
    };
    const styles = {
        info:    { background: '#d4edda', border: '#c3e6cb', color: '#155724' },
        warning: { background: '#fff3cd', border: '#ffeeba', color: '#856404' },
        error:   { background: '#f8d7da', border: '#f5c6cb', color: '#721c24' }
    };

    document.getElementById('create-notification').addEventListener('click', function () {
        const type = types[Math.floor(Math.random() * types.length)];
        const st = styles[type];

        const div = document.createElement('div');
        div.className = 'notification';
        div.style.background = st.background;
        div.style.border = '1px solid ' + st.border;
        div.style.color = st.color;

        const span = document.createElement('span');
        span.textContent = '[' + type.toUpperCase() + '] ' + messages[type];

        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn';
        closeBtn.textContent = 'Закрыть';
        closeBtn.addEventListener('click', function () { div.remove(); });

        div.appendChild(span);
        div.appendChild(closeBtn);

        document.getElementById('notifications-container').prepend(div);
        setTimeout(function () { div.remove(); }, 5000);
    });
}

task1();
task2();
task3();
task4();
task5();
task6();