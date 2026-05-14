// ЛР-12: Промисы. Вариант 1

function loadData() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.5) {
                resolve({ data: "Данные загружены" });
            } else {
                reject(new Error("Ошибка загрузки"));
            }
        }, 3000);
    });
}

console.log("Загрузка данных...");

loadData()
    .then(result => {
        console.log("Успех:", result.data);
        return result.data + " — обработано";
    })
    .then(processed => console.log("Обработано:", processed))
    .catch(error => console.error("Ошибка:", error.message))
    .finally(() => console.log("Операция завершена"));
