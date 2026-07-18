import { initSharedFeatures, addCookieToCart, showToast } from './shared.js';
import { fetchGiftBoxes } from './db/supabase.js';
import { getImageKitUrl } from './utils/imagekit.js';

document.addEventListener('DOMContentLoaded', async () => {
  initSharedFeatures();

  // Wire corporate CTA button on gifting page
  const corporateBtnGifting = document.getElementById('corporate-nav-btn-gifting');
  const corporateModal = document.getElementById('corporate-inquiry-modal');
  if (corporateBtnGifting && corporateModal) {
    corporateBtnGifting.addEventListener('click', () => {
      corporateModal.classList.add('open');
    });
  }

  // Dynamic load all curated gift boxes
  const container = document.getElementById('gift-boxes-page-container');
  if (container) {
    const boxes = await fetchGiftBoxes();
    container.innerHTML = '';

    boxes.forEach((box, index) => {
      const imageUrl = getImageKitUrl(box.image);
      const isReverse = index % 2 !== 0;

      const cardHtml = `
        <div class="gifting-showcase-row ${isReverse ? 'gifting-showcase-reverse' : ''} reveal">
          <div class="gifting-img-col">
            <div class="gifting-img-wrapper">
              <img src="${imageUrl}" alt="${box.name}" class="gifting-img" loading="lazy">
            </div>
          </div>
          <div class="gifting-text-col">
            <span class="gift-box-curated">For ${box.curated_for}</span>
            <h2 class="gifting-card-title">${box.name}</h2>
            <p class="gifting-card-desc">${box.description}</p>
            <div class="gifting-card-contents">
              <span class="gifting-contents-label">Includes selection of:</span>
              <p>${box.contents}</p>
            </div>
            <div class="gifting-card-footer">
              <span class="gifting-card-price">₹${box.price}</span>
              <button class="gift-box-btn" data-name="${box.name}" data-price="${box.price}" data-image="${box.image}">Order This Casket</button>
            </div>
          </div>
        </div>
      `;
      container.innerHTML += cardHtml;
    });

    // Bind cart add buttons
    container.querySelectorAll('.gift-box-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const price = parseFloat(btn.getAttribute('data-price'));
        const image = btn.getAttribute('data-image');
        addCookieToCart(name, price, image);
        showToast(`Added ${name} to Bag!`);
      });
    });
  }

  // Global reveal observer
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
  revealElements.forEach(el => revealObserver.observe(el));
});
