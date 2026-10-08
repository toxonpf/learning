let count = 1;

let interval = setInterval(() => {
    console.log(count++);
    if (count > 5) process.exit();
}, 1000);