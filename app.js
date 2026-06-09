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
                        <textarea id="cartNote" placeholder="اكتب ملاحظاتك على الطلبية هنا (اختياري)  (تختفي بعد كل اغلاق)..." style="width: 100%; height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-family: 'Cairo'; resize: vertical;"></textarea>
                    </div>
                    
                   <div style="display: flex; flex-direction: column; gap: 10px;">
    
    <button onclick="sendCartToWhatsApp()" style="width: 100%; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 8px; font-family: 'Cairo'; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <i class="fab fa-whatsapp"></i> إرسال الطلبية واتساب
    </button>

    <button onclick="showOrderReport()" 
            style="width: 100%; padding: 12px; background: linear-gradient(135deg, #9C27B0, #673AB7); color: white; border: none; border-radius: 8px; font-family: 'Cairo'; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <i class="fas fa-file-alt"></i> تقرير الطلبية
    </button>

    <button onclick="shareReportAsPDF()" 
            style="width: 100%; padding: 12px; background: linear-gradient(135deg, #25D366, #128C7E); color: white; border: none; border-radius: 8px; font-family: 'Cairo'; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <i class="fab fa-whatsapp"></i> ارسال الطلبية PDF واتساب
    </button>

    <button onclick="shareReportAsPDF()" 
            style="width: 100%; padding: 12px; background: linear-gradient(135deg, #2196F3, #1976D2); color: white; border: none; border-radius: 8px; font-family: 'Cairo'; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <i class="fas fa-envelope"></i> ارسال الطلبية EMAL
    </button>

    <button onclick="clearCart()" style="width: 100%; padding: 12px; background: #f5f5f5; color: #666; border: 1px solid #ddd; border-radius: 8px; font-family: 'Cairo'; cursor: pointer;">
        مسح الكل
    </button>
    
</div>
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
        renderProducts(); // تحديث عرض الكميات في الصفحة الرئيسية
    }
}

// حذف من الطلب
function removeFromCart(index) {
    if (confirm('هل تريد حذف هذا المنتج من الطلب؟')) {
        cart.splice(index, 1);
        localStorage.setItem('abushams_cart', JSON.stringify(cart));
        updateCartBadge();
        showCartPage();
        renderProducts(); // تحديث عرض الكميات في الصفحة الرئيسية
        showSmartNotification('تم الحذف', 'تم حذف المنتج من الطلب', 'success');
    }
}

// إغلاق نافذة الطلبات
function closeCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.remove();
    }
    renderProducts(); // تحديث عرض الكميات في الصفحة الرئيسية بعد الإغلاق
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
        renderProducts(); // تحديث عرض الكميات في الصفحة الرئيسية
        showSmartNotification('تم المسح', 'تم مسح جميع الطلبات بنجاح', 'success');
    }
}

// إرسال الطلب للمكتب عبر واتساب
// =======================
// نظام ترقيم الطلبات
// =======================

function generateOrderNumber() {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // جلب آخر رقم لليوم
    let lastToday = localStorage.getItem(`lastOrder_${dateStr}`) || '0';
    let nextNumber = parseInt(lastToday) + 1;
    
    // حفظ الرقم الجديد
    localStorage.setItem(`lastOrder_${dateStr}`, nextNumber.toString());
    
    // تنسيق: ORD-20250214-001
    let formattedNumber = nextNumber.toString().padStart(3, '0');
    return `ORD-${dateStr}-${formattedNumber}`;
}

// =======================
// إرسال الطلب للمكتب عبر واتساب
// =======================

function sendCartToWhatsApp() {
    if (cart.length === 0) {
        showSmartNotification('سلة فارغة', 'أضف منتجات أولاً قبل الإرسال', 'warning');
        return;
    }
    
    const orderNumber = generateOrderNumber();
    
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
    message += `📋 *رقم الطلب:* ${orderNumber}\n`;
    message += `📅 : ${currentDate}\n`;
    
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
        message += `🔢 *باركود:* ${item.code}\n`;
        message += `🏭 *الفرع:* ${item.brand}\n`;
                  
        // إضافة اسم الصنف إذا كان موجوداً
       if (product?.barcode) {
            message += `🏷️ *الكود:* ${product.barcode}\n`;
        }

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
    
    // مسح اسم الزبون بعد الإرسال
    if (customerNameElement) {
        customerNameElement.value = '';
        localStorage.setItem('abushams_customer_name', '');
    }
    
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
            product.code?.toLowerCase().includes(query) || 
            product.name?.toLowerCase().includes(query) || 
            product.brand?.toLowerCase().includes(query) || 
            product.sub?.toLowerCase().includes(query) ||
            
            product.barcode?.toLowerCase().includes(query) ||
            product.price?.toString().toLowerCase().includes(query) ||
            `💰 ${product.price}`.toLowerCase().includes(query) ||
            product.note?.toLowerCase().includes(query);
        
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
    const productPrice = product.price ? `<div class="product-price">💰 ${product.price} د.ك</div>` : '';
    const productBarcode = product.barcode ? `<div class="product-barcode">🔲 ${product.barcode}</div>` : '';
    const cartItem = cart.find(item => item.code === product.code);
    const quantityBadge = cartItem ? `
        <div class="quantity-badge" 
             style="
                 position: absolute;
                 top: 8px;
                 left: 50px;
                 width: 30px;
                 height: 30px;
                 background: #4CAF50;
                 color: white;
                 border-radius: 50%;
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 font-size: 0.9rem;
                 font-weight: bold;
                 box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                 z-index: 11;
             ">
            ${cartItem.quantity}
        </div>
    ` : '';
    
    return `
        <div class="product-card" data-code="${product.code}">
            <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${product.code}', event)">
                <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
            </button>
            
<button class="cart-add-btn" onclick="addToCart('${product.code}', '${productName}', '${product.brand}')" 
        title="أضف للطلب"
        style="
            position: absolute;
            top: 8px;
            left: 8px;
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #2196F3, #1976D2);
            border: 3px solid #FFD700;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.3rem;
            color: white;
            cursor: pointer;
            z-index: 10;
            box-shadow: 0 6px 15px rgba(33, 150, 243, 0.5), 0 0 0 4px rgba(255, 215, 0, 0.3);
            transition: all 0.3s ease;
            margin: 0;
            padding: 0;
        "
        onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 8px 20px rgba(33, 150, 243, 0.6), 0 0 0 6px rgba(255, 215, 0, 0.4)'"
        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 6px 15px rgba(33, 150, 243, 0.5), 0 0 0 4px rgba(255, 215, 0, 0.3)'">
    <i class="fas fa-cart-plus" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));"></i>
</button>
            
            ${quantityBadge}
            
            <div class="product-image-container" onclick="openProduct('${product.code}', '${productName}', '${product.brand}')">
                <img src="images/${product.code}.webp" 
                     class="product-image"
                     loading="lazy"
                     onerror="tryNextExtension(this, '${product.code}')"
                     alt="${productName}">
            </div>
            
            <div class="product-info" style="display: flex; flex-direction: column; gap: 2px; padding: 5px;">
                <div class="product-brand">🏭 ${product.brand}</div>
                <div class="product-name">📝 ${productName}</div>
                ${productBarcode}
                <div class="product-code">🔢 ${product.code}</div>
                ${productPrice}
            <div style="display: flex; justify-content: space-between; gap: 4px; margin-top: 8px;">
                <button onclick="openProduct('${product.code}', '${productName}', '${product.brand}', event)" 
                        style="flex: 1; background: #2196F3; color: white; border: none; border-radius: 6px; padding: 6px 4px; font-family: 'Cairo'; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 3px;">
                    <i class="fas fa-eye" style="font-size: 0.7rem;"></i> عرض
                </button>
                
                <button onclick="shareProduct('${product.code}', '${productName}', '${product.brand}', event)" 
                        style="flex: 1; background: #25D366; color: white; border: none; border-radius: 6px; padding: 6px 4px; font-family: 'Cairo'; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 3px;">
                    <i class="fab fa-whatsapp" style="font-size: 0.7rem;"></i> مشاركة
                </button>
                
                <a href="images/${product.code}.webp" 
                   download="${product.code}.webp" 
                   onclick="event.stopPropagation()"
                   style="flex: 1; background: #FF9800; color: white; border: none; border-radius: 6px; padding: 6px 4px; font-family: 'Cairo'; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 3px; text-decoration: none;">
                    <i class="fas fa-download" style="font-size: 0.7rem;"></i> حفظ
                </a>
            </div>
        </div>
    </div>
`;        
}

// دالة فحص الصور المعدلة لدعم مجلدين بالتتابع الآمن
function tryNextExtension(img, code) {
    const currentSrc = img.src;
    // تحديد المجلد الحالي النشط في الفحص لحماية المسار
    const isMainFolder = currentSrc.includes('/images/') && !currentSrc.includes('/images-1/');
    const currentExt = currentSrc.split('.').pop().toLowerCase().split('?')[0];
    const currentIndex = SUPPORTED_EXTENSIONS.indexOf(currentExt);
   
    if (currentIndex < SUPPORTED_EXTENSIONS.length - 1) {
        // 1. الانتقال للامتداد التالي في نفس المجلد الحالي
        const nextExt = SUPPORTED_EXTENSIONS[currentIndex + 1];
        const folder = isMainFolder ? 'images' : 'images-1';
        const newPath = `${folder}/${code}.${nextExt}`;
       
        img.src = newPath;
       
        const downloadBtn = document.getElementById(`dl-${code}`);
        if (downloadBtn) {
            downloadBtn.href = newPath;
            downloadBtn.setAttribute('download', `${code}.${nextExt}`);
        }
        img.onerror = function() {
            tryNextExtension(this, code);
        };
    } else if (isMainFolder) {
        // 2. إذا انتهت كل الامتدادات في مجلد images الرئيسي، ننتقل فوراً لفحص مجلد images-1 من البداية
        const newPath = `images-1/${code}.${SUPPORTED_EXTENSIONS[0]}`;
        img.src = newPath;
        img.onerror = function() {
            tryNextExtension(this, code);
        };
    } else {
        // 3. في حال فشل البحث في المجلدين بالكامل، يتم عرض الصورة الافتراضية الخاصة بك
        img.src = 'https://www.appsheet.com/image/getimageurl?appName=ibcno1-3381183&tableName=%D9%86%D8%B3%D8%AE%D8%A9%20%D9%85%D9%86%20%D8%A7%D9%84%D8%AA%D8%AD%D8%AF%D9%8A%D8%AB%20%D8%A7%D9%84%D8%B9%D8%A7%D9%852&fileName=%D9%86%D8%B3%D8%AE%D8%A9%20%D9%85%D9%86%20%D8%A7%D9%84%D8%AA%D8%AD%D8%AF%D9%8A%D8%AB%20%D8%A7%D9%84%D8%B9%D8%A7%D9%852_Images%2F2596%D8%B5%D9%8ور%D8%A9%20%D8%A7%D9%81%D8%AA%D8%B1%D8%A7%D8%B6%D9%8A%D8%A9.imge.071853.jpg&appVersion=1.002911&signature=3ee63307bee2b069afefefb553ff0d913075dc9addaca6d07f75d438d6250698';
        
        const downloadBtn = document.getElementById(`dl-${code}`);
        if (downloadBtn) {
            downloadBtn.style.display = 'none';
        }
    }
}

// فتح المنتج مع دعم ذكي للمجلد الثاني
async function openProduct(code, name, brand, event) {
    if (event) event.stopPropagation();
    
    // فحص مجلد images الرئيسي أولاً
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

    // إذا لم تنجح، يفحص مجلد images-1 تلقائياً قبل إعطاء خطأ
    for (const ext of SUPPORTED_EXTENSIONS) {
        const url = `images-1/${code}.${ext}`;
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
    
    showSmartNotification('لم يتم العثور', 'لم يتم العثور على ملف لهذا المنتج في مجلدات النظام', 'error');
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
    renderProducts();
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
    
    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });
    
    window.addEventListener('scroll', () => {
        if (document.activeElement === searchInput) {
            searchInput.blur();
        }
    });
}

// نظام الإحصائيات والإدارة
function showStatsPage() {
    const statsModalHTML = `
        <div class="modal" id="statsModal" style="display: flex; z-index: 100000;">
            <div class="modal-content" style="max-width: 700px;">
                <div style="padding: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                        <h3 style="color: #1a237e; margin: 0;">
                            <i class="fas fa-chart-bar"></i> إحصائيات النظام
                        </h3>
                        <button onclick="closeStatsModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">×</button>
                    </div>
                    
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
                    
                    <div style="background: #f8f9fa; border-radius: 15px; padding: 20px; margin-bottom: 20px;">
                        <h4 style="color: #4CAF50; margin-bottom: 15px; border-bottom: 2px solid #E8F5E9; padding-bottom: 10px;">
                            <i class="fas fa-camera"></i> إحصائية الصور لكل ماركة
                        </h4>
                        <div id="brandImagesStats" style="max-height: 400px; overflow-y: auto;">
                            <div style="text-align: center; padding: 30px; color: #666;">
                                <i class="fas fa-spinner fa-spin" style="font-size: 2.5rem; margin-bottom: 15px;"></i>
                                <div style="font-size: 1.1rem;">جاري حساب إحصائية الصور لكل ماركة...</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border-radius: 15px; padding: 25px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                            <div style="font-size: 2.5rem; background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-images"></i>
                            </div>
                            <div>
                                <div style="font-size: 2.8rem; font-weight: bold;" id="availableImages">جاري العد...</div>
                            </div>
                        </div>
                    </div>
                    
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
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                        <div style="background: #FF4081; color: white; border-radius: 12px; padding: 20px; text-align: center;">
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
                    
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button onclick="checkAllImages()" style="flex: 1; padding: 15px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 10px; font-family: 'Cairo'; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <i class="fas fa-sync-alt"></i> تحديث الإحصائيات
                        </button>
                        <button onclick="exportStats()" style="flex: 1; padding: 15px; background: linear-gradient(135deg, #4CAF50, #8BC34A); color: white; border: none; border-radius: 10px; font-family: 'Cairo'; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <i class="fas fa-download"></i> تصدير الإحصائيات
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (document.getElementById('statsModal')) {
        document.getElementById('statsModal').remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', statsModalHTML);
    countAvailableImages();
    showBrandImagesStats();
}

function closeStatsModal() {
    const modal = document.getElementById('statsModal');
    if (modal) {
        modal.remove();
    }
}

// عداد فحص الصور المعدل لدعم مجلدين بالتوازي في الإحصائيات
async function countAvailableImages() {
    let imageCount = 0;
    let loadingCount = 0;
    const totalProducts = products.length;
    
    const updateCounter = () => {
        document.getElementById('availableImages').innerHTML = `
            <span>${imageCount}</span>
            <small style="font-size: 1rem; opacity: 0.8;"> / ${totalProducts}</small>
        `;
    };
    
    for (const product of products) {
        loadingCount++;
        
        if (loadingCount % 10 === 0) {
            updateCounter();
        }
        
        let hasImage = false;
        // فحص المجلد الأساسي
        for (const ext of SUPPORTED_EXTENSIONS) {
            const url = `images/${product.code}.${ext}`;
            const exists = await checkImageExists(url);
            if (exists) {
                hasImage = true;
                break;
            }
        }
        
        // إذا لم يعثر عليها، يفحص المجلد الجديد
        if (!hasImage) {
            for (const ext of SUPPORTED_EXTENSIONS) {
                const url = `images-1/${product.code}.${ext}`;
                const exists = await checkImageExists(url);
                if (exists) {
                    hasImage = true;
                    break;
                }
            }
        }
        
        if (hasImage) {
            imageCount++;
        }
    }
    
    updateCounter();
    
    const percentage = Math.round((imageCount / totalProducts) * 100);
    document.getElementById('availableImages').innerHTML = `
        <span>${imageCount}</span>
        <small style="font-size: 1rem; opacity: 0.8;"> / ${totalProducts}</small>
        <div style="font-size: 1rem; margin-top: 5px; background: rgba(255,255,255,0.3); padding: 3px 10px; border-radius: 20px; display: inline-block;">
            ${percentage}%
        </div>
    `;
}

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

async function showBrandImagesStats() {
    const container = document.getElementById('brandImagesStats');
    if (!container) return;
    
    const brandStats = {};
    
    products.forEach(product => {
        if (!brandStats[product.brand]) {
            brandStats[product.brand] = {
                total: 0,
                withImages: 0,
                percentage: 0
            };
        }
        brandStats[product.brand].total++;
    });
    
    for (const brand in brandStats) {
        const brandProducts = products.filter(p => p.brand === brand);
        const sampleSize = Math.min(10, brandProducts.length);
        
        let imagesCount = 0;
        
        for (let i = 0; i < sampleSize; i++) {
            const product = brandProducts[i];
            let hasImage = false;
            
            for (const ext of SUPPORTED_EXTENSIONS) {
                const url = `images/${product.code}.${ext}`;
                const exists = await checkImageExists(url);
                if (exists) {
                    hasImage = true;
                    break;
                }
            }
            
            if (!hasImage) {
                for (const ext of SUPPORTED_EXTENSIONS) {
                    const url = `images-1/${product.code}.${ext}`;
                    const exists = await checkImageExists(url);
                    if (exists) {
                        hasImage = true;
                        break;
                    }
                }
            }
            
            if (hasImage) {
                imagesCount++;
            }
        }
        
        const estimatedWithImages = Math.round((imagesCount / sampleSize) * brandStats[brand].total);
        brandStats[brand].withImages = estimatedWithImages;
        brandStats[brand].percentage = brandStats[brand].total > 0 ? 
            Math.round((estimatedWithImages / brandStats[brand].total) * 100) : 0;
    }
    
    const sortedBrands = Object.entries(brandStats).sort((a, b) => b[1].total - a[1].total);
    
    let html = `
        <div style="display: flex; justify-content: space-between; padding: 12px 15px; background: #E8F5E9; border-radius: 8px; margin-bottom: 10px; font-weight: bold; color: #2E7D32;">
            <div style="flex: 4;">العلامة التجارية</div>
            <div style="flex: 2; text-align: center;">المنتجات</div>
            <div style="flex: 2; text-align: center;">الصور</div>
            <div style="flex: 2; text-align: center;">النسبة</div>
        </div>
    `;
    
    sortedBrands.forEach(([brand, stats]) => {
        const colorClass = stats.percentage >= 80 ? 'success' : 
                          stats.percentage >= 50 ? 'warning' : 'danger';
        
        const colors = {
            success: { bg: '#E8F5E9', text: '#2E7D32', icon: '✅' },
            warning: { bg: '#FFF3E0', text: '#EF6C00', icon: '⚠️' },
            danger: { bg: '#FFEBEE', text: '#C62828', icon: '❌' }
        };
        
        const config = colors[colorClass];
        
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: ${config.bg}; margin-bottom: 8px; border-radius: 8px; border-left: 4px solid ${config.text};">
                <div style="flex: 4; font-weight: bold; color: #333; display: flex; align-items: center; gap: 8px;">
                    <span style="color: ${config.text};">${config.icon}</span>
                    ${brand}
                </div>
                <div style="flex: 2; text-align: center; font-weight: bold; color: #333;">
                    ${stats.total}
                </div>
                <div style="flex: 2; text-align: center; font-weight: bold; color: ${config.text};">
                    ${stats.withImages}
                </div>
                <div style="flex: 2; text-align: center;">
                    <div style="display: inline-block; background: white; padding: 5px 12px; border-radius: 20px; font-weight: bold; color: ${config.text}; border: 1px solid ${config.text};">
                        ${stats.percentage}%
                    </div>
                </div>
            </div>
        `;
    });
    
    const totalProducts = Object.values(brandStats).reduce((sum, stat) => sum + stat.total, 0);
    const totalImages = Object.values(brandStats).reduce((sum, stat) => sum + stat.withImages, 0);
    const overallPercentage = totalProducts > 0 ? Math.round((totalImages / totalProducts) * 100) : 0;
    
    html += `
        <div style="display: flex; justify-content: space-between; padding: 15px; background: linear-gradient(135deg, #4CAF50, #8BC34A); border-radius: 8px; margin-top: 15px; color: white; font-weight: bold;">
            <div style="flex: 4;">الإجمالي</div>
            <div style="flex: 2; text-align: center;">${totalProducts}</div>
            <div style="flex: 2; text-align: center;">${totalImages}</div>
            <div style="flex: 2; text-align: center;">
                <div style="display: inline-block; background: white; padding: 5px 12px; border-radius: 20px; color: #4CAF50; font-weight: bold;">
                    ${overallPercentage}%
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

async function checkAllImages() {
    showSmartNotification('جاري التحديث', 'جاري تحديث إحصائيات الصور، قد تستغرق العملية بضع ثواني...', 'info', 5000);
    await countAvailableImages();
    await showBrandImagesStats();
    showSmartNotification('تم التحديث', 'تم تحديث جميع الإحصائيات بنجاح', 'success');
}

function exportStats() {
    const stats = {
        تاريخ_التصدير: new Date().toLocaleString('ar-EG'),
        إجمالي_المنتجات: products.length,
        العلامات_التجارية: new Set(products.map(p => p.brand)).size,
        المنتجات_المفضلة: favorites.length,
        منتجات_الطلب_الحالي: cart.reduce((sum, item) => sum + item.quantity, 0),
        تفاصيل_العلامات_التجارية: {}
    };
    
    const brands = {};
    products.forEach(product => {
        brands[product.brand] = (brands[product.brand] || 0) + 1;
    });
    
    stats.تفاصيل_العلامات_التجارية = brands;
    
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
    
    navigator.clipboard.writeText(exportText).then(() => {
        showSmartNotification('تم التصدير', 'تم نسخ الإحصائيات إلى الحافظة', 'success');
    });
}

// تشغيل التطبيق
document.addEventListener('DOMContentLoaded', init);

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
        async (decodedText) => {
            stopScanner();
            const product = products.find(p => p.code === decodedText);
            
            if (!product) {
                showSmartNotification('لم يتم العثور', `الباركود ${decodedText} غير موجود`, 'error');
                searchInput.value = decodedText;
                handleSearch();
                return;
            }
            
            showQuickAddModal(product, decodedText);
            if (navigator.vibrate) navigator.vibrate(100);
        }
    ).catch(err => {
        showSmartNotification('خطأ في الكاميرا', 'يرجى السماح بصلاحية الكاميرا', 'error');
        console.error(err);
    });
}

function stopScanner() {
    if (html5QrCode && html5QrCode.getState() > 1) { 
        html5QrCode.stop().then(() => {
            document.getElementById('reader-container').style.display = 'none';
            console.log("تم إغلاق الكاميرا بنجاح");
        }).catch(err => {
            console.error("فشل إيقاف الكاميرا:", err);
            document.getElementById('reader-container').style.display = 'none';
        });
    } else {
        document.getElementById('reader-container').style.display = 'none';
    }
}

function showQuickAddModal(product, scannedCode) {
    const modalHTML = `
        <div class="modal" id="quickAddModal" style="display: flex; z-index: 100000;">
            <div class="modal-content" style="max-width: 400px; animation: slideUp 0.3s ease;">
                <div style="padding: 25px; text-align: center;">
                    <div style="font-size: 3rem; color: #4CAF50; margin-bottom: 15px;">
                        <i class="fas fa-barcode"></i>
                    </div>
                    
                    <h3 style="color: #333; margin-bottom: 10px; font-family: 'Cairo';">تم مسح المنتج بنجاح!</h3>
                    
                    <div style="background: #f8f9fa; border-radius: 10px; padding: 15px; margin-bottom: 20px; text-align: right;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <div style="width: 60px; height: 60px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                <img src="images/${product.code}.webp" 
                                     style="max-width: 100%; max-height: 100%; object-fit: contain;"
                                     onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"60\" height=\"60\"><rect width=\"100%\" height=\"100%\" fill=\"%23eee\"/><text x=\"50%\" y=\"50%\" text-anchor=\"middle\" dy=\".3em\" font-family=\"Cairo\" font-size=\"10\" fill=\"%23999\">${product.code}</text></svg>'">
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #1a237e;">${product.brand}</div>
                                <div style="font-size: 0.9rem; color: #666;">${product.name || 'منتج'}</div>
                                <div style="font-family: monospace; font-size: 0.8rem; color: #ff9800;">${scannedCode}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 25px;">
                        <div style="font-weight: bold; color: #666; margin-bottom: 10px;">اختر الكمية المطلوبة:</div>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
                            <button id="decreaseQty" 
                                    style="width: 50px; height: 50px; border: none; background: #f5f5f5; border-radius: 50%; font-size: 1.5rem; cursor: pointer; color: #666;"
                                    onmouseover="this.style.background='#e0e0e0'"
                                    onmouseout="this.style.background='#f5f5f5'">
                                −
                            </button>
                            
                            <div style="font-size: 2.5rem; font-weight: bold; color: #1a237e; min-width: 60px; text-align: center;" id="quantityDisplay">1</div>
                            
                            <button id="increaseQty" 
                                    style="width: 50px; height: 50px; border: none; background: #4CAF50; border-radius: 50%; font-size: 1.5rem; cursor: pointer; color: white;"
                                    onmouseover="this.style.background='#45a049'"
                                    onmouseout="this.style.background='#4CAF50'">
                                +
                            </button>
                        </div>
                        <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
                            <button class="quickQtyBtn" data-qty="5">5</button>
                            <button class="quickQtyBtn" data-qty="10">10</button>
                            <button class="quickQtyBtn" data-qty="20">20</button>
                            <button class="quickQtyBtn" data-qty="50">50</button>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <textarea id="quickNote" 
                                  placeholder="ملاحظة سريعة (اختياري)..."
                                  style="width: 100%; height: 60px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-family: 'Cairo'; resize: none; font-size: 0.9rem CONTAINER;"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button id="cancelQuickAdd" 
                                style="flex: 1; padding: 15px; background: #f5f5f5; color: #666; border: 1px solid #ddd; border-radius: 8px; font-family: 'Cairo'; font-weight: bold; cursor: pointer;">
                            إلغاء
                        </button>
                        <button id="addToCartQuick" 
                                style="flex: 2; padding: 15px; background: linear-gradient(135deg, #4CAF50, #8BC34A); color: white; border: none; border-radius: 8px; font-family: 'Cairo'; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fas fa-cart-plus"></i> إضافة للطلب
                        </button>
                    </div>
                    
                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
                        <button id="openProductDetails" 
                                style="background: none; border: none; color: #2196F3; cursor: pointer; font-family: 'Cairo'; font-size: 0.9rem; display: flex; align-items: center; gap: 5px; margin: 0 auto;">
                            <i class="fas fa-external-link-alt"></i> فتح تفاصيل المنتج
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const style = document.createElement('style');
    style.textContent = `
        .quickQtyBtn {
            padding: 8px 15px;
            background: #E3F2FD;
            color: #2196F3;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            font-family: 'Cairo';
            font-weight: bold;
            font-size: 0.9rem;
            transition: all 0.2s;
        }
        
        .quickQtyBtn:hover {
            background: #2196F3;
            color: white;
        }
        
        #quickAddModal .modal-content {
            animation: slideUp 0.3s ease;
        }
    `;
    document.head.appendChild(style);
    
    let quantity = 1;
    const quantityDisplay = document.getElementById('quantityDisplay');
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    
    decreaseBtn.addEventListener('click', () => {
        if (quantity > 1) {
            quantity--;
            quantityDisplay.textContent = quantity;
        }
    });
    
    increaseBtn.addEventListener('click', () => {
        if (quantity < 999) {
            quantity++;
            quantityDisplay.textContent = quantity;
        }
    });
    
    document.querySelectorAll('.quickQtyBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            quantity = parseInt(btn.dataset.qty);
            quantityDisplay.textContent = quantity;
        });
    });
    
    document.getElementById('addToCartQuick').addEventListener('click', () => {
        const note = document.getElementById('quickNote').value.trim();
        const existingItem = cart.find(item => item.code === product.code);
        
        if (existingItem) {
            existingItem.quantity += quantity;
            if (note) existingItem.note = note;
            showSmartNotification('تم التحديث', `تم إضافة ${quantity} قطعة إلى ${product.name || product.code}`, 'success');
        } else {
            cart.push({
                code: product.code,
                name: product.name || '',
                brand: product.brand,
                quantity: quantity,
                note: note,
                addedAt: new Date().toISOString()
            });
            showSmartNotification('تم الإضافة', `تم إضافة ${product.name || product.code} للطلب (${quantity} قطعة)`, 'success');
        }
        
        localStorage.setItem('abushams_cart', JSON.stringify(cart));
        updateCartBadge();
        closeQuickAddModal();
        renderProducts();
    });
    
    document.getElementById('cancelQuickAdd').addEventListener('click', closeQuickAddModal);
    
    document.getElementById('openProductDetails').addEventListener('click', () => {
        closeQuickAddModal();
        openProduct(product.code, product.name, product.brand);
    });
    
    const modal = document.getElementById('quickAddModal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeQuickAddModal();
        }
    });
    
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeQuickAddModal();
        }
    };
    document.addEventListener('keydown', handleEsc);
    
    setTimeout(() => {
        document.getElementById('quickNote').focus();
    }, 300);
}

function closeQuickAddModal() {
    const modal = document.getElementById('quickAddModal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function renderBrands() {
    const brands = ['ماركات', ...new Set(products.map(p => p.brand))];
    const brandDropdown = document.getElementById('brandDropdown');
    brandDropdown.innerHTML = brands.map(brand => `
        <option value="${brand}" ${currentBrand === brand ? 'selected' : ''}>
            ${brand}
        </option>
    `).join('');
}

function renderSubCategories() {
    let filtered = currentBrand === 'الكل' ? products : products.filter(p => p.brand === currentBrand);
    const subs = ['افرع ', ...new Set(filtered.map(p => p.sub))];
    const subDropdown = document.getElementById('subDropdown');
    subDropdown.innerHTML = subs.map(sub => `
        <option value="${sub}" ${currentSub === sub ? 'selected' : ''}>
            ${sub}
        </option>
    `).join('');
    subDropdown.parentElement.style.display = subs.length <= 1 ? 'none' : 'block';
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

// نظام التقرير المنبثق
function showOrderReport() {
    if (cart.length === 0) {
        showSmartNotification('سلة فارغة', 'لا توجد منتجات لعرضها', 'warning');
        return;
    }

    const orderNumber = generateOrderNumber();
    const currentDate = new Date().toLocaleDateString('ar-EG');
    const currentTime = new Date().toLocaleTimeString('ar-EG');
    const customerName = document.getElementById('customerName')?.value || 'غير محدد';
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    let productsTable = '';
    cart.forEach((item, index) => {
        const product = products.find(p => p.code === item.code);
        productsTable += `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${item.brand}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${product?.name || 'منتج'}</td>
                <td style="padding: 10px; border: 1px solid #ddd; direction: ltr; text-align: left;">${item.code}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${item.note || '-'}</td>
            </tr>
        `;
    });

    const generalNote = document.getElementById('cartNote')?.value || '';
    const reportWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    
    reportWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>تقرير الطلب - IBC</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Cairo', sans-serif; }
                body { background: #f5f5f5; padding: 30px; }
                .report-container { max-width: 1100px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden; }
                .report-header { background: linear-gradient(135deg, #1a237e, #3949ab); color: white; padding: 30px; text-align: center; }
                .report-header h1 { font-size: 2.5rem; margin-bottom: 10px; }
                .report-header h3 { font-size: 1.2rem; opacity: 0.9; }
                .report-info { padding: 25px; background: #f8f9fa; border-bottom: 1px solid #eee; }
                .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
                .info-item { text-align: center; }
                .info-label { font-size: 0.9rem; color: #666; margin-bottom: 5px; }
                .info-value { font-size: 1.3rem; font-weight: bold; color: #1a237e; }
                .products-section { padding: 25px; }
                .products-section h2 { color: #1a237e; margin-bottom: 20px; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
                th { background: #1a237e; color: white; padding: 12px; font-weight: 600; }
                td { padding: 12px; border: 1px solid #ddd; }
                tr:nth-child(even) { background: #f8f9fa; }
                .notes-section { padding: 0 25px 25px 25px; }
                .notes-box { background: #fff9e6; border: 1px solid #ffd700; border-radius: 10px; padding: 20px; margin-top: 10px; }
                .report-footer { background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee; color: #666; }
                .action-buttons { padding: 25px; display: flex; gap: 15px; justify-content: center; border-top: 1px solid #eee; }
                .btn { padding: 12px 30px; border: none; border-radius: 8px; font-family: 'Cairo'; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 1rem; transition: all 0.3s; }
                .btn-print { background: linear-gradient(135deg, #2196F3, #1976D2); color: white; }
                .btn-close { background: #f5f5f5; color: #666; border: 1px solid #ddd; }
                @media print { body { background: white; padding: 0; } .report-container { box-shadow: none; } .action-buttons { display: none; } }
            </style>
        </head>
        <body>
            <div class="report-container">
                <div class="report-header">
                    <h1>📋 تقرير الطلب</h1>
                    <h3>نظام إدارة طلبات IBC</h3>
                </div>
                
                <div class="report-info">
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">رقم الطلب</div>
                            <div class="info-value">${orderNumber}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">التاريخ</div>
                            <div class="info-value">${currentDate}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">الوقت</div>
                            <div class="info-value">${currentTime}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">الزبون</div>
                            <div class="info-value">${customerName}</div>
                        </div>
                    </div>
                </div>
                
                <div class="products-section">
                    <h2>🛒 تفاصيل المنتجات</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>الماركة</th>
                                <th>المنتج</th>
                                <th>الكود</th>
                                <th>الكمية</th>
                                <th>ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productsTable}
                        </tbody>
                    </table>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 15px; border-radius: 10px;">
                        <span style="font-weight: bold; color: #1a237e;">إجمالي المنتجات:</span>
                        <span style="font-size: 1.3rem; font-weight: bold; color: #4CAF50;">${cart.length}</span>
                        <span style="font-weight: bold; color: #1a237e;">إجمالي القطع:</span>
                        <span style="font-size: 1.3rem; font-weight: bold; color: #4CAF50;">${totalItems}</span>
                    </div>
                </div>
                
                ${generalNote ? `
                <div class="notes-section">
                    <h2 style="color: #1a237e; margin-bottom: 10px;">📝 ملاحظات عامة</h2>
                    <div class="notes-box">
                        ${generalNote}
                    </div>
                </div>
                ` : ''}
                
                <div class="report-footer">
                    <p>تم إنشاء هذا التقرير بواسطة نظام IBC - جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
                </div>
                
                <div class="action-buttons">
                    <button class="btn btn-print" onclick="window.print()">
                        <i class="fas fa-print"></i> طباعة التقرير
                    </button>
                    <button class="btn btn-close" onclick="window.close()">
                        <i class="fas fa-times"></i> إغلاق
                    </button>
                </div>
            </div>
        </body>
        </html>
    `);
    
    reportWindow.document.close();
}

function sendReportToWhatsApp() {
    if (cart.length === 0) {
        showSmartNotification('السلة فارغة', 'لا يمكن إرسال تقرير فارغ', 'warning');
        return;
    }

    const orderNumber = generateOrderNumber();
    const customerName = document.getElementById('customerName')?.value || 'غير محدد';
    const date = new Date().toLocaleDateString('ar-EG');
    const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

    let message = `📋 *تقرير الطلب - IBC*\n`;
    message += `══════════════════════\n`;
    message += `📋 رقم الطلب: ${orderNumber}\n`;
    message += `👤 الزبون: ${customerName}\n`;
    message += `📅 التاريخ: ${date}\n`;
    message += `📊 إجمالي: ${cart.length} منتج | ${totalItems} قطعة\n`;
    message += `══════════════════════\n\n`;

    cart.forEach((item, i) => {
        const product = products.find(p => p.code === item.code);
        message += `*${i + 1}. ${item.brand}*\n`;
        message += `🔢 الكود: ${item.code}\n`;
        if (product?.barcode) message += `🔲 باركود: ${product.barcode}\n`;
        if (product?.name) message += `📝 المنتج: ${product.name}\n`;
        message += `📦 الكمية: ${item.quantity}\n`;
        if (item.note) message += `🗒️ ملاحظة: ${item.note}\n`;
        message += `──────────\n\n`;
    });

    const generalNote = document.getElementById('cartNote')?.value;
    if (generalNote) {
        message += `📝 *ملاحظات عامة:*\n${generalNote}\n\n`;
    }

    message += `══════════════════════\n🚀 نظام IBC`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    showSmartNotification('تم الإرسال', 'تم إرسال التقرير عبر واتساب', 'success');
}

async function shareReportAsPDF() {
    if (cart.length === 0) {
        showSmartNotification('⚠️ السلة فارغة', 'لا توجد منتجات لتصديرها', 'warning');
        return;
    }

    const orderNumber = generateOrderNumber();
    const customerName = document.getElementById('customerName')?.value || 'غير محدد';
    const date = new Date().toLocaleDateString('ar-EG');
    const generalNote = document.getElementById('cartNote')?.value || '';

    const element = document.createElement('div');
    element.style.width = '750px'; 
    element.innerHTML = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 30px; background: #fff;">
            <div style="text-align: center; border-bottom: 3px solid #1a237e; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="color: #1a237e; margin: 0;">📋 تقرير طلب - IBC</h1>
            </div>
            
            <table style="width: 100%; margin-bottom: 20px; font-size: 14px;">
                <tr>
                    <td><strong>رقم الطلب:</strong> ${orderNumber}</td>
                    <td style="text-align: left;"><strong>التاريخ:</strong> ${date}</td>
                </tr>
                <tr>
                    <td><strong>الزبون:</strong> ${customerName}</td>
                </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 12px;">
                <thead>
                    <tr style="background-color: #1a237e; color: white;">
                        <th style="border: 1px solid #ddd; padding: 10px; width: 40px;">#</th>
                        <th style="border: 1px solid #ddd; padding: 10px;">الماركة</th>
                        <th style="border: 1px solid #ddd; padding: 10px;">المنتج</th>
                        <th style="border: 1px solid #ddd; padding: 10px;">الكود</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 60px;">كمية حبة</th>
                        <th style="border: 1px solid #ddd; padding: 10px;">ملاحظة  الصنف</th>
                    </tr>
                </thead>
                <tbody>
                    ${cart.map((item, i) => {
                        const product = products.find(p => p.code === item.code);
                        return `
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 8px;">${i + 1}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${item.brand}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${product?.name || '-'}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${item.code}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${item.quantity}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${item.note || '-'}</td>
                            </tr>`;
                    }).join('')}
                </tbody>
            </table>

            ${generalNote ? `
            <div style="margin-top: 20px; padding: 15px; border: 1px solid #ff0000; border-radius: 8px; background-color: #ffebee;">
                <strong style="color: #b71c1c; display: block; margin-bottom: 5px;">📝 ملاحظات عامة على الطلب:</strong>
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #000;">${generalNote}</p>
            </div>
            ` : ''}
            
            <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px;">
                تم توليد هذا التقرير عبر نظام IBC الذكي جميع الحقوق محفوظة 
            </div>
        </div>
    `;

    const opt = {
        margin:       [10, 5],
        filename:     `IBC_Order_${orderNumber}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true, scrollX: 0, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        await html2pdf().set(opt).from(element).save();
        showSmartNotification('✅ تم الحفظ', 'تم استخراج التقرير كاملاً مع الملاحظات العامة', 'success');
    } catch (error) {
        console.error("PDF Error:", error);
        alert("حدث خطأ، حاول مرة أخرى.");
    }
}
