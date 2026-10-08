const path = require('path');

console.log('\n Задание 1:');
console.log(__dirname);
console.log(__filename);
console.log(path.basename(__filename));
console.log(path.extname(__filename));
console.log(path.basename(__dirname));


console.log('\n Задание 2:');
console.log(path.join(__dirname, "data", "index.txt"));
console.log(path.parse(path.join(__dirname, "data", "index.txt")));

console.log('\n Задание 3:');
console.log(path.join(__dirname, "files", toString(process.argv[2])));

console.log('\n Задание 4:');
let files = ['photo.jpg', 'document.pdf', 'music.mp3', 'script.js'];
files.forEach(el => {
    console.log(path.extname(path.join(__dirname, "uploads", el)));
    console.log(path.join(__dirname, "uploads", el));
});
