const images = [
  { src: 'img/toonhub/spain-girl.png', bg: '#F4845F' },
  { src: 'img/toonhub/spain-boy.png', bg: '#6BBF7A' },
  { src: 'img/toonhub/casual-girl.png', bg: '#E882B4' },
  { src: 'img/toonhub/casual-boy.png', bg: '#6EB5FF' }
];

const root = document.querySelector('#toonhub');
const characters = [...document.querySelectorAll('.character')];
const themeColor = document.querySelector('meta[name="theme-color"]');
let activeIndex = 0;
let isAnimating = false;

images.forEach(({ src }) => {
  const image = new Image();
  image.src = src;
});

function render() {
  const roles = {
    [activeIndex]: 'center',
    [(activeIndex + 3) % images.length]: 'left',
    [(activeIndex + 1) % images.length]: 'right',
    [(activeIndex + 2) % images.length]: 'back'
  };

  characters.forEach((character, index) => {
    character.dataset.role = roles[index];
  });

  root.style.backgroundColor = images[activeIndex].bg;
  themeColor.setAttribute('content', images[activeIndex].bg);
}

function navigate(direction) {
  if (isAnimating) return;
  isAnimating = true;
  activeIndex = direction === 'next'
    ? (activeIndex + 1) % images.length
    : (activeIndex + images.length - 1) % images.length;
  render();
  window.setTimeout(() => { isAnimating = false; }, 650);
}

document.querySelectorAll('[data-direction]').forEach(button => {
  button.addEventListener('click', () => navigate(button.dataset.direction));
});

document.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') navigate('prev');
  if (event.key === 'ArrowRight') navigate('next');
});

render();
