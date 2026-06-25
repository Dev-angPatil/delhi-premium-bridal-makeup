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
   🖌️ CANVAS RENDERING — "object-fit: contain" style
   Frames are 720×1280 portrait (9:16). We use CONTAIN (Math.min) so the
   full frame is always visible without cropping — exactly what the user
   wants when they say "zoom out". A dark background fills any edge gaps
   on wider screens.
   ========================================================================== */

function drawImageContain(ctx, img) {
  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;

  if (!iw || !ih) return;

  // CONTAIN: scale so the entire image fits, no cropping
  const scale = Math.min(cw / iw, ch / ih);
  const nw = iw * scale;
  const nh = ih * scale;

  // Center the image
  const dx = (cw - nw) / 2;
  const dy = (ch - nh) / 2;

  // Fill background first (for letterbox bars on non-portrait screens)
  ctx.fillStyle = '#090708';
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, nw, nh);
}

const playhead = { frame: 0 };

function renderFrame() {
  const activeIndex = Math.min(Math.max(Math.round(playhead.frame), 0), totalFrames - 1);
  const activeImg = images[activeIndex];
  if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
    drawImageContain(ctx, activeImg);
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

/* (Theme swap removed — glow theme picker UI was removed) */

/* ==========================================================================
   ↔️ BEFORE / AFTER SLIDER HANDLERS — Mobile-first touch handling
   ========================================================================== */

const beforeImg = document.getElementById('img-before');
const afterImg = document.getElementById('img-after');
const beforeWrapper = document.getElementById('image-before-wrapper');
const sliderHandle = document.getElementById('slider-handle');
const sliderContainer = document.querySelector('.before-after-slider');
const dragButton = document.querySelector('.handle-button');

// Load AI-generated portrait images:
// - image-before (LEFT overlay) = AFTER look (full bridal, same model)
// - image-after  (RIGHT bg)     = BEFORE look (natural, same model)
beforeImg.src = '/after.webp';
afterImg.src  = '/before.webp';

// Update alt text
beforeImg.alt = 'After — Full Bridal Transformation';
afterImg.alt  = 'Before — Natural Look';

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
  // End at 65% of the scroll container so all 240 frames play
  // through in the first ~2/3 of scroll — making the animation feel
  // significantly faster and ensuring the full video is seen.
  gsap.to(playhead, {
    frame: totalFrames - 1,
    ease: 'none',
    scrollTrigger: {
      trigger: '#scroll-container',
      start: 'top top',
      end: '30% bottom',   // All 240 frames play in first 30% of scroll
      scrub: 0.08,          // Very tight scrub — frames track finger almost 1:1
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
