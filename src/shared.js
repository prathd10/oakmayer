// Shared module for Oakmere Website (Vite/ES6)
import { fetchCookies, createOrder } from './db/supabase.js';
import { getImageKitUrl } from './utils/imagekit.js';

// Global cart state with localStorage persistence
export const state = {
  cart: JSON.parse(localStorage.getItem('oakmere_cart')) || [],
  customizer: {
    capacity: 6,
    price: 1500.00,
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

  // Secure checkout button trigger (cart drawer footer)
  const checkoutBtn = document.getElementById('checkout-action-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (state.cart.length > 0) {
        // Close cart drawer first
        const cartDrawer = document.getElementById('cart-drawer-panel');
        const cartOverlay = document.getElementById('cart-drawer-overlay');
        if (cartDrawer) cartDrawer.classList.remove('open');
        if (cartOverlay) cartOverlay.classList.remove('open');
        
        openCheckoutModal();
      } else {
        showToast("Your selection drawer is empty. Add cookies first!");
      }
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
    if (subtotalDisplay) subtotalDisplay.textContent = '₹0.00';
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
        <div class="cart-item-details">Quantity: ${item.quantity} &times; ₹${item.price}</div>
        <div class="cart-item-price">₹${itemTotal.toFixed(2)}</div>
      </div>
      <button class="cart-item-remove" data-index="${index}">&times;</button>
    `;
    container.appendChild(cartRow);
  });

  if (subtotalDisplay) {
    subtotalDisplay.textContent = `₹${subtotal.toFixed(2)}`;
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
            <span class="showcase-price">₹${cookie.price} / Selection Box of 6</span>
            <button class="cookie-add-btn showcase-btn" 
              data-id="${cookie.id}"
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

// --- SECURE CHECKOUT MODAL LOGIC ---

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function openCheckoutModal() {
  const modal = createCheckoutModal();
  const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalDisplay = modal.querySelector('#checkout-total-val');
  if (totalDisplay) {
    totalDisplay.textContent = `₹${total.toFixed(2)}`;
  }
  modal.classList.add('open');
}

function createCheckoutModal() {
  let modal = document.getElementById('checkout-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'checkout-modal';
  modal.className = 'inquiry-modal-overlay'; // Re-use luxury inquiry modal styling
  
  modal.innerHTML = `
    <div class="inquiry-modal-card checkout-modal-card" style="max-width: 600px; padding: 3rem; border: 2px solid var(--navy-blue);">
      <button class="inquiry-close-btn" id="checkout-close-btn" aria-label="Close Checkout Modal" style="font-weight: 700;">&times;</button>
      <div class="inquiry-modal-header" style="margin-bottom: 2.2rem; text-align: left;">
        <span class="gold-accent" style="font-weight: 800; letter-spacing: 0.18em; font-size: 0.75rem;">SECURE TRANSACTION TERMINAL</span>
        <h2 style="font-family: var(--font-primary); font-weight: 300; font-size: 2.6rem; color: var(--navy-blue); margin-top: 0.5rem; line-height: 1.1;">Complete Your Curation</h2>
        <p style="font-size: 0.88rem; color: rgba(38, 57, 72, 0.7); margin-top: 0.5rem; line-height: 1.5; font-family: var(--font-sans);">Please enter your delivery details. Payment processing is mock-simulated.</p>
      </div>
      <form class="inquiry-form" id="checkout-form" style="text-align: left;">
        <div class="inquiry-form-row" style="margin-bottom: 1.2rem;">
          <div class="inquiry-form-group">
            <label for="checkout-first-name" style="font-weight: 800; font-family: var(--font-sans); text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.72rem; color: var(--navy-blue); display: block; margin-bottom: 0.4rem;">First Name *</label>
            <input type="text" id="checkout-first-name" required placeholder="Alexander" style="font-weight: 600; border: 2px solid rgba(38, 57, 72, 0.15); padding: 0.8rem; width: 100%; border-radius: 0; outline: none; font-size: 0.92rem; font-family: var(--font-sans); transition: border-color 0.2s;">
          </div>
          <div class="inquiry-form-group">
            <label for="checkout-last-name" style="font-weight: 800; font-family: var(--font-sans); text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.72rem; color: var(--navy-blue); display: block; margin-bottom: 0.4rem;">Last Name *</label>
            <input type="text" id="checkout-last-name" required placeholder="Vance" style="font-weight: 600; border: 2px solid rgba(38, 57, 72, 0.15); padding: 0.8rem; width: 100%; border-radius: 0; outline: none; font-size: 0.92rem; font-family: var(--font-sans); transition: border-color 0.2s;">
          </div>
        </div>
        <div class="inquiry-form-row" style="margin-bottom: 1.2rem;">
          <div class="inquiry-form-group">
            <label for="checkout-email" style="font-weight: 800; font-family: var(--font-sans); text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.72rem; color: var(--navy-blue); display: block; margin-bottom: 0.4rem;">Email Address *</label>
            <input type="email" id="checkout-email" required placeholder="alex@company.com" style="font-weight: 600; border: 2px solid rgba(38, 57, 72, 0.15); padding: 0.8rem; width: 100%; border-radius: 0; outline: none; font-size: 0.92rem; font-family: var(--font-sans); transition: border-color 0.2s;">
          </div>
          <div class="inquiry-form-group">
            <label for="checkout-phone" style="font-weight: 800; font-family: var(--font-sans); text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.72rem; color: var(--navy-blue); display: block; margin-bottom: 0.4rem;">Phone Number *</label>
            <input type="tel" id="checkout-phone" required placeholder="+91 98765 43210" style="font-weight: 600; border: 2px solid rgba(38, 57, 72, 0.15); padding: 0.8rem; width: 100%; border-radius: 0; outline: none; font-size: 0.92rem; font-family: var(--font-sans); transition: border-color 0.2s;">
          </div>
        </div>
        <div class="inquiry-form-group" style="margin-bottom: 1.8rem;">
          <label for="checkout-address" style="font-weight: 800; font-family: var(--font-sans); text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.72rem; color: var(--navy-blue); display: block; margin-bottom: 0.4rem;">Shipping Address *</label>
          <input type="text" id="checkout-address" required placeholder="456 Oakmayer Lane, Mumbai, MH, 400001" style="font-weight: 600; border: 2px solid rgba(38, 57, 72, 0.15); padding: 0.8rem; width: 100%; border-radius: 0; outline: none; font-size: 0.92rem; font-family: var(--font-sans); transition: border-color 0.2s;">
        </div>
        
        <div class="checkout-summary-box" style="background: rgba(38, 57, 72, 0.04); padding: 1.2rem; margin-bottom: 2rem; border-left: 3px solid var(--gold);">
          <div style="display: flex; justify-content: space-between; font-weight: 800; font-family: var(--font-sans); font-size: 0.78rem; letter-spacing: 0.08em; color: var(--navy-blue); align-items: center;">
            <span>TOTAL AMOUNT PAYABLE:</span>
            <span id="checkout-total-val" style="color: var(--gold); font-size: 1.15rem; font-weight: 800;">₹0.00</span>
          </div>
        </div>

        <button type="submit" class="btn-premium btn-hero inquiry-submit-btn" style="width: 100%; padding: 1.1rem; border-radius: 0; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; font-size: 0.85rem;">Authorize & Place Order</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // Focus effect for inputs
  const inputs = modal.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.style.borderColor = 'var(--navy-blue)';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = 'rgba(38, 57, 72, 0.15)';
    });
  });

  // Bind close buttons
  const closeBtn = modal.querySelector('#checkout-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  // Bind form submit
  const form = modal.querySelector('#checkout-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleCheckoutSubmit(form, modal);
    });
  }

  return modal;
}

async function handleCheckoutSubmit(form, modal) {
  const firstName = document.getElementById('checkout-first-name').value.trim();
  const lastName = document.getElementById('checkout-last-name').value.trim();
  const email = document.getElementById('checkout-email').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  const address = document.getElementById('checkout-address').value.trim();

  const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const orderItems = state.cart.map(item => ({
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image
  }));

  // Generate order ID like #ba8d93aa
  const orderId = '#' + Math.random().toString(16).substring(2, 10);

  const orderData = {
    id: orderId,
    customer_name: `${firstName} ${lastName}`,
    customer_email: email,
    customer_phone: phone,
    shipping_address: address,
    amount: total,
    status: 'Paid', // default status
    items: orderItems
  };

  showToast("Authorizing payment transaction...");
  
  const { data, error } = await createOrder(orderData);
  if (error) {
    showToast("Failed to place order. Database table missing?");
    console.error("Order creation failed", error);
  } else {
    // Clear cart locally first so background reflects it
    state.cart = [];
    saveCart();
    updateCartCount();
    
    // Display Thank You screen inside the modal card!
    showThankYouScreen(modal, orderId, email);
  }
}

function showThankYouScreen(modal, orderId, email) {
  const card = modal.querySelector('.inquiry-modal-card');
  if (!card) return;

  card.innerHTML = `
    <button class="inquiry-close-btn" id="thankyou-close-btn" aria-label="Close Modal" style="font-weight: 700;">&times;</button>
    <div style="text-align: center; padding: 2rem 1rem;">
      <div style="width: 80px; height: 80px; background: rgba(197, 160, 89, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem auto; border: 2px solid var(--gold);">
        <span style="font-size: 2.5rem; color: var(--gold); line-height: 1; font-weight: bold;">✓</span>
      </div>
      <span class="gold-accent" style="letter-spacing: 0.2em; font-size: 0.8rem; font-weight: 800; text-transform: uppercase;">TRANSACTION SUCCESSFUL</span>
      <h2 style="font-family: var(--font-primary); font-size: 2.8rem; font-weight: 300; color: var(--navy-blue); margin: 0.8rem 0 1.5rem 0; line-height: 1.1;">Thank You for Your Order</h2>
      <p style="color: rgba(38, 57, 72, 0.75); font-size: 0.95rem; line-height: 1.6; max-width: 480px; margin: 0 auto 2rem auto; font-family: var(--font-sans);">
        Your selection caskets have been registered. Our culinary artisans are preparing your curations for dispatch.
      </p>
      
      <div style="border: 1px dashed rgba(197, 160, 89, 0.4); background: rgba(197, 160, 89, 0.03); padding: 1.5rem; margin-bottom: 2.5rem; display: inline-block; min-width: 320px;">
        <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(38, 57, 72, 0.5); display: block; margin-bottom: 0.4rem; font-weight: 700; font-family: var(--font-sans);">YOUR UNIQUE ORDER ID</span>
        <strong style="font-family: var(--font-secondary); font-size: 1.8rem; color: var(--gold); font-weight: 800; letter-spacing: 0.05em;">${orderId}</strong>
      </div>

      <p style="font-size: 0.85rem; color: rgba(38, 57, 72, 0.6); margin-bottom: 2rem; font-family: var(--font-sans);">
        A receipt and shipping tracking log has been dispatched to <strong style="color: var(--navy-blue); font-weight: 700;">${escapeHTML(email)}</strong>.
      </p>

      <button id="thankyou-continue-btn" class="btn-premium btn-hero" style="padding: 1rem 3rem; min-width: 240px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; font-size: 0.8rem; border-radius: 0;">Continue Curation</button>
    </div>
  `;

  const closeBtn = card.querySelector('#thankyou-close-btn');
  const continueBtn = card.querySelector('#thankyou-continue-btn');

  const closeHandler = () => {
    modal.classList.remove('open');
    // Remove the modal so it generates fresh next time
    setTimeout(() => modal.remove(), 500);
  };

  if (closeBtn) closeBtn.addEventListener('click', closeHandler);
  if (continueBtn) continueBtn.addEventListener('click', closeHandler);
}
