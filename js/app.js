// ===== DATA STORE =====
const DB = {
    get(key, def) { try { const v = localStorage.getItem('alqaysar_' + key); return v ? JSON.parse(v) : def; } catch(e) { return def; } },
    set(key, val) { localStorage.setItem('alqaysar_' + key, JSON.stringify(val)); },
    init() {
        if (!localStorage.getItem('alqaysar_initialized')) {
            this.set('categories', [
                { id: 1, name: 'شاورما', icon: 'fa-drumstick-bite' },
                { id: 2, name: 'برجر', icon: 'fa-hamburger' },
                { id: 3, name: 'بيتزا', icon: 'fa-pizza-slice' },
                { id: 4, name: 'دجاج', icon: 'fa-drumstick-bite' },
                { id: 5, name: 'مقبلات', icon: 'fa-bread-slice' },
                { id: 6, name: 'مشروبات', icon: 'fa-glass-water' }
            ]);
            this.set('menu', [
                { id: 1, name: 'شاورما دجاج', category: 1, price: 45, desc: 'شاورما دجاج طازجة مع ثومية وخضار', image: '', active: true },
                { id: 2, name: 'برجر لحم كلاسيك', category: 2, price: 65, desc: 'برجر لحم أنجوس مع جبنة شيدر وخضار طازج', image: '', active: true },
                { id: 3, name: 'بيتزا مارغريتا', category: 3, price: 55, desc: 'بيتزا إيطالية أصلية مع صلصة الطماطم والموزاريلا', image: '', active: true },
                { id: 4, name: 'أجنحة دجاج حارة', category: 4, price: 50, desc: '6 قطع أجنحة دجاج مقلية بالتوابل الحارة', image: '', active: true },
                { id: 5, name: 'حمص', category: 5, price: 20, desc: 'حمص بالطحينة مع زيت زيتون وبابريكا', image: '', active: true },
                { id: 6, name: 'كولا', category: 6, price: 10, desc: 'مشروب غازي مثلج', image: '', active: true }
            ]);
            this.set('offers', [
                { id: 1, title: 'وجبة عائلية', desc: '4 شاورما + 2 برجر + بطاطس + 4 مشروبات', price: 199, oldPrice: 250, image: '', active: true }
            ]);
            this.set('settings', {
                name: 'مطعم القيصر', subtitle: 'أشهى المأكولات بأجود المكونات',
                desc: 'نقدم لكم أشهى المأكولات بأجود المكونات الطازجة، مع خبرة تزيد عن عشرين عاماً في عالم الطهي.',
                address: 'القاهرة - مصر الجديدة - شارع العروبة', hours: '10:00 ص - 12:00 ص',
                phone: '01234567890', phone2: '', whatsapp: '01234567890', email: 'info@alqaysar.com',
                facebook: '', instagram: '', twitter: '', tiktok: '', snapchat: '', youtube: '',
                primaryColor: '#e67e22', darkColor: '#1a1a2e', logoUrl: 'images/logo.png', heroBg: ''
            });
            this.set('password', 'admin123');
            this.set('visits', 0);
            localStorage.setItem('alqaysar_initialized', 'true');
        }
    }
};

// ===== INIT =====
DB.init();
let currentCategory = 'all';

// ===== HELPERS =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const formatPrice = (p) => p ? p.toLocaleString('ar-SA') + ' ر.س' : '';
const getCatName = (id) => {
    const cats = DB.get('categories', []);
    const c = cats.find(x => x.id == id);
    return c ? c.name : '';
};

// ===== RENDER =====
function renderAll() {
    renderSettings();
    renderOffers();
    renderCategoriesFilter();
    renderMenu();
    renderSocial();
    updateVisits();
}

function renderSettings() {
    const s = DB.get('settings', {});
    document.title = s.name + ' - القائمة';
    $('#hero-title').textContent = s.name;
    $('#hero-subtitle').textContent = s.subtitle;
    $('#about-title').textContent = 'قصة ' + s.name;
    $('#about-text').textContent = s.desc;
    $('#footer-desc').textContent = s.subtitle;
    $('.phone-number').textContent = s.phone || '--';
    $('.work-hours').textContent = s.hours || '--';
    $('#contact-address').textContent = s.address || '--';
    $('#contact-phone').textContent = s.phone || '--';
    $('#contact-hours').textContent = s.hours || '--';
    $('#contact-email').textContent = s.email || '--';
    $('#hero-phone').href = 'tel:' + s.phone;
    $('#year').textContent = new Date().getFullYear();

    // Apply colors
    if (s.primaryColor) {
        document.documentElement.style.setProperty('--primary', s.primaryColor);
        const r = parseInt(s.primaryColor.slice(1,3),16), g = parseInt(s.primaryColor.slice(3,5),16), b = parseInt(s.primaryColor.slice(5,7),16);
        const darken = (c) => Math.max(0, c - 40);
        const darkColor = '#' + [darken(r), darken(g), darken(b)].map(x => x.toString(16).padStart(2,'0')).join('');
        document.documentElement.style.setProperty('--primary-dark', darkColor);
    }
    if (s.darkColor) document.documentElement.style.setProperty('--dark', s.darkColor);
    if (s.logoUrl) $('#logo-img').src = s.logoUrl;
    if (s.heroBg) $('.hero').style.background = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${s.heroBg}) center/cover`;
}

function renderSocial() {
    const s = DB.get('settings', {});
    const links = [];
    const icons = { facebook: 'fa-facebook-f', instagram: 'fa-instagram', twitter: 'fa-twitter', tiktok: 'fa-tiktok', snapchat: 'fa-snapchat', youtube: 'fa-youtube' };
    let html = '';
    for (let key in icons) {
        if (s[key]) {
            html += `<a href="${s[key]}" target="_blank"><i class="fab ${icons[key]}"></i></a>`;
            links.push({ url: s[key], icon: icons[key] });
        }
    }
    $('#social-links').innerHTML = html;

    let footerHtml = '';
    links.forEach(l => footerHtml += `<a href="${l.url}" target="_blank"><i class="fab ${l.icon}"></i></a>`);
    $('#footer-social').innerHTML = footerHtml;
}

function renderOffers() {
    const offers = DB.get('offers', []).filter(o => o.active);
    const grid = $('#offers-grid');
    if (!offers.length) { grid.innerHTML = '<p style="text-align:center;color:#999">لا توجد عروض حالياً</p>'; return; }
    grid.innerHTML = offers.map(o => `
        <div class="offer-card">
            ${o.oldPrice ? `<span class="offer-badge">خصم</span>` : ''}
            <div class="offer-img">
                ${o.image ? `<img src="${o.image}" alt="${o.title}">` : `<div class="offer-img-placeholder"><i class="fas fa-utensils"></i></div>`}
            </div>
            <div class="offer-info">
                <h3>${o.title}</h3>
                <p>${o.desc}</p>
                <div class="offer-price">
                    <span class="new">${formatPrice(o.price)}</span>
                    ${o.oldPrice ? `<span class="old">${formatPrice(o.oldPrice)}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function renderCategoriesFilter() {
    const cats = DB.get('categories', []);
    const filter = $('#categories-filter');
    filter.innerHTML = '<button class="cat-btn active" data-category="all" onclick="filterCategory('all', this)">الكل</button>' +
        cats.map(c => `<button class="cat-btn" data-category="${c.id}" onclick="filterCategory(${c.id}, this)">${c.name}</button>`).join('');
}

function renderMenu() {
    const items = DB.get('menu', []).filter(i => i.active);
    const filtered = currentCategory === 'all' ? items : items.filter(i => i.category == currentCategory);
    const grid = $('#menu-grid');
    if (!filtered.length) { grid.innerHTML = '<p style="text-align:center;color:#999;padding:40px">لا توجد أصناف في هذا التصنيف</p>'; return; }
    grid.innerHTML = filtered.map(item => `
        <div class="menu-item" onclick="openModal(${item.id})">
            <div class="menu-item-img">
                ${item.image ? `<img src="${item.image}" alt="${item.name}">` : `<div class="menu-item-img-placeholder"><i class="fas fa-utensils"></i></div>`}
            </div>
            <div class="menu-item-info">
                <div class="menu-item-category">${getCatName(item.category)}</div>
                <h3 class="menu-item-title">${item.name}</h3>
                <p class="menu-item-desc">${item.desc || ''}</p>
                <div class="menu-item-footer">
                    <span class="menu-item-price">${formatPrice(item.price)}</span>
                    <button class="menu-item-btn"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterCategory(cat, btn) {
    currentCategory = cat;
    $$('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderMenu();
}

// ===== MODAL =====
function openModal(id) {
    const item = DB.get('menu', []).find(i => i.id === id);
    if (!item) return;
    $('#modal-img').src = item.image || '';
    $('#modal-img').style.display = item.image ? 'block' : 'none';
    $('#modal-img').parentElement.style.background = item.image ? 'none' : '#eee';
    if (!item.image) $('#modal-img').parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:64px"><i class="fas fa-utensils"></i></div>';
    else $('#modal-img').parentElement.innerHTML = '<img src="' + item.image + '" alt="">';
    $('#modal-category').textContent = getCatName(item.category);
    $('#modal-title').textContent = item.name;
    $('#modal-desc').textContent = item.desc || '';
    $('#modal-price').textContent = formatPrice(item.price);
    $('#modal-order').href = 'tel:' + DB.get('settings', {}).phone;
    $('#productModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    $('#productModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ===== MOBILE MENU =====
function toggleMobileMenu() {
    $('#mobileMenu').classList.toggle('open');
}

// ===== HEADER SCROLL =====
window.addEventListener('scroll', () => {
    $('.header').classList.toggle('scrolled', window.scrollY > 50);
});

// ===== VISITS =====
function updateVisits() {
    let v = DB.get('visits', 0) + 1;
    DB.set('visits', v);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', renderAll);
