let products = [
    {
        "id": 1,
        "name": "Keyboard",
        "price": 15000,
        "category": "Accessories",
        "inStock": true
    },
    {
        "id": 2,
        "name": "Mouse",
        "price": 8000,
        "category": "Accessories",
        "inStock": true
    },
    {
        "id": 3,
        "name": "Monitor",
        "price": 85000,
        "category": "Monitors",
        "inStock": false
    },
    {
        "id": 4,
        "name": "Laptop",
        "price": 420000,
        "category": "Computers",
        "inStock": true
    },
    {
        "id": 5,
        "name": "Webcam",
        "price": 22000,
        "category": "Accessories",
        "inStock": false
    }
];
let nextId = 6;

export function getAllProducts(query = {}) {
    return products.filter(product =>
        (query.category === undefined || product.category === query.category) &&
        (query.inStock === undefined || product.inStock === (query.inStock === 'true')) &&
        (query.minPrice === undefined || product.price >= Number(query.minPrice)) &&
        (query.maxPrice === undefined || product.price <= Number(query.maxPrice))
    );
}
export function findProductById(id) {
    return products.find(product => product.id === id);
}
export function addProduct(data) {
    const product = { ...data, id: nextId++ };
    products.push(product);
    return product;
}
export function updateProductById(id, changes) {
    const product = findProductById(id);
    if (!product) return null;
    Object.assign(product, changes);
    return product;
}
export function deleteProductById(id) {
    const index = products.findIndex(product => product.id === id);
    if (index === -1) return null;
    return products.splice(index, 1)[0];
}
