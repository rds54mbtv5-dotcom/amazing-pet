// Electron 提供受限接口；普通浏览器也能预览图片、动画和气泡。
const desktop = window.petDesktop;
window.addEventListener('DOMContentLoaded', () => {
  const pet = document.getElementById('pet');
  const bubble = document.getElementById('bubble');
  const image = document.getElementById('pet-image');
  let pointer = null;
  let timer;
  const showBubble = () => {
    clearTimeout(timer);
    bubble.classList.add('visible');
    timer = setTimeout(() => bubble.classList.remove('visible'), 3000);
  };
  const showMissing = () => {
    image.hidden = true;
    document.getElementById('missing-image').hidden = false;
  };
  image.addEventListener('error', showMissing);
  if (image.complete && !image.naturalWidth) showMissing();
  pet.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointer) return;
    pointer = { id: event.pointerId, x: event.screenX, y: event.screenY, moved: false };
    pet.setPointerCapture(event.pointerId);
    desktop?.startDrag();
  });
  pet.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    if (Math.hypot(event.screenX - pointer.x, event.screenY - pointer.y) > 5) pointer.moved = true;
    if (pointer.moved) desktop?.moveDrag();
  });
  const finish = (event, cancelled) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const clicked = !pointer.moved && !cancelled;
    pointer = null;
    desktop?.endDrag();
    if (pet.hasPointerCapture(event.pointerId)) pet.releasePointerCapture(event.pointerId);
    if (clicked) showBubble();
  };
  pet.addEventListener('pointerup', event => finish(event, false));
  pet.addEventListener('pointercancel', event => finish(event, true));
  pet.addEventListener('lostpointercapture', event => finish(event, true));
  pet.addEventListener('click', event => { if (event.detail === 0) showBubble(); });
  pet.addEventListener('contextmenu', event => {
    event.preventDefault();
    pointer = null;
    desktop?.openMenu();
  });
});
