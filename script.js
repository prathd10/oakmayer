document.addEventListener('DOMContentLoaded', () => {

  // Premium Website Loader Logic
  const loaderScreen = document.getElementById('loader-screen');
  const loaderProgress = document.getElementById('loader-progress-line');

  // Trigger progress line load animation after bar fades in (1s)
  setTimeout(() => {
    if (loaderProgress) {
      loaderProgress.style.width = '100%';
    }
  }, 1100);

  // Fade out loader and transition hero elements after loading completes
  setTimeout(() => {
    if (loaderScreen) {
      loaderScreen.classList.add('fade-out');
      document.body.classList.add('loaded');
      
      // Remove loader from DOM after transition completes
      setTimeout(() => {
        loaderScreen.remove();
      }, 800);
    }
  }, 3600); // Slower, premium entry delay

  // Global State
  const state = {
    cart: [],
    customizer: {
      capacity: 6,
      price: 25.00,
      title: "The Classic Drawer",
      mode: "personal", // 'personal' or 'gift'
      selections: {
        'chocolate-chunk': { count: 0, name: "Chocolate Chunk", image: "assets/hero_cookie.png" },
        'hazelnut-praline': { count: 0, name: "Hazelnut Praline", image: "assets/cookie_hazelnut.png" },
        'pistachio-rose': { count: 0, name: "Pistachio Rose", image: "assets/cookie_pistachio.png" },
        'smoked-pecan': { count: 0, name: "Smoked Pecan", image: "assets/cookie_pecan.png" },
        'sesame-matcha': { count: 0, name: "Sesame Matcha", image: "assets/cookie_sesame.png" },
        'lavender-earl': { count: 0, name: "Lavender Earl Grey", image: "assets/cookie_lavender.png" },
        'salted-caramel': { count: 0, name: "Salted Caramel Toffee", image: "assets/cookie_caramel.png" }
      }
    }
  };

  // Header Scroll Effect
  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Scroll Reveal Animation (Intersection Observer)
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target); // Reveal once
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // Shopping Bag Drawer Toggle
  const cartDrawer = document.getElementById('cart-drawer-panel');
  const cartOverlay = document.getElementById('cart-drawer-overlay');
  const cartToggleBtn = document.getElementById('cart-toggle-btn');
  const cartCloseBtn = document.getElementById('cart-close-btn');

  function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
  }

  function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
  }

  cartToggleBtn.addEventListener('click', openCart);
  cartCloseBtn.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  // -----------------------------------------------
  // Hamburger / Mobile Navigation
  // -----------------------------------------------
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
  const mobileNavClose = document.getElementById('mobile-nav-close');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  const corporateMobileBtn = document.getElementById('corporate-mobile-btn');

  function openMobileNav() {
    mobileNavOverlay.classList.add('open');
    hamburgerBtn.classList.add('open');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    mobileNavOverlay.classList.remove('open');
    hamburgerBtn.classList.remove('open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', openMobileNav);
  }
  if (mobileNavClose) {
    mobileNavClose.addEventListener('click', closeMobileNav);
  }

  // Close mobile nav when any link is clicked
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });

  // Corporate Concierge from mobile nav
  if (corporateMobileBtn) {
    corporateMobileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeMobileNav();
      setTimeout(() => {
        const modal = document.getElementById('corporate-inquiry-modal');
        if (modal) modal.classList.add('open');
      }, 400);
    });
  }

  // Toast Notification System
  const toastWrapper = document.getElementById('toast-wrapper');
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <span>${message}</span>
    `;
    toastWrapper.appendChild(toast);

    // Fade out and remove toast
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, 3000);
  }

  // Cart Management
  const cartItemsContainer = document.getElementById('cart-items-container');
  const emptyCartMessage = document.getElementById('empty-cart-message');
  const cartSubtotalDisplay = document.getElementById('cart-subtotal-display');
  const headerCartCount = document.getElementById('header-cart-count');

  function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    
    if (state.cart.length === 0) {
      emptyCartMessage.style.display = 'block';
      cartItemsContainer.appendChild(emptyCartMessage);
      cartSubtotalDisplay.textContent = '$0.00';
      headerCartCount.textContent = '0';
      return;
    }

    emptyCartMessage.style.display = 'none';
    let subtotal = 0;
    let totalItems = 0;

    state.cart.forEach((item, index) => {
      subtotal += item.price * item.quantity;
      totalItems += item.quantity;

      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-details">${item.description}</div>
          <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.quantity}</div>
        </div>
        <button class="cart-item-remove" data-index="${index}">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      `;
      cartItemsContainer.appendChild(itemEl);
    });

    cartSubtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
    headerCartCount.textContent = totalItems.toString();

    // Hook remove buttons
    const removeButtons = cartItemsContainer.querySelectorAll('.cart-item-remove');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'));
        const removedItemName = state.cart[index].name;
        state.cart.splice(index, 1);
        updateCartUI();
        showToast(`Removed "${removedItemName}" from Bag`);
      });
    });
  }

  function addItemToCart(name, price, description, image) {
    // Check if duplicate item exists
    const existingIndex = state.cart.findIndex(item => item.name === name && item.description === description);
    
    if (existingIndex > -1) {
      state.cart[existingIndex].quantity += 1;
    } else {
      state.cart.push({
        name,
        price,
        description,
        image,
        quantity: 1
      });
    }
    
    updateCartUI();
    openCart();
  }

  // Pre-made menu items click handler
  const addMenuButtons = document.querySelectorAll('.cookie-add-btn');
  addMenuButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cookieName = btn.getAttribute('data-cookie');
      const price = parseFloat(btn.getAttribute('data-price'));
      const image = btn.getAttribute('data-image');
      
      addItemToCart(
        `Signature Selection Box`, 
        price, 
        `Selection of 6x ${cookieName}`, 
        image
      );
      showToast(`Added Selection Box: ${cookieName} to Bag`);
    });
  });

  // Build Your Box Customizer Logic
  const boxSlotsWrapper = document.getElementById('box-slots-wrapper');
  const sizeButtons = document.querySelectorAll('.size-btn');
  const visualBoxTitle = document.getElementById('visual-box-title');
  const visualBoxSubtitle = document.getElementById('visual-box-subtitle');
  const filledSlotsCount = document.getElementById('filled-slots-count');
  const totalSlotsCount = document.getElementById('total-slots-count');
  const configPriceDisplay = document.getElementById('configurator-price-display');
  const configAddToCartBtn = document.getElementById('configurator-add-to-cart-btn');

  // Qty elements
  const qtyValChocolate = document.getElementById('qty-chocolate-chunk');
  const qtyValHazelnut = document.getElementById('qty-hazelnut-praline');
  const qtyValPistachio = document.getElementById('qty-pistachio-rose');
  const qtyValPecan = document.getElementById('qty-smoked-pecan');
  const qtyValSesame = document.getElementById('qty-sesame-matcha');

  function initBoxSlots() {
    boxSlotsWrapper.innerHTML = '';
    
    // Adjust layout columns based on size
    boxSlotsWrapper.className = 'box-slots-container';
    if (state.customizer.capacity === 6) {
      boxSlotsWrapper.classList.add('box-6');
    } else if (state.customizer.capacity === 12) {
      boxSlotsWrapper.classList.add('box-12');
    } else if (state.customizer.capacity === 24) {
      boxSlotsWrapper.classList.add('box-24');
    }

    // Generate slots with clean number indicators
    for (let i = 0; i < state.customizer.capacity; i++) {
      const slot = document.createElement('div');
      slot.className = 'box-slot';
      slot.setAttribute('data-slot-index', i);
      const indexStr = (i + 1).toString().padStart(2, '0');
      slot.innerHTML = `<span class="slot-index">${indexStr}</span>`;
      boxSlotsWrapper.appendChild(slot);
    }

    // Reset selection counts
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
    qtyValChocolate.textContent = state.customizer.selections['chocolate-chunk'].count;
    qtyValHazelnut.textContent = state.customizer.selections['hazelnut-praline'].count;
    qtyValPistachio.textContent = state.customizer.selections['pistachio-rose'].count;
    if (qtyValPecan) qtyValPecan.textContent = state.customizer.selections['smoked-pecan'].count;
    if (qtyValSesame) qtyValSesame.textContent = state.customizer.selections['sesame-matcha'].count;

    // Calculate total filled slots
    let totalSelected = 0;
    for (let key in state.customizer.selections) {
      totalSelected += state.customizer.selections[key].count;
    }

    filledSlotsCount.textContent = totalSelected;
    totalSlotsCount.textContent = state.customizer.capacity;
    
    // Update price based on mode
    calculateCurrentPrice();
    configPriceDisplay.textContent = `$${state.customizer.price.toFixed(2)}`;

    // Enable/disable add to cart button
    if (totalSelected === state.customizer.capacity) {
      configAddToCartBtn.removeAttribute('disabled');
      visualBoxSubtitle.textContent = "Box is beautifully complete!";
    } else {
      configAddToCartBtn.setAttribute('disabled', 'true');
      const remaining = state.customizer.capacity - totalSelected;
      visualBoxSubtitle.textContent = `Select ${remaining} more cookie${remaining > 1 ? 's' : ''} to complete box`;
    }

    // Enable/disable add buttons
    const incBtns = document.querySelectorAll('.inc-btn');
    incBtns.forEach(btn => {
      if (totalSelected >= state.customizer.capacity) {
        btn.setAttribute('disabled', 'true');
      } else {
        btn.removeAttribute('disabled');
      }
    });

    // Enable/disable dec buttons
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

  // Handle Box Size Clicks
  sizeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      sizeButtons.forEach(b => b.classList.remove('active'));
      const activeBtn = e.currentTarget;
      activeBtn.classList.add('active');

      const capacity = parseInt(activeBtn.getAttribute('data-size'));
      const title = activeBtn.getAttribute('data-title');

      state.customizer.capacity = capacity;
      state.customizer.title = title;

      if (state.customizer.mode === 'gift') {
        visualBoxTitle.textContent = title.replace("Drawer", "Gifting Drawer").replace("Cabinet", "Gifting Cabinet").replace("Vault", "Gifting Vault");
      } else {
        visualBoxTitle.textContent = title;
      }

      initBoxSlots();
      showToast(`Selected ${title} (${capacity} Slots)`);
    });
  });

  // Handle Configurator Tabs Toggle
  const tabBtnPersonal = document.getElementById('tab-btn-personal');
  const tabBtnGifting = document.getElementById('tab-btn-gifting');
  const giftingDetailsStep = document.getElementById('gifting-details-step');

  function setCustomizerMode(mode) {
    state.customizer.mode = mode;
    if (mode === 'gift') {
      tabBtnPersonal.classList.remove('active');
      tabBtnGifting.classList.add('active');
      giftingDetailsStep.style.display = 'block';
      visualBoxTitle.textContent = state.customizer.title.replace("Drawer", "Gifting Drawer").replace("Cabinet", "Gifting Cabinet").replace("Vault", "Gifting Vault");
    } else {
      tabBtnPersonal.classList.add('active');
      tabBtnGifting.classList.remove('active');
      giftingDetailsStep.style.display = 'none';
      visualBoxTitle.textContent = state.customizer.title;
    }
    updateConfigQuantitiesUI();
  }

  if (tabBtnPersonal && tabBtnGifting) {
    tabBtnPersonal.addEventListener('click', () => setCustomizerMode('personal'));
    tabBtnGifting.addEventListener('click', () => setCustomizerMode('gift'));
  }

  // Handle Qty Add/Sub in Customizer
  const quantityControls = document.querySelectorAll('.config-quantity-selector');
  quantityControls.forEach(ctrl => {
    const incBtn = ctrl.querySelector('.inc-btn');
    const decBtn = ctrl.querySelector('.dec-btn');
    
    incBtn.addEventListener('click', () => {
      const key = incBtn.getAttribute('data-target');
      
      // Calculate total filled slots
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

    decBtn.addEventListener('click', () => {
      const key = decBtn.getAttribute('data-target');
      if (state.customizer.selections[key].count > 0) {
        state.customizer.selections[key].count--;
        clearLastVisualSlot(key);
        updateConfigQuantitiesUI();
      }
    });
  });

  function fillNextVisualSlot(key) {
    const slots = boxSlotsWrapper.querySelectorAll('.box-slot');
    const cookieData = state.customizer.selections[key];
    
    // Find first empty slot
    for (let i = 0; i < slots.length; i++) {
      if (!slots[i].classList.contains('filled')) {
        slots[i].classList.add('filled');
        slots[i].setAttribute('data-cookie-type', key);
        slots[i].innerHTML = `<img src="${cookieData.image}" alt="${cookieData.name}">`;
        break;
      }
    }
  }

  function clearLastVisualSlot(key) {
    const slots = boxSlotsWrapper.querySelectorAll('.box-slot');
    
    // Find last slot filled with this cookie type
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

  // Add Custom Box to Cart
  configAddToCartBtn.addEventListener('click', () => {
    // Generate assortment description
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
      const message = document.getElementById('gift-message-input').value.trim();
      
      description += ` | Wrap: ${ribbon} Ribbon, ${seal} Seal`;
      if (message) {
        description += ` (Message: "${message}")`;
      }
    } else {
      description = `Custom Selection: ${description}`;
    }

    // Add to cart
    addItemToCart(
      productName,
      state.customizer.price,
      description,
      "assets/cookie_box.png"
    );

    showToast(`Added ${productName} to Bag!`);
    
    // Reset customizer
    initBoxSlots();
    if (state.customizer.mode === 'gift') {
      document.getElementById('gift-message-input').value = '';
    }
  });

  // Initialize configurator slots
  initBoxSlots();

  // Testimonials Carousel Logic
  const testimonialSlides = document.querySelectorAll('.review-slide');
  const testimonialDots = document.querySelectorAll('.dot');
  let currentReviewIndex = 0;
  let testimonialInterval;

  function showReview(index) {
    testimonialSlides.forEach(slide => slide.classList.remove('active'));
    testimonialDots.forEach(dot => dot.classList.remove('active'));

    testimonialSlides[index].classList.add('active');
    testimonialDots[index].classList.add('active');
    currentReviewIndex = index;
  }

  testimonialDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      clearInterval(testimonialInterval); // Stop auto-switching when clicked
      const index = parseInt(e.currentTarget.getAttribute('data-index'));
      showReview(index);
      startAutoTestimonial(); // Restart timer
    });
  });

  function startAutoTestimonial() {
    testimonialInterval = setInterval(() => {
      let nextIndex = (currentReviewIndex + 1) % testimonialSlides.length;
      showReview(nextIndex);
    }, 6000);
  }

  // Start testimonial switcher
  startAutoTestimonial();

  // Newsletter Submit Toast
  const newsletterForm = document.getElementById('email-subscribe-form');
  const newsletterEmail = document.getElementById('newsletter-email-field');
  
  newsletterForm.addEventListener('submit', () => {
    const email = newsletterEmail.value;
    if (email) {
      showToast(`Request received! Welcome to the Oakmayer Circle.`);
      newsletterEmail.value = '';
    }
  });

  // Secure checkout button trigger
  const checkoutBtn = document.getElementById('checkout-action-btn');
  checkoutBtn.addEventListener('click', () => {
    if (state.cart.length > 0) {
      showToast("Directing to secure transaction terminal...");
    }
  });

  // Corporate Concierge Gifting Modal triggers
  const corporateModal = document.getElementById('corporate-inquiry-modal');
  const openCorporateBtn = document.getElementById('corporate-gifting-btn');
  const openCorporateNavBtn = document.getElementById('corporate-nav-btn');
  const closeCorporateBtn = document.getElementById('inquiry-close-btn');
  const corporateForm = document.getElementById('corporate-inquiry-form');

  function openCorporateModal(e) {
    if (e) e.preventDefault();
    if (corporateModal) corporateModal.classList.add('open');
  }

  function closeCorporateModal() {
    if (corporateModal) corporateModal.classList.remove('open');
  }

  if (openCorporateBtn) openCorporateBtn.addEventListener('click', openCorporateModal);
  if (openCorporateNavBtn) openCorporateNavBtn.addEventListener('click', openCorporateModal);
  if (closeCorporateBtn) closeCorporateBtn.addEventListener('click', closeCorporateModal);

  // Close modal when clicking outside the card
  if (corporateModal) {
    corporateModal.addEventListener('click', (e) => {
      if (e.target === corporateModal) {
        closeCorporateModal();
      }
    });
  }

  // Handle form submission
  if (corporateForm) {
    corporateForm.addEventListener('submit', () => {
      const name = document.getElementById('inquiry-name').value;
      const company = document.getElementById('inquiry-company').value;
      showToast(`Thank you, ${name}! Your inquiry for ${company} is submitted.`);
      closeCorporateModal();
      corporateForm.reset();
    });
  }

});
