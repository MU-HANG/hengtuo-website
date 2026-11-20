const products = {
  excavator: {
    prefix: 'HTE', number: '420', category: '土方工程 · 履带式', name: '履带式液压挖掘机',
    description: '面向采石场、基础设施与大型土方工程。强化型工作装置配合宽履带底盘，兼顾挖掘力与复杂地面的通过性。',
    specs: [['工作质量', '42', 't'], ['标准斗容', '2.4', 'm³']],
  },
  loader: {
    prefix: 'HTL', number: '680', category: '物料装运 · 轮式', name: '轮式装载机',
    description: '用于料场转运、砂石装载和矿区短距搬运。铰接式车架便于狭窄区域转向，宽幅铲斗支持连续作业。',
    specs: [['额定载荷', '6.8', 't'], ['标准斗容', '4.2', 'm³']],
  },
  truck: {
    prefix: 'HTM', number: '105', category: '露天采矿 · 刚性车架', name: '刚性矿用自卸车',
    description: '面向露天矿区的大批量运输。耐磨翻斗、宽体底盘与双回路制动构成适应重载工况的整车方案。',
    specs: [['额定载荷', '105', 't'], ['车厢堆装容积', '65', 'm³']],
  },
};

const film = document.querySelector('#brand-film');
const filmToggle = document.querySelector('#film-toggle');
const filmStage = film.closest('.hero-stage');
const filmLabel = filmToggle.querySelector('span');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const compactFilm = window.matchMedia('(max-width: 680px)');
let filmInView = false;
let filmPreference;
let filmUnavailable = false;

function syncFilm() {
  const allowAutoplay = !reducedMotion.matches && !navigator.connection?.saveData;
  const shouldPlay = filmPreference ?? allowAutoplay;
  if (!shouldPlay || !filmInView || document.hidden || filmUnavailable) {
    film.pause();
    return;
  }
  if (!film.getAttribute('src')) {
    film.muted = true;
    film.src = compactFilm.matches ? film.dataset.mobile : film.dataset.desktop;
  }
  if (film.paused) film.play().catch(updateFilmToggle);
}

function updateFilmToggle() {
  filmToggle.classList.toggle('is-playing', !film.paused);
  filmLabel.textContent = film.paused ? '播放影像' : '暂停影像';
}

filmToggle.addEventListener('click', () => {
  filmPreference = film.paused;
  syncFilm();
});
film.addEventListener('play', updateFilmToggle);
film.addEventListener('pause', updateFilmToggle);
film.addEventListener('playing', () => filmStage.classList.add('is-film-ready'));
film.addEventListener('error', () => {
  filmUnavailable = true;
  filmStage.classList.remove('is-film-ready');
  filmToggle.hidden = true;
});
reducedMotion.addEventListener('change', syncFilm);
document.addEventListener('visibilitychange', syncFilm);

const filmObserver = new IntersectionObserver(([entry]) => {
  filmInView = entry.intersectionRatio >= .16;
  syncFilm();
}, { threshold: .16 });
filmObserver.observe(filmStage);
filmToggle.hidden = false;

const nav = document.querySelector('.site-nav');
const menu = document.querySelector('.menu-toggle');
const navLinks = [...nav.querySelectorAll('a')];
function closeMenu(returnFocus = false) {
  menu.setAttribute('aria-expanded', 'false');
  nav.classList.remove('is-open');
  if (returnFocus) menu.focus();
}
menu.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  menu.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('is-open')) closeMenu(true);
});

const pages = navLinks.slice(1).map(link => document.querySelector(link.hash));
let navFrame = 0;
function updateNav() {
  const current = pages.findLastIndex(section => section.getBoundingClientRect().top < window.innerHeight*.38) + 1;
  navLinks.forEach((link, index) => {
    link.classList.toggle('is-current', index === current);
    if (index === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  navFrame = 0;
}
function scheduleNav() {
  if (!navFrame) navFrame = requestAnimationFrame(updateNav);
}
window.addEventListener('scroll', scheduleNav, { passive: true });
window.addEventListener('resize', scheduleNav);
updateNav();

for (const button of document.querySelectorAll('.glass')) {
  button.addEventListener('pointermove', event => {
    const bounds = button.getBoundingClientRect();
    button.style.setProperty('--glow-x', ((event.clientX - bounds.left) / bounds.width * 100) + '%');
    button.style.setProperty('--glow-y', ((event.clientY - bounds.top) / bounds.height * 100) + '%');
  });
}

const tabs = [...document.querySelectorAll('.product-tab')];
const panel = document.querySelector('#product-panel');
const fields = Object.fromEntries(['category', 'code', 'name', 'description'].map(key => [key, document.querySelector('#product-' + key)]));
const specs = document.querySelector('#specs');
const poster = document.querySelector('#model-poster');
const surface = document.querySelector('#model-surface');
const status = document.querySelector('#viewer-status');
const toolbar = document.querySelector('.viewer-toolbar');
const spin = document.querySelector('#rotate-model');
const reset = document.querySelector('#reset-model');
let selected = 'excavator';
let showroom;

function showProduct(tab) {
  selected = tab.dataset.kit;
  const product = products[selected];
  tabs.forEach(item => {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
  });
  panel.setAttribute('aria-labelledby', tab.id);
  for (const key of ['name', 'category', 'description']) fields[key].textContent = product[key];
  const digits = document.createElement('span');
  digits.textContent = product.number;
  fields.code.replaceChildren(product.prefix, digits);

  specs.replaceChildren(...product.specs.map(([label, value, unit]) => {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    term.textContent = label;
    const data = document.createElement('dd');
    const measurement = document.createElement('small');
    measurement.textContent = unit;
    data.append(value + ' ', measurement);
    row.append(term, data);
    return row;
  }));
  poster.src = './assets/' + selected + '.webp';
  poster.alt = product.prefix + ' ' + product.number + ' ' + product.name + '概念模型';
  showroom?.select(selected);
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => showProduct(tab));
  tab.addEventListener('keydown', event => {
    const next = {
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    showProduct(tabs[next]);
    tabs[next].focus();
  });
});

function fallback() {
  showroom = undefined;
  poster.classList.remove('is-hidden');
  status.textContent = '静态模型预览';
  toolbar.hidden = true;
  surface.hidden = true;
}
async function startShowroom() {
  try {
    const { createShowroom } = await import('./viewer.bundle.js');
    showroom = createShowroom(surface, fallback);
    showroom.select(selected);
    poster.classList.add('is-hidden');
    status.textContent = '交互式 3D 模型';
    toolbar.hidden = false;
  } catch (error) {
    console.warn('3D 展厅切换至静态预览', error);
    fallback();
  }
}
const load = new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting) return;
  load.disconnect();
  startShowroom();
}, { rootMargin: '450px' });
load.observe(surface);

spin.addEventListener('click', () => {
  const active = spin.getAttribute('aria-pressed') === 'false';
  spin.setAttribute('aria-pressed', String(active));
  showroom?.setAutoRotate(active);
});
reset.addEventListener('click', () => {
  spin.setAttribute('aria-pressed', 'false');
  showroom?.setAutoRotate(false);
  showroom?.reset();
});
