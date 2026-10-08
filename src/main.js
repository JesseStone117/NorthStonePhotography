import { photos } from './generated/photos.js';
import { categories, descriptions, orderPortfolio, filterPortfolio, inquiryEmail } from './portfolio.js';
import { site } from './site.js';

const $ = selector => document.querySelector(selector);
const photoById = new Map(photos.map(photo => [photo.id, photo]));
const portfolio = orderPortfolio(photos);
const labelFor = photo => categories.find(category => category.id === photo.category).title;
const descriptionFor = photo => descriptions[photo.id] || `${labelFor(photo)} photograph by ${site.name}`;

function setPhoto(element, id, sizes) {
  const photo = photoById.get(id);
  element.src = photo.preview;
  element.srcset = photo.srcset;
  element.sizes = sizes;
  element.decoding = 'async';
}

setPhoto($('#hero-photo'), 'couples-good-332', '(max-width: 800px) 1100px, 100vw');
setPhoto($('#approach-photo'), 'family-img-0249', '(max-width: 560px) 100vw, 50vw');
setPhoto($('#banner-photo'), 'family-kings-238', '100vw');
$('#year').textContent = new Date().getFullYear();
$('#service-area').textContent = `With heart, in ${site.location}.`;
const contact = $('#contact-email');
contact.textContent = site.email;
contact.href = `mailto:${site.email}`;
contact.hidden = !site.email;
if (site.instagram) {
  const instagram = $('#instagram-link');
  instagram.href = site.instagram;
  instagram.hidden = false;
}

// Session cards lead directly to their own portfolio collection.
$('#chapter-grid').innerHTML = categories.map((category, index) => {
  const photo = photoById.get(category.cover);
  return `<a class="chapter-card reveal" href="#portfolio" data-category="${category.id}" style="--reveal-delay:${index * 70}ms"><div class="chapter-image"><img src="${photo.preview}" srcset="${photo.srcset}" sizes="(max-width:800px) 43vw, 21vw" width="${photo.width}" height="${photo.height}" alt="${descriptionFor(photo)}" loading="lazy" decoding="async" /></div><div class="chapter-tag"><span>${category.tag}</span><span>0${index + 1}</span></div><div class="chapter-title"><h3>${category.title}</h3><span aria-hidden="true">↗</span></div><p class="chapter-description">${category.description}</p></a>`;
}).join('');

let activeCategory = 'all';
let visibleLimit = 9;
let filtered = portfolio;
let lightboxIndex = 0;
let lightboxOpener;
const lightbox = $('#lightbox');

const filters = [{ id: 'all', title: 'All stories' }, ...categories];
$('#portfolio-filters').innerHTML = filters.map(category => `<button class="filter-button" type="button" data-filter="${category.id}" aria-pressed="${category.id === 'all'}" aria-controls="gallery">${category.title}</button>`).join('');

function renderGallery() {
  filtered = filterPortfolio(portfolio, activeCategory);
  const visible = filtered.slice(0, visibleLimit);
  $('#gallery').innerHTML = visible.map(photo => `<button class="gallery-item" type="button" data-photo="${photo.id}" aria-label="View ${descriptionFor(photo)}"><img src="${photo.preview}" srcset="${photo.srcset}" sizes="(max-width:800px) 44vw, 29vw" width="${photo.width}" height="${photo.height}" alt="${descriptionFor(photo)}" loading="lazy" decoding="async" /><span class="gallery-label" aria-hidden="true"><span>${labelFor(photo)}</span><span>↗</span></span></button>`).join('');
  $('#load-more').hidden = visible.length >= filtered.length;
  $('#gallery-count').textContent = `${visible.length} of ${filtered.length} photographs`;
  $('#gallery-status').textContent = `Showing ${visible.length} ${activeCategory === 'all' ? '' : filters.find(item => item.id === activeCategory).title + ' '}photographs.`;
  document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === activeCategory)));
}

function selectCategory(category) {
  activeCategory = category;
  visibleLimit = 9;
  renderGallery();
}

$('#portfolio-filters').addEventListener('click', event => {
  const button = event.target.closest('[data-filter]');
  if (button) selectCategory(button.dataset.filter);
});
$('#chapter-grid').addEventListener('click', event => {
  const card = event.target.closest('[data-category]');
  if (!card) return;
  selectCategory(card.dataset.category);
  $('#inquiry-form').elements.session.value = card.dataset.category;
});
$('#load-more').addEventListener('click', () => {
  const previousCount = Math.min(visibleLimit, filtered.length);
  visibleLimit += 9;
  renderGallery();
  // Keep keyboard focus on the first newly revealed image when the button disappears.
  if ($('#load-more').hidden) $('#gallery').children[previousCount]?.focus({ preventScroll: true });
});
renderGallery();

function displayLightboxPhoto() {
  const photo = filtered[lightboxIndex];
  const image = $('#lightbox-image');
  image.src = photo.src;
  image.removeAttribute('srcset');
  image.alt = descriptionFor(photo);
  $('#lightbox-caption').textContent = `${labelFor(photo)} · ${lightboxIndex + 1} / ${filtered.length}`;
}
function moveLightbox(direction) {
  lightboxIndex = (lightboxIndex + direction + filtered.length) % filtered.length;
  displayLightboxPhoto();
}
$('#gallery').addEventListener('click', event => {
  const button = event.target.closest('[data-photo]');
  if (!button) return;
  lightboxOpener = button;
  lightboxIndex = filtered.findIndex(photo => photo.id === button.dataset.photo);
  displayLightboxPhoto();
  lightbox.showModal();
  document.body.classList.add('modal-open');
});
$('#lightbox-close').addEventListener('click', () => lightbox.close());
$('#lightbox-previous').addEventListener('click', () => moveLightbox(-1));
$('#lightbox-next').addEventListener('click', () => moveLightbox(1));
lightbox.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    moveLightbox(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
lightbox.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  lightboxOpener?.focus({ preventScroll: true });
});
lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
let swipeStart;
lightbox.addEventListener('touchstart', event => { swipeStart = event.changedTouches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', event => {
  if (swipeStart === undefined) return;
  const distance = event.changedTouches[0].clientX - swipeStart;
  if (Math.abs(distance) > 65) moveLightbox(distance < 0 ? 1 : -1);
  swipeStart = undefined;
}, { passive: true });

const menuToggle = $('.menu-toggle');
const navigation = $('#navigation');
function closeMenu() {
  navigation.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  navigation.classList.toggle('is-open', open);
});
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuToggle.focus();
  }
});
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
matchMedia('(min-width: 801px)').addEventListener('change', closeMenu);

// Native email composition keeps the booking flow useful without pretending to send.
$('#inquiry-note').textContent = `Opens your email app with your session details addressed to Sarah. Please send the email to complete your inquiry.`;
$('#inquiry-submit').firstChild.textContent = 'Prepare your inquiry ';
$('#inquiry-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  try {
    const data = Object.fromEntries(new FormData(form));
    const uri = inquiryEmail(data, site.email);
    const status = $('#inquiry-status');
    status.replaceChildren(document.createTextNode('Your draft is ready. Send it from your email app to reach Sarah. If your app didn’t open, '));
    const retry = document.createElement('a');
    retry.href = uri;
    retry.textContent = 'open the draft again';
    retry.style.textDecoration = 'underline';
    status.append(retry, document.createTextNode(` or email ${site.email} directly.`));
    retry.click();
  } catch (error) {
    $('#inquiry-status').textContent = error.message;
  }
});

// Short reveals and a restrained hero drift; honor the visitor’s motion preference.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('js');
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  }), { threshold: .08, rootMargin: '0px 0px -25px 0px' });
  document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
}
const header = $('.site-header');
const hero = $('.hero');
let scrollScheduled = false;
function updateScroll() {
  header.classList.toggle('scrolled', window.scrollY > 30);
  const rect = hero.getBoundingClientRect();
  if (!motionPreference.matches && rect.bottom > 0 && rect.top < window.innerHeight) {
    $('#hero-photo').style.transform = `translateY(${Math.max(-14, Math.min(14, -rect.top * .04))}px)`;
  }
  scrollScheduled = false;
}
window.addEventListener('scroll', () => {
  if (!scrollScheduled) {
    scrollScheduled = true;
    requestAnimationFrame(updateScroll);
  }
}, { passive: true });
motionPreference.addEventListener('change', () => {
  if (motionPreference.matches) $('#hero-photo').style.transform = '';
  updateScroll();
});
updateScroll();
