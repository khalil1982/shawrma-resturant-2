/**
 * POS Screen Logic
 * منطق شاشة نقطة البيع
 */

// DOM Elements
const userInfo = document.getElementById("userInfo");
const shiftInfo = document.getElementById("shiftInfo");
const shiftText = document.getElementById("shiftText");
const logoutBtn = document.getElementById("logoutBtn");
const menuSearch = document.getElementById("menuSearch");
const categoriesList = document.getElementById("categoriesList");
const menuItemsList = document.getElementById("menuItemsList");
const orderItemsList = document.getElementById("orderItemsList");
const clearOrderBtn = document.getElementById("clearOrderBtn");
const orderNotes = document.getElementById("orderNotes");
const orderType = document.getElementById("orderType");
const customerCount = document.getElementById("customerCount");
const discountPercent = document.getElementById("discountPercent");
const subtotalAmount = document.getElementById("subtotalAmount");
const discountAmount = document.getElementById("discountAmount");
const totalAmount = document.getElementById("totalAmount");
const createOrderBtn = document.getElementById("createOrderBtn");
const cancelBtn = document.getElementById("cancelBtn");
const summaryError = document.getElementById("summaryError");

// State
let sessionToken = null;
let currentUser = null;
let activeShift = null;
let categories = [];
let menuItems = [];
let currentOrder = [];
let selectedCategory = null;

/**
 * تهيئة الصفحة
 */
const init = async () => {
  // التحقق من الجلسة
  const storedToken = sessionStorage.getItem("sessionToken");
  if (!storedToken) {
    redirectToLogin();
    return;
  }

  sessionToken = storedToken;

  // تحميل معلومات المستخدم
  const sessionResult = await window.authApi.me(sessionToken);
  if (!sessionResult.ok) {
    redirectToLogin();
    return;
  }

  currentUser = sessionResult.user;
  userInfo.textContent = `${currentUser.full_name} (${currentUser.role.display_name})`;

  // تحميل الوردية النشطة
  await loadActiveShift();

  // تحميل القائمة
  await loadMenu();

  // إعداد المستمعين
  setupEventListeners();
};

/**
 * الانتقال إلى صفحة تسجيل الدخول
 */
const redirectToLogin = () => {
  sessionStorage.removeItem("sessionToken");
  window.location.href = "index.html";
};

/**
 * تحميل الوردية النشطة
 */
const loadActiveShift = async () => {
  const result = await window.shiftApi.active(sessionToken);

  if (!result.ok) {
    activeShift = null;
    shiftText.textContent = "لا توجد وردية نشطة";
    const indicator = shiftInfo.querySelector(".shift-indicator");
    indicator.classList.remove("active");
    createOrderBtn.disabled = true;
    setSummaryError("لا يمكن إنشاء طلب بدون وردية نشطة");
    return;
  }

  activeShift = result.shift;
  if (activeShift) {
    shiftText.textContent = `وردية ${activeShift.shift_type === "morning" ? "صباحية" : "مسائية"} - ${activeShift.shift_date}`;
    const indicator = shiftInfo.querySelector(".shift-indicator");
    indicator.classList.add("active");
    setSummaryError("");
  }
};

/**
 * تحميل القائمة (التصنيفات والأصناف)
 */
const loadMenu = async () => {
  // تحميل التصنيفات
  const categoriesResult = await window.menuApi.categories(sessionToken);
  if (categoriesResult.ok) {
    categories = categoriesResult.categories;
    renderCategories();
  }

  // تحميل الأصناف
  const itemsResult = await window.menuApi.items(sessionToken);
  if (itemsResult.ok) {
    menuItems = itemsResult.items;
    renderMenuItems();
  }
};

/**
 * عرض التصنيفات
 */
const renderCategories = () => {
  categoriesList.innerHTML = "";

  // إضافة زر "الكل"
  const allChip = document.createElement("button");
  allChip.className = "category-chip" + (selectedCategory === null ? " active" : "");
  allChip.textContent = "الكل";
  allChip.addEventListener("click", () => {
    selectedCategory = null;
    renderCategories();
    renderMenuItems();
  });
  categoriesList.appendChild(allChip);

  // إضافة التصنيفات
  categories.forEach((category) => {
    const chip = document.createElement("button");
    chip.className = "category-chip" + (selectedCategory === category.id ? " active" : "");
    chip.textContent = category.name;
    chip.addEventListener("click", () => {
      selectedCategory = category.id;
      renderCategories();
      renderMenuItems();
    });
    categoriesList.appendChild(chip);
  });
};

/**
 * عرض الأصناف
 */
const renderMenuItems = () => {
  menuItemsList.innerHTML = "";

  const searchTerm = menuSearch.value.toLowerCase();
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      !searchTerm || item.name.toLowerCase().includes(searchTerm);
    const matchesCategory =
      selectedCategory === null || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (filteredItems.length === 0) {
    menuItemsList.innerHTML = '<div class="empty-state">لا توجد أصناف</div>';
    return;
  }

  filteredItems.forEach((item) => {
    const card = document.createElement("div");
    card.className = "menu-item-card" + (item.is_available ? "" : " unavailable");

    const name = document.createElement("div");
    name.className = "menu-item-card__name";
    name.textContent = item.name;

    const price = document.createElement("div");
    price.className = "menu-item-card__price";
    price.textContent = `${item.price.toFixed(2)} ر.س`;

    card.appendChild(name);
    card.appendChild(price);

    if (item.is_available) {
      card.addEventListener("click", () => addItemToOrder(item));
    }

    menuItemsList.appendChild(card);
  });
};

/**
 * إضافة صنف إلى الطلب
 */
const addItemToOrder = (menuItem) => {
  const existingItem = currentOrder.find(
    (item) => item.menuItemId === menuItem.id
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    currentOrder.push({
      menuItemId: menuItem.id,
      itemName: menuItem.name,
      unitPrice: menuItem.price,
      quantity: 1,
    });
  }

  renderOrder();
  updateSummary();
};

/**
 * عرض الطلب الحالي
 */
const renderOrder = () => {
  orderItemsList.innerHTML = "";

  if (currentOrder.length === 0) {
    orderItemsList.innerHTML = '<div class="empty-state">لا توجد أصناف في الطلب</div>';
    return;
  }

  currentOrder.forEach((item, index) => {
    const orderItem = document.createElement("div");
    orderItem.className = "order-item";

    const info = document.createElement("div");
    info.className = "order-item__info";

    const itemName = document.createElement("div");
    itemName.className = "order-item__name";
    itemName.textContent = item.itemName;

    const itemPrice = document.createElement("div");
    itemPrice.className = "order-item__price";
    itemPrice.textContent = `${item.unitPrice.toFixed(2)} ر.س`;

    info.appendChild(itemName);
    info.appendChild(itemPrice);

    // كمية
    const quantityDiv = document.createElement("div");
    quantityDiv.className = "order-item__quantity";

    const decreaseBtn = document.createElement("button");
    decreaseBtn.className = "quantity-btn";
    decreaseBtn.textContent = "-";
    decreaseBtn.addEventListener("click", () => {
      if (item.quantity > 1) {
        item.quantity -= 1;
        renderOrder();
        updateSummary();
      }
    });

    const quantityValue = document.createElement("span");
    quantityValue.className = "quantity-value";
    quantityValue.textContent = item.quantity;

    const increaseBtn = document.createElement("button");
    increaseBtn.className = "quantity-btn";
    increaseBtn.textContent = "+";
    increaseBtn.addEventListener("click", () => {
      item.quantity += 1;
      renderOrder();
      updateSummary();
    });

    quantityDiv.appendChild(decreaseBtn);
    quantityDiv.appendChild(quantityValue);
    quantityDiv.appendChild(increaseBtn);

    // الإجمالي
    const total = document.createElement("div");
    total.className = "order-item__total";
    const lineTotal = item.quantity * item.unitPrice;
    total.textContent = `${lineTotal.toFixed(2)} ر.س`;

    // زر الحذف
    const removeBtn = document.createElement("button");
    removeBtn.className = "order-item__remove";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      currentOrder.splice(index, 1);
      renderOrder();
      updateSummary();
    });

    orderItem.appendChild(info);
    orderItem.appendChild(quantityDiv);
    orderItem.appendChild(total);
    orderItem.appendChild(removeBtn);

    orderItemsList.appendChild(orderItem);
  });
};

/**
 * تحديث الملخص (المجاميع)
 */
const updateSummary = () => {
  const subtotal = currentOrder.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const discount = parseFloat(discountPercent.value) || 0;
  const discountValue = (subtotal * discount) / 100;
  const total = subtotal - discountValue;

  subtotalAmount.textContent = `${subtotal.toFixed(2)} ر.س`;
  discountAmount.textContent = `${discountValue.toFixed(2)} ر.س`;
  totalAmount.textContent = `${total.toFixed(2)} ر.س`;

  // تفعيل/تعطيل زر الإنشاء
  createOrderBtn.disabled = currentOrder.length === 0 || !activeShift;
};

/**
 * مسح الطلب
 */
const clearOrder = () => {
  if (currentOrder.length === 0) return;

  if (confirm("هل أنت متأكد من مسح الطلب؟")) {
    currentOrder = [];
    orderNotes.value = "";
    discountPercent.value = "0";
    renderOrder();
    updateSummary();
  }
};

/**
 * إنشاء الطلب
 */
const createOrder = async () => {
  if (currentOrder.length === 0 || !activeShift) return;

  setSummaryError("");
  createOrderBtn.disabled = true;

  const items = currentOrder.map((item) => ({
    menuItemId: item.menuItemId,
    itemName: item.itemName,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.quantity * item.unitPrice,
  }));

  const result = await window.orderApi.create(sessionToken, {
    orderType: orderType.value,
    customerCount: parseInt(customerCount.value),
    items,
  });

  if (!result.ok) {
    setSummaryError(result.error || "فشل إنشاء الطلب");
    createOrderBtn.disabled = false;
    return;
  }

  // نجح الإنشاء
  alert(`تم إنشاء الطلب #${result.order.id} بنجاح!`);
  clearOrder();
  createOrderBtn.disabled = false;
};

/**
 * إلغاء الطلب
 */
const cancel = () => {
  clearOrder();
};

/**
 * تعيين رسالة خطأ في الملخص
 */
const setSummaryError = (message) => {
  if (!message) {
    summaryError.textContent = "";
    summaryError.classList.add("hidden");
    return;
  }
  summaryError.textContent = message;
  summaryError.classList.remove("hidden");
};

/**
 * إعداد المستمعين
 */
const setupEventListeners = () => {
  logoutBtn.addEventListener("click", async () => {
    await window.authApi.logout(sessionToken);
    redirectToLogin();
  });

  menuSearch.addEventListener("input", renderMenuItems);

  clearOrderBtn.addEventListener("click", clearOrder);

  discountPercent.addEventListener("input", updateSummary);

  createOrderBtn.addEventListener("click", createOrder);

  cancelBtn.addEventListener("click", cancel);
};

// بدء التطبيق
init();
