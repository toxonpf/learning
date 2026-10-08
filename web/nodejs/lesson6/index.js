const fs = require('fs').promises;
const path = require('path');

const booksFile = path.join(__dirname, 'books.json');

// Задание 1:
async function createFile() {
    try {
        await fs.access(booksFile);
    } catch (err) {
        await fs.writeFile(booksFile, '[]', 'utf-8');
        console.log('Файл books.json создан');
    }
}

async function readBooks() {
    try {
        let content = await fs.readFile(booksFile, 'utf-8');
        return JSON.parse(content);
    } catch (err) { console.log(err) }
}

async function writeBooks(books) {
    try {
        await fs.writeFile(
            booksFile,
            JSON.stringify(books, null, 2),
            'utf-8'
        );
    } catch (err) { console.log(err) }
}

// Задание 2:
async function addBook(title, author, year) {
    try {
        let books = await readBooks();
        let id = books.length + 1;

        books.push({
            id: id,
            title: title,
            author: author,
            year: year,
            isIssued: false
        });

        await writeBooks(books);
        console.log(`Книга ${title} добавлена`);
    } catch (err) { console.log(err) }
}

// Задание 3:
async function findBooksByAuthor(author) {
    try {
        let books = await readBooks();
        let found = books.filter((book) => book.author == author);
        console.log(found);
    } catch (err) { console.log(err) }
}

// Задание 4:
async function issueBook(id) {
    try {
        let books = await readBooks();
        let book = books.find((book) => book.id == id);

        if (book) {
            book.isIssued = true;
            await writeBooks(books);
            console.log(`Книга ${book.title} выдана`);
        } else {
            console.log('Книга не найдена');
        }
    } catch (err) { console.log(err) }
}

// Задание 5:
async function deleteOldBooks(currentYear) {
    try {
        let books = await readBooks();
        let newBooks = books.filter((book) => currentYear - book.year <= 50);
        await writeBooks(newBooks);
        console.log(`Удалено книг: ${books.length - newBooks.length}`);
    } catch (err) { console.log(err) }
}

async function start() {
    await createFile();

    console.log('\n Задание 2:');
    await addBook('Мастер и Маргарита', 'Михаил Булгаков', 1967);
    await addBook('Преступление и наказание', 'Фёдор Достоевский', 1866);
    await addBook('Собачье сердце', 'Михаил Булгаков', 1925);

    console.log('\n Задание 3:');
    await findBooksByAuthor('Михаил Булгаков');

    console.log('\n Задание 4:');
    await issueBook(1);

    console.log('\n Задание 5:');
    await deleteOldBooks(2026);
}
start();
