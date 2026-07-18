// admin.js - Admin Portal Logic for Oakmere Artisanal Cookies
import { supabase, fetchOrders, updateOrderStatus, fetchCorporateInquiries, updateCorporateInquiryStatus } from '../src/db/supabase.js';

// --- CONFIGURATION & CLIENT INITIALIZATION ---

// Load credentials from environment variables directly
function getCredentials() {
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    imageKitEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '',
    imageKitPublicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '',
    imageKitPrivateKey: import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY || '',
  };
}

// Retrieve the Supabase client
function getSupabase() {
  return supabase;
}

// Helper to check if credentials are valid
function hasValidCredentials() {
  const creds = getCredentials();
  return !!(creds.supabaseUrl && creds.supabaseAnonKey);
}

// Helper to build ImageKit URL for client preview
function getImageKitUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('assets/') || path.startsWith('/assets/')) {
    return path;
  }
  const creds = getCredentials();
  const endpoint = creds.imageKitEndpoint.endsWith('/') ? creds.imageKitEndpoint : `${creds.imageKitEndpoint}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${endpoint}${cleanPath}`;
}

// --- DOM ELEMENTS ---
const loader = document.getElementById('admin-loader');
const loginScreen = document.getElementById('login-screen');
const dashboardLayout = document.getElementById('dashboard-layout');
const loginForm = document.getElementById('login-form');
const signoutBtn = document.getElementById('signout-btn');
const sidebarUserEmail = document.getElementById('sidebar-user-email');
const userAvatarInitial = document.getElementById('user-avatar-initial');

// Forms & Navigation
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const productForm = document.getElementById('product-form');
const productFormTitle = document.getElementById('product-form-title');
const productFormSubtitle = document.getElementById('product-form-subtitle');
const productFormCancel = document.getElementById('product-form-cancel');
// --- REALTIME STATE ---
let realtimeChannel = null;

// Image upload preview elements
const imageFileInput = document.getElementById('product-image-file');
const imagePreviewBox = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');
const fileNameLabel = document.getElementById('file-name-label');
const imagePathInput = document.getElementById('product-image-path');

// --- STATE MANAGER ---
let activeTab = 'dashboard';
let currentProducts = [];

// --- GLOBAL TOAST HELPER ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}

// Show/Hide loader overlay
function showLoader(visible) {
  if (visible) loader.classList.remove('hidden');
  else loader.classList.add('hidden');
}

// --- AUTHENTICATION & HISTORY ROUTING ---

// Navigate programmatically to a route path
export function navigate(path) {
  window.history.pushState({}, '', path);
  handleRoute();
}

async function handleRoute() {
  showLoader(true);
  
  if (!hasValidCredentials()) {
    showLoader(false);
    showToast("Supabase URL and Anon Key are not configured in .env.local!", "error");
    showLogin(true);
    return;
  }

  const supabase = getSupabase();
  if (!supabase) {
    showLoader(false);
    showToast("Failed to initialize Supabase client.", "error");
    return;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    const path = window.location.pathname.replace(/\/$/, ''); // strip trailing slash
    
    if (error || !user) {
      // Not authenticated: only /admin/login is allowed
      unsubscribeFromRealtime();
      if (path !== '/admin/login') {
        window.history.replaceState({}, '', '/admin/login');
      }
      showLogin(true);
    } else {
      // Authenticated: redirect away from /admin/login or root /admin to /admin/dashboard
      sidebarUserEmail.textContent = user.email;
      userAvatarInitial.textContent = user.email.charAt(0).toUpperCase();
      
      showLogin(false);
      subscribeToRealtime();
      
      if (path === '/admin/login' || path === '/admin' || path === '' || path === '/admin/') {
        window.history.replaceState({}, '', '/admin/dashboard');
        await switchTab('dashboard');
      } else if (path === '/admin/dashboard' || path.startsWith('/admin/dashboard')) {
        const params = new URLSearchParams(window.location.search);
        const subtab = params.get('tab') || 'dashboard';
        await switchTab(subtab);
      } else {
        // General fallback
        window.history.replaceState({}, '', '/admin/dashboard');
        await switchTab('dashboard');
      }
    }
  } catch (err) {
    console.error("Auth check failed", err);
    showLogin(true);
  } finally {
    showLoader(false);
  }
}

// Global popstate event handler for browser back/forward buttons
window.addEventListener('popstate', handleRoute);

function showLogin(visible) {
  if (visible) {
    loginScreen.classList.remove('hidden');
    dashboardLayout.classList.add('hidden');
  } else {
    loginScreen.classList.add('hidden');
    dashboardLayout.classList.remove('hidden');
  }
}

// Submit Sign In Form
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  showLoader(true);
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    showToast("Successfully authenticated!");
    loginForm.reset();
    navigate('/admin/dashboard');
  } catch (err) {
    showToast(err.message || "Failed to log in.", "error");
  } finally {
    showLoader(false);
  }
});

// Submit Sign Out
signoutBtn.addEventListener('click', async () => {
  showLoader(true);
  const supabase = getSupabase();
  try {
    unsubscribeFromRealtime();
    await supabase.auth.signOut();
    showToast("Successfully signed out.");
    navigate('/admin/login');
  } catch (err) {
    showToast("Error signing out.", "error");
  } finally {
    showLoader(false);
  }
});


// --- NAVIGATION & TABS ---

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const tabName = item.getAttribute('data-tab');
    if (tabName === 'dashboard') {
      navigate('/admin/dashboard');
    } else {
      navigate(`/admin/dashboard?tab=${tabName}`);
    }
  });
});

async function switchTab(tabName) {
  activeTab = tabName;
  
  // Update sidebar button states
  navItems.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  // Toggle visible sections
  tabContents.forEach(content => {
    if (content.id === `tab-${tabName}`) content.classList.remove('hidden');
    else content.classList.add('hidden');
  });

  // Reload data if needed
  if (tabName === 'dashboard') {
    await loadAnalytics();
  } else if (tabName === 'orders') {
    await loadOrders();
  } else if (tabName === 'corporate') {
    await loadCorporateInquiries();
  } else if (tabName === 'catalog') {
    await loadCatalog();
  } else if (tabName === 'add-product') {
    resetProductForm();
  }
}


// --- INITIALIZE DASHBOARD & LOAD DATA ---

async function initDashboard() {
  await loadAnalytics();
}

async function loadAnalytics() {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { data: cookies, error } = await supabase.from('cookies').select('*').order('id', { ascending: true });
    if (error) throw error;

    currentProducts = cookies || [];
    renderDashboard(currentProducts);
  } catch (err) {
    showToast("Error loading analytics data: " + err.message, "error");
  }
}

function renderDashboard(products) {
  let totalViews = 0;
  let totalClicks = 0;
  let topItem = null;
  let maxEngagement = -1;

  products.forEach(p => {
    const views = parseInt(p.views) || 0;
    const clicks = parseInt(p.clicks) || 0;
    totalViews += views;
    totalClicks += clicks;

    const engagement = views + clicks;
    if (engagement > maxEngagement && engagement > 0) {
      maxEngagement = engagement;
      topItem = p;
    }
  });

  // Populate Metric Cards
  document.getElementById('metric-views').textContent = totalViews.toLocaleString();
  document.getElementById('metric-clicks').textContent = totalClicks.toLocaleString();
  document.getElementById('metric-products').textContent = products.length;
  document.getElementById('metric-top-item').textContent = topItem ? topItem.name : "None";

  // Populate Engagement Report Table
  const tbody = document.getElementById('engagement-table-body');
  tbody.innerHTML = '';

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No products found in database.</td></tr>';
    return;
  }

  // Sort by engagement (views + clicks) descending
  const sortedProducts = [...products].sort((a, b) => {
    const engagementA = (parseInt(a.views) || 0) + (parseInt(a.clicks) || 0);
    const engagementB = (parseInt(b.views) || 0) + (parseInt(b.clicks) || 0);
    return engagementB - engagementA;
  });

  sortedProducts.forEach(p => {
    const views = parseInt(p.views) || 0;
    const clicks = parseInt(p.clicks) || 0;
    const total = views + clicks;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHTML(p.name)}</strong></td>
      <td class="text-right">${views.toLocaleString()}</td>
      <td class="text-right">${clicks.toLocaleString()}</td>
      <td class="text-right"><strong>${total.toLocaleString()}</strong></td>
    `;
    tbody.appendChild(tr);
  });
}


// --- CATALOG VIEW ---

async function loadCatalog() {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { data: cookies, error } = await supabase.from('cookies').select('*').order('id', { ascending: true });
    if (error) throw error;

    currentProducts = cookies || [];
    renderCatalog(currentProducts);
  } catch (err) {
    showToast("Error loading catalog: " + err.message, "error");
  }
}

function renderCatalog(products) {
  const container = document.getElementById('catalog-list-container');
  container.innerHTML = '';

  if (products.length === 0) {
    container.innerHTML = '<div class="text-center text-muted py-5" style="grid-column: 1/-1;">No products found in the catalog.</div>';
    return;
  }

  products.forEach(p => {
    const imageUrl = getImageKitUrl(p.image);
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-img-wrapper">
        <img src="${imageUrl}" alt="${escapeHTML(p.name)}" class="product-img" loading="lazy">
        ${p.top_seller ? '<span class="top-seller-badge">Top Seller</span>' : ''}
        <span class="product-id-badge">ID: ${p.id}</span>
      </div>
      <div class="product-details">
        <h3 class="product-title">${escapeHTML(p.name)}</h3>
        <p class="product-ingredients">${escapeHTML(p.ingredients)}</p>
        <p class="product-desc">${escapeHTML(p.description)}</p>
        <div class="product-footer">
          <span class="product-price">₹${parseFloat(p.price).toFixed(2)}</span>
          <div class="product-actions">
            <button class="btn-icon edit-btn" data-id="${p.id}" title="Edit Cookie">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon delete delete-btn" data-id="${p.id}" data-image="${escapeHTML(p.image)}" data-name="${escapeHTML(p.name)}" title="Delete Cookie">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // Bind Actions
  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const product = currentProducts.find(p => p.id == id);
      if (product) openEditProduct(product);
    });
  });

  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const imagePath = btn.getAttribute('data-image');
      const name = btn.getAttribute('data-name');
      confirmDeleteProduct(id, imagePath, name);
    });
  });
}

// Catalog search logic
document.getElementById('catalog-search').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  if (!query) {
    renderCatalog(currentProducts);
    return;
  }

  const filtered = currentProducts.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.ingredients.toLowerCase().includes(query)
  );
  renderCatalog(filtered);
});

// Shortcut buttons
document.getElementById('catalog-add-btn').addEventListener('click', () => {
  navigate('/admin/dashboard?tab=add-product');
});


// --- ADD / EDIT PRODUCT FORM ---

function resetProductForm() {
  productForm.reset();
  document.getElementById('product-id').value = '';
  productFormTitle.textContent = 'Add New Product';
  productFormSubtitle.textContent = 'Fill in the details below to add a product to the menu.';
  document.getElementById('product-custom-id-group').classList.remove('hidden');
  document.getElementById('product-custom-id').setAttribute('required', 'true');
  
  // Clear image fields
  imagePathInput.value = '';
  previewImg.src = '';
  previewImg.classList.add('hidden');
  imagePreviewBox.querySelector('.preview-placeholder').classList.remove('hidden');
  fileNameLabel.textContent = 'No file chosen';
}

function openEditProduct(product) {
  resetProductForm();
  
  document.getElementById('product-id').value = product.id;
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-ingredients').value = product.ingredients;
  document.getElementById('product-description').value = product.description;
  document.getElementById('product-top-seller').checked = product.top_seller;
  
  // Custom ID input is hidden during edit (we modify by primary key, which is the id)
  document.getElementById('product-custom-id-group').classList.add('hidden');
  document.getElementById('product-custom-id').removeAttribute('required');

  productFormTitle.textContent = 'Edit Product';
  productFormSubtitle.textContent = `Modifying cookie item: ${product.name}`;

  // Preview existing image
  if (product.image) {
    const imageUrl = getImageKitUrl(product.image);
    imagePathInput.value = product.image;
    previewImg.src = imageUrl;
    previewImg.classList.remove('hidden');
    imagePreviewBox.querySelector('.preview-placeholder').classList.add('hidden');
    fileNameLabel.textContent = getFilenameFromPath(product.image);
  }

  // Switch to product tab
  activeTab = 'add-product';
  navItems.forEach(btn => {
    if (btn.getAttribute('data-tab') === 'add-product') btn.classList.add('active');
    else btn.classList.remove('active');
  });
  tabContents.forEach(content => {
    if (content.id === 'tab-add-product') content.classList.remove('hidden');
    else content.classList.add('hidden');
  });
  
  // Keep URL in sync
  window.history.pushState({}, '', '/admin/dashboard?tab=add-product');
}

// Cancel click handler
productFormCancel.addEventListener('click', () => {
  navigate('/admin/dashboard?tab=catalog');
});

// Image File Selector Changed
imageFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Display chosen filename
  fileNameLabel.textContent = file.name;

  // Validate ImageKit credentials for uploading
  const creds = getCredentials();
  if (!creds.imageKitPublicKey || !creds.imageKitPrivateKey || !creds.imageKitEndpoint) {
    showToast("Please enter complete ImageKit settings to enable uploads.", "error");
    // Show local preview anyway
    const reader = new FileReader();
    reader.onload = (event) => {
      previewImg.src = event.target.result;
      previewImg.classList.remove('hidden');
      imagePreviewBox.querySelector('.preview-placeholder').classList.add('hidden');
    };
    reader.readAsDataURL(file);
    return;
  }

  // Upload to ImageKit
  showLoader(true);
  try {
    const uploadResult = await uploadToImageKit(file, creds);
    showToast("Image successfully uploaded to ImageKit!");
    
    // Save the uploaded filePath (e.g. "image_name.png" or "/image_name.png")
    // If returned url is full, we can save the filePath returned by ImageKit.
    const savedPath = uploadResult.filePath.startsWith('/') ? uploadResult.filePath.slice(1) : uploadResult.filePath;
    imagePathInput.value = savedPath;
    
    // Render preview with ImageKit endpoint
    previewImg.src = uploadResult.url;
    previewImg.classList.remove('hidden');
    imagePreviewBox.querySelector('.preview-placeholder').classList.add('hidden');
  } catch (err) {
    showToast("ImageKit upload failed: " + err.message, "error");
  } finally {
    showLoader(false);
  }
});

// Upload file to ImageKit using local proxy to bypass CORS
async function uploadToImageKit(file, creds) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', file.name);
  formData.append('folder', '/');

  const authHeader = 'Basic ' + btoa(creds.imageKitPrivateKey + ':');
  
  // Call ImageKit Upload API via our Vite server proxy
  const response = await fetch('/imagekit-upload/api/v1/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': authHeader
    },
    body: formData
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Server responded with ${response.status}`);
  }

  return await response.json();
}

// Product Form Submission (Save/Update)
productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('product-name').value;
  const price = parseFloat(document.getElementById('product-price').value);
  const ingredients = document.getElementById('product-ingredients').value;
  const description = document.getElementById('product-description').value;
  const top_seller = document.getElementById('product-top-seller').checked;
  const image = imagePathInput.value;

  if (!image) {
    showToast("Please upload an image for the product.", "error");
    return;
  }

  const editId = document.getElementById('product-id').value;
  const isEditing = !!editId;
  const customId = document.getElementById('product-custom-id').value;

  showLoader(true);
  const supabase = getSupabase();

  try {
    if (isEditing) {
      // Perform Update in Supabase
      const { error } = await supabase
        .from('cookies')
        .update({ name, price, ingredients, description, top_seller, image })
        .eq('id', editId);

      if (error) throw error;
      showToast(`Product "${name}" successfully updated!`);
    } else {
      // Validate Custom ID is provided
      if (!customId) throw new Error("A unique numeric product ID is required.");
      const numericId = parseInt(customId);
      
      // Check conflict
      const { data: conflict } = await supabase.from('cookies').select('id').eq('id', numericId).maybeSingle();
      if (conflict) throw new Error(`Product ID ${numericId} is already in use. Choose another one.`);

      // Perform Insert in Supabase
      const { error } = await supabase
        .from('cookies')
        .insert([{ id: numericId, name, price, ingredients, description, top_seller, image }]);

      if (error) throw error;
      showToast(`Product "${name}" successfully added to catalog!`);
    }

    // Go back to catalog
    navigate('/admin/dashboard?tab=catalog');
  } catch (err) {
    showToast(err.message || "Failed to save product.", "error");
  } finally {
    showLoader(false);
  }
});


// --- PRODUCT DELETION & IMAGEKIT CLEANUP ---

async function confirmDeleteProduct(id, imagePath, name) {
  const confirmed = confirm(`Are you sure you want to delete the product "${name}" (ID: ${id})?\n\nThis will remove it from the catalog page and attempt to delete its photos from ImageKit.`);
  if (!confirmed) return;

  showLoader(true);
  const supabase = getSupabase();
  const creds = getCredentials();

  try {
    // 1. If it's an uploaded ImageKit photo (not a static local asset), delete it from ImageKit first
    const isLocalAsset = imagePath.startsWith('assets/') || imagePath.startsWith('/assets/');
    
    if (!isLocalAsset) {
      if (creds.imageKitPrivateKey && creds.imageKitPublicKey) {
        try {
          const filename = getFilenameFromPath(imagePath);
          showToast(`Searching for file "${filename}" in ImageKit...`);
          
          const fileId = await searchImageKitFileId(filename, creds);
          if (fileId) {
            showToast("Deleting photo from ImageKit media library...");
            await deleteImageKitFile(fileId, creds);
            showToast("ImageKit asset deleted successfully.");
          } else {
            console.warn(`File "${filename}" not found in ImageKit. Skipping image deletion.`);
          }
        } catch (imgErr) {
          console.error("Failed to delete ImageKit photo", imgErr);
          showToast("ImageKit cleanup failed, but proceeding with database deletion: " + imgErr.message, "warning");
        }
      } else {
        showToast("ImageKit credentials not configured. Skipping photo removal.", "warning");
      }
    }

    // 2. Delete product row from Supabase
    const { error } = await supabase
      .from('cookies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    showToast(`Product "${name}" successfully deleted from catalog.`);
    await loadCatalog();
  } catch (err) {
    showToast("Deletion failed: " + err.message, "error");
  } finally {
    showLoader(false);
  }
}

// Search ImageKit by filename to retrieve its fileId
async function searchImageKitFileId(filename, creds) {
  const authHeader = 'Basic ' + btoa(creds.imageKitPrivateKey + ':');
  // Simple Lucene search query for name match
  const searchQuery = encodeURIComponent(`name = "${filename}"`);
  
  const response = await fetch(`/imagekit-api/v1/files?searchQuery=${searchQuery}`, {
    method: 'GET',
    headers: {
      'Authorization': authHeader
    }
  });

  if (!response.ok) {
    throw new Error(`ImageKit search query responded with ${response.status}`);
  }

  const files = await response.json();
  if (files && files.length > 0) {
    // Return first exact match
    const match = files.find(f => f.name === filename) || files[0];
    return match.fileId;
  }
  return null;
}

// Delete file from ImageKit by fileId
async function deleteImageKitFile(fileId, creds) {
  const authHeader = 'Basic ' + btoa(creds.imageKitPrivateKey + ':');
  
  const response = await fetch(`/imagekit-api/v1/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': authHeader
    }
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`ImageKit file delete responded with ${response.status}`);
  }
}


// --- REALTIME SUBSCRIPTIONS & EVENT HANDLERS ---

function subscribeToRealtime() {
  if (realtimeChannel) return;

  const supabase = getSupabase();
  if (!supabase) return;

  console.log("Subscribing to Supabase Realtime channel for cookies and orders...");
  realtimeChannel = supabase
    .channel('db-realtime-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cookies'
      },
      (payload) => {
        console.log('Cookies Realtime update received:', payload);
        handleRealtimeChange(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders'
      },
      (payload) => {
        console.log('Orders Realtime update received:', payload);
        handleOrdersRealtimeChange(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'corporate_inquiries'
      },
      (payload) => {
        console.log('Corporate Realtime update received:', payload);
        handleCorporateRealtimeChange(payload);
      }
    )
    .subscribe((status) => {
      console.log(`Realtime channel status: ${status}`);
    });
}

function unsubscribeFromRealtime() {
  if (realtimeChannel) {
    const supabase = getSupabase();
    if (supabase) {
      supabase.removeChannel(realtimeChannel);
    }
    realtimeChannel = null;
    console.log("Unsubscribed from Supabase Realtime channel.");
  }
}

function handleRealtimeChange(payload) {
  if (payload.eventType === 'INSERT') {
    const exists = currentProducts.some(p => p.id == payload.new.id);
    if (!exists) {
      currentProducts.push(payload.new);
    }
  } else if (payload.eventType === 'UPDATE') {
    const index = currentProducts.findIndex(p => p.id == payload.new.id);
    if (index !== -1) {
      currentProducts[index] = payload.new;
    } else {
      currentProducts.push(payload.new);
    }
  } else if (payload.eventType === 'DELETE') {
    currentProducts = currentProducts.filter(p => p.id != payload.old.id);
  }

  // Sort by ID to preserve default ordering
  currentProducts.sort((a, b) => a.id - b.id);

  if (activeTab === 'dashboard') {
    renderDashboard(currentProducts);
  } else if (activeTab === 'catalog') {
    renderCatalog(currentProducts);
  }
}

function handleOrdersRealtimeChange(payload) {
  if (payload.eventType === 'INSERT') {
    const exists = currentOrders.some(o => o.id == payload.new.id);
    if (!exists) {
      currentOrders.push(payload.new);
    }
  } else if (payload.eventType === 'UPDATE') {
    const index = currentOrders.findIndex(o => o.id == payload.new.id);
    if (index !== -1) {
      currentOrders[index] = payload.new;
    } else {
      currentOrders.push(payload.new);
    }
  } else if (payload.eventType === 'DELETE') {
    currentOrders = currentOrders.filter(o => o.id != payload.old.id);
  }

  // Sort by created_at descending (newest first)
  currentOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (activeTab === 'orders') {
    renderOrders(currentOrders);
  }
}

function handleCorporateRealtimeChange(payload) {
  if (payload.eventType === 'INSERT') {
    const exists = currentCorporateInquiries.some(c => c.id == payload.new.id);
    if (!exists) {
      currentCorporateInquiries.push(payload.new);
    }
  } else if (payload.eventType === 'UPDATE') {
    const index = currentCorporateInquiries.findIndex(c => c.id == payload.new.id);
    if (index !== -1) {
      currentCorporateInquiries[index] = payload.new;
    } else {
      currentCorporateInquiries.push(payload.new);
    }
  } else if (payload.eventType === 'DELETE') {
    currentCorporateInquiries = currentCorporateInquiries.filter(c => c.id != payload.old.id);
  }

  // Sort by created_at descending
  currentCorporateInquiries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (activeTab === 'corporate') {
    renderCorporateInquiries(currentCorporateInquiries);
  }
}


// --- UTILITY HELPERS ---

function getFilenameFromPath(filePath) {
  if (!filePath) return '';
  return filePath.substring(filePath.lastIndexOf('/') + 1);
}

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

// --- INIT APP ---
document.addEventListener('DOMContentLoaded', () => {
  handleRoute();
  
  // Bind order details modal close
  initOrderDetailsModal();

  // Bind corporate details modal close
  initCorporateDetailsModal();

  // Bind order search
  const searchInput = document.getElementById('orders-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        renderOrders(currentOrders);
        return;
      }
      const filtered = currentOrders.filter(o => 
        o.id.toLowerCase().includes(query) || 
        o.customer_name.toLowerCase().includes(query) || 
        o.customer_email.toLowerCase().includes(query)
      );
      renderOrders(filtered);
    });
  }

  // Bind corporate search
  const corpSearchInput = document.getElementById('corporate-search');
  if (corpSearchInput) {
    corpSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        renderCorporateInquiries(currentCorporateInquiries);
        return;
      }
      const filtered = currentCorporateInquiries.filter(c => 
        c.company_name.toLowerCase().includes(query) || 
        c.contact_name.toLowerCase().includes(query) || 
        c.company_email.toLowerCase().includes(query)
      );
      renderCorporateInquiries(filtered);
    });
  }

  // Bind order refresh
  const refreshBtn = document.getElementById('orders-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadOrders();
    });
  }

  // Bind corporate refresh
  const corpRefreshBtn = document.getElementById('corporate-refresh-btn');
  if (corpRefreshBtn) {
    corpRefreshBtn.addEventListener('click', () => {
      loadCorporateInquiries();
    });
  }
});

// --- ORDERS MANAGEMENT LOGIC ---

let currentOrders = [];

async function loadOrders() {
  showLoader(true);
  try {
    currentOrders = await fetchOrders();
    renderOrders(currentOrders);
  } catch (err) {
    showToast("Error loading orders: " + err.message, "error");
  } finally {
    showLoader(false);
  }
}

function renderOrders(orders) {
  const tbody = document.getElementById('orders-table-body');
  tbody.innerHTML = '';

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No orders found.</td></tr>';
    return;
  }

  orders.forEach(order => {
    const dateStr = formatDate(order.created_at);
    const amountStr = `₹${parseFloat(order.amount).toFixed(2)}`;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHTML(order.id)}</strong></td>
      <td>${dateStr}</td>
      <td>
        <div style="font-weight: 600;">${escapeHTML(order.customer_name)}</div>
        <div class="text-muted" style="font-size: 0.78rem;">${escapeHTML(order.customer_email)}</div>
      </td>
      <td><strong>${amountStr}</strong></td>
      <td>
        <select class="status-select status-${order.status.toLowerCase()}" data-id="${order.id}">
          <option value="Paid" ${order.status === 'Paid' ? 'selected' : ''}>Paid</option>
          <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
          <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option value="Failed" ${order.status === 'Failed' ? 'selected' : ''}>Failed</option>
        </select>
      </td>
      <td class="text-center">
        <button class="btn-primary view-order-btn" style="padding: 0.4rem 0.8rem; font-size: 0.7rem; letter-spacing: 0.05em; border-radius: 0;" data-id="${order.id}">View</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Bind inline status change listeners
  tbody.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const id = select.getAttribute('data-id');
      const newStatus = select.value;
      
      // Update locally first for responsive visual feel
      select.className = `status-select status-${newStatus.toLowerCase()}`;
      
      showLoader(true);
      const { error } = await updateOrderStatus(id, newStatus);
      showLoader(false);
      
      if (error) {
        showToast("Failed to update status in database.", "error");
        await loadOrders();
      } else {
        showToast(`Order status updated to ${newStatus}`);
      }
    });
  });

  // Bind view action buttons
  tbody.querySelectorAll('.view-order-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const order = orders.find(o => o.id === id);
      if (order) openOrderDetails(order);
    });
  });
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options); // e.g. "10 May 2026"
}

function openOrderDetails(order) {
  const modal = document.getElementById('order-details-modal');
  if (!modal) return;

  document.getElementById('detail-order-id').textContent = `ORDER ID: ${order.id}`;
  document.getElementById('detail-customer-name').textContent = order.customer_name;
  document.getElementById('detail-customer-meta').textContent = `${order.customer_email} • ${order.customer_phone}`;
  document.getElementById('detail-shipping-address').textContent = order.shipping_address;
  document.getElementById('detail-amount').textContent = `₹${parseFloat(order.amount).toFixed(2)}`;

  // Bind status select inside details modal
  const statusSelect = document.getElementById('detail-status-select');
  if (statusSelect) {
    statusSelect.value = order.status;
    statusSelect.onchange = async () => {
      const newStatus = statusSelect.value;
      showLoader(true);
      const { error } = await updateOrderStatus(order.id, newStatus);
      showLoader(false);
      if (error) {
        showToast("Failed to update status.", "error");
      } else {
        showToast(`Order status updated to ${newStatus}`);
        order.status = newStatus;
        loadOrders(); // Reload table
      }
    };
  }

  // Populate items list
  const listContainer = document.getElementById('detail-items-list');
  listContainer.innerHTML = '';

  const items = Array.isArray(order.items) ? order.items : [];
  items.forEach(item => {
    const itemRow = document.createElement('div');
    itemRow.style.display = 'flex';
    itemRow.style.justifyContent = 'space-between';
    itemRow.style.padding = '0.5rem 0';
    itemRow.style.borderBottom = '1px solid rgba(38, 57, 72, 0.05)';
    itemRow.style.fontSize = '0.85rem';
    itemRow.innerHTML = `
      <span style="font-weight: 500;">${escapeHTML(item.name)} <span class="text-muted">x${item.quantity}</span></span>
      <span style="font-weight: 600;">₹${(item.price * item.quantity).toFixed(2)}</span>
    `;
    listContainer.appendChild(itemRow);
  });

  modal.classList.add('open');
}

function initOrderDetailsModal() {
  const modal = document.getElementById('order-details-modal');
  if (!modal) return;
  const closeBtn = document.getElementById('order-details-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }
}

// --- CORPORATE ONBOARDING MANAGEMENT LOGIC ---

let currentCorporateInquiries = [];

async function loadCorporateInquiries() {
  showLoader(true);
  try {
    currentCorporateInquiries = await fetchCorporateInquiries();
    renderCorporateInquiries(currentCorporateInquiries);
  } catch (err) {
    showToast("Error loading corporate inquiries: " + err.message, "error");
  } finally {
    showLoader(false);
  }
}

function renderCorporateInquiries(inquiries) {
  const tbody = document.getElementById('corporate-table-body');
  tbody.innerHTML = '';

  if (inquiries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No inquiries logged.</td></tr>';
    return;
  }

  inquiries.forEach(inquiry => {
    const dateStr = formatDate(inquiry.created_at);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${dateStr}</td>
      <td><strong>${escapeHTML(inquiry.company_name)}</strong></td>
      <td>
        <div style="font-weight: 600;">${escapeHTML(inquiry.contact_name)}</div>
        <div class="text-muted" style="font-size: 0.78rem;">${escapeHTML(inquiry.company_email)}</div>
      </td>
      <td><strong>${inquiry.quantity} Boxes</strong></td>
      <td>${escapeHTML(inquiry.budget_tier)}</td>
      <td>
        <select class="status-select status-${inquiry.status.toLowerCase().replace(' ', '-')}" data-id="${inquiry.id}">
          <option value="Pending" ${inquiry.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Approved" ${inquiry.status === 'Approved' ? 'selected' : ''}>Approved</option>
          <option value="In Production" ${inquiry.status === 'In Production' ? 'selected' : ''}>In Production</option>
          <option value="Delivered" ${inquiry.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option value="Rejected" ${inquiry.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
      <td class="text-center">
        <button class="btn-primary view-corp-btn" style="padding: 0.4rem 0.8rem; font-size: 0.7rem; letter-spacing: 0.05em; border-radius: 0;" data-id="${inquiry.id}">View</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Bind status changes
  tbody.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const id = select.getAttribute('data-id');
      const newStatus = select.value;
      
      select.className = `status-select status-${newStatus.toLowerCase().replace(' ', '-')}`;
      
      showLoader(true);
      const { error } = await updateCorporateInquiryStatus(id, newStatus);
      showLoader(false);
      
      if (error) {
        showToast("Failed to update status in database.", "error");
        await loadCorporateInquiries();
      } else {
        showToast(`Corporate status updated to ${newStatus}`);
      }
    });
  });

  // Bind view button clicks
  tbody.querySelectorAll('.view-corp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const inquiry = inquiries.find(c => c.id === id);
      if (inquiry) openCorporateDetails(inquiry);
    });
  });
}

function openCorporateDetails(inquiry) {
  const modal = document.getElementById('corporate-details-modal');
  if (!modal) return;

  document.getElementById('corp-detail-company').textContent = inquiry.company_name;
  document.getElementById('corp-detail-contact').textContent = inquiry.contact_name;
  document.getElementById('corp-detail-email').textContent = inquiry.company_email;
  document.getElementById('corp-detail-phone').textContent = inquiry.contact_phone;
  document.getElementById('corp-detail-qty').textContent = `${inquiry.quantity} Boxes`;
  document.getElementById('corp-detail-stamp').textContent = inquiry.logo_stamp ? "Yes, custom stamp required" : "No, standard branding";
  document.getElementById('corp-detail-date').textContent = formatDate(inquiry.delivery_date);
  document.getElementById('corp-detail-budget').textContent = inquiry.budget_tier;
  document.getElementById('corp-detail-notes').textContent = inquiry.branding_notes || "No notes provided.";
  document.getElementById('corp-detail-created').textContent = formatDate(inquiry.created_at);

  const statusSelect = document.getElementById('corp-detail-status');
  if (statusSelect) {
    statusSelect.value = inquiry.status;
    statusSelect.onchange = async () => {
      const newStatus = statusSelect.value;
      showLoader(true);
      const { error } = await updateCorporateInquiryStatus(inquiry.id, newStatus);
      showLoader(false);
      if (error) {
        showToast("Failed to update status.", "error");
      } else {
        showToast(`Corporate status updated to ${newStatus}`);
        inquiry.status = newStatus;
        loadCorporateInquiries();
      }
    };
  }

  modal.classList.add('open');
}

function initCorporateDetailsModal() {
  const modal = document.getElementById('corporate-details-modal');
  if (!modal) return;
  const closeBtn = document.getElementById('corporate-details-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }
}
