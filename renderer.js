window.addEventListener('DOMContentLoaded', () => {
  const home = document.querySelector('.pet-home');
  if (home.dataset.initialized) return;
  home.dataset.initialized = 'true';
  const desktop = window.petDesktop;
  if (desktop) document.body.classList.add('desktop');
  const pet = document.getElementById('pet');
  const image = document.getElementById('pet-image');
  const bubble = document.getElementById('bubble');
  const controller = new AbortController();
  const timers = new Map();
  const sleepAfter = 240000;
  const doubleClickDelay = 350;
  const positionKey = 'amazing-pet.position.v1';
  let pointer = null, pendingClick = null, paused = false, disposed = false;
  let x = 0, y = 0, lastActivity = Date.now(), knowledgeIndex = 0;
  const knowledge = [
    '你知道吗？剪纸可以用一张纸讲故事。',
    '皮影戏里的小人，是用光和影演故事的！',
    '想认识传统乐器吗？我们一起了解阮吧！',
    '学习辛苦啦，看看远处，让眼睛休息一下吧。'
  ];
  const machine = new window.PetStateMachine(state => {
    pet.dataset.state = '';
    void pet.offsetWidth;
    pet.dataset.state = state;
  });
  const listen = (target, type, fn) => target.addEventListener(type, fn, { signal: controller.signal });
  function cancel(name) {
    clearTimeout(timers.get(name));
    timers.delete(name);
  }
  function schedule(name, fn, delay) {
    cancel(name);
    if (disposed || paused) return;
    timers.set(name, setTimeout(() => {
      timers.delete(name);
      if (!disposed && !paused) fn();
    }, delay));
  }
  function cancelClick() { cancel('click'); pendingClick = null; }
  function showBubble(text, duration = 3000) {
    bubble.textContent = text;
    bubble.classList.add('visible');
    schedule('bubble', () => bubble.classList.remove('visible'), duration);
  }
  function savePosition() {
    if (desktop) return;
    try { localStorage.setItem(positionKey, JSON.stringify({ x, y })); } catch { /* 隐私模式仍可拖动。 */ }
  }
  function place(nextX, nextY, save = false) {
    const { width, height } = home.getBoundingClientRect();
    const maxX = Math.max(0, innerWidth - width - 14);
    const maxY = Math.max(0, innerHeight - height - (desktop ? 8 : 84));
    const minX = Math.min(14, maxX);
    const minY = Math.min(desktop ? 76 : 100, maxY);
    x = Math.min(maxX, Math.max(minX, nextX));
    y = Math.min(maxY, Math.max(minY, nextY));
    home.style.setProperty('--pet-x', `${x}px`);
    home.style.setProperty('--pet-y', `${y}px`);
    home.dataset.positioned = 'true';
    if (save) savePosition();
  }
  function restorePosition() {
    let saved;
    if (!desktop) {
      try { saved = JSON.parse(localStorage.getItem(positionKey)); } catch { /* 损坏的存储回退到居中。 */ }
    }
    const rect = home.getBoundingClientRect();
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) place(saved.x, saved.y);
    else place((innerWidth - rect.width) / 2, (innerHeight - rect.height) / 2);
  }
  function armSleep() {
    schedule('sleep', () => {
      if (!pointer) {
        cancel('hover');
        cancelClick();
        bubble.classList.remove('visible');
        machine.play('sleep');
      }
    }, Math.max(0, sleepAfter - (Date.now() - lastActivity)));
  }
  function activity(wake = false) {
    lastActivity = Date.now();
    if (wake && machine.state === 'sleep') machine.play('idle', { force: true });
    armSleep();
  }
  function planReminder(delay = 90000) {
    schedule('reminder', () => {
      if (!pointer && !pendingClick && machine.state === 'idle') {
        machine.play('greet');
        showBubble(knowledge[knowledgeIndex++ % knowledge.length], 5000);
      }
      planReminder(180000);
    }, delay);
  }
  function happy() {
    activity(true);
    cancel('hover');
    if (machine.play('happy')) showBubble('今天想了解什么非遗知识？');
  }
  function playInstrument() {
    activity(true);
    cancel('hover');
    if (machine.play('playInstrument')) showBubble('跟着节奏，听见传统文化的美～');
  }
  function registerClick(event) {
    const now = Date.now();
    if (pendingClick && now - pendingClick.at <= doubleClickDelay &&
        Math.hypot(event.clientX - pendingClick.x, event.clientY - pendingClick.y) <= 20) {
      cancelClick();
      playInstrument();
    } else {
      // 位置不同的第二次点击先完成前一次单击，再独立计时。
      if (pendingClick) happy();
      pendingClick = { at: now, x: event.clientX, y: event.clientY };
      schedule('click', () => {
        pendingClick = null;
        if (!pointer) happy();
      }, doubleClickDelay);
    }
  }
  function finish(event, cancelled = false) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const { moved } = pointer;
    pointer = null;
    desktop?.endDrag();
    if (pet.hasPointerCapture(event.pointerId)) pet.releasePointerCapture(event.pointerId);
    activity(true);
    if (moved) {
      cancelClick();
      savePosition();
      machine.play('land', { force: true });
    } else if (!cancelled) registerClick(event);
    else cancelClick();
  }
  listen(pet, 'pointerenter', () => {
    if (machine.state === 'sleep') return;
    activity();
    schedule('hover', () => {
      if (!pointer && !pendingClick && machine.play('shy')) showBubble('嘿嘿，摸摸头，好开心～');
    }, 1500);
  });
  listen(pet, 'pointerleave', () => cancel('hover'));
  listen(pet, 'pointerdown', event => {
    if (event.button !== 0 || pointer || paused) return;
    activity(true);
    cancel('hover');
    pointer = { id: event.pointerId, startX: event.clientX, startY: event.clientY,
      lastX: event.clientX, originX: x, originY: y, moved: false };
    pet.setPointerCapture(event.pointerId);
    desktop?.startDrag();
  });
  listen(pet, 'pointermove', event => {
    if (machine.state !== 'sleep') activity();
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.startX, dy = event.clientY - pointer.startY;
    if (!pointer.moved && Math.hypot(dx, dy) > 5) {
      pointer.moved = true;
      cancelClick();
      machine.play('drag');
      bubble.classList.remove('visible');
    }
    if (pointer.moved) {
      const tilt = Math.max(-7, Math.min(7, (event.clientX - pointer.lastX) * .4));
      pet.style.setProperty('--drag-tilt', `${tilt}deg`);
      if (desktop) desktop.moveDrag();
      else place(pointer.originX + dx, pointer.originY + dy);
    }
    pointer.lastX = event.clientX;
  });
  listen(pet, 'pointerup', event => finish(event));
  listen(pet, 'pointercancel', event => finish(event, true));
  listen(pet, 'lostpointercapture', event => finish(event, true));
  listen(pet, 'click', event => { if (event.detail === 0 && !pointer) { cancelClick(); happy(); } });
  listen(pet, 'dblclick', event => event.preventDefault());
  listen(pet, 'contextmenu', event => {
    if (!desktop) return;
    event.preventDefault();
    if (pointer) finish({ pointerId: pointer.id }, true);
    cancelClick();
    cancel('hover');
    desktop.openMenu();
  });
  listen(window, 'blur', () => {
    if (pointer) finish({ pointerId: pointer.id }, true);
    cancelClick();
    cancel('hover');
  });
  listen(window, 'resize', () => place(x, y, true));
  listen(window, 'pet:celebrate', () => {
    if (pointer || paused) return;
    activity(true);
    cancelClick();
    if (machine.play('greet')) showBubble('太棒啦！又认识了一项非遗！');
  });
  function pause() {
    if (pointer) finish({ pointerId: pointer.id }, true);
    paused = true;
    for (const name of timers.keys()) cancel(name);
    pendingClick = null;
    bubble.classList.remove('visible');
    machine.play('idle', { force: true });
  }
  function resume() {
    if (disposed) return;
    paused = false;
    if (Date.now() - lastActivity >= sleepAfter) machine.play('sleep', { force: true });
    else armSleep();
    planReminder();
    place(x, y);
  }
  listen(document, 'visibilitychange', () => document.hidden ? pause() : resume());
  listen(window, 'pagehide', event => {
    pause();
    if (!event.persisted) {
      disposed = true;
      machine.dispose();
      controller.abort();
    }
  });
  listen(window, 'pageshow', event => { if (event.persisted) resume(); });
  function showMissing() {
    image.hidden = true;
    document.getElementById('missing-image').hidden = false;
  }
  listen(image, 'error', showMissing);
  if (image.complete && !image.naturalWidth) showMissing();
  restorePosition();
  armSleep();
  planReminder();
  machine.play('greet');
  showBubble('你好呀，我是小火苗！双击我，一起感受传统乐器的节奏。');
});
