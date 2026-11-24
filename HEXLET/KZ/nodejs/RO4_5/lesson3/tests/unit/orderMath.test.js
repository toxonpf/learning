import { describe, test, expect } from '@jest/globals';
import { calculateOrderTotal, canCancelOrder } from '../../services/orderMath.js';
describe('Order math', () => {
    test('several items AAA', () => {
        // Arrange
        const items = [{ price: 10000, quantity: 2 }, { price: 5000, quantity: 1 }];
        // Act
        const total = calculateOrderTotal(items);
        // Assert
        expect(total).toBe(25000);
    });
    test('one item', () => expect(calculateOrderTotal([{ price: 42000, quantity: 3 }])).toBe(126000));
    test('empty array', () => expect(calculateOrderTotal([])).toBe(0));
    test.each([[1, 1000], [100, 100000]])('boundary quantity %i', (quantity, total) =>
        expect(calculateOrderTotal([{ price: 1000, quantity }])).toBe(total));
    test.each([0, 101, -1, 1.5, '1'])('invalid quantity %s', quantity =>
        expect(() => calculateOrderTotal([{ price: 100, quantity }])).toThrow(/quantity/));
    test.each([0, -1, 1.5, '10', NaN])('invalid price %s', price =>
        expect(() => calculateOrderTotal([{ price, quantity: 1 }])).toThrow(RangeError));
    test('input type', () => expect(() => calculateOrderTotal(null)).toThrow(TypeError));
    test.each(['new', 'paid', 'shipped', 'cancelled'])('cancellation %s', status =>
        expect(canCancelOrder(status)).toBe(status === 'new'));
});
