const canvas = document.querySelector('#spaceCanvas');
const ctx = canvas.getContext('2d');
const loader = document.querySelector('#loader');
const universe = document.querySelector('#universe');
const loadingScene = document.querySelector('#loadingScene');
const heartFill = document.querySelector('#heartFill');
const backgroundMusic = document.querySelector('#backgroundMusic');
const musicHeart = document.querySelector('#musicHeart');

function playBackgroundMusic() {
  backgroundMusic.volume = .65;
  backgroundMusic.play().then(() => {
    musicHeart.classList.add('music-playing');
    musicHeart.setAttribute('aria-label', 'Música reproduciéndose');
  }).catch(() => {
    musicHeart.setAttribute('aria-label', 'No se pudo reproducir la música. Inténtalo de nuevo');
  });
}

musicHeart.addEventListener('click', playBackgroundMusic);

let width = 0;
let height = 0;
let pixelRatio = 1;
let stars = [];
let dust = [];
let galaxyParticles = [];
let shootingStars = [];
let pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
let galaxyRotation = 0;
let galaxyVelocity = .00035;
let galaxyTilt = .31;
let targetGalaxyTilt = .31;
let draggingGalaxy = false;
let lastDragX = 0;
let lastDragY = 0;
const memoryCards = [...document.querySelectorAll('.space-memory')];
const orbitalItems = [...document.querySelectorAll('.space-memory, .space-letter')];

function createStar(depth) {
  const palette = Math.random();
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    radius: .35 + Math.random() * (2.15 * depth),
    depth,
    alpha: .42 + Math.random() * .58,
    phase: Math.random() * Math.PI * 2,
    speed: .0007 + Math.random() * .0025,
    sparkle: Math.random() > .91,
    color: palette > .88 ? '190,210,255' : palette > .72 ? '220,195,255' : '255,255,255'
  };
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const count = Math.min(1450, Math.floor(width * height / 780));
  stars = Array.from({ length: count }, (_, index) => createStar(.2 + (index % 5) * .2));
  dust = Array.from({ length: 42 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 15 + Math.random() * 55,
    alpha: .004 + Math.random() * .012,
    hue: Math.random() > .5 ? 265 : 220
  }));
  const galaxyCount = Math.min(2600, Math.floor(width * height / 420));
  galaxyParticles = Array.from({ length: galaxyCount }, (_, index) => {
    const arms = 5;
    const arm = index % arms;
    const radius = Math.pow(Math.random(), .7);
    const spread = (Math.random() - .5) * (.22 + radius * .6);
    const baseAngle = arm * Math.PI * 2 / arms + radius * 7.2 + spread;
    const temperature = Math.random();
    return {
      radius,
      angle: baseAngle,
      size: .22 + Math.random() * (radius < .18 ? 2.1 : 1.25),
      alpha: .2 + Math.random() * .75,
      speed: .000018 + (1 - radius) * .000045,
      vertical: (Math.random() - .5) * (8 + radius * 42),
      phase: Math.random() * Math.PI * 2,
      color: radius < .16 ? '255,238,203' : temperature > .82 ? '255,177,203' : temperature > .55 ? '189,178,255' : '146,190,255'
    };
  });
}

function addShootingStar() {
  shootingStars.push({
    x: Math.random() * width * .65,
    y: Math.random() * height * .35,
    vx: 9 + Math.random() * 5,
    vy: 3.5 + Math.random() * 2,
    life: 0,
    maxLife: 55 + Math.random() * 25
  });
}

function draw(time) {
  ctx.clearRect(0, 0, width, height);
  pointer.x += (pointer.targetX - pointer.x) * .035;
  pointer.y += (pointer.targetY - pointer.y) * .035;

  for (const cloud of dust) {
    ctx.beginPath();
    ctx.fillStyle = `hsla(${cloud.hue},70%,65%,${cloud.alpha})`;
    ctx.arc(cloud.x + pointer.x * .004, cloud.y + pointer.y * .004, cloud.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const centerX = width / 2 + pointer.x * .014;
  const centerY = height / 2 + pointer.y * .01;
  const galaxyRadius = Math.min(width * .46, height * .72);
  if (!draggingGalaxy) {
    galaxyRotation += galaxyVelocity;
    galaxyVelocity *= .992;
    if (Math.abs(galaxyVelocity) < .00016) galaxyVelocity = galaxyVelocity < 0 ? -.00016 : .00016;
  }
  galaxyTilt += (targetGalaxyTilt - galaxyTilt) * .06;
  const tilt = galaxyTilt + pointer.y / Math.max(height, 1) * .025;
  const rotationOffset = galaxyRotation + pointer.x / Math.max(width, 1) * .035;

  const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, galaxyRadius);
  outerGlow.addColorStop(0, 'rgba(255,215,227,.24)');
  outerGlow.addColorStop(.08, 'rgba(178,116,220,.14)');
  outerGlow.addColorStop(.38, 'rgba(77,74,166,.045)');
  outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, galaxyRadius, galaxyRadius * .38, 0, 0, Math.PI * 2);
  ctx.fill();

  for (const particle of galaxyParticles) {
    const angle = particle.angle + time * particle.speed + rotationOffset;
    const radial = particle.radius * galaxyRadius;
    const x = centerX + Math.cos(angle) * radial;
    const y = centerY + Math.sin(angle) * radial * tilt + particle.vertical * (1 - particle.radius * .35);
    const pulse = .8 + Math.sin(time * .0015 + particle.phase) * .2;
    const edgeFade = Math.pow(1 - particle.radius, .18);
    ctx.fillStyle = `rgba(${particle.color},${particle.alpha * pulse * edgeFade})`;
    ctx.beginPath();
    ctx.arc(x, y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }

  orbitalItems.forEach((card, index) => {
    const radius = Number(card.dataset.radius) * galaxyRadius;
    const angle = Number(card.dataset.angle) + rotationOffset + time * (.000012 + index * .0000003);
    const depth = (Math.sin(angle) + 1) / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius * tilt + Math.cos(angle * 2) * 5;
    const scale = .62 + depth * .72;
    card.style.transform = `translate(-50%,-50%) translate(${x - width / 2}px,${y - height / 2}px) scale(${scale})`;
    card.style.opacity = String(.42 + depth * .58);
    card.style.zIndex = String(6 + Math.round(depth * 8));
  });

  const core = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, galaxyRadius * .12);
  core.addColorStop(0, 'rgba(255,255,245,.72)');
  core.addColorStop(.12, 'rgba(255,207,220,.46)');
  core.addColorStop(.48, 'rgba(169,95,214,.17)');
  core.addColorStop(1, 'rgba(75,47,145,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, galaxyRadius * .16, galaxyRadius * .07, 0, 0, Math.PI * 2);
  ctx.fill();

  for (const star of stars) {
    const x = star.x + pointer.x * star.depth * .022;
    const y = star.y + pointer.y * star.depth * .022;
    const twinkle = star.alpha * (.7 + Math.sin(time * star.speed + star.phase) * .3);
    ctx.beginPath();
    ctx.fillStyle = `rgba(${star.color},${twinkle})`;
    if (star.radius > 1.15) {
      ctx.shadowColor = `rgba(${star.color},.8)`;
      ctx.shadowBlur = 13;
    }
    ctx.arc(x, y, star.radius, 0, Math.PI * 2);
    ctx.fill();
    if (star.sparkle && twinkle > .68) {
      const ray = star.radius * (4 + twinkle * 3);
      ctx.strokeStyle = `rgba(${star.color},${twinkle * .48})`;
      ctx.lineWidth = .55;
      ctx.beginPath();
      ctx.moveTo(x - ray, y); ctx.lineTo(x + ray, y);
      ctx.moveTo(x, y - ray); ctx.lineTo(x, y + ray);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  if (Math.random() < .002 && shootingStars.length < 2) addShootingStar();
  shootingStars = shootingStars.filter(star => {
    star.life += 1;
    star.x += star.vx;
    star.y += star.vy;
    const opacity = Math.max(0, 1 - star.life / star.maxLife);
    const tailX = star.x - star.vx * 9;
    const tailY = star.y - star.vy * 9;
    const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
    gradient.addColorStop(0, 'rgba(190,180,255,0)');
    gradient.addColorStop(1, `rgba(245,240,255,${opacity})`);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(star.x, star.y);
    ctx.stroke();
    return star.life < star.maxLife && star.x < width + 150;
  });

  requestAnimationFrame(draw);
}

function updatePointer(clientX, clientY) {
  pointer.targetX = clientX - width / 2;
  pointer.targetY = clientY - height / 2;
}

window.addEventListener('pointermove', event => {
  updatePointer(event.clientX, event.clientY);
  if (!draggingGalaxy) return;
  const dx = event.clientX - lastDragX;
  const dy = event.clientY - lastDragY;
  galaxyRotation += dx * .008;
  galaxyVelocity = dx * .00022;
  targetGalaxyTilt = Math.max(.12, Math.min(.68, targetGalaxyTilt + dy * .0025));
  lastDragX = event.clientX;
  lastDragY = event.clientY;
});
universe.addEventListener('pointerdown', event => {
  if (event.target.closest('button')) return;
  draggingGalaxy = true;
  lastDragX = event.clientX;
  lastDragY = event.clientY;
  universe.setPointerCapture(event.pointerId);
  universe.classList.add('is-dragging');
});
function stopGalaxyDrag(event) {
  if (!draggingGalaxy) return;
  draggingGalaxy = false;
  universe.classList.remove('is-dragging');
  if (universe.hasPointerCapture(event.pointerId)) universe.releasePointerCapture(event.pointerId);
}
universe.addEventListener('pointerup', stopGalaxyDrag);
universe.addEventListener('pointercancel', stopGalaxyDrag);
window.addEventListener('deviceorientation', event => {
  if (event.gamma !== null && event.beta !== null) {
    pointer.targetX = Math.max(-30, Math.min(30, event.gamma)) * 8;
    pointer.targetY = Math.max(-30, Math.min(30, event.beta - 45)) * 5;
  }
});
window.addEventListener('resize', resize);

const photoViewer = document.querySelector('#photoViewer');
const memoryLetters = [
  { title: 'Toy Story 5', text: 'Este recuerdo me hace pensar en lo afortunado que he sido al conocerte. Eras la vaquera Celestuki, la protagonista de mi vida. Espero que podamos seguir disfrazándonos cada vez que vayamos al cine.', signature: 'Hasta el infinito y más allá ♡' },
  { title: 'Un súper beso', text: 'Sentirte cerca me hace muy feliz. Tus besos me transportan a otra galaxia y, cada vez que siento tus labios, recuerdo nuestro primer beso en el banco de San Fernando. Soy muy afortunado de tener una princesa como túuu.' },
  { title: 'Mi princesita Celestuki', text: 'Una flor de loto que nació el 7 de febrero de 2005 y que, poco a poco, florece más y más. Me alegro muchísimo de todo lo que has conseguido hasta ahora. ¡Sigue siendo tú misma y nunca pierdas esa esencia que alegra a todos!' },
  { title: '¡Vamos, España!', text: 'Aún recuerdo este día como si fuera ayer y lo guapa que estabas. Que sepas que todavía no se me olvida la promesa que os hice a ti y a Luli. Espero poder ir a ver partidos de fútbol contigooo.', signature: 'Para mi causa limeña ♡' },
  { title: '¡Burger!', text: 'Cómo olvidar este día. Aún guardo el súper regalo que me diste y recuerdo el momento en que te entregué tu collar y tu anillo. Me alegra poder tenerte y comer a tu lado. Disfrutar de una burger del Goiko contigo no lo cambio por nada del mundo.' },
  { title: 'Mi compañera de gym', text: 'La mejor entrenadora que hay. Aún recuerdo nuestra primera vez en el Basic; ahora ya no le tenemos miedo a la máquina de prensa, jajaja. Espero que podamos seguir compartiendo el gimnasio como buenos gymbros, volver a reír juntos y competir para ver quién hace más.' },
  { title: 'Mi lugar seguro', text: 'Contigo a mi lado lo puedo todo. En mis momentos más difíciles tú has estado ahí, y te agradezco que seas una persona tan alegre, divertida y súper atenta. No hay nadie como tú en este universo.', signature: 'Para Celeste, una estrella que nunca se apaga ♡' },
  { title: 'Spiderman ecuatoriano', text: 'Quiero poder ser tu amigo y vecino Spider-Man, salvarte y protegerte de las cosas malas. Siempre estará aquí tu héroe panzón para lo que necesites: el hombre que soluciona.', signature: 'Para mi Celestuki ♡' }
];
memoryCards.forEach((card, index) => card.addEventListener('click', () => {
  const source = card.querySelector('img');
  photoViewer.querySelector('img').src = source.src;
  photoViewer.querySelector('img').alt = source.alt;
  photoViewer.querySelector('.viewer-photo-number').textContent = String(index + 1).padStart(2, '0');
  photoViewer.querySelector('h2').textContent = memoryLetters[index].title;
  photoViewer.querySelector('.viewer-letter > p').textContent = memoryLetters[index].text;
  photoViewer.querySelector('.viewer-letter footer strong').textContent = memoryLetters[index].signature || 'para ti ♡';
  photoViewer.showModal();
}));
photoViewer.querySelector('.viewer-close').addEventListener('click', () => photoViewer.close());
photoViewer.addEventListener('click', event => { if (event.target === photoViewer) photoViewer.close(); });

const letterDialog = document.querySelector('#letterDialog');
document.querySelector('#orbitLetter').addEventListener('click', () => {
  letterDialog.showModal();
  letterDialog.classList.remove('playing');
  void letterDialog.offsetWidth;
  letterDialog.classList.add('playing');
});
letterDialog.querySelector('.letter-dialog-close').addEventListener('click', () => letterDialog.close());
letterDialog.addEventListener('click', event => { if (event.target === letterDialog) letterDialog.close(); });
letterDialog.addEventListener('close', () => letterDialog.classList.remove('playing'));

resize();
requestAnimationFrame(draw);

let progress = 0;
const loadingInterval = setInterval(() => {
  const remaining = 100 - progress;
  progress += Math.max(1, Math.ceil(Math.random() * Math.min(5, remaining)));
  progress = Math.min(progress, 100);
  heartFill.setAttribute('y', String(108 - progress * 1.08));
  if (progress >= 70) loadingScene.classList.add('almost-there');

  if (progress === 100) {
    clearInterval(loadingInterval);
    setTimeout(() => {
      document.querySelector('#revealCurtain').classList.add('open');
      loader.classList.add('is-complete');
      universe.classList.add('ready');
      document.body.classList.remove('is-loading');
    }, 500);
  }
}, 75);
