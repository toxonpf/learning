let currentProducts = [];

document.addEventListener("DOMContentLoaded", async () => {
    await setupCategoryFilter();
    await renderCatalog();
    setupSearch();
    setupSort();
});

async function renderCatalog(category = null) {
    const container = document.getElementById("catalog");
    container.innerHTML = '<p class="loading-text">Загрузка товаров...</p>';

    const raw = category ? await getProductsByCategory(category) : await getProducts();
    currentProducts = raw.map(p => new Product(p.id, p.title, p.price, p.description, p.image, p.category));
    renderProducts();
}

function renderProducts() {
    const container = document.getElementById("catalog");
    const sorted = sortProducts(currentProducts);
    container.innerHTML = sorted.map(p => p.renderCard()).join('');
    applySearchFilter();
}

function sortProducts(products) {
    const sort = document.getElementById("sort-select")?.value;
    if (!sort) return products;
    const sorted = [...products];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "name-asc") sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "name-desc") sorted.sort((a, b) => b.title.localeCompare(a.title));
    return sorted;
}

function setupSort() {
    const sortSelect = document.getElementById("sort-select");
    if (!sortSelect) return;
    sortSelect.addEventListener("change", renderProducts);
}

function applySearchFilter() {
    const searchInput = document.getElementById("search-input");
    if (!searchInput || !searchInput.value.trim()) return;
    const query = searchInput.value.toLowerCase().trim();
    document.querySelectorAll(".card").forEach(card => {
        const title = card.querySelector(".card-title").textContent.toLowerCase();
        card.style.display = title.includes(query) ? "" : "none";
    });
}

async function setupCategoryFilter() {
    const filterContainer = document.getElementById("category-filter");
    if (!filterContainer) return;

    const categories = await getCategories();

    filterContainer.innerHTML = `
        <button class="filter-btn active" data-category="">Все</button>
        ${categories.map(cat => `<button class="filter-btn" data-category="${cat}">${cat}</button>`).join('')}
    `;

    filterContainer.addEventListener("click", async (e) => {
        if (!e.target.classList.contains("filter-btn")) return;

        document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
        e.target.classList.add("active");

        const searchInput = document.getElementById("search-input");
        if (searchInput) searchInput.value = "";

        const category = e.target.dataset.category;
        await renderCatalog(category || null);
    });
}

function setupSearch() {
    const searchInput = document.getElementById("search-input");
    if (!searchInput) return;

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase().trim();
        document.querySelectorAll(".card").forEach(card => {
            const title = card.querySelector(".card-title").textContent.toLowerCase();
            card.style.display = title.includes(query) ? "" : "none";
        });
    });
}
