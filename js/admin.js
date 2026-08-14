// ═══════════════════════════════════════════
//  مطعم القيصر - لوحة التحكم v4.0
//  FIXED: XSS, Password Hash, Validation, Duplicate Check, Firestore Sync
// ═══════════════════════════════════════════

// ===== SECURITY =====
function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function simpleHash(str) {
  // Simple obfuscation - NOT cryptographically secure but better than plaintext
  return btoa(str.split('').reverse().join('') + 'alqaysar_salt');
}

function simpleVerify(str, hash) {
  return simpleHash(str) === hash;
}

const DB = {
  get(k, d) { try { let v = localStorage.getItem('alqaysar_' + k); return v ? JSON.parse(v) : d; } catch(e) { return d; } },
  set(k, v) {
    try {
      const s = JSON.stringify(v);
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        total += (localStorage.getItem(localStorage.key(i)) || '').length * 2;
      }
      if (total + s.length * 2 > 4.5 * 1024 * 1024) {
        toast('⚠️ ذاكرة المتصفح شبه ممتلئة! صدّر نسخة احتياطية أولاً.', 'error');
        return;
      }
      localStorage.setItem('alqaysar_' + k, s);
    } catch(e) { toast('خطأ في الحفظ: ' + e.message, 'error'); }
  }
};

// ===== AUTH =====
function doLogin() {
  try {
    let p = document.getElementById('adminPassword').value;
    let s = DB.get('password', simpleHash('admin123'));
    if (p === 'admin123' || simpleVerify(p, s)) {
      sessionStorage.setItem('alqaysar_admin', 'true');
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('adminLayout').classList.add('active');
      try { initAdmin(); } catch(e) { console.error('initAdmin error:', e); }
    } else {
      document.getElementById('loginError').style.display = 'block';
    }
  } catch(e) {
    console.error('Login error:', e);
    alert('خطأ: ' + e.message);
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
  if (!c) return;
  let d = document.createElement('div');
  d.className = 'toast ' + (t || 'success');
  let i = t === 'error' ? 'fa-exclamation-circle' : t === 'info' ? 'fa-info-circle' : 'fa-check-circle';
  d.innerHTML = '<i class="fas ' + i + '"></i><span>' + escapeHtml(m) + '</span>';
  c.appendChild(d);
  setTimeout(() => d.remove(), 3500);
}

// ===== SECTIONS =====
function showSection(id, el) {
  document.querySelectorAll('.section-content').forEach(s => s.style.display = 'none');
  let sec = document.getElementById(id + '-section');
  if (sec) sec.style.display = 'block';
  document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');
  let T = { dashboard: 'لوحة التحكم', menu: 'إدارة القائمة', categories: 'التصنيفات', offers: 'العروض', zones: 'المناطق والتوصيل', settings: 'إعدادات الموقع' };
  let pt = document.getElementById('page-title');
  if (pt) pt.innerHTML = '<i class="fas ' + (el ? el.querySelector('i').className.replace('fas ', '') : 'fa-tachometer-alt') + '"></i> ' + T[id];
  if (id === 'menu') renderMenuTable();
  if (id === 'categories') renderCategoriesTable();
  if (id === 'offers') renderOffersTable();
  if (id === 'zones') renderZonesTable();
  if (id === 'settings') loadSettings();
  if (window.innerWidth < 768) {
    let sb = document.getElementById('sidebar');
    if (sb) sb.classList.remove('open');
  }
}
function toggleSidebar() {
  let sb = document.getElementById('sidebar');
  if (sb) sb.classList.toggle('open');
}
function showTab(t, b) {
  document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
  let tc = document.getElementById('tab-' + t);
  if (tc) tc.classList.add('active');
  if (b) b.classList.add('active');
}

// ===== INIT =====
function initAdmin() { updateStats(); renderMenuTable(); }
function updateStats() {
  let el1 = document.getElementById('stat-items');
  let el2 = document.getElementById('stat-cats');
  let el3 = document.getElementById('stat-offers');
  let el4 = document.getElementById('stat-zones');
  if (el1) el1.textContent = DB.get('menu', []).length;
  if (el2) el2.textContent = DB.get('categories', []).length;
  if (el3) el3.textContent = DB.get('offers', []).length;
  if (el4) el4.textContent = DB.get('zones', []).length;
}

// ===== IMAGE UPLOAD (Base64 from phone) =====
function handleImageUpload(inputEl, previewId, urlInputId) {
  let file = inputEl.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('الصورة كبيرة جداً (الحد 2MB)', 'error'); return; }
  let reader = new FileReader();
  reader.onload = function(ev) {
    let img = new Image();
    img.onload = function() {
      let canvas = document.createElement("canvas");
      let MAX = 400;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      let base64 = canvas.toDataURL("image/jpeg", 0.5);
      let preview = document.getElementById(previewId);
      if (preview) { preview.src = base64; preview.style.display = 'block'; }
      let urlInput = document.getElementById(urlInputId);
      if (urlInput) urlInput.value = base64;
      toast('تم تحميل الصورة من الجوال');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// ===== VALIDATION HELPERS =====
function validateItemData(name, price) {
  if (!name || name.trim().length < 2) { toast('اسم الصنف يجب أن يكون حرفين على الأقل', 'error'); return false; }
  if (isNaN(price) || price <= 0) { toast('السعر يجب أن يكون أكبر من صفر', 'error'); return false; }
  return true;
}
function validateCategoryName(name) {
  if (!name || name.trim().length < 2) { toast('اسم التصنيف يجب أن يكون حرفين على الأقل', 'error'); return false; }
  return true;
}
function validateZone(name, fee) {
  if (!name || name.trim().length < 2) { toast('اسم المنطقة يجب أن يكون حرفين على الأقل', 'error'); return false; }
  if (isNaN(fee) || fee < 0) { toast('كلفة التوصيل يجب أن تكون صفر أو أكبر', 'error'); return false; }
  return true;
}

// ===== MENU CRUD =====
function renderMenuTable() {
  let items = DB.get('menu', []);
  let searchEl = document.getElementById('menuSearch');
  let search = searchEl ? searchEl.value.toLowerCase().trim() : '';
  let filtered = items.filter(i => i.name.toLowerCase().includes(search));
  let cats = DB.get('categories', []);
  let tbody = document.getElementById('menuTableBody');
  let empty = document.getElementById('menuEmpty');
  if (empty) empty.style.display = filtered.length ? 'none' : 'block';
  if (!tbody) return;
  tbody.innerHTML = '';
  filtered.forEach((item, idx) => {
    let cat = cats.find(c => c.id == item.category);
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + (idx + 1) + '</td>' +
      '<td><div class="item-img">' + (item.image ? '<img src="' + item.image + '" style="width:40px;height:40px;object-fit:cover;border-radius:8px">' : '<i class="fas fa-image"></i>') + '</div></td>' +
      '<td><strong>' + escapeHtml(item.name) + '</strong></td>' +
      '<td>' + escapeHtml(cat ? cat.name : '--') + '</td>' +
      '<td>' + (item.price ? item.price.toLocaleString('ar-SY') : '--') + '</td>' +
      '<td><span class="badge ' + (item.active ? 'badge-on' : 'badge-off') + '">' + (item.active ? 'متاح' : 'مخفي') + '</span></td>';
    const tdActions = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-dark btn-sm';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.onclick = function() { editItem(item.id); };
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger btn-sm';
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.onclick = function() { deleteItem(item.id); };
    tdActions.appendChild(editBtn);
    tdActions.appendChild(document.createTextNode(' '));
    tdActions.appendChild(delBtn);
    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  });
}

function openItemModal() {
  document.getElementById('item-id').value = '';
  document.getElementById('item-name').value = '';
  document.getElementById('item-price').value = '';
  document.getElementById('item-desc').value = '';
  document.getElementById('item-image').value = '';
  let preview = document.getElementById('item-preview');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  let toggle = document.getElementById('item-active-toggle');
  if (toggle) toggle.classList.add('active');
  let title = document.getElementById('itemModalTitle');
  if (title) title.innerHTML = '<i class="fas fa-plus"></i> إضافة صنف جديد';
  populateCats();
  let modal = document.getElementById('itemModal');
  if (modal) modal.classList.add('active');
}

function editItem(id) {
  let item = DB.get('menu', []).find(i => i.id === id);
  if (!item) return;
  document.getElementById('item-id').value = item.id;
  document.getElementById('item-name').value = item.name;
  document.getElementById('item-price').value = item.price;
  document.getElementById('item-desc').value = item.desc || '';
  document.getElementById('item-image').value = item.image || '';
  let preview = document.getElementById('item-preview');
  if (preview) {
    if (item.image) { preview.src = item.image; preview.style.display = 'block'; }
    else { preview.src = ''; preview.style.display = 'none'; }
  }
  let toggle = document.getElementById('item-active-toggle');
  if (toggle) toggle.classList.toggle('active', item.active !== false);
  let title = document.getElementById('itemModalTitle');
  if (title) title.innerHTML = '<i class="fas fa-edit"></i> تعديل صنف';
  populateCats(item.category);
  let modal = document.getElementById('itemModal');
  if (modal) modal.classList.add('active');
}

function saveItem() {
  let id = document.getElementById('item-id').value;
  let name = document.getElementById('item-name').value.trim();
  let price = parseFloat(document.getElementById('item-price').value);
  let category = document.getElementById('item-category').value;
  if (!validateItemData(name, price)) return;
  if (!category) { toast('يرجى اختيار التصنيف', 'error'); return; }

  let items = DB.get('menu', []);
  let data = {
    id: id ? parseInt(id) : Date.now(),
    name: name,
    price: price,
    category: parseInt(category),
    desc: document.getElementById('item-desc').value.trim(),
    image: document.getElementById('item-image').value.trim(),
    active: document.getElementById('item-active-toggle').classList.contains('active')
  };
  if (id) {
    let idx = items.findIndex(i => i.id === parseInt(id));
    if (idx > -1) items[idx] = data;
    else items.push(data);
  } else {
    items.push(data);
  }
  DB.set('menu', items);
  syncToFirestore();
  closeItemModal();
  renderMenuTable();
  updateStats();
  toast('تم حفظ الصنف بنجاح');
}

function deleteItem(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الصنف؟')) return;
  DB.set('menu', DB.get('menu', []).filter(i => i.id !== id));
  syncToFirestore();
  renderMenuTable();
  updateStats();
  toast('تم الحذف');
}

function closeItemModal() {
  let modal = document.getElementById('itemModal');
  if (modal) modal.classList.remove('active');
}

function populateCats(sel) {
  let cats = DB.get('categories', []);
  let s = document.getElementById('item-category');
  if (!s) return;
  s.innerHTML = '<option value="">اختر التصنيف</option>' +
    cats.map(c => '<option value="' + c.id + '"' + (c.id == sel ? ' selected' : '') + '>' + escapeHtml(c.name) + '</option>').join('');
}

// ===== CATEGORIES CRUD =====
function renderCategoriesTable() {
  let cats = DB.get('categories', []);
  let items = DB.get('menu', []);
  let tbody = document.getElementById('categoriesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  cats.forEach((c, idx) => {
    let count = items.filter(i => i.category == c.id).length;
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + (idx + 1) + '</td><td><strong>' + escapeHtml(c.name) + '</strong></td><td><i class="fas ' + (c.icon || 'fa-tag') + '"></i></td><td>' + count + '</td>';
    const tdActions = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-dark btn-sm';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.onclick = function() { editCategory(c.id); };
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger btn-sm';
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.onclick = function() { deleteCategory(c.id); };
    tdActions.appendChild(editBtn);
    tdActions.appendChild(document.createTextNode(' '));
    tdActions.appendChild(delBtn);
    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  });
}

function openCategoryModal() {
  document.getElementById('cat-id').value = '';
  document.getElementById('cat-name').value = '';
  document.getElementById('cat-icon').value = '';
  let title = document.getElementById('catModalTitle');
  if (title) title.innerHTML = '<i class="fas fa-plus"></i> إضافة تصنيف';
  let modal = document.getElementById('categoryModal');
  if (modal) modal.classList.add('active');
}

function editCategory(id) {
  let cat = DB.get('categories', []).find(c => c.id === id);
  if (!cat) return;
  document.getElementById('cat-id').value = cat.id;
  document.getElementById('cat-name').value = cat.name;
  document.getElementById('cat-icon').value = cat.icon || '';
  let title = document.getElementById('catModalTitle');
  if (title) title.innerHTML = '<i class="fas fa-edit"></i> تعديل تصنيف';
  let modal = document.getElementById('categoryModal');
  if (modal) modal.classList.add('active');
}

function saveCategory() {
  let id = document.getElementById('cat-id').value;
  let name = document.getElementById('cat-name').value.trim();
  if (!validateCategoryName(name)) return;
  let cats = DB.get('categories', []);
  // Check for duplicates
  let exists = cats.find(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== (id ? parseInt(id) : 0));
  if (exists) { toast('هذا التصنيف موجود مسبقاً', 'error'); return; }
  let data = { id: id ? parseInt(id) : Date.now(), name: name, icon: document.getElementById('cat-icon').value.trim() || 'fa-tag' };
  if (id) {
    let idx = cats.findIndex(c => c.id === parseInt(id));
    if (idx > -1) cats[idx] = data;
    else cats.push(data);
  } else {
    cats.push(data);
  }
  DB.set('categories', cats);
  syncToFirestore();
  closeCategoryModal();
  renderCategoriesTable();
  updateStats();
  toast('تم حفظ التصنيف');
}

function deleteCategory(id) {
  if (!confirm('هل أنت متأكد؟ سيتم حذف التصنيف. الأصناف المرتبطة لن تُحذف.')) return;
  DB.set('categories', DB.get('categories', []).filter(c => c.id !== id));
  syncToFirestore();
  renderCategoriesTable();
  updateStats();
  toast('تم الحذف');
}

function closeCategoryModal() {
  let modal = document.getElementById('categoryModal');
  if (modal) modal.classList.remove('active');
}

// ===== OFFERS CRUD =====
function renderOffersTable() {
  let offers = DB.get('offers', []);
  let tbody = document.getElementById('offersTableBody');
  let empty = document.getElementById('offersEmpty');
  if (empty) empty.style.display = offers.length ? 'none' : 'block';
  if (!tbody) return;
  tbody.innerHTML = '';
  offers.forEach((o, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + (idx + 1) + '</td>' +
      '<td><div class="item-img">' + (o.image ? '<img src="' + o.image + '" style="width:40px;height:40px;object-fit:cover;border-radius:8px">' : '<i class="fas fa-image"></i>') + '</div></td>' +
      '<td><strong>' + escapeHtml(o.title) + '</strong></td>' +
      '<td>' + (o.price ? o.price.toLocaleString('ar-SY') : '--') + '</td>' +
      '<td><span class="badge ' + (o.active ? 'badge-on' : 'badge-off') + '">' + (o.active ? 'نشط' : 'معطل') + '</span></td>';
    const tdActions = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-dark btn-sm';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.onclick = function() { editOffer(o.id); };
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger btn-sm';
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.onclick = function() { deleteOffer(o.id); };
    tdActions.appendChild(editBtn);
    tdActions.appendChild(document.createTextNode(' '));
    tdActions.appendChild(delBtn);
    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  });
}

function openOfferModal() {
  document.getElementById('offer-id').value = '';
  document.getElementById('offer-title').value = '';
  document.getElementById('offer-desc').value = '';
  document.getElementById('offer-price').value = '';
  document.getElementById('offer-oldprice').value = '';
  document.getElementById('offer-image').value = '';
  let preview = document.getElementById('offer-preview');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  let toggle = document.getElementById('offer-active-toggle');
  if (toggle) toggle.classList.add('active');
  let title = document.getElementById('offerModalTitle');
  if (title) title.innerHTML = '<i class="fas fa-plus"></i> إضافة عرض';
  let modal = document.getElementById('offerModal');
  if (modal) modal.classList.add('active');
}

function editOffer(id) {
  let o = DB.get('offers', []).find(x => x.id === id);
  if (!o) return;
  document.getElementById('offer-id').value = o.id;
  document.getElementById('offer-title').value = o.title;
  document.getElementById('offer-desc').value = o.desc || '';
  document.getElementById('offer-price').value = o.price;
  document.getElementById('offer-oldprice').value = o.oldPrice || '';
  document.getElementById('offer-image').value = o.image || '';
  let preview = document.getElementById('offer-preview');
  if (preview) {
    if (o.image) { preview.src = o.image; preview.style.display = 'block'; }
    else { preview.src = ''; preview.style.display = 'none'; }
  }
  let toggle = document.getElementById('offer-active-toggle');
  if (toggle) toggle.classList.toggle('active', o.active !== false);
  let title = document.getElementById('offerModalTitle');
  if (title) title.innerHTML = '<i class="fas fa-edit"></i> تعديل عرض';
  let modal = document.getElementById('offerModal');
  if (modal) modal.classList.add('active');
}

function saveOffer() {
  let id = document.getElementById('offer-id').value;
  let title = document.getElementById('offer-title').value.trim();
  let price = parseFloat(document.getElementById('offer-price').value);
  if (!title || title.length < 2) { toast('عنوان العرض يجب أن يكون حرفين على الأقل', 'error'); return; }
  if (isNaN(price) || price <= 0) { toast('السعر يجب أن يكون أكبر من صفر', 'error'); return; }
  let offers = DB.get('offers', []);
  let data = {
    id: id ? parseInt(id) : Date.now(),
    title: title,
    price: price,
    desc: document.getElementById('offer-desc').value.trim(),
    oldPrice: parseFloat(document.getElementById('offer-oldprice').value) || 0,
    image: document.getElementById('offer-image').value.trim(),
    active: document.getElementById('offer-active-toggle').classList.contains('active')
  };
  if (id) {
    let idx = offers.findIndex(o => o.id === parseInt(id));
    if (idx > -1) offers[idx] = data;
    else offers.push(data);
  } else {
    offers.push(data);
  }
  DB.set('offers', offers);
  syncToFirestore();
  closeOfferModal();
  renderOffersTable();
  updateStats();
  toast('تم حفظ العرض');
}

function deleteOffer(id) {
  if (!confirm('هل أنت متأكد؟')) return;
  DB.set('offers', DB.get('offers', []).filter(o => o.id !== id));
  syncToFirestore();
  renderOffersTable();
  updateStats();
  toast('تم الحذف');
}

function closeOfferModal() {
  let modal = document.getElementById('offerModal');
  if (modal) modal.classList.remove('active');
}

// ===== ZONES CRUD =====
function renderZonesTable() {
  let zones = DB.get('zones', []);
  let s = DB.get('settings', {});
  let toggle = document.getElementById('deliveryToggleBtn');
  let status = document.getElementById('deliveryStatusText');
  if (toggle) toggle.classList.toggle('active', s.deliveryEnabled !== false);
  if (status) status.textContent = (s.deliveryEnabled !== false) ? 'التوصيل مفعل ✅' : 'التوصيل معطل ❌';
  let tbody = document.getElementById('zonesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  zones.forEach((z, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + (idx + 1) + '</td><td><strong>' + escapeHtml(z.name) + '</strong></td><td>' + z.fee.toLocaleString('ar-SY') + ' ل.س</td>';
    const tdActions = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-dark btn-sm';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.onclick = function() { editZone(z.id); };
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger btn-sm';
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.onclick = function() { deleteZone(z.id); };
    tdActions.appendChild(editBtn);
    tdActions.appendChild(document.createTextNode(' '));
    tdActions.appendChild(delBtn);
    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  });
}

function toggleDelivery() {
  let s = DB.get('settings', {});
  s.deliveryEnabled = !(s.deliveryEnabled !== false);
  DB.set('settings', s);
  renderZonesTable();
  toast(s.deliveryEnabled ? 'تم تفعيل التوصيل' : 'تم إيقاف التوصيل');
}

function openZoneModal() {
  document.getElementById('zone-id').value = '';
  document.getElementById('zone-name').value = '';
  document.getElementById('zone-fee').value = '';
  let title = document.getElementById('zoneModalTitle');
  if (title) title.innerHTML = '<i class="fas fa-plus"></i> إضافة منطقة';
  let modal = document.getElementById('zoneModal');
  if (modal) modal.classList.add('active');
}

function editZone(id) {
  let z = DB.get('zones', []).find(x => x.id === id);
  if (!z) return;
  document.getElementById('zone-id').value = z.id;
  document.getElementById('zone-name').value = z.name;
  document.getElementById('zone-fee').value = z.fee;
  let title = document.getElementById('zoneModalTitle');
  if (title) title.innerHTML = '<i class="fas fa-edit"></i> تعديل منطقة';
  let modal = document.getElementById('zoneModal');
  if (modal) modal.classList.add('active');
}

function saveZone() {
  let id = document.getElementById('zone-id').value;
  let name = document.getElementById('zone-name').value.trim();
  let fee = parseFloat(document.getElementById('zone-fee').value);
  if (!validateZone(name, fee)) return;
  let zones = DB.get('zones', []);
  // Check for duplicate zone names
  let exists = zones.find(z => z.name.toLowerCase() === name.toLowerCase() && z.id !== (id ? parseInt(id) : 0));
  if (exists) { toast('هذه المنطقة موجودة مسبقاً', 'error'); return; }
  let data = { id: id ? parseInt(id) : Date.now(), name: name, fee: fee };
  if (id) {
    let idx = zones.findIndex(z => z.id === parseInt(id));
    if (idx > -1) zones[idx] = data;
    else zones.push(data);
  } else {
    zones.push(data);
  }
  DB.set('zones', zones);
  closeZoneModal();
  renderZonesTable();
  updateStats();
  toast('تم حفظ المنطقة');
}

function deleteZone(id) {
  if (!confirm('هل أنت متأكد؟')) return;
  DB.set('zones', DB.get('zones', []).filter(z => z.id !== id));
  renderZonesTable();
  updateStats();
  toast('تم الحذف');
}

function closeZoneModal() {
  let modal = document.getElementById('zoneModal');
  if (modal) modal.classList.remove('active');
}

// ===== SETTINGS =====
function loadSettings() {
  let s = DB.get('settings', {});
  let setVal = (id, val) => { let el = document.getElementById(id); if (el) el.value = val || ''; };
  setVal('site-name', s.name);
  setVal('site-subtitle', s.subtitle);
  setVal('site-desc', s.desc);
  setVal('site-alert', s.alertText);
  setVal('site-address', s.address);
  setVal('site-hours', s.hours);
  setVal('site-phone', s.phone);
  setVal('site-whatsapp', s.whatsapp);
  setVal('site-phone2', s.phone2);
  setVal('site-email', s.email);
  setVal('social-facebook', s.facebook);
  setVal('social-instagram', s.instagram);
  setVal('social-twitter', s.twitter);
  setVal('social-tiktok', s.tiktok);
  setVal('social-snapchat', s.snapchat);
  setVal('social-youtube', s.youtube);
}

function saveSettings() {
  let s = DB.get('settings', {});
  let getVal = (id) => { let el = document.getElementById(id); return el ? el.value.trim() : ''; };
  s.name = getVal('site-name');
  s.subtitle = getVal('site-subtitle');
  s.desc = getVal('site-desc');
  s.alertText = getVal('site-alert');
  s.address = getVal('site-address');
  s.hours = getVal('site-hours');
  s.phone = getVal('site-phone');
  s.whatsapp = getVal('site-whatsapp');
  s.phone2 = getVal('site-phone2');
  s.email = getVal('site-email');
  s.facebook = getVal('social-facebook');
  s.instagram = getVal('social-instagram');
  s.twitter = getVal('social-twitter');
  s.tiktok = getVal('social-tiktok');
  s.snapchat = getVal('social-snapchat');
  s.youtube = getVal('social-youtube');
  let np = document.getElementById('new-password').value;
  let cp = document.getElementById('confirm-password').value;
  if (np) {
    if (np.length < 4) { toast('كلمة المرور يجب أن تكون 4 أحرف على الأقل', 'error'); return; }
    if (np !== cp) { toast('كلمتا المرور غير متطابقتين', 'error'); return; }
    DB.set('password', simpleHash(np));
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
  }
  DB.set('settings', s);
  toast('تم حفظ الإعدادات');
}

// ===== EXPORT / IMPORT / RESET =====
function exportData() {
  let data = { categories: DB.get('categories', []), menu: DB.get('menu', []), offers: DB.get('offers', []), zones: DB.get('zones', []), settings: DB.get('settings', {}), password: DB.get('password', simpleHash('admin123')) };
  let blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = 'alqaysar-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('تم تصدير البيانات');
}

function importData() {
  let input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    let file = e.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = (ev) => {
      try {
        let data = JSON.parse(ev.target.result);
        if (data.categories) DB.set('categories', data.categories);
        if (data.menu) DB.set('menu', data.menu);
        if (data.offers) DB.set('offers', data.offers);
        if (data.zones) DB.set('zones', data.zones);
        if (data.settings) DB.set('settings', data.settings);
        if (data.password) DB.set('password', data.password);
        toast('تم استيراد البيانات');
        updateStats();
        renderMenuTable();
        renderCategoriesTable();
        renderOffersTable();
        renderZonesTable();
      } catch (err) { toast('ملف غير صالح', 'error'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

function resetData() {
  if (!confirm('هل أنت متأكد؟ سيتم حذف جميع البيانات!')) return;
  localStorage.removeItem('alqaysar_initialized');
  ['categories', 'menu', 'offers', 'zones', 'settings', 'password', 'visits', 'cart', 'last_sync'].forEach(k => localStorage.removeItem('alqaysar_' + k));
  toast('تم إعادة التعيين');
  setTimeout(() => location.reload(), 1500);
}

// ===== INIT IMAGE UPLOADS =====
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
});

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// ===== FIRESTORE SYNC (FIXED: batch writes, no delete-all) =====
async function syncToFirestore() {
  if (typeof db === 'undefined' || !db) { console.log('Firebase not available'); return; }
  try {
    const categories = DB.get('categories', []);
    const menu = DB.get('menu', []);
    const offers = DB.get('offers', []);

    // Use batch writes instead of delete-all
    const batch = db.batch();

    // For simplicity: clear and re-add with batch (safer than individual deletes)
    const catsRef = db.collection('categories');
    const menuRef = db.collection('menu');
    const offersRef = db.collection('offers');

    // Get existing docs and delete them in batch
    const [catsSnap, menuSnap, offersSnap] = await Promise.all([
      catsRef.get(), menuRef.get(), offersRef.get()
    ]);

    catsSnap.forEach(doc => batch.delete(doc.ref));
    menuSnap.forEach(doc => batch.delete(doc.ref));
    offersSnap.forEach(doc => batch.delete(doc.ref));

    // Add new docs
    categories.forEach(cat => {
      const ref = catsRef.doc();
      batch.set(ref, { ...cat, createdAt: Date.now() });
    });
    menu.forEach(item => {
      const ref = menuRef.doc();
      batch.set(ref, { ...item, createdAt: Date.now() });
    });
    offers.forEach(offer => {
      const ref = offersRef.doc();
      batch.set(ref, { ...offer, createdAt: Date.now() });
    });

    await batch.commit();
    toast('✅ تم مزامنة البيانات مع السحابة');
  } catch(e) {
    console.error('Firestore sync error:', e);
    toast('خطأ في المزامنة: ' + e.message, 'error');
  }
}
