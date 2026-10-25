const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PetStateMachine } = require('../pet-state.js');
function setup() {
  let now = 0, nextId = 0;
  const timers = new Map();
  const clock = {
    setTimeout(fn, delay) { const id = ++nextId; timers.set(id, { fn, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    advance(ms) {
      const end = now + ms;
      while (true) {
        const due = [...timers].filter(([, t]) => t.at <= end).sort((a,b) => a[1].at - b[1].at)[0];
        if (!due) break;
        now = due[1].at; timers.delete(due[0]); due[1].fn();
      }
      now = end;
    }
  };
  return { machine: new PetStateMachine(() => {}, clock), clock };
}
test('all finite actions return to idle after their documented duration', () => {
  for (const [state, duration] of Object.entries({ blink:420, greet:1000, shy:800, happy:700, land:420 })) {
    const { machine, clock } = setup();
    machine.play(state); clock.advance(duration - 1); assert.equal(machine.state, state);
    clock.advance(1); assert.equal(machine.state, 'idle');
  }
});
test('drag blocks all automatic and lower-priority actions until explicit landing', () => {
  const { machine, clock } = setup(); machine.play('drag');
  for (const state of ['idle','blink','greet','shy','happy','sleep','land']) assert.equal(machine.play(state), false);
  clock.advance(60000); assert.equal(machine.state, 'drag');
  machine.play('land', { force:true }); clock.advance(420); assert.equal(machine.state,'idle');
});
test('preempted action timer cannot interrupt a newer action; repeated clicks restart happy', () => {
  const { machine, clock } = setup();
  machine.play('greet'); clock.advance(900); machine.play('happy'); clock.advance(150);
  assert.equal(machine.state,'happy'); machine.play('happy'); clock.advance(699);
  assert.equal(machine.state,'happy'); clock.advance(1); assert.equal(machine.state,'idle');
});
test('sleep persists, wakes explicitly, and dispose cancels pending animation callbacks', () => {
  const { machine, clock } = setup(); machine.play('sleep'); clock.advance(500000);
  assert.equal(machine.state,'sleep'); machine.play('idle',{ force:true }); assert.equal(machine.state,'idle');
  machine.play('happy');machine.dispose();clock.advance(1000);assert.equal(machine.state,'happy');
  assert.throws(()=>machine.play('unknown'), /Unknown pet action/);
});
