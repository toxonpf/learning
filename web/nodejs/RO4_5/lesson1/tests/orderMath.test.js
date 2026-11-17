import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderTotal, canCancelOrder } from '../services/orderMath.js';
test('calculates several positions using Arrange Act Assert', () => {
    // Arrange
    const items = [{ price: 10000, quantity: 2 }, { price: 5000, quantity: 1 }];
    // Act
    const total = calculateOrderTotal(items);
    // Assert
    assert.strictEqual(total, 25000);
});
test('one item', () => assert.strictEqual(calculateOrderTotal([{ price: 42000, quantity: 3 }]), 126000));
test('empty array', () => assert.strictEqual(calculateOrderTotal([]), 0));
for (const q of [1, 100]) test(`boundary quantity ${q}`, () =>
    assert.strictEqual(calculateOrderTotal([{ price: 1000, quantity: q }]), q * 1000));
test('two positions with quantity 100', () => assert.strictEqual(calculateOrderTotal([
    { price: 1000, quantity: 100 }, { price: 2000, quantity: 100 }]), 300000));
for (const q of [0, 101, -1, 1.5, '1']) test(`invalid quantity ${q}`, () =>
    assert.throws(() => calculateOrderTotal([{ price: 1, quantity: q }]), /quantity/));
for (const price of [0, -1, 1.5, '100', NaN]) test(`invalid price ${price}`, () =>
    assert.throws(() => calculateOrderTotal([{ price, quantity: 1 }]), /price/));
test('non-array input', () => assert.throws(() => calculateOrderTotal(null), TypeError));
test('minimum price', () => assert.strictEqual(calculateOrderTotal([{ price: 1, quantity: 1 }]), 1));
test('overflow', () => assert.throws(() => calculateOrderTotal([{ price: Number.MAX_SAFE_INTEGER, quantity: 2 }]), /safe/));
for (const status of ['new', 'paid', 'shipped', 'cancelled']) test(`cancellation ${status}`, () =>
    assert.strictEqual(canCancelOrder(status), status === 'new'));
