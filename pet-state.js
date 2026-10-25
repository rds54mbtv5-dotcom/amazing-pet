/* 所有动作共用一个状态；高优先级动作会取消低优先级动作的结束计时。 */
(function (root) {
  const actions = Object.freeze({
    idle: { priority: 0 },
    sleep: { priority: 1 },
    greet: { priority: 2, duration: 1000 },
    shy: { priority: 3, duration: 800 },
    happy: { priority: 4, duration: 700 },
    playInstrument: { priority: 5, duration: 3000 },
    land: { priority: 6, duration: 420 },
    drag: { priority: 7 }
  });
  class PetStateMachine {
    constructor(onChange, clock = globalThis) {
      this.state = 'idle';
      this.onChange = onChange;
      this.clock = clock;
      this.timer = null;
      this.onChange(this.state);
    }
    play(next, { force = false } = {}) {
      if (!actions[next]) throw new Error(`Unknown pet action: ${next}`);
      if (!force && actions[next].priority < actions[this.state].priority) return false;
      this.clock.clearTimeout(this.timer);
      this.timer = null;
      this.state = next;
      this.onChange(next);
      const duration = actions[next].duration;
      if (duration) this.timer = this.clock.setTimeout(() => this.play('idle', { force: true }), duration);
      return true;
    }
    dispose() { this.clock.clearTimeout(this.timer); }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { PetStateMachine };
  else root.PetStateMachine = PetStateMachine;
})(globalThis);
