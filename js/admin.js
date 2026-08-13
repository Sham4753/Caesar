// ═══════════════════════════════════════════
//  مطعم القيصر - لوحة التحكم
// ═══════════════════════════════════════════

const DB = {
  get(k, d) { try { let v = localStorage.getItem('alqaysar_' + k); return v ? JSON.parse(v) : d; } catch(e) { return d; } },
  set(k, v) { localStorage.setItem('alqaysar_' + k, JSON.stringify(v)); }
};

// ===== AUTH =====
function doLogin() {
  let p = document.getElementById('adminPassword').value;
  let s = DB.get('password', 'admin123');
  if (p === s) {
    sessionStorage.setItem('alqaysar_admin', 'true');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminLayout').classList.add('active');
    initAdmin();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
}
function logout() { sessionStorage.removeItem('alqaysar_admin'); location.reload(); }
function checkAuth() {
  if (sessionStorage.getItem('alqaysar_admin') === 'true') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminLayout').classList.add('active');
    initAdmin();
  }
}

// ===== TOAST =====
function toast(m, t) {
  let c = document.getElementById('toastContainer');
  let d = document.createElement('div');
  d.className = 'toast ' + (t || 'success');
  let i = t === 'error' ? 'fa-exclamation-circle' : t === 'info' ? 'fa-info-circle' : 'fa-check-circle';
  d.innerHTML = '<i class="fas ' + i + '"></i><span>' + m + '</span>';
  c.appendChild(d);
  setTimeout(() => d.remove(), 3500);
}

// ===== SECTIONS =====
function showSection(id, el) {
  document.querySelectorAll('.section-content').forEach(s => s.style.display = 'none');
  document.getElementById(id + '-section').style.display = 'block';
  document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');
  let T = { dashboard: 'لوحة التحكم', menu: 'إدارة القائمة', categories: 'التصنيفات', offers: 'العروض', zones: 'المناطق والتوصيل', settings: 'إعدادات الموقع' };
  document.getElementById('page-title').innerHTML = '<i class="fas ' + (el ? el.querySelector('i').className.replace('fas ', '') : 'fa-tachometer-alt') + '"></i> ' + T[id];
  if (id === 'menu') renderMenuTable();
  if (id === 'categories') renderCategoriesTable();
  if (id === 'offers') renderOffersTable();
  if (id === 'zones') renderZonesTable();
  if (id === 'settings') loadSettings();
  if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function showTab(t, b) {
  document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
  document.getElementById('tab-' + t).classList.add('active');
  b.classList.add('active');
}

// ===== INIT =====
function initAdmin() { updateStats(); renderMenuTable(); }
function updateStats() {
  document.getElementById('stat-items').textContent = DB.get('menu', []).length;
  document.getElementById('stat-cats').textContent = DB.get('categories', []).length;
  document.getElementById('stat-offers').textContent = DB.get('offers', []).length;
  document.getElementById('stat-zones').textContent = DB.get('zones', []).length;
}

// ===== MENU CRUD =====
function renderMenuTable() {
  let items = DB.get('menu', []), search = document.getElementById('menuSearch').value.toLowerCase();
  let filtered = items.filter(i => i.name.toLowerCase().includes(search));
  let cats = DB.get('categories', []), tbody = document.getElementById('menuTableBody');
  document.getElementById('menuEmpty').style.display = filtered.length ? 'none' : 'block';
  tbody.innerHTML = filtered.map((item, idx) => {
    let cat = cats.find(c => c.id == item.category);
    return '<tr><td>' + (idx + 1) + '</td>' +
      '<td><div class="item-img">' + (item.image ? '<img src="' + item.image + '" style="width:40px;height:40px;object-fit:cover;border-radius:8px">' : '<i class="fas fa-image"></i>') + '</div></td>' +
      '<td><strong>' + item.name + '</strong></td>' +
      '<td>' + (cat ? cat.name : '--') + '</td>' +
      '<td>' + (item.price ? item.price.toLocaleString('ar-SY') : '--') + '</td>' +
      '<td><span class="badge ' + (item.active ? 'badge-on' : 'badge-off') + '">' + (item.active ? 'متاح' : 'مخفي') + '</span></td>' +
      '<td><button class="btn btn-dark btn-sm" onclick="editItem(' + item.id + ')"><i class="fas fa-edit"></i></button> ' +
      '<button class="btn btn-danger btn-sm" onclick="deleteItem(' + item.id + ')"><i class="fas fa-trash"></i></button></td></tr>';
  }).join('');
}

function openItemModal() {
  document.getElementById('item-id').value = '';
  document.getElementById('item-name').value = '';
  document.getElementById('item-price').value = '';
  document.getElementById('item-desc').value = '';
  document.getElementById('item-image').value = '';
  document.getElementById('item-active-toggle').classList.add('active');
  document.getElementById('itemModalTitle').innerHTML = '<i class="fas fa-plus"></i> إضافة صنف جديد';
  populateCats();
  document.getElementById('itemModal').classList.add('active');
}
function editItem(id) {
  let item = DB.get('menu', []).find(i => i.id === id);
  if (!item) return;
  document.getElementById('item-id').value = item.id;
  document.getElementById('item-name').value = item.name;
  document.getElementById('item-price').value = item.price;
  document.getElementById('item-desc').value = item.desc || '';
  document.getElementById('item-image').value = item.image || '';
  document.getElementById('item-active-toggle').classList.toggle('active', item.active);
  document.getElementById('itemModalTitle').innerHTML = '<i class="fas fa-edit"></i> تعديل صنف';
  populateCats(item.category);
  document.getElementById('itemModal').classList.add('active');
}
function saveItem() {
  let id = document.getElementById('item-id').value;
  let name = document.getElementById('item-name').value.trim();
  let price = parseFloat(document.getElementById('item-price').value);
  let category = document.getElementById('item-category').value;
  if (!name || !price || !category) { toast('يرجى ملء جميع الحقول المطلوبة', 'error'); return; }
  let items = DB.get('menu', []);
  let data = { id: id ? parseInt(id) : Date.now(), name, price, category: parseInt(category), desc: document.getElementById('item-desc').value.trim(), image: document.getElementById('item-image').value.trim(), active: document.getElementById('item-active-toggle').classList.contains('active') };
  if (id) { let idx = items.findIndex(i => i.id === parseInt(id)); if (idx > -1) items[idx] = data; }
  else items.push(data);
  DB.set('menu', items);
  closeItemModal(); renderMenuTable(); updateStats(); toast('تم حفظ الصنف');
}
function deleteItem(id) { if (!confirm('هل أنت متأكد من حذف هذا الصنف؟')) return; DB.set('menu', DB.get('menu', []).filter(i => i.id !== id)); renderMenuTable(); updateStats(); toast('تم الحذف'); }
function closeItemModal() { document.getElementById('itemModal').classList.remove('active'); }
function populateCats(sel) {
  let cats = DB.get('categories', []), s = document.getElementById('item-category');
  s.innerHTML = '<option value="">اختر التصنيف</option>' + cats.map(c => '<option value="' + c.id + '"' + (c.id == sel ? ' selected' : '') + '>' + c.name + '</option>').join('');
}

// ===== CATEGORIES CRUD =====
function renderCategoriesTable() {
  let cats = DB.get('categories', []), items = DB.get('menu', []), tbody = document.getElementById('categoriesTableBody');
  tbody.innerHTML = cats.map((c, idx) => {
    let count = items.filter(i => i.category == c.id).length;
    return '<tr><td>' + (idx + 1) + '</td><td><strong>' + c.name + '</strong></td><td><i class="fas ' + (c.icon || 'fa-tag') + '"></i></td><td>' + count + '</td>' +
      '<td><button class="btn btn-dark btn-sm" onclick="editCategory(' + c.id + ')"><i class="fas fa-edit"></i></button> ' +
      '<button class="btn btn-danger btn-sm" onclick="deleteCategory(' + c.id + ')"><i class="fas fa-trash"></i></button></td></tr>';
  }).join('');
}
function openCategoryModal() { document.getElementById('cat-id').value = ''; document.getElementById('cat-name').value = ''; document.getElementById('cat-icon').value = ''; document.getElementById('catModalTitle').innerHTML = '<i class="fas fa-plus"></i> إضافة تصنيف'; document.getElementById('categoryModal').classList.add('active'); }
function editCategory(id) { let cat = DB.get('categories', []).find(c => c.id === id); if (!cat) return; document.getElementById('cat-id').value = cat.id; document.getElementById('cat-name').value = cat.name; document.getElementById('cat-icon').value = cat.icon || ''; document.getElementById('catModalTitle').innerHTML = '<i class="fas fa-edit"></i> تعديل تصنيف'; document.getElementById('categoryModal').classList.add('active'); }
function saveCategory() { let id = document.getElementById('cat-id').value, name = document.getElementById('cat-name').value.trim(); if (!name) { toast('يرجى إدخال اسم التصنيف', 'error'); return; } let cats = DB.get('categories', []), data = { id: id ? parseInt(id) : Date.now(), name, icon: document.getElementById('cat-icon').value.trim() || 'fa-tag' }; if (id) { let idx = cats.findIndex(c => c.id === parseInt(id)); if (idx > -1) cats[idx] = data; } else cats.push(data); DB.set('categories', cats); closeCategoryModal(); renderCategoriesTable(); updateStats(); toast('تم حفظ التصنيف'); }
function deleteCategory(id) { if (!confirm('هل أنت متأكد؟')) return; DB.set('categories', DB.get('categories', []).filter(c => c.id !== id)); renderCategoriesTable(); updateStats(); toast('تم الحذف'); }
function closeCategoryModal() { document.getElementById('categoryModal').classList.remove('active'); }

// ===== OFFERS CRUD =====
function renderOffersTable() {
  let offers = DB.get('offers', []), tbody = document.getElementById('offersTableBody');
  document.getElementById('offersEmpty').style.display = offers.length ? 'none' : 'block';
  tbody.innerHTML = offers.map((o, idx) => '<tr><td>' + (idx + 1) + '</td>' +
    '<td><div class="item-img">' + (o.image ? '<img src="' + o.image + '" style="width:40px;height:40px;object-fit:cover;border-radius:8px">' : '<i class="fas fa-image"></i>') + '</div></td>' +
    '<td><strong>' + o.title + '</strong></td>' +
    '<td>' + (o.price ? o.price.toLocaleString('ar-SY') : '--') + '</td>' +
    '<td><span class="badge ' + (o.active ? 'badge-on' : 'badge-off') + '">' + (o.active ? 'نشط' : 'معطل') + '</span></td>' +
    '<td><button class="btn btn-dark btn-sm" onclick="editOffer(' + o.id + ')"><i class="fas fa-edit"></i></button> ' +
    '<button class="btn btn-danger btn-sm" onclick="deleteOffer(' + o.id + ')"><i class="fas fa-trash"></i></button></td></tr>').join('');
}
function openOfferModal() { document.getElementById('offer-id').value = ''; document.getElementById('offer-title').value = ''; document.getElementById('offer-desc').value = ''; document.getElementById('offer-price').value = ''; document.getElementById('offer-oldprice').value = ''; document.getElementById('offer-image').value = ''; document.getElementById('offer-active-toggle').classList.add('active'); document.getElementById('offerModalTitle').innerHTML = '<i class="fas fa-plus"></i> إضافة عرض'; document.getElementById('offerModal').classList.add('active'); }
function editOffer(id) { let o = DB.get('offers', []).find(x => x.id === id); if (!o) return; document.getElementById('offer-id').value = o.id; document.getElementById('offer-title').value = o.title; document.getElementById('offer-desc').value = o.desc || ''; document.getElementById('offer-price').value = o.price; document.getElementById('offer-oldprice').value = o.oldPrice || ''; document.getElementById('offer-image').value = o.image || ''; document.getElementById('offer-active-toggle').classList.toggle('active', o.active); document.getElementById('offerModalTitle').innerHTML = '<i class="fas fa-edit"></i> تعديل عرض'; document.getElementById('offerModal').classList.add('active'); }
function saveOffer() { let id = document.getElementById('offer-id').value, title = document.getElementById('offer-title').value.trim(), price = parseFloat(document.getElementById('offer-price').value); if (!title || !price) { toast('يرجى ملء الحقول المطلوبة', 'error'); return; } let offers = DB.get('offers', []), data = { id: id ? parseInt(id) : Date.now(), title, price, desc: document.getElementById('offer-desc').value.trim(), oldPrice: parseFloat(document.getElementById('offer-oldprice').value) || 0, image: document.getElementById('offer-image').value.trim(), active: document.getElementById('offer-active-toggle').classList.contains('active') }; if (id) { let idx = offers.findIndex(o => o.id === parseInt(id)); if (idx > -1) offers[idx] = data; } else offers.push(data); DB.set('offers', offers); closeOfferModal(); renderOffersTable(); updateStats(); toast('تم حفظ العرض'); }
function deleteOffer(id) { if (!confirm('هل أنت متأكد؟')) return; DB.set('offers', DB.get('offers', []).filter(o => o.id !== id)); renderOffersTable(); updateStats(); toast('تم الحذف'); }
function closeOfferModal() { document.getElementById('offerModal').classList.remove('active'); }

// ===== ZONES CRUD =====
function renderZonesTable() {
  let zones = DB.get('zones', []), s = DB.get('settings', {});
  document.getElementById('deliveryToggleBtn').classList.toggle('active', s.deliveryEnabled !== false);
  document.getElementById('deliveryStatusText').textContent = (s.deliveryEnabled !== false) ? 'التوصيل مفعل ✅' : 'التوصيل معطل ❌';
  let tbody = document.getElementById('zonesTableBody');
  tbody.innerHTML = zones.map((z, idx) => '<tr><td>' + (idx + 1) + '</td><td><strong>' + z.name + '</strong></td><td>' + z.fee.toLocaleString('ar-SY') + ' ل.س</td>' +
    '<td><button class="btn btn-dark btn-sm" onclick="editZone(' + z.id + ')"><i class="fas fa-edit"></i></button> ' +
    '<button class="btn btn-danger btn-sm" onclick="deleteZone(' + z.id + ')"><i class="fas fa-trash"></i></button></td></tr>').join('');
}
function toggleDelivery() {
  let s = DB.get('settings', {});
  s.deliveryEnabled = !(s.deliveryEnabled !== false);
  DB.set('settings', s);
  renderZonesTable();
  toast(s.deliveryEnabled ? 'تم تفعيل التوصيل' : 'تم إيقاف التوصيل');
}
function openZoneModal() { document.getElementById('zone-id').value = ''; document.getElementById('zone-name').value = ''; document.getElementById('zone-fee').value = ''; document.getElementById('zoneModalTitle').innerHTML = '<i class="fas fa-plus"></i> إضافة منطقة'; document.getElementById('zoneModal').classList.add('active'); }
function editZone(id) { let z = DB.get('zones', []).find(x => x.id === id); if (!z) return; document.getElementById('zone-id').value = z.id; document.getElementById('zone-name').value = z.name; document.getElementById('zone-fee').value = z.fee; document.getElementById('zoneModalTitle').innerHTML = '<i class="fas fa-edit"></i> تعديل منطقة'; document.getElementById('zoneModal').classList.add('active'); }
function saveZone() { let id = document.getElementById('zone-id').value, name = document.getElementById('zone-name').value.trim(), fee = parseFloat(document.getElementById('zone-fee').value); if (!name || isNaN(fee)) { toast('يرجى ملء جميع الحقول', 'error'); return; } let zones = DB.get('zones', []), data = { id: id ? parseInt(id) : Date.now(), name, fee }; if (id) { let idx = zones.findIndex(z => z.id === parseInt(id)); if (idx > -1) zones[idx] = data; } else zones.push(data); DB.set('zones', zones); closeZoneModal(); renderZonesTable(); updateStats(); toast('تم حفظ المنطقة'); }
function deleteZone(id) { if (!confirm('هل أنت متأكد؟')) return; DB.set('zones', DB.get('zones', []).filter(z => z.id !== id)); renderZonesTable(); updateStats(); toast('تم الحذف'); }
function closeZoneModal() { document.getElementById('zoneModal').classList.remove('active'); }

// ===== SETTINGS =====
function loadSettings() {
  let s = DB.get('settings', {});
  document.getElementById('site-name').value = s.name || '';
  document.getElementById('site-subtitle').value = s.subtitle || '';
  document.getElementById('site-desc').value = s.desc || '';
  document.getElementById('site-alert').value = s.alertText || '';
  document.getElementById('site-address').value = s.address || '';
  document.getElementById('site-hours').value = s.hours || '';
  document.getElementById('site-phone').value = s.phone || '';
  document.getElementById('site-whatsapp').value = s.whatsapp || '';
  document.getElementById('site-phone2').value = s.phone2 || '';
  document.getElementById('site-email').value = s.email || '';
  document.getElementById('social-facebook').value = s.facebook || '';
  document.getElementById('social-instagram').value = s.instagram || '';
  document.getElementById('social-twitter').value = s.twitter || '';
  document.getElementById('social-tiktok').value = s.tiktok || '';
  document.getElementById('social-snapchat').value = s.snapchat || '';
  document.getElementById('social-youtube').value = s.youtube || '';
}
function saveSettings() {
  let s = DB.get('settings', {});
  s.name = document.getElementById('site-name').value.trim();
  s.subtitle = document.getElementById('site-subtitle').value.trim();
  s.desc = document.getElementById('site-desc').value.trim();
  s.alertText = document.getElementById('site-alert').value.trim();
  s.address = document.getElementById('site-address').value.trim();
  s.hours = document.getElementById('site-hours').value.trim();
  s.phone = document.getElementById('site-phone').value.trim();
  s.whatsapp = document.getElementById('site-whatsapp').value.trim();
  s.phone2 = document.getElementById('site-phone2').value.trim();
  s.email = document.getElementById('site-email').value.trim();
  s.facebook = document.getElementById('social-facebook').value.trim();
  s.instagram = document.getElementById('social-instagram').value.trim();
  s.twitter = document.getElementById('social-twitter').value.trim();
  s.tiktok = document.getElementById('social-tiktok').value.trim();
  s.snapchat = document.getElementById('social-snapchat').value.trim();
  s.youtube = document.getElementById('social-youtube').value.trim();
  let np = document.getElementById('new-password').value, cp = document.getElementById('confirm-password').value;
  if (np) { if (np !== cp) { toast('كلمتا المرور غير متطابقتين', 'error'); return; } DB.set('password', np); document.getElementById('new-password').value = ''; document.getElementById('confirm-password').value = ''; }
  DB.set('settings', s); toast('تم حفظ الإعدادات');
}

// ===== EXPORT / IMPORT / RESET =====
function exportData() {
  let data = { categories: DB.get('categories', []), menu: DB.get('menu', []), offers: DB.get('offers', []), zones: DB.get('zones', []), settings: DB.get('settings', {}), password: DB.get('password', 'admin123') };
  let blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = 'alqaysar-backup-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); URL.revokeObjectURL(url); toast('تم تصدير البيانات');
}
function importData() {
  let input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
  input.onchange = (e) => {
    let file = e.target.files[0]; if (!file) return;
    let reader = new FileReader();
    reader.onload = (ev) => { try { let data = JSON.parse(ev.target.result); if (data.categories) DB.set('categories', data.categories); if (data.menu) DB.set('menu', data.menu); if (data.offers) DB.set('offers', data.offers); if (data.zones) DB.set('zones', data.zones); if (data.settings) DB.set('settings', data.settings); if (data.password) DB.set('password', data.password); toast('تم استيراد البيانات'); updateStats(); renderMenuTable(); renderCategoriesTable(); renderOffersTable(); renderZonesTable(); } catch (err) { toast('ملف غير صالح', 'error'); } };
    reader.readAsText(file);
  }; input.click();
}
function resetData() { if (!confirm('هل أنت متأكد؟ سيتم حذف جميع البيانات!')) return; localStorage.removeItem('alqaysar_initialized'); ['categories', 'menu', 'offers', 'zones', 'settings', 'password', 'visits', 'cart'].forEach(k => localStorage.removeItem('alqaysar_' + k)); toast('تم إعادة التعيين'); setTimeout(() => location.reload(), 1500); }

// Close modals on overlay click
document.addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay')) { e.target.classList.remove('active'); } });
document.addEventListener('DOMContentLoaded', checkAuth);
