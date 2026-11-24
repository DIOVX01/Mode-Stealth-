import test from 'node:test';
import assert from 'node:assert/strict';
import { dayKey, addDays, daysBetween } from '../js/day.js';
test('dayKey before 4am belongs to previous day', () => assert.equal(dayKey(new Date(2026, 10, 25, 3, 59)), '2026-11-24'));
test('dayKey at 4am is the same day', () => assert.equal(dayKey(new Date(2026, 10, 25, 4, 0)), '2026-11-25'));
test('addDays crosses month and year', () => { assert.equal(addDays('2026-11-30', 1), '2026-12-01'); assert.equal(addDays('2026-12-31', 1), '2027-01-01'); });
test('daysBetween', () => assert.equal(daysBetween('2026-11-25', '2026-12-02'), 7));
