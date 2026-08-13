// ═══════════════════════════════════════════
//  مطعم القيصر - منطق التطبيق (الزبائن)
// ═══════════════════════════════════════════

// ===== DATA STORE =====
const DB = {
  get(k, d) { try { let v = localStorage.getItem('alqaysar_' + k); return v ? JSON.parse(v) : d; } catch(e) { return d; } },
  set(k, v) { localStorage.setItem('alqaysar_' + k, JSON.stringify(v)); }
};

// ===== DEFAULT DATA =====
function initDefaults() {
  if (!DB.get('initialized')) {
    DB.set('categories', [
      { id: 1, name: 'شاورما', icon: 'fa-drumstick-bite' },
      { id: 2, name: 'برجر', icon: 'fa-hamburger' },
      { id: 3, name: 'بيتزا', icon: 'fa-pizza-slice' },
      { id: 4, name: 'دجاج مقلي', icon: 'fa-drumstick-bite' },
      { id: 5, name: 'مقبلات', icon: 'fa-bread-slice' },
      { id: 6, name: 'مشروبات', icon: 'fa-glass-water' }
    ]);
    DB.set('menu', [
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
    ]);
    DB.set('offers', [
      { id: 1, title: 'وجبة عائلية', desc: '4 شاورما + 2 برجر + بطاطس كبير + 4 مشروبات', price: 120000, oldPrice: 150000, image: '', active: true },
      { id: 2, title: 'وجبة الشباب', desc: '2 شاورما دبل + 2 أجنحة + 2 كولا', price: 80000, oldPrice: 95000, image: '', active: true }
    ]);
    DB.set('zones', [
      { id: 1, name: 'المزة', fee: 5000 },
      { id: 2, name: 'المالكي', fee: 3000 },
      { id: 3, name: 'الصالحية', fee: 4000 },
      { id: 4, name: 'باب توما', fee: 3500 },
      { id: 5, name: 'الحمراء', fee: 6000 },
      { id: 6, name: 'الشعلان', fee: 2500 },
      { id: 7, name: 'العمارة', fee: 4500 },
      { id: 8, name: 'ركن الدين', fee: 7000 }
    ]);
    DB.set('settings', {
      name: 'مطعم القيصر', subtitle: 'أشهى المأكولات بأجود المكونات',
      desc: 'نقدم لكم أشهى المأكولات بأجود المكونات الطازجة.',
      address: 'دمشق - شارع الثورة - مقابل جامع الحسن',
      hours: '10:00 ص - 12:00 ص',
      phone: '0999123456', phone2: '', whatsapp: '0999123456',
      email: '', alertText: 'الأسعار قابلة للتعديل حسب النشرة اليومية',
      deliveryEnabled: true, defaultZoneFee: 5000,
      facebook: '', instagram: '', twitter: '', tiktok: '', snapchat: '', youtube: ''
    });
    DB.set('password', 'admin123');
    DB.set('cart', {});
    DB.set('initialized', true);
  }
}

// ===== STATE =====
let currentCategory = 'all';
let deliveryMode = 'delivery';
let selectedZone = null;
let deferredPrompt = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initDefaults();
  setTimeout(() => {
    document.getElementById('loadingScreen').classList.add('hidden');
  }, 1500);
  renderAll();
  loadCart();
  setupPWA();
});

// ===== RENDER ALL =====
function renderAll() {
  const s = DB.get('settings', {});
  document.getElementById('alertText').textContent = s.alertText || 'الأسعار قابلة للتعديل حسب النشرة اليومية';
  document.querySelector('.logo-text h1').textContent = s.name || 'مطعم القيصر';
  document.querySelector('.logo-text span').textContent = s.subtitle || 'أشهى المأكولات';
  document.getElementById('footerDesc').textContent = s.desc || '';
  document.getElementById('footerPhone').textContent = s.phone || '--';
  document.getElementById('footerHours').textContent = s.hours || '--';
  document.getElementById('footerAddress').textContent = s.address || '--';

  // Social links
  const social = [];
  const icons = { facebook: 'fa-facebook-f', instagram: 'fa-instagram', twitter: 'fa-twitter', tiktok: 'fa-tiktok', snapchat: 'fa-snapchat', youtube: 'fa-youtube' };
  let html = '';
  for (let k in icons) { if (s[k]) { html += '<a href="' + s[k] + '" target="_blank"><i class="fab ' + icons[k] + '"></i></a>'; } }
  document.getElementById('footerSocial').innerHTML = html;

  // Delivery toggle state
  if (!s.deliveryEnabled) {
    deliveryMode = 'pickup';
    document.getElementById('zoneSelector').style.display = 'none';
    const btns = document.querySelectorAll('#deliveryToggle button');
    btns[0].classList.remove('active');
    btns[1].classList.add('active');
  }

  renderZones();
  renderCategories();
  renderMenu();
  renderOffers();
}

// ===== ZONES =====
function renderZones() {
  const zones = DB.get('zones', []);
  const sel = document.getElementById('zoneSelect');
  sel.innerHTML = '<option value="">-- اختر المنطقة --</option>' +
    zones.map(z => '<option value="' + z.id + '">' + z.name + ' (' + formatPrice(z.fee) + ')</option>').join('');
}

function updateZoneFee() {
  const zoneId = document.getElementById('zoneSelect').value;
  const zones = DB.get('zones', []);
  selectedZone = zones.find(z => z.id == zoneId);
  const display = document.getElementById('zoneFeeDisplay');
  if (selectedZone) {
    document.getElementById('zoneFeeAmount').textContent = formatPrice(selectedZone.fee);
    display.style.display = 'flex';
  } else {
    display.style.display = 'none';
  }
  updateCartBar();
}

// ===== DELIVERY MODE =====
function setDeliveryMode(mode, btn) {
  deliveryMode = mode;
  document.querySelectorAll('#deliveryToggle button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('zoneSelector').style.display = mode === 'delivery' ? 'block' : 'none';
  if (mode === 'pickup') selectedZone = null;
  updateCartBar();
}

// ===== CATEGORIES =====
function renderCategories() {
  const cats = DB.get('categories', []);
  const scroll = document.getElementById('categoriesScroll');
  scroll.innerHTML = '<button class="cat-chip active" data-cat="all" onclick="filterCategory('all', this)">الكل</button>' +
    cats.map(c => '<button class="cat-chip" data-cat="' + c.id + '" onclick="filterCategory(' + c.id + ', this)">' + c.name + '</button>').join('');
}

function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.cat-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMenu();
}

// ===== MENU =====
function renderMenu() {
  const items = DB.get('menu', []).filter(i => i.active);
  const filtered = currentCategory === 'all' ? items : items.filter(i => i.category == currentCategory);
  const grid = document.getElementById('menuGrid');
  const empty = document.getElementById('menuEmpty');

  if (!filtered.length) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  grid.innerHTML = filtered.map(item => {
    const cart = DB.get('cart', {});
    const qty = cart[item.id] || 0;
    return '<div class="menu-card fade-in">' +
      '<div class="menu-card-img">' +
        (item.image ? '<img src="' + item.image + '" alt="' + item.name + '" loading="lazy" onload="this.classList.add('loaded')">' : '') +
        '<div class="img-placeholder"><i class="fas fa-utensils"></i></div>' +
      '</div>' +
      '<div class="menu-card-body">' +
        '<h4 class="menu-card-title">' + item.name + '</h4>' +
        '<p class="menu-card-desc">' + (item.desc || '') + '</p>' +
        '<div class="menu-card-footer">' +
          '<span class="menu-card-price">' + formatPrice(item.price) + '</span>' +
          (qty > 0 
            ? '<div class="qty-control">' +
                '<button onclick="updateQty(' + item.id + ', -1); event.stopPropagation();">−</button>' +
                '<span>' + qty + '</span>' +
                '<button onclick="updateQty(' + item.id + ', 1); event.stopPropagation();">+</button>' +
              '</div>'
            : '<button class="qty-control" style="padding:4px 12px;" onclick="updateQty(' + item.id + ', 1); event.stopPropagation();">' +
                '<span style="color:var(--gold);"><i class="fas fa-plus"></i></span>' +
              '</button>'
          ) +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ===== OFFERS =====
function renderOffers() {
  const offers = DB.get('offers', []).filter(o => o.active);
  const section = document.getElementById('offersSection');
  if (!offers.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  document.getElementById('offersScroll').innerHTML = offers.map(o =>
    '<div class="offer-card">' +
      (o.oldPrice ? '<span class="offer-badge">خصم</span>' : '') +
      '<div class="offer-img">' + (o.image ? '<img src="' + o.image + '" alt="" loading="lazy">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#333;font-size:40px"><i class="fas fa-utensils"></i></div>') + '</div>' +
      '<div class="offer-body">' +
        '<h4>' + o.title + '</h4>' +
        '<p>' + o.desc + '</p>' +
        '<div class="offer-price">' +
          '<span class="new">' + formatPrice(o.price) + '</span>' +
          (o.oldPrice ? '<span class="old">' + formatPrice(o.oldPrice) + '</span>' : '') +
        '</div>' +
      '</div>' +
    '</div>'
  ).join('');
}

// ===== CART =====
function updateQty(itemId, delta) {
  const cart = DB.get('cart', {});
  const items = DB.get('menu', []);
  const item = items.find(i => i.id === itemId);
  if (!item) return;

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
  const items = DB.get('menu', []);
  let totalItems = 0, subtotal = 0;

  for (let id in cart) {
    const item = items.find(i => i.id == id);
    if (item) { totalItems += cart[id]; subtotal += item.price * cart[id]; }
  }

  const deliveryFee = (deliveryMode === 'delivery' && selectedZone) ? selectedZone.fee : 0;
  const total = subtotal + deliveryFee;

  const bar = document.getElementById('cartBar');
  if (totalItems > 0) {
    bar.classList.add('visible');
    document.getElementById('cartItemsCount').textContent = totalItems + ' ' + (totalItems === 1 ? 'صنف' : 'أصناف');
    document.getElementById('cartTotalPrice').textContent = formatPrice(total);
  } else {
    bar.classList.remove('visible');
  }
}

function loadCart() { updateCartBar(); }

// ===== CART MODAL =====
function openCartModal() {
  const cart = DB.get('cart', {});
  const items = DB.get('menu', []);
  const body = document.getElementById('cartModalBody');
  const footer = document.getElementById('cartModalFooter');

  const cartItems = [];
  let subtotal = 0;
  for (let id in cart) {
    const item = items.find(i => i.id == id);
    if (item) { cartItems.push({ ...item, qty: cart[id] }); subtotal += item.price * cart[id]; }
  }

  if (!cartItems.length) {
    body.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-basket"></i><h4>السلة فارغة</h4><p>أضف بعض الأصناف لطلبك</p></div>';
    footer.style.display = 'none';
  } else {
    body.innerHTML = cartItems.map(item =>
      '<div class="cart-item">' +
        '<div class="cart-item-img">' + (item.image ? '<img src="' + item.image + '">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#555"><i class="fas fa-utensils"></i></div>') + '</div>' +
        '<div class="cart-item-info">' +
          '<h4>' + item.name + '</h4>' +
          '<span class="item-price">' + formatPrice(item.price) + ' × ' + item.qty + '</span>' +
        '</div>' +
        '<div class="cart-item-actions">' +
          '<button class="remove-btn" onclick="updateQty(' + item.id + ', -' + item.qty + '); openCartModal();"><i class="fas fa-trash-alt"></i></button>' +
          '<div class="qty-control">' +
            '<button onclick="updateQty(' + item.id + ', -1); openCartModal();">−</button>' +
            '<span>' + item.qty + '</span>' +
            '<button onclick="updateQty(' + item.id + ', 1); openCartModal();">+</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    ).join('');

    const deliveryFee = (deliveryMode === 'delivery' && selectedZone) ? selectedZone.fee : 0;
    const total = subtotal + deliveryFee;

    document.getElementById('subtotalPrice').textContent = formatPrice(subtotal);
    document.getElementById('deliveryFeeRow').style.display = deliveryMode === 'delivery' ? 'flex' : 'none';
    document.getElementById('deliveryFeePrice').textContent = formatPrice(deliveryFee);
    document.getElementById('finalTotalPrice').textContent = formatPrice(total);
    footer.style.display = 'block';
  }

  document.getElementById('cartModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCartModal() {
  document.getElementById('cartModal').classList.remove('active');
  document.body.style.overflow = '';
}

// ===== WHATSAPP ORDER =====
function sendWhatsAppOrder() {
  const cart = DB.get('cart', {});
  if (!Object.keys(cart).length) { toast('السلة فارغة', 'error'); return; }
  document.getElementById('customerModal').classList.add('active');
}

function closeCustomerModal() {
  document.getElementById('customerModal').classList.remove('active');
}

function confirmOrder() {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const notes = document.getElementById('custNotes').value.trim();

  if (!name || !phone) { toast('يرجى إدخال الاسم ورقم الهاتف', 'error'); return; }
  if (deliveryMode === 'delivery' && !address) { toast('يرجى إدخال العنوان للتوصيل', 'error'); return; }
  if (deliveryMode === 'delivery' && !selectedZone) { toast('يرجى اختيار المنطقة', 'error'); return; }

  const cart = DB.get('cart', {});
  const items = DB.get('menu', []);
  const s = DB.get('settings', {});

  let subtotal = 0;
  let itemsText = '';
  for (let id in cart) {
    const item = items.find(i => i.id == id);
    if (item) {
      const lineTotal = item.price * cart[id];
      subtotal += lineTotal;
      itemsText += '• ' + item.name + ' × ' + cart[id] + ' = ' + formatPrice(lineTotal) + '\n';
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

  const waNumber = s.whatsapp || s.phone || '';
  const waLink = 'https://wa.me/' + waNumber.replace(/\D/g, '') + '?text=' + encodeURIComponent(msg);

  // Clear cart
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
  if (!p && p !== 0) return '';
  return p.toLocaleString('ar-SY') + ' ل.س';
}

function toast(msg, type) {
  const c = document.getElementById('toastContainer');
  const div = document.createElement('div');
  div.className = 'toast ' + (type || 'success');
  const icon = type === 'error' ? 'fa-exclamation-circle' : type === 'info' ? 'fa-info-circle' : 'fa-check-circle';
  div.innerHTML = '<i class="fas ' + icon + '"></i><span>' + msg + '</span>';
  c.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// ===== PWA =====
function setupPWA() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
      document.getElementById('pwaBanner').classList.add('visible');
    }, 3000);
  });
}

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
  }
  document.getElementById('pwaBanner').classList.remove('visible');
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});
