// ═══════════════════════════════════════════
//  مطعم القيصر - منطق التطبيق (الزبائن) v4.0
//  REAL-TIME: Firestore is primary, localStorage is cache only
// ═══════════════════════════════════════════

// ===== SECURITY: XSS SANITIZER =====
function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// ===== DATA STORE (cache only) =====
const DB = {
  get(k, d) {
    try { let v = localStorage.getItem('alqaysar_' + k); return v ? JSON.parse(v) : d; }
    catch(e) { return d; }
  },
  set(k, v) {
    try { localStorage.setItem('alqaysar_' + k, JSON.stringify(v)); }
    catch(e) { console.warn('localStorage failed:', e); }
  }
};

// ===== DEFAULT DATA (fallback when offline) =====
const DEFAULT_CATEGORIES = [
  { id: 1, name: 'شاورما', icon: 'fa-drumstick-bite' },
  { id: 2, name: 'برجر', icon: 'fa-hamburger' },
  { id: 3, name: 'بيتزا', icon: 'fa-pizza-slice' },
  { id: 4, name: 'دجاج مقلي', icon: 'fa-drumstick-bite' },
  { id: 5, name: 'مقبلات', icon: 'fa-bread-slice' },
  { id: 6, name: 'مشروبات', icon: 'fa-glass-water' }
];

const DEFAULT_MENU = [
  { id: 101, name: 'شاورما دجاج عادي', category: 1, price: 15000, desc: 'شاورما دجاج طازجة مع ثومية وخضار', image: '', active: true },
  { id: 102, name: 'شاورما دجاج دبل', category: 1, price: 22000, desc: 'ضعف الكمية مع خبز محمص', image: '', active: true },
  { id: 103, name: 'صحن شاورما', category: 1, price: 35000, desc: 'صحن شاورما مع أرز وبطاطس', image: '', active: true },
  { id: 201, name: 'برجر كلاسيك', category: 2, price: 18000, desc: 'برجر لحم مع جبنة وخضار طازج', image: '', active: true },
  { id: 202, name: 'برجر دبل', category: 2, price: 28000, desc: 'برجر مزدوج مع جبنة شيدر', image: '', active: true },
  { id: 301, name: 'بيتزا مارغريتا', category: 3, price: 25000, desc: 'صلصة طماطم وموزاريلا طازجة', image: '', active: true },
  { id: 302, name: 'بيتزا خضار', category: 3, price: 28000, desc: 'فلفل، زيتون، مشروم، ذرة', image: '', active: true },
  { id: 401, name: 'أجنحة دجاج 6 قطع', category: 4, price: 20000, desc: 'مقلية مقرمشة مع صوص', image: '', active: true },
  { id: 402, name: 'أجنحة دجاج 12 قطعة', category: 4, price: 35000, desc: 'ضعف الكمية مع صوصين', image: '', active: true },
  { id: 501, name: 'حمص', category: 5, price: 8000, desc: 'حمص بالطحينة مع زيت زيتون', image: '', active: true },
  { id: 502, name: 'متبل', category: 5, price: 8000, desc: 'متبل باذنجان بالطحينة', image: '', active: true },
  { id: 601, name: 'كولا', category: 6, price: 3000, desc: 'مشروب غازي مثلج', image: '', active: true },
  { id: 602, name: 'عصير برتقال طازج', category: 6, price: 5000, desc: 'عصير طبيعي 100%', image: '', active: true }
];

const DEFAULT_OFFERS = [
  { id: 1, title: 'وجبة عائلية', desc: '4 شاورما + 2 برجر + بطاطس كبير + 4 مشروبات', price: 120000, oldPrice: 150000, image: '', active: true },
  { id: 2, title: 'وجبة الشباب', desc: '2 شاورما دبل + 2 أجنحة + 2 كولا', price: 80000, oldPrice: 95000, image: '', active: true }
];

const DEFAULT_ZONES = [
  { id: 1, name: 'المزة', fee: 5000 },
  { id: 2, name: 'المالكي', fee: 3000 },
  { id: 3, name: 'الصالحية', fee: 4000 },
  { id: 4, name: 'باب توما', fee: 3500 },
  { id: 5, name: 'الحمراء', fee: 6000 },
  { id: 6, name: 'الشعلان', fee: 2500 },
  { id: 7, name: 'العمارة', fee: 4500 },
  { id: 8, name: 'ركن الدين', fee: 7000 }
];

const DEFAULT_SETTINGS = {
  name: 'مطعم القيصر', subtitle: 'أشهى المأكولات بأجود المكونات',
  desc: 'نقدم لكم أشهى المأكولات بأجود المكونات الطازجة.',
  address: 'دمشق - شارع الثورة - مقابل جامع الحسن',
  hours: '10:00 ص - 12:00 ص',
  phone: '0999123456', phone2: '', whatsapp: '0999123456',
  email: '', alertText: 'الأسعار قابلة للتعديل حسب النشرة اليومية',
  deliveryEnabled: true, defaultZoneFee: 5000, logo: '',
  facebook: '', instagram: '', twitter: '', tiktok: '', snapchat: '', youtube: ''
};

// ===== IN-MEMORY DATA (real-time source) =====
let liveData = {
  categories: DEFAULT_CATEGORIES,
  menu: DEFAULT_MENU,
  offers: DEFAULT_OFFERS,
  zones: DEFAULT_ZONES,
  settings: DEFAULT_SETTINGS
};

function initDefaults() {
  if (!DB.get('initialized')) {
    DB.set('cart', {});
    DB.set('initialized', true);
  }
}

// ===== STATE =====
let currentCategory = 'all';
let deliveryMode = 'delivery';
let selectedZone = null;
let deferredPrompt = null;
let lastOrderTime = 0;
let isOnline = true;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  try {
    initDefaults();
    loadCart();
    setupPWA();

    // Try to load from Firestore first (real-time), fallback to cache
    if (typeof db !== 'undefined' && db) {
      setupRealtimeListeners();
      // Show cached data immediately while loading from cloud
      const cached = loadFromCache();
      if (cached) {
        liveData = cached;
        renderAll();
      }
    } else {
      // No Firebase — use cache or defaults
      const cached = loadFromCache();
      liveData = cached || {
        categories: DEFAULT_CATEGORIES,
        menu: DEFAULT_MENU,
        offers: DEFAULT_OFFERS,
        zones: DEFAULT_ZONES,
        settings: DEFAULT_SETTINGS
      };
      renderAll();
    }

    // Hide loader
    setTimeout(function() {
      var ls = document.getElementById('loadingScreen');
      if (ls) ls.classList.add('hidden');
    }, 500);
  } catch (err) {
    console.error('Init error:', err);
    renderAll();
    var ls = document.getElementById('loadingScreen');
    if (ls) ls.classList.add('hidden');
  }
});

// ===== CACHE HELPERS =====
function loadFromCache() {
  try {
    const cats = DB.get('categories', null);
    const menu = DB.get('menu', null);
    const offers = DB.get('offers', null);
    const zones = DB.get('zones', null);
    const settings = DB.get('settings', null);
    if (cats && menu && offers && zones && settings) {
      return { categories: cats, menu: menu, offers: offers, zones: zones, settings: settings };
    }
  } catch(e) {}
  return null;
}

function saveToCache() {
  DB.set('categories', liveData.categories);
  DB.set('menu', liveData.menu);
  DB.set('offers', liveData.offers);
  DB.set('zones', liveData.zones);
  DB.set('settings', liveData.settings);
}

// ===== REAL-TIME FIRESTORE LISTENERS =====
function setupRealtimeListeners() {
  if (typeof db === 'undefined' || !db) return;

  // Categories listener
  db.collection('categories').onSnapshot((snapshot) => {
    const cats = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = data.id !== undefined ? data.id : (isNaN(doc.id) ? doc.id : parseInt(doc.id));
      cats.push({ id: id, ...data });
    });
    if (cats.length > 0) {
      liveData.categories = cats;
      saveToCache();
      renderCategories();
      renderMenu();
      toast('تم تحديث التصنيفات', 'info');
    }
  }, (err) => { console.log('Categories listener error:', err); });

  // Menu listener
  db.collection('menu').onSnapshot((snapshot) => {
    const menu = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = data.id !== undefined ? data.id : (isNaN(doc.id) ? doc.id : parseInt(doc.id));
      menu.push({ id: id, ...data });
    });
    if (menu.length > 0) {
      liveData.menu = menu;
      saveToCache();
      renderMenu();
      toast('تم تحديث القائمة', 'info');
    }
  }, (err) => { console.log('Menu listener error:', err); });

  // Offers listener
  db.collection('offers').onSnapshot((snapshot) => {
    const offers = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = data.id !== undefined ? data.id : (isNaN(doc.id) ? doc.id : parseInt(doc.id));
      offers.push({ id: id, ...data });
    });
    liveData.offers = offers;
    saveToCache();
    renderOffers();
    toast('تم تحديث العروض', 'info');
  }, (err) => { console.log('Offers listener error:', err); });

  // Zones listener (one-time load is enough for zones)
  db.collection('zones').get().then((snapshot) => {
    const zones = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = data.id !== undefined ? data.id : (isNaN(doc.id) ? doc.id : parseInt(doc.id));
      zones.push({ id: id, ...data });
    });
    if (zones.length > 0) {
      liveData.zones = zones;
      saveToCache();
      renderZones();
    }
  }).catch(err => console.log('Zones load error:', err));

  // Settings listener
  db.collection('settings').doc('main').onSnapshot((doc) => {
    if (doc.exists) {
      if (doc.exists && doc.data()) {
        const data = doc.data();
        if (Object.keys(data).length > 0) {
          liveData.settings = { ...DEFAULT_SETTINGS, ...data };
        }
      }
      saveToCache();
      renderAll();
      toast('تم تحديث إعدادات الموقع', 'info');
    }
  }, (err) => { console.log('Settings listener error:', err); });
}

// ===== RENDER ALL =====
function renderAll() {
  try {
    const s = liveData.settings;
    const alertEl = document.getElementById('alertText');
    if (alertEl) alertEl.textContent = s.alertText || 'الأسعار قابلة للتعديل حسب النشرة اليومية';

    const logoTextH1 = document.querySelector('.logo-text h1');
    const logoTextSpan = document.querySelector('.logo-text span');
    if (logoTextH1) logoTextH1.textContent = s.name || 'مطعم القيصر';
    if (logoTextSpan) logoTextSpan.textContent = s.subtitle || 'أشهى المأكولات';

    // Apply custom logo
    if (s.logo) {
      document.querySelectorAll('img[src="./images/logo.png"]').forEach(img => img.src = s.logo);
    }

    const footerDesc = document.getElementById('footerDesc');
    const footerPhone = document.getElementById('footerPhone');
    const footerHours = document.getElementById('footerHours');
    const footerAddress = document.getElementById('footerAddress');

    if (footerDesc) footerDesc.textContent = s.desc || '';
    if (footerPhone) footerPhone.textContent = s.phone || '--';
    if (footerHours) footerHours.textContent = s.hours || '--';
    if (footerAddress) footerAddress.textContent = s.address || '--';

    const icons = { facebook: 'fa-facebook-f', instagram: 'fa-instagram', twitter: 'fa-twitter', tiktok: 'fa-tiktok', snapchat: 'fa-snapchat', youtube: 'fa-youtube' };
    let html = '';
    for (let k in icons) { if (s[k]) html += '<a href="' + escapeHtml(s[k]) + '" target="_blank" rel="noopener"><i class="fab ' + icons[k] + '"></i></a>'; }
    const footerSocial = document.getElementById('footerSocial');
    if (footerSocial) footerSocial.innerHTML = html;

    if (s.deliveryEnabled === false) {
      deliveryMode = 'pickup';
      const zoneSel = document.getElementById('zoneSelector');
      if (zoneSel) zoneSel.style.display = 'none';
      const btns = document.querySelectorAll('#deliveryToggle button');
      if (btns[0]) btns[0].classList.remove('active');
      if (btns[1]) btns[1].classList.add('active');
    }

    renderZones();
    renderCategories();
    renderMenu();
    renderOffers();
  } catch (err) {
    console.error('renderAll error:', err);
  }
}

// ===== ZONES =====
function renderZones() {
  const zones = liveData.zones;
  const sel = document.getElementById('zoneSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- اختر المنطقة --</option>' +
    zones.map(z => '<option value="' + z.id + '">' + escapeHtml(z.name) + ' (' + formatPrice(z.fee) + ')</option>').join('');
}

function updateZoneFee() {
  const zoneId = document.getElementById('zoneSelect').value;
  const zones = liveData.zones;
  selectedZone = zones.find(z => z.id == zoneId);
  const display = document.getElementById('zoneFeeDisplay');
  if (display) {
    if (selectedZone) {
      document.getElementById('zoneFeeAmount').textContent = formatPrice(selectedZone.fee);
      display.style.display = 'flex';
    } else {
      display.style.display = 'none';
    }
  }
  updateCartBar();
}

// ===== DELIVERY MODE =====
function setDeliveryMode(mode, btn) {
  deliveryMode = mode;
  document.querySelectorAll('#deliveryToggle button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const zoneSel = document.getElementById('zoneSelector');
  if (zoneSel) zoneSel.style.display = mode === 'delivery' ? 'block' : 'none';
  if (mode === 'pickup') selectedZone = null;
  updateCartBar();
}

// ===== CATEGORIES =====
function renderCategories() {
  const cats = liveData.categories;
  const scroll = document.getElementById('categoriesScroll');
  if (!scroll) return;
  scroll.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = 'cat-chip active';
  allBtn.dataset.cat = 'all';
  allBtn.textContent = 'الكل';
  allBtn.onclick = function() { filterCategory('all', this); };
  scroll.appendChild(allBtn);
  cats.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'cat-chip';
    btn.dataset.cat = c.id;
    btn.textContent = c.name;
    btn.onclick = function() { filterCategory(c.id, this); };
    scroll.appendChild(btn);
  });
}

function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.cat-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMenu();
}

// ===== MENU =====
function renderMenu() {
  const items = liveData.menu.filter(i => i.active !== false);
  const filtered = currentCategory === 'all' ? items : items.filter(i => i.category == currentCategory);
  const grid = document.getElementById('menuGrid');
  const empty = document.getElementById('menuEmpty');

  if (!grid) return;
  if (!filtered.length) { grid.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
  if (empty) empty.style.display = 'none';

  const cart = DB.get('cart', {});
  grid.innerHTML = '';

  filtered.forEach(item => {
    const qty = cart[item.id] || 0;
    const card = document.createElement('div');
    card.className = 'menu-card fade-in';

    const imgDiv = document.createElement('div');
    imgDiv.className = 'menu-card-img';
    if (item.image) {
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.name;
      img.loading = 'lazy';
      img.onload = function() {
        this.classList.add('loaded');
        const ph = imgDiv.querySelector('.img-placeholder');
        if (ph) ph.style.display = 'none';
      };
      imgDiv.appendChild(img);
    }
    const ph = document.createElement('div');
    ph.className = 'img-placeholder';
    ph.innerHTML = '<i class="fas fa-utensils"></i>';
    if (item.image) ph.style.display = 'none';
    imgDiv.appendChild(ph);
    card.appendChild(imgDiv);

    const body = document.createElement('div');
    body.className = 'menu-card-body';

    const title = document.createElement('h4');
    title.className = 'menu-card-title';
    title.textContent = item.name;
    body.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'menu-card-desc';
    desc.textContent = item.desc || '';
    body.appendChild(desc);

    const footer = document.createElement('div');
    footer.className = 'menu-card-footer';

    const price = document.createElement('span');
    price.className = 'menu-card-price';
    price.textContent = formatPrice(item.price);
    footer.appendChild(price);

    if (qty > 0) {
      const qc = document.createElement('div');
      qc.className = 'qty-control';
      const minus = document.createElement('button');
      minus.textContent = '−';
      minus.onclick = function(e) { e.stopPropagation(); updateQty(item.id, -1); };
      const span = document.createElement('span');
      span.textContent = qty;
      const plus = document.createElement('button');
      plus.textContent = '+';
      plus.onclick = function(e) { e.stopPropagation(); updateQty(item.id, 1); };
      qc.appendChild(minus); qc.appendChild(span); qc.appendChild(plus);
      footer.appendChild(qc);
    } else {
      const addBtn = document.createElement('button');
      addBtn.className = 'qty-control';
      addBtn.style.cssText = 'padding:4px 12px;';
      addBtn.innerHTML = '<span style="color:var(--gold);"><i class="fas fa-plus"></i></span>';
      addBtn.onclick = function(e) { e.stopPropagation(); updateQty(item.id, 1); };
      footer.appendChild(addBtn);
    }

    body.appendChild(footer);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

// ===== OFFERS =====
function renderOffers() {
  const offers = liveData.offers.filter(o => o.active);
  const section = document.getElementById('offersSection');
  if (!section) return;
  if (!offers.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  const scroll = document.getElementById('offersScroll');
  if (!scroll) return;
  scroll.innerHTML = '';
  offers.forEach(o => {
    const card = document.createElement('div');
    card.className = 'offer-card';

    if (o.oldPrice) {
      const badge = document.createElement('span');
      badge.className = 'offer-badge';
      badge.textContent = 'خصم';
      card.appendChild(badge);
    }

    const imgDiv = document.createElement('div');
    imgDiv.className = 'offer-img';
    if (o.image) {
      const img = document.createElement('img');
      img.src = o.image;
      img.alt = '';
      img.loading = 'lazy';
      imgDiv.appendChild(img);
    } else {
      imgDiv.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#333;font-size:40px"><i class="fas fa-utensils"></i></div>';
    }
    card.appendChild(imgDiv);

    const body = document.createElement('div');
    body.className = 'offer-body';
    body.innerHTML = '<h4>' + escapeHtml(o.title) + '</h4>' +
      '<p>' + escapeHtml(o.desc) + '</p>' +
      '<div class="offer-price">' +
        '<span class="new">' + formatPrice(o.price) + '</span>' +
        (o.oldPrice ? '<span class="old">' + formatPrice(o.oldPrice) + '</span>' : '') +
      '</div>';

    const addOfferBtn = document.createElement('button');
    addOfferBtn.className = 'btn-whatsapp';
    addOfferBtn.style.cssText = 'margin-top:10px;padding:8px;font-size:13px;';
    addOfferBtn.innerHTML = '<i class="fas fa-cart-plus"></i> أضف للسلة';
    addOfferBtn.onclick = function() { addOfferToCart(o); };
    body.appendChild(addOfferBtn);

    card.appendChild(body);
    scroll.appendChild(card);
  });
}

function addOfferToCart(offer) {
  const cart = DB.get('cart', {});
  const offerId = 'offer_' + offer.id;
  cart[offerId] = (cart[offerId] || 0) + 1;
  DB.set('cart', cart);
  renderMenu(); updateCartBar();
  toast('تمت إضافة العرض: ' + offer.title, 'success');
}

// ===== CART =====
function updateQty(itemId, delta) {
  const cart = DB.get('cart', {});
  const items = liveData.menu;
  const item = items.find(i => i.id === itemId);
  if (!item) {
    const offers = liveData.offers;
    const offer = offers.find(o => 'offer_' + o.id === itemId);
    if (!offer) return;
    let qty = (cart[itemId] || 0) + delta;
    if (qty <= 0) delete cart[itemId];
    else cart[itemId] = qty;
    DB.set('cart', cart);
    renderMenu(); updateCartBar();
    if (delta > 0) toast('تمت الإضافة: ' + offer.title, 'success');
    else if (qty === 0) toast('تمت الإزالة من السلة', 'info');
    return;
  }

  let qty = (cart[itemId] || 0) + delta;
  if (qty <= 0) delete cart[itemId];
  else cart[itemId] = qty;

  DB.set('cart', cart);
  renderMenu();
  updateCartBar();

  if (delta > 0) toast('تمت الإضافة: ' + item.name, 'success');
  else if (qty === 0) toast('تمت الإزالة من السلة', 'info');
}

function updateCartBar() {
  const cart = DB.get('cart', {});
  const items = liveData.menu;
  const offers = liveData.offers;
  let totalItems = 0, subtotal = 0;

  for (let id in cart) {
    if (id.startsWith('offer_')) {
      const offerId = parseInt(id.replace('offer_', ''));
      const offer = offers.find(o => o.id === offerId);
      if (offer) { totalItems += cart[id]; subtotal += offer.price * cart[id]; }
    } else {
      const item = items.find(i => i.id == id);
      if (item) { totalItems += cart[id]; subtotal += item.price * cart[id]; }
    }
  }

  const deliveryFee = (deliveryMode === 'delivery' && selectedZone) ? selectedZone.fee : 0;
  const total = subtotal + deliveryFee;

  const bar = document.getElementById('cartBar');
  if (!bar) return;
  if (totalItems > 0) {
    bar.classList.add('visible');
    const countEl = document.getElementById('cartItemsCount');
    const priceEl = document.getElementById('cartTotalPrice');
    if (countEl) countEl.textContent = totalItems + ' ' + (totalItems === 1 ? 'صنف' : 'أصناف');
    if (priceEl) priceEl.textContent = formatPrice(total);
  } else {
    bar.classList.remove('visible');
  }
}

function loadCart() { updateCartBar(); }

// ===== CART MODAL =====
function openCartModal() {
  const cart = DB.get('cart', {});
  const items = liveData.menu;
  const offers = liveData.offers;
  const body = document.getElementById('cartModalBody');
  const footer = document.getElementById('cartModalFooter');

  const cartItems = [];
  let subtotal = 0;
  for (let id in cart) {
    if (id.startsWith('offer_')) {
      const offerId = parseInt(id.replace('offer_', ''));
      const offer = offers.find(o => o.id === offerId);
      if (offer) { cartItems.push({ ...offer, qty: cart[id], isOffer: true, id: id }); subtotal += offer.price * cart[id]; }
    } else {
      const item = items.find(i => i.id == id);
      if (item) { cartItems.push({ ...item, qty: cart[id], isOffer: false }); subtotal += item.price * cart[id]; }
    }
  }

  if (!cartItems.length) {
    if (body) body.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-basket"></i><h4>السلة فارغة</h4><p>أضف بعض الأصناف لطلبك</p></div>';
    if (footer) footer.style.display = 'none';
  } else {
    if (body) {
      body.innerHTML = '';
      cartItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = '<div class="cart-item-img">' + (item.image ? '<img src="' + item.image + '">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#555"><i class="fas fa-utensils"></i></div>') + '</div>' +
          '<div class="cart-item-info"><h4>' + escapeHtml(item.name || item.title) + '</h4><span class="item-price">' + formatPrice(item.price) + ' × ' + item.qty + '</span></div>' +
          '<div class="cart-item-actions">' +
            '<button class="remove-btn" onclick="updateQty(\'' + item.id + '\', -' + item.qty + '); openCartModal();"><i class="fas fa-trash-alt"></i></button>' +
            '<div class="qty-control">' +
              '<button onclick="updateQty(\'' + item.id + '\', -1); openCartModal();">−</button>' +
              '<span>' + item.qty + '</span>' +
              '<button onclick="updateQty(\'' + item.id + '\', 1); openCartModal();">+</button>' +
            '</div>' +
          '</div>';
        body.appendChild(div);
      });
    }

    const deliveryFee = (deliveryMode === 'delivery' && selectedZone) ? selectedZone.fee : 0;
    const total = subtotal + deliveryFee;

    const subEl = document.getElementById('subtotalPrice');
    const feeRow = document.getElementById('deliveryFeeRow');
    const feeEl = document.getElementById('deliveryFeePrice');
    const totalEl = document.getElementById('finalTotalPrice');

    if (subEl) subEl.textContent = formatPrice(subtotal);
    if (feeRow) feeRow.style.display = deliveryMode === 'delivery' ? 'flex' : 'none';
    if (feeEl) feeEl.textContent = formatPrice(deliveryFee);
    if (totalEl) totalEl.textContent = formatPrice(total);
    if (footer) footer.style.display = 'block';
  }

  const modal = document.getElementById('cartModal');
  if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeCartModal() {
  const modal = document.getElementById('cartModal');
  if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

// ===== WHATSAPP ORDER =====
function sendWhatsAppOrder() {
  const cart = DB.get('cart', {});
  if (!Object.keys(cart).length) { toast('السلة فارغة', 'error'); return; }
  const now = Date.now();
  if (now - lastOrderTime < 10000) {
    toast('يرجى الانتظار قليلاً قبل إرسال طلب جديد', 'error');
    return;
  }
  const modal = document.getElementById('customerModal');
  if (modal) modal.classList.add('active');
}

function closeCustomerModal() {
  const modal = document.getElementById('customerModal');
  if (modal) modal.classList.remove('active');
}

function confirmOrder() {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const notes = document.getElementById('custNotes').value.trim();

  if (!name || name.length < 2) { toast('يرجى إدخال اسم صحيح', 'error'); return; }
  if (!phone || !/^\d{7,15}$/.test(phone.replace(/\D/g,''))) { toast('يرجى إدخال رقم هاتف صحيح', 'error'); return; }
  if (deliveryMode === 'delivery' && !address) { toast('يرجى إدخال العنوان للتوصيل', 'error'); return; }
  if (deliveryMode === 'delivery' && !selectedZone) { toast('يرجى اختيار المنطقة', 'error'); return; }

  const cart = DB.get('cart', {});
  const items = liveData.menu;
  const offers = liveData.offers;
  const s = liveData.settings;

  let subtotal = 0;
  let itemsText = '';
  for (let id in cart) {
    if (id.startsWith('offer_')) {
      const offerId = parseInt(id.replace('offer_', ''));
      const offer = offers.find(o => o.id === offerId);
      if (offer) {
        const lineTotal = offer.price * cart[id];
        subtotal += lineTotal;
        itemsText += '• (عرض) ' + offer.title + ' × ' + cart[id] + ' = ' + formatPrice(lineTotal) + '\n';
      }
    } else {
      const item = items.find(i => i.id == id);
      if (item) {
        const lineTotal = item.price * cart[id];
        subtotal += lineTotal;
        itemsText += '• ' + item.name + ' × ' + cart[id] + ' = ' + formatPrice(lineTotal) + '\n';
      }
    }
  }

  const deliveryFee = (deliveryMode === 'delivery' && selectedZone) ? selectedZone.fee : 0;
  const total = subtotal + deliveryFee;

  let msg = '👑 *طلب جديد من مطعم القيصر* 👑\n\n';
  msg += '━━━━━━━━━━━━━━━━━━━━━\n';
  msg += '📋 *تفاصيل الطلب:*\n';
  msg += itemsText;
  msg += '━━━━━━━━━━━━━━━━━━━━━\n';
  msg += '💰 *المجموع الفرعي:* ' + formatPrice(subtotal) + '\n';
  if (deliveryMode === 'delivery') {
    msg += '🛵 *كلفة التوصيل:* ' + formatPrice(deliveryFee) + '\n';
    msg += '📍 *المنطقة:* ' + selectedZone.name + '\n';
  }
  msg += '━━━━━━━━━━━━━━━━━━━━━\n';
  msg += '💵 *الإجمالي:* ' + formatPrice(total) + '\n\n';
  msg += '━━━━━━━━━━━━━━━━━━━━━\n';
  msg += '👤 *الاسم:* ' + name + '\n';
  msg += '📱 *الهاتف:* ' + phone + '\n';
  if (deliveryMode === 'delivery') msg += '🏠 *العنوان:* ' + address + '\n';
  msg += '📦 *نوع الطلب:* ' + (deliveryMode === 'delivery' ? 'توصيل للمنزل 🛵' : 'استلام من الفرع 🏪') + '\n';
  if (notes) msg += '📝 *ملاحظات:* ' + notes + '\n';
  msg += '━━━━━━━━━━━━━━━━━━━━━\n';
  msg += '⏰ تاريخ الطلب: ' + new Date().toLocaleString('ar-SY') + '\n';
  msg += 'شكراً لاختياركم مطعم القيصر 🙏';

  const waNumber = (s.whatsapp || s.phone || '').replace(/\D/g, '');
  if (!waNumber) { toast('رقم الواتساب غير مضبوط في الإعدادات', 'error'); return; }
  const waLink = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(msg);

  lastOrderTime = Date.now();
  DB.set('cart', {});
  updateCartBar();
  renderMenu();
  closeCustomerModal();
  closeCartModal();

  toast('جارٍ تحويلك إلى الواتساب...', 'success');
  setTimeout(() => { window.open(waLink, '_blank'); }, 800);
}

// ===== HELPERS =====
function formatPrice(p) {
  if (p === null || p === undefined || isNaN(p)) return '';
  return p.toLocaleString('ar-SY') + ' ل.س';
}

function toast(msg, type) {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const div = document.createElement('div');
  div.className = 'toast ' + (type || 'success');
  const icon = type === 'error' ? 'fa-exclamation-circle' : type === 'info' ? 'fa-info-circle' : 'fa-check-circle';
  div.innerHTML = '<i class="fas ' + icon + '"></i><span>' + escapeHtml(msg) + '</span>';
  c.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// ===== PWA =====
function setupPWA() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
      const banner = document.getElementById('pwaBanner');
      if (banner) banner.classList.add('visible');
    }, 3000);
  });
}

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
  }
  const banner = document.getElementById('pwaBanner');
  if (banner) banner.classList.remove('visible');
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});


// ═══════════════════════════════════════════
//  FIRESTORE REAL-TIME LISTENERS
// ═══════════════════════════════════════════

function setupRealtimeListeners() {
  if (typeof db === 'undefined' || !db) {
    console.log('Firebase not available — using local data');
    return;
  }

  // Categories real-time
  db.collection('categories').onSnapshot((snapshot) => {
    const cats = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = data.id !== undefined ? data.id : (isNaN(doc.id) ? doc.id : parseInt(doc.id));
      cats.push({ id: id, ...data });
    });
    if (cats.length > 0) {
      liveData.categories = cats;
      DB.set('categories', cats);
      renderCategories();
      renderMenu();
    }
  }, (err) => { console.log('Categories listener:', err); });

  // Menu real-time
  db.collection('menu').onSnapshot((snapshot) => {
    const menu = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = data.id !== undefined ? data.id : (isNaN(doc.id) ? doc.id : parseInt(doc.id));
      menu.push({ id: id, ...data });
    });
    if (menu.length > 0) {
      liveData.menu = menu;
      DB.set('menu', menu);
      renderMenu();
    }
  }, (err) => { console.log('Menu listener:', err); });

  // Offers real-time
  db.collection('offers').onSnapshot((snapshot) => {
    const offers = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = data.id !== undefined ? data.id : (isNaN(doc.id) ? doc.id : parseInt(doc.id));
      offers.push({ id: id, ...data });
    });
    liveData.offers = offers;
    DB.set('offers', offers);
    renderOffers();
  }, (err) => { console.log('Offers listener:', err); });

  // Zones real-time
  db.collection('zones').onSnapshot((snapshot) => {
    const zones = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = data.id !== undefined ? data.id : (isNaN(doc.id) ? doc.id : parseInt(doc.id));
      zones.push({ id: id, ...data });
    });
    liveData.zones = zones;
    DB.set('zones', zones);
    renderZones();
  }, (err) => { console.log('Zones listener:', err); });

  // Settings real-time
  db.collection('settings').doc('main').onSnapshot((doc) => {
    if (doc.exists) {
      liveData.settings = { ...DEFAULT_SETTINGS, ...doc.data() };
      DB.set('settings', liveData.settings);
      renderAll();
    }
  }, (err) => { console.log('Settings listener:', err); });
}

