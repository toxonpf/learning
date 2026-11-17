import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { createProductService } from '../../services/productService.js';
describe('Product service with injected repository', () => {
    let repository, service;
    beforeEach(() => {
        repository = { findById: jest.fn(), create: jest.fn(), delete: jest.fn() };
        service = createProductService(repository);
    });
    test('returns a product and passes id once', async () => {
        const product = { id: 15, name: 'Notebook', price: 420000 };
        repository.findById.mockResolvedValue(product);
        await expect(service.getById(15)).resolves.toEqual(product);
        expect(repository.findById).toHaveBeenCalledWith(15);
        expect(repository.findById).toHaveBeenCalledTimes(1);
    });
    test('rejects a missing product', async () => {
        repository.findById.mockResolvedValue(null);
        await expect(service.getById(999)).rejects.toThrow('Product not found');
    });
    test('creates product', async () => {
        const input = { name: 'Mouse', price: 12000, categoryId: 1 };
        repository.create.mockResolvedValue({ id: 20, ...input });
        await expect(service.create(input)).resolves.toEqual({ id: 20, ...input });
        expect(repository.create).toHaveBeenCalledWith(input);
    });
    test.each([0, -1, NaN])('rejects invalid price %s before repository', async price => {
        await expect(service.create({ price })).rejects.toThrow('Invalid product price');
        expect(repository.create).not.toHaveBeenCalled();
    });
    test('deletes existing product', async () => {
        repository.findById.mockResolvedValue({ id: 15 }); repository.delete.mockResolvedValue({ id: 15 });
        await expect(service.delete(15)).resolves.toEqual({ id: 15 });
        expect(repository.delete).toHaveBeenCalledWith(15); expect(repository.delete).toHaveBeenCalledTimes(1);
    });
    test('does not delete missing product', async () => {
        repository.findById.mockResolvedValue(null);
        await expect(service.delete(99)).rejects.toThrow('Product not found');
        expect(repository.delete).not.toHaveBeenCalled();
    });
    test('sequential mock values', async () => {
        repository.findById.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce({ id: 2 });
        expect((await service.getById(1)).id).toBe(1); expect((await service.getById(2)).id).toBe(2);
    });
    test('fresh mock state', () => expect(repository.findById).not.toHaveBeenCalled());
    test('propagates repository failure', async () => {
        repository.findById.mockRejectedValue(new Error('Database unavailable'));
        await expect(service.getById(1)).rejects.toThrow('Database unavailable');
    });
});
