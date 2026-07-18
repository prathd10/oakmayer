import { 
  initSharedFeatures, 
  state, 
  addCookieToCart, 
  generateShowcaseRowHTML, 
  showToast 
} from './shared.js';
import { fetchCookies } from './db/supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize shared structures (loader, nav, cart drawers, concierge desk)
  initSharedFeatures();

  // Dynamic load all 10 cookies in menu page
  const menuContainer = document.getElementById('menu-showcase-container');
  if (menuContainer) {
    const cookies = await fetchCookies();

    menuContainer.innerHTML = '';
    cookies.forEach((cookie, index) => {
      menuContainer.innerHTML += generateShowcaseRowHTML(cookie, index);
    });

    // Re-bind intersection observer for all page reveal items (including dynamic showcase)
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px"
    });
    revealElements.forEach(el => revealObserver.observe(el));

    // Bind click handlers for dynamic Selection Box buttons
    menuContainer.querySelectorAll('.cookie-add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = btn.getAttribute('data-cookie');
        const price = parseFloat(btn.getAttribute('data-price'));
        const image = btn.getAttribute('data-image');
        
        // Add to global cart as Selection Box package
        addCookieToCart(
          `Signature Selection Box`, 
          price, 
          image
        );
        showToast(`Added Selection Box: ${name} to Bag!`);
      });
    });
  }

  // Secure checkout button trigger (cart footer)
  const checkoutBtn = document.getElementById('checkout-action-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (state.cart.length > 0) {
        showToast("Directing to secure transaction terminal...");
      }
    });
  }
});
