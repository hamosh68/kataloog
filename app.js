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

// ===============================
// نظام الإشعارات الذكي
// ===============================

// دالة الإشعارات الذكية
function showSmartNotification(title, message, type = 'success', duration = 3000) {
    // منع تكرار الإشعارات المتطابقة
    const existingNotifications = document.querySelectorAll('.smart-notification');
    existingNotifications.forEach(notification => {
        if (notification.querySelector('.notification-body').textContent.includes(message.substring(0, 50))) {
            notification.remove();
        }
    });
    
    // تحديد الألوان حسب النوع
    const colors = {
        success: { bg: '#4CAF50', icon: '✅', titleColor: '#2E7D32' },
        warning: { bg: '#FF9800', icon: '⚠️', titleColor: '#EF6C00' },
        error: { bg: '#F44336', icon: '❌', titleColor: '#C62828' },
        info: { bg: '#2196F3', icon: 'ℹ️', titleColor: '#1565C0' }
    };
    
    const config = colors[type] || colors.info;
    
    // إنشاء الإشعار
    const notification = document.createElement('div');
    notification.className = `smart-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 99999;
        transform: translateX(400px);
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        overflow: hidden;
        border-left: 5px solid ${config.bg};
        font-family: 'Cairo', sans-serif;
        direction: rtl;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; padding: 15px 20px; background: #f8f9fa; border-bottom: 1px solid #eee;">
            <span style="font-size: 1.3rem; margin-left: 10px;">${config.icon}</span>
            <span style="font-weight: bold; font-size: 1rem; color: ${config.titleColor}; flex: 1;">${title}</span>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; font-size: 1.2rem; color: #666; cursor: pointer; padding: 0; width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                    onmouseover="this.style.background='rgba(0,0,0,0.1)'; this.style.color='#333'"
                    onmouseout="this.style.background='none'; this.style.color='#666'">
                ✕
            </button>
        </div>
        <div style="padding: 20px; font-size: 0.95rem; color: #555; line-height: 1.5;">
            ${message}
        </div>
        <div class="notification-progress" style="height: 4px; background: ${config.bg}; width: 100%;"></div>
    `;
    
    // إضافة للصفحة
    document.body.appendChild(notification);
    
    // ظهور سلس
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // التقدم الزمني
    const progressBar = notification.querySelector('.notification-progress');
    setTimeout(() => {
        progressBar.style.transition = `width ${duration}ms linear`;
        progressBar.style.width = '0%';
    }, 10);
    
    // الإزالة التلقائية
    const removeTimer = setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 300);
    }, duration + 10);
    
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
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) notification.remove();
            }, 300);
        }, duration);
    });
    
    // زر الإغلاق
    notification.querySelector('button').addEventListener('click', () => {
        clearTimeout(removeTimer);
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 300);
    });
}

// ===============================
// استبدال جميع الـ alerts القديمة
// ===============================

// 1. في دالة addToCart
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

// 2. في دالة sendCartToWhatsApp (بدل alert)
function sendCartToWhatsApp() {
    if (cart.length === 0) {
        showSmartNotification('سلة فارغة', 'أضف منتجات أولاً قبل الإرسال', 'warning');
        return;
    }
    
    // ... باقي الكود
    
    // بدل alert التاكيد
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

// 3. في دالة clearCart
function clearCart() {
    if (cart.length === 0) {
        showSmartNotification('لا يوجد طلبات', 'سلة الطلبات فارغة بالفعل', 'info');
        return;
    }
    
    // استخدام confirm محسن
    showConfirmModal(
        'مسح جميع الطلبات',
        'هل أنت متأكد من مسح جميع الطلبات؟ لا يمكن التراجع عن هذا الإجراء.',
        'warning',
        () => {
            cart = [];
            localStorage.setItem('abushams_cart', JSON.stringify(cart));
            updateCartBadge();
            closeCartModal();
            showSmartNotification('تم المسح', 'تم مسح جميع الطلبات بنجاح', 'success');
        }
    );
}

// 4. في دالة clearFavorites
function clearFavorites() {
    if (favorites.length === 0) {
        showSmartNotification('لا يوجد مفضلة', 'قائمة المفضلة فارغة', 'info');
        return;
    }
    
    showConfirmModal(
        'مسح المفضلة',
        'هل أنت متأكد من مسح جميع المنتجات من المفضلة؟',
        'warning',
        () => {
            favorites = [];
            localStorage.setItem('favorites', JSON.stringify(favorites));
            if (showOnlyFavorites) renderProducts();
            showSmartNotification('تم المسح', 'تم مسح جميع المفضلة بنجاح', 'success');
        }
    );
}

// 5. في دالة removeFromCart
function removeFromCart(index) {
    const itemName = cart[index]?.name || cart[index]?.code || 'المنتج';
    
    showConfirmModal(
        'حذف المنتج',
        `هل تريد حذف "${itemName}" من الطلب؟`,
        'warning',
        () => {
            cart.splice(index, 1);
            localStorage.setItem('abushams_cart', JSON.stringify(cart));
            updateCartBadge();
            showCartPage();
            showSmartNotification('تم الحذف', `تم حذف ${itemName} من الطلب`, 'success');
        }
    );
}

// 6. في دالة startScanner عند الخطأ
function startScanner() {
    // ... الكود الحالي
    
    html5QrCode.start(
        { facingMode: "environment" }, 
        config,
        (decodedText) => {
            // ... الكود الحالي
            showSmartNotification('تم المسح الضوئي', `تم قراءة الكود: ${decodedText}`, 'success');
        }
    ).catch(err => {
        showSmartNotification('خطأ في الكاميرا', 'يرجى السماح بصلاحية الكاميرا', 'error');
        console.error(err);
    });
}

// 7. في دالة toggleFavorite
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

// ===============================
// نظام تأكيد محسن بدل confirm العادي
// ===============================

function showConfirmModal(title, message, type = 'warning', onConfirm) {
    // إزالة أي مودال تأكيد سابق
    const oldModal = document.getElementById('confirmModal');
    if (oldModal) oldModal.remove();
    
    const colors = {
        warning: { bg: '#FF9800', icon: '⚠️' },
        danger: { bg: '#F44336', icon: '❌' },
        info: { bg: '#2196F3', icon: 'ℹ️' }
    };
    
    const config = colors[type] || colors.warning;
    
    const modalHTML = `
        <div class="modal" id="confirmModal" style="display: flex; z-index: 100000;">
            <div class="modal-content" style="max-width: 400px; animation: slideUp 0.3s ease;">
                <div style="padding: 25px; text-align: center;">
                    <div style="font-size: 3rem; color: ${config.bg}; margin-bottom: 15px;">
                        ${config.icon}
                    </div>
                    <h3 style="color: #333; margin-bottom: 15px; font-family: 'Cairo';">${title}</h3>
                    <p style="color: #666; line-height: 1.6; margin-bottom: 25px; font-family: 'Cairo';">
                        ${message}
                    </p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button onclick="document.getElementById('confirmModal').remove()" 
                                style="padding: 12px 30px; background: #f5f5f5; color: #666; border: 1px solid #ddd; border-radius: 8px; font-family: 'Cairo'; cursor: pointer; font-weight: bold; flex: 1;">
                            إلغاء
                        </button>
                        <button onclick="document.getElementById('confirmModal').remove(); ${onConfirm.toString().replace(/\n/g, ' ')}" 
                                style="padding: 12px 30px; background: ${config.bg}; color: white; border: none; border-radius: 8px; font-family: 'Cairo'; cursor: pointer; font-weight: bold; flex: 1;">
                            تأكيد
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // إغلاق بالنقر خارج المودال
    const modal = document.getElementById('confirmModal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // إغلاض بالزر ESC
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

// ===============================
// تحديث دالة showCartNotification القديمة
// ===============================

function showCartNotification(productName) {
    showSmartNotification('تمت الإضافة للطلب', productName, 'success');
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
// عرض صفحة الطلبات
function showCartPage() {
    if (cart.length === 0) {
        alert('🚫 سلة الطلبات فارغة\nأضف منتجات أولاً باستخدام زر 🛒');
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
function closeCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.remove();
    }
}
// حفظ اسم الزبون
function saveCustomerName(name) {
    localStorage.setItem('abushams_customer_name', name.trim());
}

// إرسال الطلب للمكتب عبر واتساب
// إرسال الطلب للمكتب عبر واتساب
function sendCartToWhatsApp() {
    if (cart.length === 0) {
        alert('🚫 سلة الطلبات فارغة!');
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
        const confirmationMsg = customerName 
            ? `✅ تم إرسال طلب الزبون ${customerName}!\n\n${cart.length} منتج\n${cart.reduce((sum, item) => sum + item.quantity, 0)} قطعة`
            : `✅ تم إرسال الطلب!\n\n${cart.length} منتج\n${cart.reduce((sum, item) => sum + item.quantity, 0)} قطعة`;
        
        alert(confirmationMsg);
    }, 500);
}function renderSubCategories() {
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
    } else {
        cart.push({
            code: productCode,
            name: productName,
            brand: productBrand,
            quantity: 1,
            note: '', // إضافة حقل الملاحظة الافتراضي
            addedAt: new Date().toISOString()
        });
    }
    
    localStorage.setItem('abushams_cart', JSON.stringify(cart));
    updateCartBadge();
    showCartNotification(productName || productCode);
}

// إشعار إضافة للطلب
function showCartNotification(productName) {
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 100px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            font-family: 'Cairo';
            display: flex;
            align-items: center;
            gap: 10px;
        ">
            <i class="fas fa-check-circle"></i>
            <div>
                <div style="font-weight: bold;">تمت الإضافة للطلب</div>
                <div style="font-size: 0.9rem;">${productName}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
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
            
            // إهتزاز خفيف للموبايل عند نجاح القراءة
            if (navigator.vibrate) navigator.vibrate(100);
        }
    ).catch(err => {
        alert("يرجى السماح بصلاحية الكاميرا");
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







