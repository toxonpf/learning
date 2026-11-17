export function createProductService(repository) {
    async function getById(id) {
        const product = await repository.findById(id);
        if (!product) throw new Error('Product not found');
        return product;
    }
    return {
        getById,
        async create(data) {
            if (!Number.isSafeInteger(data.price) || data.price <= 0) throw new Error('Invalid product price');
            return repository.create(data);
        },
        async delete(id) { await getById(id); return repository.delete(id); }
    };
}
