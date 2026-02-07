// المتغيرات العامة
let currentBrand = 'الكل';
let currentSub = 'الكل';
let showOnlyFavorites = false;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
const SUPPORTED_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg', 'gif', 'pdf'];
let displayLimit = 24;

// العناصر
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const brandTabs = document.getElementById('brandTabs');
const subTabs = document.getElementById('subTabs');
const productsGrid = document.getElementById('productsGrid');
const emptyState = document.getElementById('emptyState');
const showAllBtn = document.getElementById('showAllBtn');
const showFavBtn = document.getElementById('showFavBtn');
const clearFavBtn = document.getElementById('clearFavBtn');

// التهيئة
function init() {
    renderBrands();
    renderSubCategories();
    renderProducts();
    setupEventListeners();
    showAll();
}

// التصنيفات
function renderBrands() {
    const brands = ['الكل', ...new Set(products.map(p => p.brand))];
    brandTabs.innerHTML = brands.map(brand => `
        <button class="filter-tab ${currentBrand === brand ? 'active' : ''}" 
                onclick="setBrand('${brand}')">
            ${brand}
        </button>
    `).join('');
}

function renderSubCategories() {
    let filtered = currentBrand === 'الكل' ? products : products.filter(p => p.brand === currentBrand);
    const subs = ['الكل', ...new Set(filtered.map(p => p.sub))];
    subTabs.innerHTML = subs.map(sub => `
        <button class="filter-tab ${currentSub === sub ? 'active' : ''}" 
                onclick="setSub('${sub}')">
            ${sub}
        </button>
    `).join('');
    subTabs.parentElement.style.display = subs.length <= 1 ? 'none' : 'block';
}

function setBrand(brand) {
    currentBrand = brand;
    currentSub = 'الكل';
    showOnlyFavorites = false;
    showAllBtn.classList.remove('active');
    showFavBtn.classList.remove('active');
    renderSubCategories();
    renderProducts();
    updateActiveNav();
}

function setSub(sub) {
    currentSub = sub;
    showOnlyFavorites = false;
    showAllBtn.classList.remove('active');
    showFavBtn.classList.remove('active');
    renderProducts();
    updateActiveNav();
}

// عرض المنتجات
function renderProducts() {
    if (!productsGrid || !searchInput) return;

    const query = searchInput.value.toLowerCase().trim();
    
    // فلترة المنتجات
    const filtered = products.filter(product => {
        const brandMatch = currentBrand === 'الكل' || product.brand === currentBrand;
        const subMatch = (typeof currentSub === 'undefined' || currentSub === 'الكل') || product.sub === currentSub;
        
        const searchMatch = !query || 
            product.code.toLowerCase().includes(query) || 
            (product.name && product.name.toLowerCase().includes(query)) || 
            (product.brand && product.brand.toLowerCase().includes(query)) || 
            (product.sub && product.sub.toLowerCase().includes(query));
        
        const isFavMode = typeof showOnlyFavorites !== 'undefined' && showOnlyFavorites;
        const favMatch = !isFavMode || favorites.includes(product.code);
        
        return brandMatch && subMatch && searchMatch && favMatch;
    });

    // عرض النتائج
    if (filtered.length === 0) {
        productsGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
    } else {
        productsGrid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';
        
        const itemsToShow = filtered.slice(0, displayLimit);
        productsGrid.innerHTML = itemsToShow.map(product => createProductCard(product)).join('');

        // زر عرض المزيد
        if (filtered.length > displayLimit) {
            const loadMoreHtml = `
                <div id="loadMoreContainer" style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                    <button onclick="loadMoreItems()" style="padding: 12px 30px; background: #1a237e; color: white; border: none; border-radius: 25px; font-family: 'Cairo'; cursor: pointer; font-weight: bold;">
                        عرض المزيد (${filtered.length - displayLimit})
                    </button>
                </div>`;
            productsGrid.insertAdjacentHTML('beforeend', loadMoreHtml);
        }
    }
}

function loadMoreItems() {
    displayLimit += 24; 
    renderProducts();
}

function createProductCard(product) {
    const isFavorite = favorites.includes(product.code);
    const productName = product.name || 'منتج';
    
    return `
        <div class="product-card" data-code="${product.code}">
            <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${product.code}', event)">
                <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
            </button>
            <div class="product-image-container" onclick="openProduct('${product.code}', '${productName}', '${product.brand}')">
                <img src="images/${product.code}.webp" 
                     class="product-image"
                     loading="lazy"
                     onerror="tryNextExtension(this, '${product.code}')"
                     alt="${productName}">
            </div>
            <div class="product-info">
                <div class="product-code">${product.code}</div>
                <div class="product-name">${productName}</div>
                <div class="product-brand">${product.brand}</div>
            </div>
            <div class="product-actions">
                <button class="action-button view" onclick="openProduct('${product.code}', '${productName}', '${product.brand}', event)">
                    <i class="fas fa-eye"></i>
                    عرض
                </button>
                <button class="action-button share" onclick="shareProduct('${product.code}', '${productName}', '${product.brand}', event)">
                    <i class="fab fa-whatsapp"></i>
                    مشاركة
                </button>
                <a href="images/${product.code}.webp" 
                   download="${product.code}.webp" 
                   class="action-button download" 
                   id="dl-${product.code}" 
                   onclick="event.stopPropagation();"
                   style="background: #ffeb3b; color: #000; box-shadow: 0 0 10px rgba(255, 235, 59, 0.5); font-weight: bold;">
                    <i class="fas fa-download"></i> حفظ صورة
                </a>
            </div>
        </div>
    `;
}

function tryNextExtension(img, code) {
    const currentSrc = img.src;
    const currentExt = currentSrc.split('.').pop().toLowerCase();
    const currentIndex = SUPPORTED_EXTENSIONS.indexOf(currentExt);
    
    if (currentIndex < SUPPORTED_EXTENSIONS.length - 1) {
        const nextExt = SUPPORTED_EXTENSIONS[currentIndex + 1];
        const newPath = `images/${code}.${nextExt}`;
        
        img.src = newPath;
        
        const downloadBtn = document.getElementById(`dl-${code}`);
        if (downloadBtn) {
            downloadBtn.href = newPath;
            downloadBtn.setAttribute('download', `${code}.${nextExt}`);
        }

        img.onerror = function() {
            tryNextExtension(this, code);
        };
    } else {
        img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect width="100%" height="100%" fill="%23eee"/><text x="50%" y="50%" text-anchor="middle" font-family="Cairo" font-size="12" fill="%23999">${code}</text></svg>';
    }
}

// فتح المنتج
async function openProduct(code, name, brand, event) {
    if (event) event.stopPropagation();
    
    for (const ext of SUPPORTED_EXTENSIONS) {
        const url = `images/${code}.${ext}`;
        const exists = await fileExists(url);
        
        if (exists) {
            if (ext === 'pdf') {
                window.open(url, '_blank');
            } else {
                if (typeof GLightbox !== 'undefined') {
                    const lightbox = GLightbox({
                        elements: [{
                            href: url,
                            type: 'image',
                            title: `${brand} - ${name}<br><small>كود: ${code}</small>`
                        }],
                        touchNavigation: true,
                        loop: true,
                        zoomable: true
                    });
                    lightbox.open();
                } else {
                    window.open(url, '_blank');
                }
            }
            return;
        }
    }
    
    alert('لم يتم العثور على ملف لهذا المنتج');
}

function fileExists(url) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => {
            if (url.endsWith('.pdf')) {
                fetch(url, { method: 'HEAD' })
                    .then(res => resolve(res.ok))
                    .catch(() => resolve(false));
            } else {
                resolve(false);
            }
        };
        img.src = url;
    });
}

// المفضلة
function toggleFavorite(code, event) {
    if (event) event.stopPropagation();
    const index = favorites.indexOf(code);
    
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(code);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderProducts();
}

function showFavorites() {
    showOnlyFavorites = true;
    currentBrand = 'الكل';
    currentSub = 'الكل';
    searchInput.value = '';
    clearBtn.style.display = 'none';
    showAllBtn.classList.remove('active');
    showFavBtn.classList.add('active');
    renderBrands();
    renderSubCategories();
    renderProducts();
    updateActiveNav('favorites');
}

function clearFavorites() {
    if (confirm('هل أنت متأكد من مسح جميع المفضلة؟')) {
        favorites = [];
        localStorage.setItem('favorites', JSON.stringify(favorites));
        if (showOnlyFavorites) {
            renderProducts();
        }
    }
}

function showAll() {
    currentBrand = 'الكل';
    currentSub = 'الكل';
    showOnlyFavorites = false;
    searchInput.value = '';
    clearBtn.style.display = 'none';
    showAllBtn.classList.add('active');
    showFavBtn.classList.remove('active');
    renderBrands();
    renderSubCategories();
    renderProducts();
    updateActiveNav('home');
}

// مشاركة المنتج
function shareProduct(code, name, brand, event) {
    if (event) event.stopPropagation();
    
    const imgElement = document.getElementById(`img-${code}`) || document.querySelector(`[data-code="${code}"] img`);
    const imgPath = imgElement ? imgElement.src : window.location.origin + window.location.pathname.replace('index.html', '') + `images/${code}.jpg`;
    
    const text = `📦 *${brand}*\n📝 ${name || 'منتج جديد'}\n🔢 الكود: ${code}\n🔗 رابط الصورة:\n${imgPath}`;
    
    if (navigator.share) {
        navigator.share({
            title: brand,
            text: text,
            url: imgPath
        }).catch(err => console.log('Error sharing', err));
    } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    }
}

// البحث
function handleSearch() {
    clearBtn.style.display = searchInput.value ? 'block' : 'none';
    showOnlyFavorites = false;
    showAllBtn.classList.remove('active');
    showFavBtn.classList.remove('active');
    renderProducts();
}

function clearSearchInput() {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    handleSearch();
}

// تحديث القائمة السفلية
function updateActiveNav(active = 'home') {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (active === 'home') {
        document.querySelector('.nav-item:nth-child(1)').classList.add('active');
    } else if (active === 'favorites') {
        document.querySelector('.nav-item:nth-child(2)').classList.add('active');
    }
}

// تجديد الصفحة
function refreshPage() {
    location.reload();
}

// الأحداث
function setupEventListeners() {
    searchInput.addEventListener('input', handleSearch);
    clearBtn.addEventListener('click', clearSearchInput);
    showAllBtn.addEventListener('click', showAll);
    showFavBtn.addEventListener('click', showFavorites);
    clearFavBtn.addEventListener('click', clearFavorites);
    
    // البحث بالضغط على Enter
    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });
    
    // إغلاق لوحة المفاتيح عند التمرير
    window.addEventListener('scroll', () => {
        if (document.activeElement === searchInput) {
            searchInput.blur();
        }
    });
}

// تشغيل التطبيق
document.addEventListener('DOMContentLoaded', init);

// منع التكبير باللمس المزدوج على الموبايل
document.addEventListener('dblclick', e => e.preventDefault());