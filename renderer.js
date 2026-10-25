// 页面与桌面共用交互；Electron 仅通过 preload 提供窗口操作。
window.addEventListener('DOMContentLoaded', () => {
  const desktop = window.petDesktop;
  const home = document.querySelector('.pet-home');
  const pet = document.getElementById('pet');
  const bubble = document.getElementById('bubble');
  const image = document.getElementById('pet-image');
  const sleepAfter = 4 * 60 * 1000;
  let pointer = null;
  let bubbleTimer, hoverTimer, sleepTimer, blinkTimer, reminderTimer;
  let lastActivity = Date.now();
  let homeX = 0, homeY = 0;
  let disposed = false;
  let knowledgeIndex = 0;
  const knowledge = [
    '你知道吗？剪纸可以用一张纸讲故事。',
    '皮影戏里的小人，是用光和影演故事的！',
    '想认识传统乐器吗？我们一起听听阮的声音吧！',
    '学习辛苦啦，看看远处，让眼睛休息一下吧。'
  ];
  const machine = new window.PetStateMachine(state => {
    // 移除再设置可重播同一动作，所有 transform 动画只作用于 pet-art。
    pet.dataset.state = '';
    void pet.offsetWidth;
    pet.dataset.state = state;
  });
  function showBubble(text, duration = 3000) {
    clearTimeout(bubbleTimer);
    bubble.textContent = text;
    bubble.classList.add('visible');
    bubbleTimer = setTimeout(() => bubble.classList.remove('visible'), duration);
  }
  function cancelHover() { clearTimeout(hoverTimer); }
  function activity() {
    lastActivity = Date.now();
    clearTimeout(sleepTimer);
    if (machine.state === 'sleep') machine.play('idle', { force: true });
    sleepTimer = setTimeout(() => {
      if (!pointer && !document.hidden) {
        cancelHover();
        bubble.classList.remove('visible');
        machine.play('sleep');
      }
    }, sleepAfter);
  }
  function planBlink() {
    clearTimeout(blinkTimer);
    blinkTimer = setTimeout(() => {
      if (!document.hidden && !pointer && machine.state === 'idle') {
        pet.dataset.doubleBlink = String(Math.random() < 0.25);
        machine.play('blink');
      }
      planBlink();
    }, 3000 + Math.random() * 4000);
  }
  function planReminder(delay = 90000) {
    clearTimeout(reminderTimer);
    reminderTimer = setTimeout(() => {
      if (!document.hidden && !pointer && machine.state === 'idle') {
        machine.play('greet');
        showBubble(knowledge[knowledgeIndex++ % knowledge.length], 5000);
      }
      planReminder(180000);
    }, delay);
  }
  function hover() {
    activity();
    cancelHover();
    hoverTimer = setTimeout(() => {
      if (!pointer && !document.hidden && machine.play('shy')) showBubble('嘿嘿，摸摸头，好开心～');
    }, 1500);
  }
  function happy() {
    activity();
    cancelHover();
    machine.play('happy');
    showBubble('今天想了解什么非遗知识？');
  }
  const showMissing = () => {
    image.hidden = true;
    document.getElementById('missing-image').hidden = false;
  };
  image.addEventListener('error', showMissing);
  if (image.complete && !image.naturalWidth) showMissing();
  pet.addEventListener('pointerenter', hover);
  pet.addEventListener('pointerleave', cancelHover);
  pet.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointer) return;
    activity();
    cancelHover();
    pointer = { id: event.pointerId, x: event.screenX, y: event.screenY,
      lastX: event.screenX, originX: homeX, originY: homeY, moved: false };
    pet.setPointerCapture(event.pointerId);
    desktop?.startDrag();
  });
  pet.addEventListener('pointermove', event => {
    activity();
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.screenX - pointer.x;
    const dy = event.screenY - pointer.y;
    if (!pointer.moved && Math.hypot(dx, dy) > 5) {
      pointer.moved = true;
      machine.play('drag');
      bubble.classList.remove('visible');
    }
    if (pointer.moved) {
      const tilt = Math.max(-12, Math.min(12, (event.screenX - pointer.lastX) * 0.6));
      pet.style.setProperty('--drag-tilt', `${tilt}deg`);
      if (desktop) desktop.moveDrag();
      else {
        homeX = Math.max(0, Math.min(Math.max(0, innerWidth - 300), pointer.originX + dx));
        homeY = Math.max(0, Math.min(Math.max(0, innerHeight - 300), pointer.originY + dy));
        home.style.transform = `translate(${homeX}px, ${homeY}px)`;
      }
    }
    pointer.lastX = event.screenX;
  });
  function finish(event, cancelled) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const { moved } = pointer;
    pointer = null;
    desktop?.endDrag();
    if (pet.hasPointerCapture(event.pointerId)) pet.releasePointerCapture(event.pointerId);
    activity();
    if (moved) machine.play('land', { force: true });
    else if (!cancelled) happy();
  }
  pet.addEventListener('pointerup', event => finish(event, false));
  pet.addEventListener('pointercancel', event => finish(event, true));
  pet.addEventListener('lostpointercapture', event => finish(event, true));
  pet.addEventListener('click', event => { if (event.detail === 0 && !pointer) happy(); });
  pet.addEventListener('contextmenu', event => {
    event.preventDefault();
    if (pointer) finish({ pointerId: pointer.id }, true);
    activity();
    cancelHover();
    desktop?.openMenu();
  });
  window.addEventListener('blur', () => {
    cancelHover();
    if (pointer) finish({ pointerId: pointer.id }, true);
  });
  // 未来学习任务完成后可发出此事件，无需直接操作动画 class。
  window.addEventListener('pet:celebrate', () => {
    if (pointer || document.hidden) return;
    activity();
    if (machine.play('greet')) showBubble('太棒啦！又认识了一项非遗！');
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (pointer) finish({ pointerId: pointer.id }, true);
      [hoverTimer, sleepTimer, blinkTimer, reminderTimer, bubbleTimer].forEach(clearTimeout);
      bubble.classList.remove('visible');
      machine.play('idle', { force: true });
    } else if (!disposed) {
      const sleepy = Date.now() - lastActivity >= sleepAfter;
      activity();
      if (sleepy) machine.play('sleep');
      planBlink();
      planReminder();
    }
  });
  window.addEventListener('pagehide', () => {
    disposed = true;
    if (pointer) desktop?.endDrag();
    [hoverTimer, sleepTimer, blinkTimer, reminderTimer, bubbleTimer].forEach(clearTimeout);
    machine.dispose();
  });
  activity();
  planBlink();
  planReminder();
  machine.play('greet');
  showBubble('你好呀！我是非遗小火苗，来摸摸我吧！');
});
