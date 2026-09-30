const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const hero = document.querySelector('.hero');
const heart = document.querySelector('.signature [data-heart]');
const layers = [...document.querySelectorAll('.light')];
const depths = [0.75, -0.5, 1.1, -0.85];
const colors = ['#000000', '#607b5f', '#6e638c', '#477991', '#a55e50'];
const drawDuration = 1600;
const holdDuration = 1600;
const exitDuration = 450;
const cycleDuration = drawDuration + holdDuration + exitDuration;
let frame = 0;
let visible = true;
let animationTime = 0;
let colorIndex = -1;
let pointer = { x: 0, y: 0 };
let current = { x: 0, y: 0 };
let viewportHeight = innerHeight;

function render(now) {
  frame = 0;
  if (reduced.matches || document.hidden || !visible) return;
  const elapsed = Math.min(64, Math.max(1, now - lastFrame));
  lastFrame = now;
  animationTime += elapsed;
  const cycle = Math.floor(animationTime / cycleDuration);
  const phase = animationTime % cycleDuration;
  const nextColor = cycle % colors.length;
  if (nextColor !== colorIndex) {
    colorIndex = nextColor;
    heart.style.stroke = colors[colorIndex];
  }
  if (phase < drawDuration) {
    const p = phase / drawDuration;
    // Exact smoothstep used by the logo studio's Signature draw preset.
    heart.style.strokeDashoffset = String(1 - p * p * (3 - 2 * p));
    heart.style.opacity = '1';
  } else if (phase < drawDuration + holdDuration) {
    heart.style.strokeDashoffset = '0';
    heart.style.opacity = '1';
  } else {
    const p = (phase - drawDuration - holdDuration) / exitDuration;
    heart.style.opacity = String(1 - p * p * (3 - 2 * p));
  }
  const blend = 1 - Math.exp(-elapsed / 110);
  current.x += (pointer.x - current.x) * blend;
  current.y += (pointer.y - current.y) * blend;
  const moving = Math.abs(pointer.x - current.x) + Math.abs(pointer.y - current.y) > .001;
  if (moving) {
    layers.forEach((layer, i) => {
      const x = current.x * 30 * depths[i];
      const y = current.y * 24 * depths[i];
      layer.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
    });
    hero.style.transform = `translate3d(${(current.x * -7).toFixed(2)}px,${(current.y * -6).toFixed(2)}px,0)`;
  }
  frame = requestAnimationFrame(render);
}
let lastFrame = performance.now();
function wake() {
  if (!frame && !reduced.matches && !document.hidden && visible) {
    lastFrame = performance.now();
    frame = requestAnimationFrame(render);
  }
}
function reset() {
  cancelAnimationFrame(frame);
  frame = 0;
  animationTime = 0;
  colorIndex = -1;
  heart.style.stroke = colors[0];
  heart.style.strokeDashoffset = reduced.matches ? '0' : '1';
  heart.style.opacity = '1';
  hero.style.removeProperty('transform');
  layers.forEach(layer => layer.style.removeProperty('transform'));
  current = { x: 0, y: 0 };
  pointer = { x: 0, y: 0 };
  if (!reduced.matches) wake();
}
addEventListener('pointermove', event => {
  if (reduced.matches || (!finePointer.matches && event.pointerType !== 'touch')) return;
  pointer = { x: event.clientX / innerWidth - .5, y: event.clientY / viewportHeight - .5 };
  wake();
}, { passive: true });
document.documentElement.addEventListener('pointerleave', () => { pointer = { x: 0, y: 0 }; wake(); });
addEventListener('resize', () => { viewportHeight = innerHeight; wake(); }, { passive: true });
if (typeof IntersectionObserver !== 'undefined') {
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) { cancelAnimationFrame(frame); frame = 0; }
    else wake();
  }).observe(hero);
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
  else wake();
});
reduced.addEventListener('change', reset);
finePointer.addEventListener('change', () => { pointer = { x: 0, y: 0 }; wake(); });
if (!reduced.matches) {
  heart.style.stroke = colors[0];
  heart.style.strokeDashoffset = '1';
  wake();
}
