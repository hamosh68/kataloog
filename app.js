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

// نظام الإشعارات الذكية
function showSmartNotification(title, message, type = 'success', duration = 3000) {
    // إزالة أي إشعار قديم
    const oldNotification = document.querySelector('.smart-notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    // تحديد الألوان حسب النوع
    const colors = {
        success: { bg: '#4CAF50', icon: '✅' },
        warning: { bg: '#FF9800', icon: '⚠️' },
        error: { bg: '#F44336', icon: '❌' },
        info: { bg: '#2196F3', icon: 'ℹ️' }
    };
    
    const config = colors[type] || colors.info;
    
    // إنشاء الإشعار
    const notification = document.createElement('div');
    notification.className = 'smart-notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            width: 350px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            z-index: 99999;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            overflow: hidden;
            border-left: 5px solid ${config.bg};
            font-family: 'Cairo', sans-serif;
            direction: rtl;
        ">
            <div style="display: flex; align-items: center; padding: 15px 20px; background: #f8f9fa; border-bottom: 1px solid #eee;">
                <span style="font-size: 1.3rem; margin-left: 10px;">${config.icon}</span>
                <span style="font-weight: bold; font-size: 1rem; color: #333; flex: 1;">${title}</span>
                <button class="notification-close" 
                        style="background: none; border: none; font-size: 1.2rem; color: #666; cursor: pointer; padding: 0; width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    ✕
                </button>
            </div>
            <div style="padding: 20px; font-size: 0.95rem; color: #555; line-height: 1.5;">
                ${message}
            </div>
            <div class="notification-progress" style="height: 4px; background: ${config.bg}; width: 100%;"></div>
        </div>
    `;
    
    // إضافة للصفحة
    document.body.appendChild(notification);
    
    // الحصول على العناصر
    const notificationDiv = notification.querySelector('div');
    const closeBtn = notification.querySelector('.notification-close');
    const progressBar = notification.querySelector('.notification-progress');
    
    // ظهور سلس
    setTimeout(() => {
        notificationDiv.style.transform = 'translateX(0)';
    }, 10);
    
    // التقدم الزمني
    setTimeout(() => {
        progressBar.style.transition = `width ${duration}ms linear`;
        progressBar.style.width = '0%';
    }, 10);
    
    // الإزالة التلقائية
    const removeTimer = setTimeout(() => {
        notificationDiv.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 300);
    }, duration + 10);
    
    // زر الإغلاق
    closeBtn.addEventListener('click', () => {
        clearTimeout(removeTimer);
        notificationDiv.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 300);
    });
    
    // إيقاف المؤقت عند التمرير فوق الإشعار
    notification.addEventListener('mouseenter', () => {
        clearTimeout(removeTimer);
        progressBar.style.transition = 'none';
        progressBar.style.width = '100%';
    });
    
    notification.addEventListener('mouseleave', () => {
        progressBar.style.transition = `width ${duration}ms linear`;
        progressBar.style.width = '0%';
        setTimeout(() => {
            notificationDiv.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) notification.remove();
            }, 300);
        }, duration);
    });
}

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

// عرض صفحة الطلبات
function showCartPage() {
    if (cart.length === 0) {
        showSmartNotification('سلة فارغة', 'أضف منتجات أولاً باستخدام زر 🛒', 'warning');
        return;
    }
    
    const cartItemsHTML = cart.map((item, index) => {
        const product = products.find(p => p.code === item.code);
        const productName = item.name || 'منتج';
        return `
            <div class="cart-item" data-index="${index}">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div onclick="openProduct('${item.code}', '${productName}', '${item.brand}')" 
                         style="width: 60px; height: 60px; background: #f5f5f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer;" 
                         title="اضغط لعرض الصورة الكاملة">
                        <img src="images/${item.code}.webp" 
                             style="max-width: 100%; max-height: 100%; object-fit: contain;"
                             onerror="tryNextExtension(this, '${item.code}')">
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: #1a237e;">${item.brand}</div>
                        <div style="font-size: 0.85rem; color: #666;">${productName}</div>
                        <div style="font-family: monospace; font-size: 0.8rem; color: #ff9800;">${item.code}</div>
                    </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="display: flex; align-items: center; gap: 10px; background: #f5f5f5; padding: 5px 10px; border-radius: 20px;">
                        <button onclick="updateCartQuantity(${index}, -1)" style="width: 25px; height: 25px; border: none; background: #ddd; border-radius: 50%; cursor: pointer; font-weight: bold;">−</button>
                        <span style="font-weight: bold; min-width: 30px; text-align: center;">${item.quantity}</span>
                        <button onclick="updateCartQuantity(${index}, 1)" style="width: 25px; height: 25px; border: none; background: #4CAF50; color: white; border-radius: 50%; cursor: pointer; font-weight: bold;">+</button>
                    </div>
                    
                    <button onclick="removeFromCart(${index})" style="background: none; border: none; color: #f44336; cursor: pointer; font-size: 1.2rem;" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>

                <div style="margin-top: 10px; width: 100%;">
                    <textarea class="item-note" data-index="${index}" placeholder="ملاحظة خاصة لهذا المنتج (اختياري)..." 
                              style="width: 100%; height: 50px; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-family: 'Cairo'; resize: vertical; font-size: 0.85rem;"
                              onblur="saveItemNote(${index}, this.value)">${item.note || ''}</textarea>
                </div>
            </div>
        `;
    }).join('');
    
    const cartModalHTML = `
        <div class="modal" id="cartModal" style="display: flex;">
            <div class="modal-content" style="max-width: 500px;">
                <div style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="color: #1a237e; margin: 0;">
                            <i class="fas fa-shopping-cart"></i> طلبات اليوم
                        </h3>
                        <button onclick="closeCartModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">×</button>
                    </div>
                    
                    <!-- إضافة خانة اسم الزبون -->
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <i class="fas fa-user" style="color: #1a237e;"></i>
                            <label style="font-weight: bold; color: #1a237e;">اسم الزبون:</label>
                        </div>
                        <input type="text" 
                               id="customerName" 
                               placeholder="أدخل اسم الزبون هنا..."
                               style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-family: 'Cairo'; font-size: 1rem;"
                               onfocus="this.style.borderColor='#4CAF50'"
                               onblur="this.style.borderColor='#e0e0e0'; saveCustomerName(this.value)">
                        <div style="font-size: 0.8rem; color: #666; margin-top: 5px; text-align: right;">
                            (اختياري - سيظهر في رسالة الطلب)
                        </div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between;">
                            <div>
                                <div style="font-weight: bold;">عدد المنتجات:</div>
                                <div style="font-size: 2rem; font-weight: bold; color: #1a237e;">${cart.length}</div>
                            </div>
                            <div>
                                <div style="font-weight: bold;">إجمالي القطع:</div>
                                <div style="font-size: 2rem; font-weight: bold; color: #4CAF50;">${cart.reduce((sum, item) => sum + item.quantity, 0)}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="max-height: 400px; overflow-y: auto; margin-bottom: 20px;">
                        ${cartItemsHTML}
                    </div>

                    <div style="margin-bottom: 20px;">
                        <textarea id="cartNote" placeholder="اكتب ملاحظاتك هنا (اختياري)..." style="width: 100%; height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-family: 'Cairo'; resize: vertical;"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button onclick="sendCartToWhatsApp()" style="flex: 2; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 8px; font-family: 'Cairo'; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fab fa-whatsapp"></i> إرسال الطلب للمكتب
                        </button>
                        <button onclick="clearCart()" style="flex: 1; padding: 12px; background: #f5f5f5; color: #666; border: 1px solid #ddd; border-radius: 8px; font-family: 'Cairo'; cursor: pointer;">
                            مسح الكل
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // إضافة المودال للصفحة
    if (document.getElementById('cartModal')) {
        document.getElementById('cartModal').remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', cartModalHTML);
    
    // تحميل اسم الزبون المحفوظ مسبقاً
    const savedCustomerName = localStorage.getItem('abushams_customer_name') || '';
    document.getElementById('customerName').value = savedCustomerName;
    
    // إضافة CSS للمودال
    const style = document.createElement('style');
    style.textContent = `
        .cart-item {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 15px;
            background: white;
            border-radius: 10px;
            margin-bottom: 10px;
            border: 1px solid #eee;
            transition: all 0.3s;
        }
        
        .cart-item:hover {
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        
        #cartModal .modal-content {
            animation: slideUp 0.3s ease;
        }

        .item-note:focus {
            border-color: #4CAF50;
            outline: none;
        }
        
        #customerName:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
        }
    `;
    document.head.appendChild(style);
}

// حفظ اسم الزبون
function saveCustomerName(name) {
    localStorage.setItem('abushams_customer_name', name.trim());
}

// حفظ ملاحظة المنتج الفردي
function saveItemNote(index, note) {
    if (cart[index]) {
        cart[index].note = note.trim();
        localStorage.setItem('abushams_cart', JSON.stringify(cart));
    }
}

// تحديث الكمية
function updateCartQuantity(index, change) {
    if (cart[index]) {
        cart[index].quantity += change;
        
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        
        localStorage.setItem('abushams_cart', JSON.stringify(cart));
        updateCartBadge();
        showCartPage(); // تحديث الصفحة
    }
}

// حذف من الطلب
function removeFromCart(index) {
    if (confirm('هل تريد حذف هذا المنتج من الطلب؟')) {
        cart.splice(index, 1);
        localStorage.setItem('abushams_cart', JSON.stringify(cart));
        updateCartBadge();
        showCartPage();
        showSmartNotification('تم الحذف', 'تم حذف المنتج من الطلب', 'success');
    }
}

// إغلاق نافذة الطلبات
function closeCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.remove();
    }
}

// مسح كل الطلبات
function clearCart() {
    if (cart.length === 0) {
        showSmartNotification('لا يوجد طلبات', 'سلة الطلبات فارغة بالفعل', 'info');
        return;
    }
    
    if (confirm('هل تريد مسح جميع الطلبات؟')) {
        cart = [];
        localStorage.setItem('abushams_cart', JSON.stringify(cart));
        updateCartBadge();
        closeCartModal();
        showSmartNotification('تم المسح', 'تم مسح جميع الطلبات بنجاح', 'success');
    }
}

// إرسال الطلب للمكتب عبر واتساب
function sendCartToWhatsApp() {
    if (cart.length === 0) {
        showSmartNotification('سلة فارغة', 'أضف منتجات أولاً قبل الإرسال', 'warning');
        return;
    }
    
    // جلب اسم الزبون من الخانة
    const customerNameElement = document.getElementById('customerName');
    const customerName = customerNameElement ? customerNameElement.value.trim() : '';
    
    // إعداد نص الطلب
    const currentDate = new Date().toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // قاعدة الرابط للصور
    const baseUrl = window.location.origin + window.location.pathname.replace(/[^\/]*$/, '') + 'images/';
    
    let message = `🛒 *طلب جديد - IBC*\n`;
    message += `═══════════════════════════════════\n`;
    message += `📅 التاريخ: ${currentDate}\n`;
    
    // إضافة اسم الزبون إذا كان موجوداً
    if (customerName) {
        message += `👤 الزبون: ${customerName}\n`;
    }
    
    message += `📊 الإحصائيات: ${cart.length} منتج | ${cart.reduce((sum, item) => sum + item.quantity, 0)} قطعة\n`;
    message += `═══════════════════════════════════\n\n`;
    
    // إضافة المنتجات مع ملاحظاتها الخاصة
    cart.forEach((item, index) => {
        const product = products.find(p => p.code === item.code);
        const imageUrl = `${baseUrl}${item.code}.${SUPPORTED_EXTENSIONS[0]}`;
        
        message += `*${index + 1}. المنتج*\n`;
        message += `🔢 *الكود:* ${item.code}\n`;
        message += `🏭 *الفرع:* ${item.brand}\n`;
        
        // إضافة اسم الصنف إذا كان موجوداً
        if (product?.sub) {
            message += `🏷️ *الصنف:* ${product.sub}\n`;
        }
        
        // اسم المنتج إذا كان موجوداً
        if (product?.name) {
            message += `📝 *الاسم:* ${product.name}\n`;
        }
        
        message += `📦 *الكمية:* ${item.quantity} قطعة\n`;
        
        // ملاحظة المنتج الخاصة
        if (item.note) {
            message += `🗒️ *ملاحظة المنتج:* ${item.note}\n`;
        }
        
        message += `🖼️ *الصورة:* [اضغط هنا للعرض](${imageUrl})\n`;
        
        // إضافة سطر فاصل أطول بين المنتجات (ما عدا المنتج الأخير)
        if (index < cart.length - 1) {
            message += `─────────────────────────────────────\n\n`;
        }
    });
    
    // إضافة الملاحظة العامة إذا كانت موجودة
    const noteElement = document.getElementById('cartNote');
    const generalNote = noteElement ? noteElement.value.trim() : '';
    if (generalNote) {
        message += `─────────────────────────────────────\n`;
        message += `🗒️ *ملاحظات عامة:*\n${generalNote}\n`;
    }
    
    message += `═══════════════════════════════════\n`;
    message += `🤖 *تم إنشاء الطلب بواسطة: كين*\n`;
    message += `📱 *نظام إدارة طلبات IBC*\n`;
    message += `🚚 *شكراً لثقتكم بنا*`;
    
    // تشفير الرسالة للرابط
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    // فتح واتساب
    window.open(whatsappUrl, '_blank');
    
    // عرض تأكيد
    setTimeout(() => {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        showSmartNotification(
            'تم الإرسال بنجاح', 
            `تم إرسال ${cart.length} منتج (${totalItems} قطعة) للمكتب`,
            'success',
            5000
        );
    }, 500);
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
            
            <!-- زر الطلب المعدل -->
            <button class="cart-add-btn" onclick="addToCart('${product.code}', '${productName}', '${product.brand}')" 
                    title="أضف للطلب"
                    style="
                        position: absolute;
                        top: 8px;
                        left: 8px;
                        width: 34px;
                        height: 34px;
                        background: linear-gradient(135deg, #2196F3, #21CBF3);
                        border: 2px solid white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.95rem;
                        color: white;
                        cursor: pointer;
                        z-index: 10;
                        box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4), 0 0 0 3px rgba(33, 150, 243, 0.1);
                        transition: all 0.3s ease;
                        margin: 0;
                        padding: 0;
                    ">
                <i class="fas fa-cart-plus"></i>
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
                    <i class="fas fa-eye"></i> عرض
                </button>
                <button class="action-button share" onclick="shareProduct('${product.code}', '${productName}', '${product.brand}', event)">
                    <i class="fab fa-whatsapp"></i> مشاركة
                </button>
                <a href="images/${product.code}.webp" 
                   download="${product.code}.webp" 
                   class="action-button download" 
                   onclick="event.stopPropagation();">
                    <i class="fas fa-download"></i> حفظ
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
    
    showSmartNotification('لم يتم العثور', 'لم يتم العثور على ملف لهذا المنتج', 'error');
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
    const product = products.find(p => p.code === code);
    const productName = product?.name || code;
    
    if (index > -1) {
        favorites.splice(index, 1);
        showSmartNotification('تم الإزالة', `تم إزالة ${productName} من المفضلة`, 'info');
    } else {
        favorites.push(code);
        showSmartNotification('تم الإضافة', `تم إضافة ${productName} للمفضلة`, 'success');
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
        showSmartNotification('تم المسح', 'تم مسح جميع المفضلة بنجاح', 'success');
    }
}

// نظام الطلبات
let cart = JSON.parse(localStorage.getItem('abushams_cart')) || [];

// تحديث عداد الطلبات
function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (badge) {
        badge.textContent = totalItems > 0 ? totalItems : '';
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// إضافة منتج للطلب
function addToCart(productCode, productName = '', productBrand = '') {
    const existingItem = cart.find(item => item.code === productCode);
    
    if (existingItem) {
        existingItem.quantity += 1;
        showSmartNotification('تم التحديث', `تم زيادة كمية ${productName || productCode} إلى ${existingItem.quantity}`, 'success');
    } else {
        cart.push({
            code: productCode,
            name: productName,
            brand: productBrand,
            quantity: 1,
            note: '',
            addedAt: new Date().toISOString()
        });
        showSmartNotification('تم الإضافة', `تم إضافة ${productName || productCode} للطلب`, 'success');
    }
    
    localStorage.setItem('abushams_cart', JSON.stringify(cart));
    updateCartBadge();
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
// ===============================
// نظام الإحصائيات والإدارة
// ===============================

// دالة عرض صفحة الإحصائيات
function showStatsPage() {
    const statsModalHTML = `
        <div class="modal" id="statsModal" style="display: flex; z-index: 100000;">
            <div class="modal-content" style="max-width: 600px;">
                <div style="padding: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                        <h3 style="color: #1a237e; margin: 0;">
                            <i class="fas fa-chart-bar"></i> إحصائيات النظام
                        </h3>
                        <button onclick="closeStatsModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">×</button>
                    </div>
                    
                    <!-- بطاقة إحصائيات المنتجات -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 15px; padding: 25px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                            <div style="font-size: 2.5rem; background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-box"></i>
                            </div>
                            <div>
                                <div style="font-size: 1.2rem; opacity: 0.9;">إجمالي المنتجات</div>
                                <div style="font-size: 2.8rem; font-weight: bold;" id="totalProducts">${products.length}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- بطاقة إحصائيات الصور -->
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border-radius: 15px; padding: 25px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                            <div style="font-size: 2.5rem; background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-images"></i>
                            </div>
                            <div>
                                <div style="font-size: 1.2rem; opacity: 0.9;">الصور المتاحة</div>
                                <div style="font-size: 2.8rem; font-weight: bold;" id="availableImages">جاري العد...</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- بطاقة إحصائيات التصنيفات -->
                    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border-radius: 15px; padding: 25px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                            <div style="font-size: 2.5rem; background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-tags"></i>
                            </div>
                            <div>
                                <div style="font-size: 1.2rem; opacity: 0.9;">العلامات التجارية</div>
                                <div style="font-size: 2.8rem; font-weight: bold;" id="totalBrands">${new Set(products.map(p => p.brand)).size}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- تفاصيل إحصائية -->
                    <div style="background: #f8f9fa; border-radius: 15px; padding: 20px; margin-bottom: 20px;">
                        <h4 style="color: #1a237e; margin-bottom: 15px; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">
                            <i class="fas fa-list-alt"></i> تفاصيل الإحصائيات
                        </h4>
                        <div id="statsDetails" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                            <!-- سيتم ملؤها بالجافاسكريبت -->
                        </div>
                    </div>
                    
                    <!-- بطاقة إحصائيات المفضلة والطلبات -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                        <div style="background: #4CAF50; color: white; border-radius: 12px; padding: 20px; text-align: center;">
                            <div style="font-size: 2.5rem; margin-bottom: 10px;">
                                <i class="fas fa-heart"></i>
                            </div>
                            <div style="font-size: 1.2rem; opacity: 0.9;">المفضلة</div>
                            <div style="font-size: 2.2rem; font-weight: bold;" id="totalFavorites">${favorites.length}</div>
                        </div>
                        
                        <div style="background: #2196F3; color: white; border-radius: 12px; padding: 20px; text-align: center;">
                            <div style="font-size: 2.5rem; margin-bottom: 10px;">
                                <i class="fas fa-shopping-cart"></i>
                            </div>
                            <div style="font-size: 1.2rem; opacity: 0.9;">الطلبات الحالية</div>
                            <div style="font-size: 2.2rem; font-weight: bold;" id="totalCartItems">${cart.reduce((sum, item) => sum + item.quantity, 0)}</div>
                        </div>
                    </div>
                    
                    <!-- أزرار التحكم -->
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button onclick="checkAllImages()" style="flex: 1; padding: 15px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 10px; font-family: 'Cairo'; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <i class="fas fa-sync-alt"></i> فحص الصور
                        </button>
                        <button onclick="exportStats()" style="flex: 1; padding: 15px; background: linear-gradient(135deg, #4CAF50, #8BC34A); color: white; border: none; border-radius: 10px; font-family: 'Cairo'; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <i class="fas fa-download"></i> تصدير الإحصائيات
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // إضافة المودال للصفحة
    if (document.getElementById('statsModal')) {
        document.getElementById('statsModal').remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', statsModalHTML);
    
    // حساب الصور المتاحة
    countAvailableImages();
    
    // عرض تفاصيل الإحصائيات
    showStatsDetails();
}

// دالة إغلاق صفحة الإحصائيات
function closeStatsModal() {
    const modal = document.getElementById('statsModal');
    if (modal) {
        modal.remove();
    }
}

// دالة عد الصور المتاحة
async function countAvailableImages() {
    let imageCount = 0;
    let loadingCount = 0;
    const totalProducts = products.length;
    
    // تحديث العداد أثناء العملية
    const updateCounter = () => {
        document.getElementById('availableImages').innerHTML = `
            <span>${imageCount}</span>
            <small style="font-size: 1rem; opacity: 0.8;"> / ${totalProducts}</small>
        `;
    };
    
    for (const product of products) {
        loadingCount++;
        
        // تحديث النسبة كل 10 منتجات
        if (loadingCount % 10 === 0) {
            updateCounter();
        }
        
        // التحقق من وجود أي صورة للمنتج
        let hasImage = false;
        for (const ext of SUPPORTED_EXTENSIONS) {
            const url = `images/${product.code}.${ext}`;
            const exists = await checkImageExists(url);
            if (exists) {
                hasImage = true;
                break;
            }
        }
        
        if (hasImage) {
            imageCount++;
        }
    }
    
    // التحديث النهائي
    updateCounter();
    
    // إضافة نسبة مئوية
    const percentage = Math.round((imageCount / totalProducts) * 100);
    document.getElementById('availableImages').innerHTML = `
        <span>${imageCount}</span>
        <small style="font-size: 1rem; opacity: 0.8;"> / ${totalProducts}</small>
        <div style="font-size: 1rem; margin-top: 5px; background: rgba(255,255,255,0.3); padding: 3px 10px; border-radius: 20px; display: inline-block;">
            ${percentage}%
        </div>
    `;
}

// دالة التحقق من وجود صورة
function checkImageExists(url) {
    return new Promise((resolve) => {
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

// دالة عرض تفاصيل الإحصائيات
function showStatsDetails() {
    const statsDetails = document.getElementById('statsDetails');
    if (!statsDetails) return;
    
    // إحصائيات العلامات التجارية
    const brands = {};
    products.forEach(product => {
        brands[product.brand] = (brands[product.brand] || 0) + 1;
    });
    
    // إحصائيات الأقسام
    const subs = {};
    products.forEach(product => {
        if (product.sub) {
            subs[product.sub] = (subs[product.sub] || 0) + 1;
        }
    });
    
    // العلامات التجارية الأكثر
    const topBrands = Object.entries(brands)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    // الأقسام الأكثر
    const topSubs = Object.entries(subs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    let detailsHTML = '';
    
    // العلامات التجارية
    detailsHTML += `
        <div style="background: white; padding: 15px; border-radius: 10px; border: 1px solid #e0e0e0;">
            <div style="font-weight: bold; color: #667eea; margin-bottom: 10px;">
                <i class="fas fa-crown"></i> أشهر الماركات
            </div>
    `;
    
    topBrands.forEach(([brand, count]) => {
        const percentage = Math.round((count / products.length) * 100);
        detailsHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #eee;">
                <span style="color: #555;">${brand}</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: bold; color: #333;">${count}</span>
                    <div style="width: 50px; height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${percentage}%; height: 100%; background: #667eea;"></div>
                    </div>
                </div>
            </div>
        `;
    });
    
    detailsHTML += `</div>`;
    
    // الأقسام
    detailsHTML += `
        <div style="background: white; padding: 15px; border-radius: 10px; border: 1px solid #e0e0e0;">
            <div style="font-weight: bold; color: #f5576c; margin-bottom: 10px;">
                <i class="fas fa-folder"></i> أشهر الأقسام
            </div>
    `;
    
    topSubs.forEach(([sub, count]) => {
        const percentage = Math.round((count / products.length) * 100);
        detailsHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #eee;">
                <span style="color: #555;">${sub}</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: bold; color: #333;">${count}</span>
                    <div style="width: 50px; height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${percentage}%; height: 100%; background: #f5576c;"></div>
                    </div>
                </div>
            </div>
        `;
    });
    
    detailsHTML += `</div>`;
    
    // معلومات المنتجات بدون صور
    detailsHTML += `
        <div style="background: white; padding: 15px; border-radius: 10px; border: 1px solid #e0e0e0; grid-column: 1 / -1;">
            <div style="font-weight: bold; color: #FF9800; margin-bottom: 10px; display: flex; justify-content: space-between;">
                <span><i class="fas fa-exclamation-triangle"></i> منتجات تحتاج صور</span>
                <span id="missingImagesCount">جاري العد...</span>
            </div>
            <div id="missingImagesList" style="max-height: 200px; overflow-y: auto;">
                جاري تحميل القائمة...
            </div>
        </div>
    `;
    
    statsDetails.innerHTML = detailsHTML;
    
    // حساب المنتجات بدون صور
    findMissingImages();
}

// دالة البحث عن المنتجات بدون صور
async function findMissingImages() {
    let missingCount = 0;
    const missingList = [];
    
    // التحقق من أول 50 منتج فقط لتجنب التحميل الزائد
    const productsToCheck = products.slice(0, 50);
    
    for (const product of productsToCheck) {
        let hasImage = false;
        
        // التحقق من جميع الامتدادات
        for (const ext of SUPPORTED_EXTENSIONS) {
            const url = `images/${product.code}.${ext}`;
            const exists = await checkImageExists(url);
            if (exists) {
                hasImage = true;
                break;
            }
        }
        
        if (!hasImage) {
            missingCount++;
            missingList.push(product);
        }
    }
    
    // تحديث العداد والقائمة
    document.getElementById('missingImagesCount').textContent = `${missingCount} منتج`;
    
    let listHTML = '';
    if (missingList.length > 0) {
        missingList.slice(0, 10).forEach(product => {
            listHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #FFF3E0; margin-bottom: 5px; border-radius: 6px;">
                    <div>
                        <div style="font-family: monospace; color: #FF9800; font-weight: bold;">${product.code}</div>
                        <div style="font-size: 0.85rem; color: #666;">${product.brand} - ${product.name || 'بدون اسم'}</div>
                    </div>
                    <button onclick="copyCode('${product.code}')" style="background: #FF9800; color: white; border: none; border-radius: 5px; padding: 5px 10px; font-size: 0.8rem; cursor: pointer;">
                        نسخ الكود
                    </button>
                </div>
            `;
        });
        
        if (missingList.length > 10) {
            listHTML += `<div style="text-align: center; color: #FF9800; padding: 10px; font-size: 0.9rem;">و ${missingList.length - 10} منتج إضافي...</div>`;
        }
    } else {
        listHTML = `<div style="text-align: center; color: #4CAF50; padding: 15px;">
            <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
            <div>جميع المنتجات لديها صور! 👍</div>
        </div>`;
    }
    
    document.getElementById('missingImagesList').innerHTML = listHTML;
}

// دالة نسخ الكود
function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showSmartNotification('تم النسخ', `تم نسخ الكود: ${code}`, 'success');
    });
}

// دالة فحص جميع الصور
async function checkAllImages() {
    showSmartNotification('جاري الفحص', 'جاري فحص جميع الصور، قد تستغرق العملية بضع ثواني...', 'info', 5000);
    
    // إعادة حساب الصور
    await countAvailableImages();
    
    // إعادة البحث عن المنتجات بدون صور
    await findMissingImages();
    
    showSmartNotification('تم الفحص', 'تم تحديث جميع الإحصائيات بنجاح', 'success');
}

// دالة تصدير الإحصائيات
function exportStats() {
    const stats = {
        تاريخ_التصدير: new Date().toLocaleString('ar-EG'),
        إجمالي_المنتجات: products.length,
        العلامات_التجارية: new Set(products.map(p => p.brand)).size,
        المنتجات_المفضلة: favorites.length,
        منتجات_الطلب_الحالي: cart.reduce((sum, item) => sum + item.quantity, 0),
        تفاصيل_العلامات_التجارية: {}
    };
    
    // إحصاء العلامات التجارية
    const brands = {};
    products.forEach(product => {
        brands[product.brand] = (brands[product.brand] || 0) + 1;
    });
    
    stats.تفاصيل_العلامات_التجارية = brands;
    
    // تحويل إلى نص
    let exportText = `📊 إحصائيات نظام IBC\n`;
    exportText += `📅 ${stats.تاريخ_التصدير}\n`;
    exportText += `═══════════════════════════════════\n\n`;
    exportText += `📦 إجمالي المنتجات: ${stats.إجمالي_المنتجات}\n`;
    exportText += `🏷️ عدد العلامات التجارية: ${stats.العلامات_التجارية}\n`;
    exportText += `❤️ المنتجات المفضلة: ${stats.المنتجات_المفضلة}\n`;
    exportText += `🛒 منتجات الطلب الحالي: ${stats.منتجات_الطلب_الحالي}\n`;
    exportText += `═══════════════════════════════════\n\n`;
    exportText += `🏭 توزيع العلامات التجارية:\n`;
    
    Object.entries(brands)
        .sort((a, b) => b[1] - a[1])
        .forEach(([brand, count]) => {
            const percentage = Math.round((count / products.length) * 100);
            exportText += `• ${brand}: ${count} منتج (${percentage}%)\n`;
        });
    
    // نسخ إلى الحافظة
    navigator.clipboard.writeText(exportText).then(() => {
        showSmartNotification('تم التصدير', 'تم نسخ الإحصائيات إلى الحافظة', 'success');
    });
}

// إضافة زر الإحصائيات في الشريط السفلي
// إضافة زر الإحصائيات في الشريط السفلي
function addStatsButton() {
    // انتظر حتى يتم تحميل الصفحة بالكامل
    setTimeout(() => {
        // التحقق إذا الزر موجود مسبقاً
        if (document.getElementById('statsNavBtn')) return;
        
        // البحث عن القائمة السفلية
        const navContainer = document.querySelector('.bottom-nav');
        if (!navContainer) {
            console.log('لم يتم العثور على .bottom-nav');
            // محاولة أخرى بعد ثانية
            setTimeout(addStatsButton, 1000);
            return;
        }
        
        console.log('تم العثور على القائمة السفلية، جارٍ إضافة زر الإحصائيات...');
        
        // إنشاء زر الإحصائيات
        const statsNavItem = document.createElement('div');
        statsNavItem.className = 'nav-item';
        statsNavItem.id = 'statsNavBtn';
        statsNavItem.innerHTML = `
            <div onclick="showStatsPage()" style="background: none; border: none; color: #666; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 10px; width: 100%;">
                <i class="fas fa-chart-bar" style="font-size: 1.3rem;"></i>
                <span style="font-size: 0.8rem; font-family: 'Cairo';">الإحصائيات</span>
            </div>
        `;
        
        // إضافة الزر للقائمة
        navContainer.appendChild(statsNavItem);
        console.log('تمت إضافة زر الإحصائيات بنجاح!');
        
        // إضافة CSS مباشرة
        const statsStyle = document.createElement('style');
        statsStyle.textContent = `
            #statsNavBtn {
                flex: 1;
                text-align: center;
            }
            
            #statsNavBtn.active div {
                color: #1a237e !important;
            }
            
            #statsNavBtn.active i {
                color: #1a237e !important;
            }
            
            #statsNavBtn div:hover {
                color: #1a237e !important;
            }
            
            #statsNavBtn div:hover i {
                color: #1a237e !important;
            }
            
            #statsNavBtn div {
                transition: all 0.3s;
            }
        `;
        document.head.appendChild(statsStyle);
        
    }, 500); // تأخير نصف ثانية للتأكد من تحميل الصفحة
}
// تشغيل التطبيق
document.addEventListener('DOMContentLoaded', init);

// منع التكبير باللمس المزدوج على الموبايل
document.addEventListener('dblclick', e => e.preventDefault());

let html5QrCode;

function toggleScanner() {
    const container = document.getElementById('reader-container');
    if (container.style.display === 'none') {
        startScanner();
    } else {
        stopScanner();
    }
}

function startScanner() {
    document.getElementById('reader-container').style.display = 'block';
    html5QrCode = new Html5Qrcode("reader");
    
    const config = { 
        fps: 15, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0
    };

    html5QrCode.start(
        { facingMode: "environment" }, 
        config,
        (decodedText) => {
            // 1. وضع الكود المقروء في خانة البحث
            searchInput.value = decodedText;

            // 2. إلغاء وضع المفضلة فوراً لضمان البحث في كل المنتجات
            showOnlyFavorites = false;
            currentBrand = 'الكل';
            currentSub = 'الكل';

            // 3. تحديث واجهة الأزرار (الفلاتر) لتعكس وضع "الكل"
            renderBrands();
            renderSubCategories();
            updateActiveNav('home'); // تحديث القائمة السفلية لتظهر أننا في الرئيسية

            // 4. إيقاف الكاميرا
            stopScanner();
            
            // 5. استدعاء دالة البحث الأصلية لتحديث قائمة المنتجات
            if (typeof handleSearch === "function") {
                handleSearch();
            }
            
            // إشعار بنجاح المسح
            showSmartNotification('تم المسح الضوئي', `تم قراءة الكود: ${decodedText}`, 'success');
            
            // إهتزاز خفيف للموبايل عند نجاح القراءة
            if (navigator.vibrate) navigator.vibrate(100);
        }
    ).catch(err => {
        showSmartNotification('خطأ في الكاميرا', 'يرجى السماح بصلاحية الكاميرا', 'error');
        console.error(err);
    });
}

function stopScanner() {
    // التأكد أن الكاميرا تعمل أصلاً قبل محاولة إغلاقها
    if (html5QrCode && html5QrCode.getState() > 1) { 
        html5QrCode.stop().then(() => {
            // إخفاء الحاوية بعد الإيقاف بنجاح
            document.getElementById('reader-container').style.display = 'none';
            console.log("تم إغلاق الكاميرا بنجاح");
        }).catch(err => {
            console.error("فشل إيقاف الكاميرا:", err);
            // في حال فشل الإيقاف البرمجي، نخفي الحاوية قسراً
            document.getElementById('reader-container').style.display = 'none';
        });
    } else {
        // إذا لم تكن الكاميرا تعمل، فقط أخفِ الحاوية
        document.getElementById('reader-container').style.display = 'none';
    }
}






