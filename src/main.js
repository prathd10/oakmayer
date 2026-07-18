import { 
  initSharedFeatures, 
  state, 
  addCookieToCart, 
  generateShowcaseRowHTML, 
  showToast 
} from './shared.js';
import { fetchCookies, fetchGiftBoxes } from './db/supabase.js';
import { getImageKitUrl } from './utils/imagekit.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize standard elements (loader, navbar, cart drawers)
  initSharedFeatures();

  // Dynamic load top 4 cookies
  const showcaseContainer = document.getElementById('home-showcase-container');
  if (showcaseContainer) {
    const cookies = await fetchCookies();
    const topSellers = cookies.filter(c => c.top_seller).slice(0, 4);

    showcaseContainer.innerHTML = '';
    topSellers.forEach((cookie, index) => {
      showcaseContainer.innerHTML += generateShowcaseRowHTML(cookie, index);
    });

    // Add event listeners for dynamic add to cart buttons
    showcaseContainer.querySelectorAll('.cookie-add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = btn.getAttribute('data-cookie');
        const price = parseFloat(btn.getAttribute('data-price'));
        const image = btn.getAttribute('data-image');
        
        // Add as a selection box package
        addCookieToCart(
          `Signature Selection Box`, 
          price, 
          image
        );
        showToast(`Added Selection Box: ${name} to Bag!`);
      });
    });
  }

  // Dynamic load Curated Gift Boxes
  const giftBoxesContainer = document.getElementById('gift-boxes-container');
  if (giftBoxesContainer) {
    const giftBoxes = await fetchGiftBoxes();
    giftBoxesContainer.innerHTML = '';
    
    giftBoxes.forEach(box => {
      const imageUrl = getImageKitUrl(box.image);
      const cardHtml = `
        <div class="gift-box-card reveal">
          <div class="gift-box-img-wrapper">
            <img src="${imageUrl}" alt="${box.name}" class="gift-box-img" loading="lazy">
          </div>
          <div class="gift-box-details">
            <span class="gift-box-curated">For ${box.curated_for}</span>
            <h3 class="gift-box-title">${box.name}</h3>
            <p class="gift-box-desc">${box.description}</p>
            <div class="gift-box-contents">
              <span>Includes Selection of:</span>
              ${box.contents}
            </div>
            <div class="gift-box-footer">
              <span class="gift-box-price">$${box.price}</span>
              <button class="gift-box-btn" data-name="${box.name}" data-price="${box.price}" data-image="${box.image}">Order Casket</button>
            </div>
          </div>
        </div>
      `;
      giftBoxesContainer.innerHTML += cardHtml;
    });

    // Bind click handlers for dynamic gift box caskets
    giftBoxesContainer.querySelectorAll('.gift-box-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const price = parseFloat(btn.getAttribute('data-price'));
        const image = btn.getAttribute('data-image');
        
        // Add curated gift box item to cart
        addCookieToCart(name, price, image);
        showToast(`Added ${name} to Bag!`);
      });
    });
  }

  // Initialize scroll reveal observer globally after dynamic contents are loaded
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

  // ---------------------------------------------------
  // Build Your Box Customizer Logic
  // ---------------------------------------------------
  const boxSlotsWrapper = document.getElementById('box-slots-wrapper');
  const sizeButtons = document.querySelectorAll('.size-btn');
  const visualBoxTitle = document.getElementById('visual-box-title');
  const visualBoxSubtitle = document.getElementById('visual-box-subtitle');
  const filledSlotsCount = document.getElementById('filled-slots-count');
  const totalSlotsCount = document.getElementById('total-slots-count');
  const configPriceDisplay = document.getElementById('configurator-price-display');
  const configAddToCartBtn = document.getElementById('configurator-add-to-cart-btn');

  // Customizer quantity text inputs
  const qtyValChocolate = document.getElementById('qty-chocolate-chunk');
  const qtyValHazelnut = document.getElementById('qty-hazelnut-praline');
  const qtyValPistachio = document.getElementById('qty-pistachio-rose');
  const qtyValPecan = document.getElementById('qty-smoked-pecan');
  const qtyValSesame = document.getElementById('qty-sesame-matcha');

  function initBoxSlots() {
    if (!boxSlotsWrapper) return;
    boxSlotsWrapper.innerHTML = '';
    
    boxSlotsWrapper.className = 'box-slots-container';
    if (state.customizer.capacity === 6) {
      boxSlotsWrapper.classList.add('box-6');
    } else if (state.customizer.capacity === 12) {
      boxSlotsWrapper.classList.add('box-12');
    } else if (state.customizer.capacity === 24) {
      boxSlotsWrapper.classList.add('box-24');
    }

    for (let i = 0; i < state.customizer.capacity; i++) {
      const slot = document.createElement('div');
      slot.className = 'box-slot';
      slot.setAttribute('data-slot-index', i);
      const indexStr = (i + 1).toString().padStart(2, '0');
      slot.innerHTML = `<span class="slot-index">${indexStr}</span>`;
      boxSlotsWrapper.appendChild(slot);
    }

    for (let key in state.customizer.selections) {
      state.customizer.selections[key].count = 0;
    }
    updateConfigQuantitiesUI();
  }

  function calculateCurrentPrice() {
    const activeSizeBtn = document.querySelector('.size-btn.active');
    if (activeSizeBtn) {
      const basePrice = parseFloat(activeSizeBtn.getAttribute('data-price'));
      state.customizer.price = state.customizer.mode === 'gift' ? basePrice + 8.00 : basePrice;
    }
  }

  function updateConfigQuantitiesUI() {
    if (qtyValChocolate) qtyValChocolate.textContent = state.customizer.selections['chocolate-chunk'].count;
    if (qtyValHazelnut) qtyValHazelnut.textContent = state.customizer.selections['hazelnut-praline'].count;
    if (qtyValPistachio) qtyValPistachio.textContent = state.customizer.selections['pistachio-rose'].count;
    if (qtyValPecan) qtyValPecan.textContent = state.customizer.selections['smoked-pecan'].count;
    if (qtyValSesame) qtyValSesame.textContent = state.customizer.selections['sesame-matcha'].count;

    let totalSelected = 0;
    for (let key in state.customizer.selections) {
      totalSelected += state.customizer.selections[key].count;
    }

    if (filledSlotsCount) filledSlotsCount.textContent = totalSelected;
    if (totalSlotsCount) totalSlotsCount.textContent = state.customizer.capacity;
    
    calculateCurrentPrice();
    if (configPriceDisplay) configPriceDisplay.textContent = `$${state.customizer.price.toFixed(2)}`;

    if (configAddToCartBtn) {
      if (totalSelected === state.customizer.capacity) {
        configAddToCartBtn.removeAttribute('disabled');
        if (visualBoxSubtitle) visualBoxSubtitle.textContent = "Box is beautifully complete!";
      } else {
        configAddToCartBtn.setAttribute('disabled', 'true');
        const remaining = state.customizer.capacity - totalSelected;
        if (visualBoxSubtitle) visualBoxSubtitle.textContent = `Select ${remaining} more cookie${remaining > 1 ? 's' : ''} to complete box`;
      }
    }

    const incBtns = document.querySelectorAll('.inc-btn');
    incBtns.forEach(btn => {
      if (totalSelected >= state.customizer.capacity) {
        btn.setAttribute('disabled', 'true');
      } else {
        btn.removeAttribute('disabled');
      }
    });

    const decBtns = document.querySelectorAll('.dec-btn');
    decBtns.forEach(btn => {
      const key = btn.getAttribute('data-target');
      if (state.customizer.selections[key].count <= 0) {
        btn.setAttribute('disabled', 'true');
      } else {
        btn.removeAttribute('disabled');
      }
    });
  }

  sizeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      sizeButtons.forEach(b => b.classList.remove('active'));
      const activeBtn = e.currentTarget;
      activeBtn.classList.add('active');

      const capacity = parseInt(activeBtn.getAttribute('data-size'));
      const title = activeBtn.getAttribute('data-title');

      state.customizer.capacity = capacity;
      state.customizer.title = title;

      if (state.customizer.mode === 'gift' && visualBoxTitle) {
        visualBoxTitle.textContent = title.replace("Drawer", "Gifting Drawer").replace("Cabinet", "Gifting Cabinet").replace("Vault", "Gifting Vault");
      } else if (visualBoxTitle) {
        visualBoxTitle.textContent = title;
      }

      initBoxSlots();
      showToast(`Selected ${title} (${capacity} Slots)`);
    });
  });

  const tabBtnPersonal = document.getElementById('tab-btn-personal');
  const tabBtnGifting = document.getElementById('tab-btn-gifting');
  const giftingDetailsStep = document.getElementById('gifting-details-step');

  function setCustomizerMode(mode) {
    state.customizer.mode = mode;
    if (mode === 'gift') {
      if (tabBtnPersonal) tabBtnPersonal.classList.remove('active');
      if (tabBtnGifting) tabBtnGifting.classList.add('active');
      if (giftingDetailsStep) giftingDetailsStep.style.display = 'block';
      if (visualBoxTitle) visualBoxTitle.textContent = state.customizer.title.replace("Drawer", "Gifting Drawer").replace("Cabinet", "Gifting Cabinet").replace("Vault", "Gifting Vault");
    } else {
      if (tabBtnPersonal) tabBtnPersonal.classList.add('active');
      if (tabBtnGifting) tabBtnGifting.classList.remove('active');
      if (giftingDetailsStep) giftingDetailsStep.style.display = 'none';
      if (visualBoxTitle) visualBoxTitle.textContent = state.customizer.title;
    }
    updateConfigQuantitiesUI();
  }

  if (tabBtnPersonal && tabBtnGifting) {
    tabBtnPersonal.addEventListener('click', () => setCustomizerMode('personal'));
    tabBtnGifting.addEventListener('click', () => setCustomizerMode('gift'));
  }

  const quantityControls = document.querySelectorAll('.config-quantity-selector');
  quantityControls.forEach(ctrl => {
    const incBtn = ctrl.querySelector('.inc-btn');
    const decBtn = ctrl.querySelector('.dec-btn');
    
    if (incBtn) {
      incBtn.addEventListener('click', () => {
        const key = incBtn.getAttribute('data-target');
        let totalSelected = 0;
        for (let k in state.customizer.selections) {
          totalSelected += state.customizer.selections[k].count;
        }

        if (totalSelected < state.customizer.capacity) {
          state.customizer.selections[key].count++;
          fillNextVisualSlot(key);
          updateConfigQuantitiesUI();
        }
      });
    }

    if (decBtn) {
      decBtn.addEventListener('click', () => {
        const key = decBtn.getAttribute('data-target');
        if (state.customizer.selections[key].count > 0) {
          state.customizer.selections[key].count--;
          clearLastVisualSlot(key);
          updateConfigQuantitiesUI();
        }
      });
    }
  });

  function fillNextVisualSlot(key) {
    if (!boxSlotsWrapper) return;
    const slots = boxSlotsWrapper.querySelectorAll('.box-slot');
    const cookieData = state.customizer.selections[key];
    
    for (let i = 0; i < slots.length; i++) {
      if (!slots[i].classList.contains('filled')) {
        slots[i].classList.add('filled');
        slots[i].setAttribute('data-cookie-type', key);
        slots[i].innerHTML = `<img src="${getImageKitUrl(cookieData.image)}" alt="${cookieData.name}">`;
        break;
      }
    }
  }

  function clearLastVisualSlot(key) {
    if (!boxSlotsWrapper) return;
    const slots = boxSlotsWrapper.querySelectorAll('.box-slot');
    
    for (let i = slots.length - 1; i >= 0; i--) {
      if (slots[i].classList.contains('filled') && slots[i].getAttribute('data-cookie-type') === key) {
        slots[i].classList.remove('filled');
        slots[i].removeAttribute('data-cookie-type');
        const indexStr = (i + 1).toString().padStart(2, '0');
        slots[i].innerHTML = `<span class="slot-index">${indexStr}</span>`;
        break;
      }
    }
  }

  if (configAddToCartBtn) {
    configAddToCartBtn.addEventListener('click', () => {
      const pieces = [];
      for (let key in state.customizer.selections) {
        const selection = state.customizer.selections[key];
        if (selection.count > 0) {
          pieces.push(`${selection.count}x ${selection.name}`);
        }
      }
      let description = pieces.join(', ');
      let productName = state.customizer.mode === 'gift' ? 'Luxury Gift Selection Box' : 'Signature Selection Box';
      
      if (state.customizer.mode === 'gift') {
        const ribbon = document.getElementById('gift-ribbon-select').value;
        const seal = document.getElementById('gift-seal-select').value;
        const messageInput = document.getElementById('gift-message-input');
        const message = messageInput ? messageInput.value.trim() : '';
        
        description += ` | Wrap: ${ribbon} Ribbon, ${seal} Seal`;
        if (message) {
          description += ` (Message: "${message}")`;
        }
      } else {
        description = `Custom Selection: ${description}`;
      }

      addCookieToCart(
        productName,
        state.customizer.price,
        "assets/cookie_box.png"
      );

      showToast(`Added ${productName} to Bag!`);
      
      initBoxSlots();
      const giftMsg = document.getElementById('gift-message-input');
      if (giftMsg) giftMsg.value = '';
    });
  }

  initBoxSlots();

  // Testimonials Carousel Logic
  const testimonialSlides = document.querySelectorAll('.review-slide');
  const testimonialDots = document.querySelectorAll('.dot');
  let currentReviewIndex = 0;
  let testimonialInterval;

  function showReview(index) {
    testimonialSlides.forEach(slide => slide.classList.remove('active'));
    testimonialDots.forEach(dot => dot.classList.remove('active'));

    if (testimonialSlides[index]) testimonialSlides[index].classList.add('active');
    if (testimonialDots[index]) testimonialDots[index].classList.add('active');
    currentReviewIndex = index;
  }

  testimonialDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      clearInterval(testimonialInterval);
      const index = parseInt(e.currentTarget.getAttribute('data-index'));
      showReview(index);
      startAutoTestimonial();
    });
  });

  function startAutoTestimonial() {
    if (testimonialSlides.length > 0) {
      testimonialInterval = setInterval(() => {
        let nextIndex = (currentReviewIndex + 1) % testimonialSlides.length;
        showReview(nextIndex);
      }, 6000);
    }
  }

  startAutoTestimonial();

  // Newsletter Submit Toast
  const newsletterForm = document.getElementById('email-subscribe-form');
  const newsletterEmail = document.getElementById('newsletter-email-field');
  
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterEmail ? newsletterEmail.value : '';
      if (email) {
        showToast(`Welcome to the Oakmere Circle!`);
        if (newsletterEmail) newsletterEmail.value = '';
      }
    });
  }

  // Secure checkout button trigger
  const checkoutBtn = document.getElementById('checkout-action-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (state.cart.length > 0) {
        showToast("Directing to secure transaction terminal...");
      }
    });
  }
});
