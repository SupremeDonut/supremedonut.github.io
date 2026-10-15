(() => {
  const canvas = document.createElement('canvas');
  canvas.className = 'voronoi-background';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const context = canvas.getContext('2d');
  const palette = ['#edc4ac', '#cbd0c8', '#d5c6dc', '#bed5cc', '#ebd3a8', '#c5cfe2', '#eac5c4', '#ced9ba'];
  const seeds = Array.from({ length: 24 }, (_, i) => ({
    x: ((i % 6) + .5 + Math.sin(i * 7.3) * .22) / 6,
    y: (Math.floor(i / 6) + .5 + Math.cos(i * 5.7) * .22) / 4,
    phase: i * 2.37,
  }));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let pointerX = .5;
  let pointerY = .5;
  let width = 0;
  let height = 0;
  let elapsed = 0;
  let start = 0;
  let lastFrame = 0;
  let frameId = 0;

  function clipToBisector(polygon, site, other) {
    const nx = other.x - site.x;
    const ny = other.y - site.y;
    const limit = (other.x * other.x + other.y * other.y - site.x * site.x - site.y * site.y) / 2;
    const result = [];

    for (let i = 0; i < polygon.length; i++) {
      const from = polygon[i];
      const to = polygon[(i + 1) % polygon.length];
      const fromDistance = from.x * nx + from.y * ny - limit;
      const toDistance = to.x * nx + to.y * ny - limit;

      if (fromDistance <= 0) result.push(from);
      if ((fromDistance < 0 && toDistance > 0) || (fromDistance > 0 && toDistance < 0)) {
        const ratio = fromDistance / (fromDistance - toDistance);
        result.push({
          x: from.x + (to.x - from.x) * ratio,
          y: from.y + (to.y - from.y) * ratio,
        });
      }
    }
    return result;
  }

  function draw(time) {
    if (!width || !height) return;
    const points = seeds.map(seed => ({
      x: (seed.x + Math.sin(time * .00012 + seed.phase) * .032 + (pointerX - .5) * .035 * Math.cos(seed.phase)) * width,
      y: (seed.y + Math.cos(time * .000125 + seed.phase) * .04 + (pointerY - .5) * .045 * Math.sin(seed.phase)) * height,
    }));

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#f0e2d2';
    context.fillRect(0, 0, width, height);

    for (let i = 0; i < points.length; i++) {
      const site = points[i];
      let cell = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }];
      for (let j = 0; j < points.length && cell.length; j++) {
        if (i !== j) cell = clipToBisector(cell, site, points[j]);
      }
      if (!cell.length) continue;

      context.beginPath();
      context.moveTo(cell[0].x, cell[0].y);
      for (let j = 1; j < cell.length; j++) context.lineTo(cell[j].x, cell[j].y);
      context.closePath();
      context.fillStyle = palette[i % palette.length];
      context.fill();
      context.strokeStyle = '#fff8e9';
      context.lineWidth = 5;
      context.stroke();
    }
  }

  function tick(now) {
    if (motion.matches) return;
    if (now - lastFrame >= 40) {
      elapsed = now - start;
      draw(elapsed);
      lastFrame = now;
    }
    frameId = requestAnimationFrame(tick);
  }

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth;
    height = innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(elapsed);
  }

  function updateMotion() {
    cancelAnimationFrame(frameId);
    if (motion.matches) {
      pointerX = pointerY = .5;
      elapsed = 0;
      draw(0);
    } else {
      start = performance.now() - elapsed;
      frameId = requestAnimationFrame(tick);
    }
  }

  document.addEventListener('pointermove', event => {
    if (motion.matches) return;
    pointerX = event.clientX / width;
    pointerY = event.clientY / height;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointerX = pointerY = .5; });
  window.addEventListener('resize', resize);
  motion.addEventListener('change', updateMotion);
  resize();
  updateMotion();
})();
