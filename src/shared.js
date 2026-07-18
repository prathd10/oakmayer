// Shared module for Oakmere Website (Vite/ES6)
import { fetchCookies } from './db/supabase.js';
import { getImageKitUrl } from './utils/imagekit.js';

// Global cart state with localStorage persistence
export const state = {
  cart: JSON.parse(localStorage.getItem('oakmere_cart')) || [],
  customizer: {
    capacity: 6,
    price: 25.00,
    title: "The Classic Drawer",
    mode: "personal",
    selections: {
      'chocolate-chunk': { count: 0, name: "Chocolate Chunk", image: "/assets/hero_cookie.png" },
      'hazelnut-praline': { count: 0, name: "Hazelnut Praline", image: "/assets/cookie_hazelnut.png" },
      'pistachio-rose': { count: 0, name: "Pistachio Rose", image: "/assets/cookie_pistachio.png" },
      'smoked-pecan': { count: 0, name: "Smoked Pecan", image: "/assets/cookie_pecan.png" },
      'sesame-matcha': { count: 0, name: "Sesame Matcha", image: "/assets/cookie_sesame.png" },
      'lavender-earl': { count: 0, name: "Lavender Earl Grey", image: "/assets/cookie_lavender.png" },
      'salted-caramel': { count: 0, name: "Salted Caramel Toffee", image: "/assets/cookie_caramel.png" },
      'classic-vanilla': { count: 0, name: "Classic Vanilla Bean", image: "/assets/cookie_vanilla.png" },
      'espresso-macchiato': { count: 0, name: "Espresso Macchiato", image: "/assets/cookie_espresso.png" },
      'velvet-cheesecake': { count: 0, name: "Velvet Cheesecake", image: "/assets/cookie_velvet.png" }
    }
  }
};

// Persist cart helper
export function saveCart() {
  localStorage.setItem('oakmere_cart', JSON.stringify(state.cart));
}

// Toast notification helper
export function showToast(message) {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span>${message}</span>
  `;
  container.appendChild(toast);

  // Auto remove toast
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// Shared DOM initialization (ran on every page)
export function initSharedFeatures() {
  // Website Loader Logic (Run only once per session on the hero/home page)
  const loaderScreen = document.getElementById('loader-screen');
  const loaderProgress = document.getElementById('loader-progress-line');
  const isHomePage = document.getElementById('hero-section') !== null;
  const loaderAlreadyPlayed = sessionStorage.getItem('oakmere_loader_played');

  if (loaderScreen) {
    if (!isHomePage || loaderAlreadyPlayed) {
      // Instantly bypass loader
      loaderScreen.remove();
      document.body.classList.add('loaded');
    } else {
      // Play loader sequence
      sessionStorage.setItem('oakmere_loader_played', 'true');
      if (loaderProgress) {
        setTimeout(() => {
          loaderProgress.style.width = '100%';
        }, 200);
      }
      setTimeout(() => {
        loaderScreen.classList.add('fade-out');
        document.body.classList.add('loaded');
        setTimeout(() => loaderScreen.remove(), 800);
      }, 1800);
    }
  } else {
    document.body.classList.add('loaded');
  }

  // Header Scroll Effect
  const header = document.getElementById('main-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Cart Drawer Logic
  const cartDrawer = document.getElementById('cart-drawer-panel');
  const cartOverlay = document.getElementById('cart-drawer-overlay');
  const cartToggleBtn = document.getElementById('cart-toggle-btn');
  const cartCloseBtn = document.getElementById('cart-close-btn');

  function openCart() {
    if (cartDrawer) cartDrawer.classList.add('open');
    if (cartOverlay) cartOverlay.classList.add('open');
    renderCartItems();
  }

  function closeCart() {
    if (cartDrawer) cartDrawer.classList.remove('open');
    if (cartOverlay) cartOverlay.classList.remove('open');
  }

  if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCart);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  // Hamburger / Mobile Navigation
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
  const mobileNavClose = document.getElementById('mobile-nav-close');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  const mobileNavDrawer = mobileNavOverlay ? mobileNavOverlay.querySelector('.mobile-nav-drawer') : null;

  if (hamburgerBtn && mobileNavOverlay) {
    hamburgerBtn.addEventListener('click', () => {
      mobileNavOverlay.classList.add('open');
      hamburgerBtn.classList.add('open');
      document.body.style.overflow = 'hidden'; // lock page scroll
    });
  }

  function closeMobileNav() {
    if (mobileNavOverlay) mobileNavOverlay.classList.remove('open');
    if (hamburgerBtn) hamburgerBtn.classList.remove('open');
    document.body.style.overflow = ''; // restore page scroll
  }

  if (mobileNavClose) mobileNavClose.addEventListener('click', closeMobileNav);
  mobileNavLinks.forEach(link => link.addEventListener('click', closeMobileNav));

  // Click on the dimmed backdrop (outside the drawer) to close
  if (mobileNavOverlay) {
    mobileNavOverlay.addEventListener('click', (e) => {
      if (mobileNavDrawer && !mobileNavDrawer.contains(e.target)) {
        closeMobileNav();
      }
    });
  }

  // Corporate Concierge Inquiry Modal
  const corporateNavBtn = document.getElementById('corporate-nav-btn');
  const corporateMobileBtn = document.getElementById('corporate-mobile-btn');
  const inquiryModal = document.getElementById('corporate-inquiry-modal');
  const inquiryCloseBtn = inquiryModal ? inquiryModal.querySelector('.inquiry-close-btn') : null;
  const inquiryForm = document.getElementById('corporate-inquiry-form');

  function openInquiry() {
    if (inquiryModal) inquiryModal.classList.add('open');
    closeMobileNav();
  }

  function closeInquiry() {
    if (inquiryModal) inquiryModal.classList.remove('open');
  }

  if (corporateNavBtn) corporateNavBtn.addEventListener('click', openInquiry);
  if (corporateMobileBtn) corporateMobileBtn.addEventListener('click', openInquiry);
  if (inquiryCloseBtn) inquiryCloseBtn.addEventListener('click', closeInquiry);
  
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast("Concierge request sent! We will contact you shortly.");
      closeInquiry();
      inquiryForm.reset();
    });
  }

  // Initial cart count rendering
  updateCartCount();
}

// Update Header Cart Count Badge
export function updateCartCount() {
  const badge = document.getElementById('header-cart-count');
  if (badge) {
    const totalQty = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalQty;
  }
}

// Render dynamic cart items
export function renderCartItems() {
  const container = document.getElementById('cart-items-container');
  const subtotalDisplay = document.getElementById('cart-subtotal-val') || document.getElementById('cart-subtotal-display');
  
  if (!container) return;
  container.innerHTML = '';

  if (state.cart.length === 0) {
    container.innerHTML = `<div class="cart-empty-msg">Your selection drawer is empty.</div>`;
    if (subtotalDisplay) subtotalDisplay.textContent = '$0.00';
    return;
  }

  let subtotal = 0;

  state.cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    const cartRow = document.createElement('div');
    cartRow.className = 'cart-item';
    
    // Support either single cookie image or box builder mock image
    const itemImg = getImageKitUrl(item.image);

    cartRow.innerHTML = `
      <img src="${itemImg}" alt="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-details">Quantity: ${item.quantity} &times; $${item.price}</div>
        <div class="cart-item-price">$${itemTotal.toFixed(2)}</div>
      </div>
      <button class="cart-item-remove" data-index="${index}">&times;</button>
    `;
    container.appendChild(cartRow);
  });

  if (subtotalDisplay) {
    subtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
  }

  // Remove item listeners
  container.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.getAttribute('data-index'));
      const removedItem = state.cart[idx];
      state.cart.splice(idx, 1);
      saveCart();
      renderCartItems();
      updateCartCount();
      showToast(`Removed ${removedItem.name} from selection bag.`);
    });
  });
}

// Add item to bag function
export function addCookieToCart(cookieName, price, imagePath) {
  const existing = state.cart.find(item => item.name === cookieName);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      name: cookieName,
      price: parseFloat(price),
      image: imagePath,
      quantity: 1
    });
  }
  saveCart();
  updateCartCount();
  showToast(`Added ${cookieName} selection to bag.`);
}

// Generate the HTML for an alternating showcase row
export function generateShowcaseRowHTML(cookie, index) {
  const isReverse = index % 2 === 1 ? ' showcase-reverse' : '';
  const numStr = String(index + 1).padStart(2, '0');
  
  // Transform image source using ImageKit url helper if configured
  const imgUrl = getImageKitUrl(cookie.image);

  return `
    <div class="showcase-row reveal${isReverse}" id="showcase-${cookie.id}">
      <div class="showcase-img-col">
        <div class="showcase-img-wrapper">
          <img src="${imgUrl}" alt="${cookie.name}" class="showcase-img">
        </div>
      </div>
      <div class="showcase-text-col">
        <div class="showcase-text-content">
          <span class="showcase-num">${numStr} / 10</span>
          <h3 class="showcase-title">${cookie.name}</h3>
          <p class="showcase-ingredients">${cookie.ingredients}</p>
          <p class="showcase-desc">${cookie.description}</p>
          <div class="showcase-action">
            <span class="showcase-price">$${cookie.price} / Selection Box of 6</span>
            <button class="cookie-add-btn showcase-btn" 
              data-cookie="${cookie.name}" 
              data-price="${cookie.price}" 
              data-image="${cookie.image}">
              + Add Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
