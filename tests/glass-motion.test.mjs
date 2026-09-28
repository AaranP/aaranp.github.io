import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceInertia, DragMotion } from '../site/src/lib/glass-motion.ts';

test('a stronger flick throws faster than a slow drag', () => {
  const slow = new DragMotion();
  slow.begin(0, 0, 0);
  slow.move(30, 0, 90);
  const fast = new DragMotion();
  fast.begin(0, 0, 0);
  fast.move(30, 0, 30);
  assert.ok(fast.release(35).y > slow.release(95).y);
});

test('velocity is capped and a stale release has no throw', () => {
  const drag = new DragMotion();
  drag.begin(0, 0, 0);
  drag.move(1000, -1000, 10);
  const capped = drag.release(12);
  assert.ok(Math.abs(Math.hypot(capped.x, capped.y) - 10) < 1e-10);
  assert.ok(capped.x < 0 && capped.y > 0);
  drag.begin(0, 0, 200);
  drag.move(100, 0, 220);
  assert.deepEqual(drag.release(400), { x: 0, y: 0 });
});

test('a long hold does not dilute fresh flick samples', () => {
  const held = new DragMotion();
  held.begin(0, 0, 0);
  held.move(10, 0, 1000);
  held.move(40, 0, 1030);
  const fresh = new DragMotion();
  fresh.begin(10, 0, 1000);
  fresh.move(40, 0, 1030);
  assert.deepEqual(held.release(1035), fresh.release(1035));
});

test('a strong flick coasts beyond a full revolution', () => {
  let velocity = { x: 0, y: 10 };
  let travel = 0;
  for (let i = 0; i < 600; i++) {
    const step = advanceInertia(velocity, 1 / 60);
    velocity = step.velocity;
    travel += step.rotation.y;
  }
  assert.ok(travel >= 2 * Math.PI);
  assert.ok(velocity.y < 0.015);
});

test('cancel clears samples and stops a pending throw', () => {
  const drag = new DragMotion();
  drag.begin(0, 0, 0);
  drag.move(40, 20, 40);
  drag.cancel();
  assert.deepEqual(drag.release(45), { x: 0, y: 0 });
});

test('damping decelerates and is independent of frame duration', () => {
  const initial = { x: 1.4, y: -2.1 };
  const single = advanceInertia(initial, 1);
  let many = { rotation: { x: 0, y: 0 }, velocity: initial };
  let x = 0, y = 0;
  for (let i = 0; i < 60; i++) {
    many = advanceInertia(many.velocity, 1 / 60);
    x += many.rotation.x;
    y += many.rotation.y;
  }
  assert.ok(Math.abs(single.rotation.x - x) < 1e-10);
  assert.ok(Math.abs(single.rotation.y - y) < 1e-10);
  assert.ok(Math.abs(single.velocity.y) < Math.abs(initial.y));
  assert.deepEqual(advanceInertia({ x: 0, y: 0 }, 1).velocity, { x: 0, y: 0 });
});

test('low-speed cutoff and a 100ms frame preserve elapsed-time motion', () => {
  const initial = { x: 0.03, y: 1.2 };
  const single = advanceInertia(initial, 1);
  let velocity = initial;
  let x = 0, y = 0;
  for (let i = 0; i < 10; i++) {
    const step = advanceInertia(velocity, 0.1);
    velocity = step.velocity;
    x += step.rotation.x;
    y += step.rotation.y;
  }
  assert.ok(Math.abs(single.rotation.x - x) < 1e-10);
  assert.ok(Math.abs(single.rotation.y - y) < 1e-10);
  assert.equal(single.velocity.x, 0);
  assert.equal(velocity.x, 0);
});
