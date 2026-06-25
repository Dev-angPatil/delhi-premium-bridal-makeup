import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GreenSock ScrollTrigger Plugin
gsap.registerPlugin(ScrollTrigger);

/* ==========================================================================
   🖼️ CANVAS & FRAME SCRUBBING SETUP
   ========================================================================== */

const canvas = document.getElementById('scrolly-canvas');
const ctx = canvas.getContext('2d');
const totalFrames = 240;
const images = [];

// Use a CSS custom property trick to get the real visible height on mobile
// (avoids the "100vh includes hidden browser chrome" iOS bug)
function getViewportHeight() {
  return window.visualViewport ? window.visualViewport.height : window.innerHeight;
}
function getViewportWidth() {
  return window.visualViewport ? window.visualViewport.width : window.innerWidth;
}

// Setup Canvas Resolution (Retina-ready)
function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const vw = getViewportWidth();
  const vh = getViewportHeight();

  canvas.width = vw * pixelRatio;
  canvas.height = vh * pixelRatio;

  // Also update CSS size so canvas fills the container
  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';

  renderFrame();
  resizeSlider();
}

function resizeSlider() {
  if (sliderContainer) {
    const sliderWidth = sliderContainer.getBoundingClientRect().width;
    sliderContainer.style.setProperty('--slider-width', `${sliderWidth}px`);
  }
}

// Generate image file path
const getFramePath = (index) => {
  const frameNum = (index + 1).toString().padStart(4, '0');
  return `/sequence/frame_${frameNum}.webp`;
};

/* ==========================================================================
   📦 ASYNC PRELOADER ENGINE
   ========================================================================== */

const loader = document.getElementById('loader');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

let loadedCount = 0;

function preloadImages() {
  return new Promise((resolve) => {
    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        loadedCount++;
        const percent = Math.round((loadedCount / totalFrames) * 100);
        progressBar.style.width = `${percent}%`;
        progressText.innerText = `Preloading Artistry: ${percent}%`;
        
        if (loadedCount === totalFrames) {
          onPreloadComplete(resolve);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalFrames) {
          onPreloadComplete(resolve);
        }
      };
      images.push(img);
    }
  });
}

function onPreloadComplete(resolve) {
  setTimeout(() => {
    loader.style.opacity = '0';
    loader.style.visibility = 'hidden';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 1000);
    resolve();
  }, 500);
}

/* ==========================================================================
   🖌️ CANVAS COVER RENDERING — Fixed "object-fit: cover" for Canvas
   The bug was using Math.min (which produces CONTAIN, causing black bars).
   Cover requires Math.MAX so the image fills the full canvas, cropping edges.
   ========================================================================== */

function drawImageCover(ctx, img) {
  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;

  if (!iw || !ih) return;

  // Scale factor: use MAX so image covers entire canvas (may crop)
  const scale = Math.max(cw / iw, ch / ih);
  const nw = iw * scale;
  const nh = ih * scale;

  // Center the image
  const dx = (cw - nw) / 2;
  const dy = (ch - nh) / 2;

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, nw, nh);
}

const playhead = { frame: 0 };

function renderFrame() {
  const activeIndex = Math.min(Math.max(Math.round(playhead.frame), 0), totalFrames - 1);
  const activeImg = images[activeIndex];
  if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
    drawImageCover(ctx, activeImg);
  }
}

/* ==========================================================================
   🎵 SYNTHESIZED LUXURY BRIDAL MUSIC (WEB AUDIO API DRONE)
   ========================================================================== */

let audioCtx = null;
let masterGain = null;
let oscillators = [];
let lfo = null;
let isAudioPlaying = false;

const audioToggle = document.getElementById('audio-toggle');
const iconMuted = document.getElementById('icon-muted');
const equalizer = document.getElementById('equalizer');

function initSynth() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(220, audioCtx.currentTime);
  filter.Q.setValueAtTime(1, audioCtx.currentTime);

  const baseFreq = 69.30; // C#2
  const frequencies = [
    baseFreq,
    baseFreq * 1.5,
    baseFreq * 2,
    baseFreq * 3,
    baseFreq * 4
  ];

  frequencies.forEach((freq, index) => {
    const osc = audioCtx.createOscillator();
    osc.type = index % 2 === 0 ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.detune.setValueAtTime((Math.random() - 0.5) * 8, audioCtx.currentTime);

    const oscGain = audioCtx.createGain();
    const volume = index === 0 ? 0.35 : 0.2 / index;
    oscGain.gain.setValueAtTime(volume, audioCtx.currentTime);

    const oscLfo = audioCtx.createOscillator();
    oscLfo.frequency.setValueAtTime(0.08 + index * 0.03, audioCtx.currentTime);
    const oscLfoGain = audioCtx.createGain();
    oscLfoGain.gain.setValueAtTime(volume * 0.3, audioCtx.currentTime);
    
    oscLfo.connect(oscLfoGain);
    oscLfoGain.connect(oscGain.gain);
    
    osc.connect(oscGain);
    oscGain.connect(filter);
    
    osc.start();
    oscLfo.start();
    
    oscillators.push(osc, oscLfo);
  });

  lfo = audioCtx.createOscillator();
  lfo.frequency.setValueAtTime(0.05, audioCtx.currentTime);
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(masterGain.gain);
  lfo.start();

  filter.connect(masterGain);
  masterGain.connect(audioCtx.destination);
}

function startAmbientSound() {
  if (!audioCtx) initSynth();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  masterGain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 2.5);
  isAudioPlaying = true;
  iconMuted.classList.add('hidden');
  equalizer.classList.remove('hidden');
}

function stopAmbientSound() {
  if (masterGain) {
    masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
  }
  isAudioPlaying = false;
  iconMuted.classList.remove('hidden');
  equalizer.classList.add('hidden');
}

audioToggle.addEventListener('click', () => {
  if (isAudioPlaying) {
    stopAmbientSound();
  } else {
    startAmbientSound();
  }
});

/* ==========================================================================
   🎨 THEME SWAP ENGINE (CINEMATIC BACKDROP)
   ========================================================================== */

const glowBackdrop = document.getElementById('ambient-glow');
const swatches = document.querySelectorAll('.swatch');

const themeGlows = {
  royal: 'radial-gradient(circle, rgba(139, 28, 46, 0.45) 0%, rgba(0,0,0,0) 70%)',
  pastel: 'radial-gradient(circle, rgba(226, 192, 180, 0.35) 0%, rgba(0,0,0,0) 70%)',
  shehnai: 'radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, rgba(0,0,0,0) 70%)'
};

const themeAccents = {
  royal: '#8b1c2e',
  pastel: '#e2c0b4',
  shehnai: '#d4af37'
};

swatches.forEach(swatch => {
  swatch.addEventListener('click', () => {
    swatches.forEach(s => {
      s.classList.remove('active');
      s.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    });

    const themeName = swatch.getAttribute('data-theme');
    swatch.classList.add('active');
    swatch.style.borderColor = 'var(--color-gold)';

    glowBackdrop.style.background = themeGlows[themeName];
    document.documentElement.style.setProperty('--color-gold', themeAccents[themeName]);
    document.documentElement.style.setProperty('--color-glow-royal', themeGlows[themeName]);
  });
});

/* ==========================================================================
   ↔️ BEFORE / AFTER SLIDER HANDLERS — Mobile-first touch handling
   ========================================================================== */

const beforeImg = document.getElementById('img-before');
const afterImg = document.getElementById('img-after');
const beforeWrapper = document.getElementById('image-before-wrapper');
const sliderHandle = document.getElementById('slider-handle');
const sliderContainer = document.querySelector('.before-after-slider');
const dragButton = document.querySelector('.handle-button');

// Inline SVG placeholders
const beforeSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 568" width="320" height="568"><rect width="320" height="568" fill="%23dfd0c0"/><path d="M160 140 c-35 0 -60 25 -60 60 c0 35 15 50 30 75 c10 18 15 35 15 50 c0 15 -10 25 -10 35 c0 20 20 30 25 30 s25 -10 25 -30 c0 -10 -10 -20 -10 -35 c0 -15 5 -32 15 -50 c15 -25 30 -40 30 -75 c0 -35 -25 -60 -60 -60 z" fill="%23f3dcd0" stroke="%23b08b75" stroke-width="1.5"/><path d="M125 185 c10 -8 20 -8 25 -2" fill="none" stroke="%238c6c58" stroke-width="1.5" stroke-linecap="round"/><path d="M195 185 c-10 -8 -20 -8 -25 -2" fill="none" stroke="%238c6c58" stroke-width="1.5" stroke-linecap="round"/><path d="M148 252 c6 2 18 2 24 0" fill="none" stroke="%23cc9688" stroke-width="2" stroke-linecap="round"/></svg>`;

const afterSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 568" width="320" height="568"><defs><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%25" stop-color="%23f5e4b7"/><stop offset="50%25" stop-color="%23d4af37"/><stop offset="100%25" stop-color="%23aa7c11"/></linearGradient><radialGradient id="glow" cx="50%25" cy="50%25" r="50%25"><stop offset="0%25" stop-color="%23d4af37" stop-opacity="0.3"/><stop offset="100%25" stop-color="%23d4af37" stop-opacity="0"/></radialGradient></defs><rect width="320" height="568" fill="%2350101d"/><circle cx="160" cy="240" r="120" fill="url(%23glow)"/><path d="M160 140 c-35 0 -60 25 -60 60 c0 35 15 50 30 75 c10 18 15 35 15 50 c0 15 -10 25 -10 35 c0 20 20 30 25 30 s25 -10 25 -30 c0 -10 -10 -20 -10 -35 c0 -15 5 -32 15 -50 c15 -25 30 -40 30 -75 c0 -35 -25 -60 -60 -60 z" fill="%23f8e2d6" stroke="%23905c48" stroke-width="1"/><path d="M146 252 c6 -4 10 -2 14 -2 s8 -2 14 2 c3 4 -6 6 -14 6 s-17 -2 -14 -6 z" fill="%23b0122a" stroke="%23600510" stroke-width="1"/><circle cx="160" cy="172" r="4" fill="%23b0122a" stroke="url(%23gold)" stroke-width="1"/><path d="M110 300 c15 25 35 35 50 35 s35 -10 50 -35" fill="none" stroke="url(%23gold)" stroke-width="4"/></svg>`;

beforeImg.src = beforeSVG;
afterImg.src = afterSVG;

let isDragging = false;

function updateSlider(clientX) {
  const rect = sliderContainer.getBoundingClientRect();
  const offsetX = clientX - rect.left;
  let percent = (offsetX / rect.width) * 100;
  percent = Math.max(0, Math.min(100, percent));

  beforeWrapper.style.width = `${percent}%`;
  sliderHandle.style.left = `${percent}%`;
}

// Drag start — on entire slider area for easier mobile use
sliderContainer.addEventListener('mousedown', (e) => {
  isDragging = true;
  updateSlider(e.clientX);
});

sliderContainer.addEventListener('touchstart', (e) => {
  isDragging = true;
  updateSlider(e.touches[0].clientX);
}, { passive: true });

window.addEventListener('mouseup', () => { isDragging = false; });
window.addEventListener('touchend', () => { isDragging = false; });

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  updateSlider(e.clientX);
});

window.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  updateSlider(e.touches[0].clientX);
  // Prevent page scroll while dragging slider horizontally
  e.preventDefault();
}, { passive: false });

/* ==========================================================================
   💳 TABS SWITCHER (PACKAGES)
   ========================================================================== */

const tabBtns = document.querySelectorAll('.tab-btn');
const packageCards = document.querySelectorAll('.package-card');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const targetTab = btn.getAttribute('data-tab');

    packageCards.forEach(card => {
      const cardId = card.getAttribute('id');
      if (cardId === `pkg-${targetTab}`) {
        card.classList.remove('hidden');
        card.classList.add('active');
      } else {
        card.classList.add('hidden');
        card.classList.remove('active');
      }
    });
  });
});

/* ==========================================================================
   🙋 FAQ ACCORDION HANDLERS
   ========================================================================== */

const faqTriggers = document.querySelectorAll('.faq-trigger');

faqTriggers.forEach(trigger => {
  trigger.addEventListener('click', () => {
    const parent = trigger.parentElement;
    const panel = trigger.nextElementSibling;
    const isActive = parent.classList.contains('active');

    document.querySelectorAll('.faq-item').forEach(item => {
      item.classList.remove('active');
      item.querySelector('.faq-panel').style.maxHeight = null;
    });

    if (!isActive) {
      parent.classList.add('active');
      panel.style.maxHeight = `${panel.scrollHeight}px`;
    }
  });
});

/* ==========================================================================
   📝 BOOKING CONSOLE FORM VALIDATOR
   ========================================================================== */

const bookingForm = document.getElementById('booking-form');
const successOverlay = document.getElementById('booking-success');
const successNameSpan = document.getElementById('success-user-name');
const closeSuccessBtn = document.getElementById('btn-close-success');

bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  let isFormValid = true;

  const nameInput = document.getElementById('input-name');
  const nameErr = document.getElementById('err-name');
  if (!nameInput.value.trim()) {
    nameInput.classList.add('invalid');
    nameErr.classList.add('visible');
    isFormValid = false;
  } else {
    nameInput.classList.remove('invalid');
    nameErr.classList.remove('visible');
  }

  const phoneInput = document.getElementById('input-phone');
  const phoneErr = document.getElementById('err-phone');
  const phoneRegex = /^\+?[0-9\s\-]{8,15}$/;
  if (!phoneRegex.test(phoneInput.value.trim())) {
    phoneInput.classList.add('invalid');
    phoneErr.classList.add('visible');
    isFormValid = false;
  } else {
    phoneInput.classList.remove('invalid');
    phoneErr.classList.remove('visible');
  }

  const dateInput = document.getElementById('input-date');
  const dateErr = document.getElementById('err-date');
  const selectedDate = new Date(dateInput.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!dateInput.value || selectedDate < today) {
    dateInput.classList.add('invalid');
    dateErr.classList.add('visible');
    isFormValid = false;
  } else {
    dateInput.classList.remove('invalid');
    dateErr.classList.remove('visible');
  }

  if (isFormValid) {
    const firstName = nameInput.value.trim().split(' ')[0];
    successNameSpan.innerText = firstName;
    successOverlay.classList.remove('hidden');
  }
});

closeSuccessBtn.addEventListener('click', () => {
  successOverlay.classList.add('hidden');
  bookingForm.reset();
  document.querySelectorAll('#booking-form input').forEach(el => el.classList.remove('invalid'));
  document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('visible'));
});

/* ==========================================================================
   🎬 ANIMATIONS & TIMELINE BINDINGS (GSAP)
   ========================================================================== */

function initAnimations() {
  // Set xPercent/yPercent on all content-boxes so GSAP owns centering
  // and the CSS transform: translate(-50%, -50%) is no longer needed.
  // This prevents GSAP from overwriting/fighting with CSS transforms.
  gsap.set('.scroll-section .content-box', { xPercent: -50, yPercent: -50 });

  // 1. Scrubbing Canvas Image Frames
  gsap.to(playhead, {
    frame: totalFrames - 1,
    ease: 'none',
    scrollTrigger: {
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.25,
      onUpdate: () => renderFrame()
    }
  });

  // 2. Scroll Progress Line
  gsap.to('#scroll-progress-line', {
    height: '100%',
    ease: 'none',
    scrollTrigger: {
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true
    }
  });

  // 3. Hero Section fades out as we scroll
  gsap.to('#scene-hero .content-box', {
    opacity: 0,
    yPercent: -80, // animate with yPercent so centering stays correct
    ease: 'power1.inOut',
    scrollTrigger: {
      trigger: '#scene-hero',
      start: 'top top',
      end: 'bottom 80%',
      scrub: true
    }
  });

  // Brand Description rises, holds, fades out
  gsap.fromTo('#scene-brand .content-box',
    { opacity: 0, yPercent: -30 },
    {
      opacity: 1,
      yPercent: -60,
      ease: 'power1.out',
      scrollTrigger: {
        trigger: '#scene-brand',
        start: 'top 85%',
        end: 'top 40%',
        scrub: true
      }
    }
  );
  gsap.to('#scene-brand .content-box', {
    opacity: 0,
    yPercent: -100,
    ease: 'power1.in',
    scrollTrigger: {
      trigger: '#scene-brand',
      start: 'bottom 80%',
      end: 'bottom 30%',
      scrub: true
    }
  });

  // Jewelry card
  gsap.fromTo('#scene-jewelry .content-box',
    { opacity: 0, yPercent: -30 },
    {
      opacity: 1,
      yPercent: -60,
      ease: 'power1.out',
      scrollTrigger: {
        trigger: '#scene-jewelry',
        start: 'top 85%',
        end: 'top 40%',
        scrub: true
      }
    }
  );
  gsap.to('#scene-jewelry .content-box', {
    opacity: 0,
    yPercent: -100,
    ease: 'power1.in',
    scrollTrigger: {
      trigger: '#scene-jewelry',
      start: 'bottom 80%',
      end: 'bottom 30%',
      scrub: true
    }
  });

  // CTA Block
  gsap.fromTo('#scene-cta .content-box',
    { opacity: 0, yPercent: -30 },
    {
      opacity: 1,
      yPercent: -60,
      ease: 'power1.out',
      scrollTrigger: {
        trigger: '#scene-cta',
        start: 'top 85%',
        end: 'bottom 90%',
        scrub: true
      }
    }
  );

  // 4. Background Canvas Dimming when entering Stage 2
  gsap.to('#canvas-container', {
    opacity: 0.1,
    ease: 'none',
    scrollTrigger: {
      trigger: '#section-before-after',
      start: 'top 90%',
      end: 'top 40%',
      scrub: true
    }
  });
}

/* ==========================================================================
   🚀 INITIALIZATION CONTROLLER
   ========================================================================== */

async function init() {
  resizeCanvas();

  // Use visualViewport for resize on mobile (handles iOS chrome bar correctly)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resizeCanvas);
  } else {
    window.addEventListener('resize', resizeCanvas);
  }

  // Preload all frames, then build animations
  await preloadImages();

  resizeSlider();
  renderFrame();
  initAnimations();
}

window.addEventListener('DOMContentLoaded', init);
