const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");
const authCard = document.getElementById("authCard");
const sessionCard = document.getElementById("sessionCard");
const sessionInfo = document.getElementById("sessionInfo");
const permissionList = document.getElementById("permissionList");
const refreshSession = document.getElementById("refreshSession");
const logoutBtn = document.getElementById("logoutBtn");
const shiftCard = document.getElementById("shiftCard");
const shiftStatus = document.getElementById("shiftStatus");
const shiftError = document.getElementById("shiftError");
const shiftOpenForm = document.getElementById("shiftOpenForm");
const shiftTypeInput = document.getElementById("shiftType");
const openingCashInput = document.getElementById("openingCash");
const shiftCloseForm = document.getElementById("shiftCloseForm");
const closingCashInput = document.getElementById("closingCash");
const closeReasonInput = document.getElementById("closeReason");
const ordersCard = document.getElementById("ordersCard");
const ordersNotice = document.getElementById("ordersNotice");
const ordersError = document.getElementById("ordersError");
const orderCreateForm = document.getElementById("orderCreateForm");
const orderTypeInput = document.getElementById("orderType");
const customerCountInput = document.getElementById("customerCount");
const ordersList = document.getElementById("ordersList");

let sessionToken = null;
let activeShift = null;

const setError = (message) => {
  if (!message) {
    loginError.textContent = "";
    loginError.classList.add("hidden");
    return;
  }
  loginError.textContent = message;
  loginError.classList.remove("hidden");
};

const setSessionView = (active) => {
  authCard.classList.toggle("hidden", active);
  sessionCard.classList.toggle("hidden", !active);
  shiftCard.classList.toggle("hidden", !active);
  ordersCard.classList.toggle("hidden", !active);
};

const setShiftError = (message) => {
  if (!message) {
    shiftError.textContent = "";
    shiftError.classList.add("hidden");
    return;
  }
  shiftError.textContent = message;
  shiftError.classList.remove("hidden");
};

const setFormEnabled = (form, enabled) => {
  const elements = form.querySelectorAll("input, select, button");
  elements.forEach((element) => {
    element.disabled = !enabled;
  });
};

const renderShift = () => {
  if (!activeShift) {
    shiftStatus.textContent = "لا توجد وردية نشطة";
    setFormEnabled(shiftOpenForm, true);
    setFormEnabled(shiftCloseForm, false);
    setFormEnabled(orderCreateForm, false);
    ordersNotice.classList.remove("hidden");
    return;
  }

  shiftStatus.textContent = `وردية ${activeShift.shift_type} بتاريخ ${activeShift.shift_date}`;
  setFormEnabled(shiftOpenForm, false);
  setFormEnabled(shiftCloseForm, true);
  setFormEnabled(orderCreateForm, true);
  ordersNotice.classList.add("hidden");
};

const renderSession = (data) => {
  sessionInfo.textContent = `المستخدم: ${data.user.username} (${data.user.role})`;
  permissionList.innerHTML = "";
  for (const permission of data.permissions) {
    const li = document.createElement("li");
    li.textContent = permission;
    permissionList.appendChild(li);
  }
};

const loadSession = async () => {
  if (!sessionToken) return;
  const result = await window.authApi.me(sessionToken);
  if (!result.ok) {
    sessionToken = null;
    setSessionView(false);
    setError("انتهت الجلسة. الرجاء تسجيل الدخول مرة أخرى.");
    return;
  }
  renderSession(result);
  setSessionView(true);
  await loadShift();
};

const loadShift = async () => {
  if (!sessionToken) return;
  const result = await window.shiftApi.active(sessionToken);
  if (!result.ok) {
    activeShift = null;
    renderShift();
    setShiftError(result.error || "تعذر تحميل الوردية");
    return;
  }
  activeShift = result.shift || null;
  setShiftError("");
  renderShift();
  await loadOrders();
};

const setOrdersError = (message) => {
  if (!message) {
    ordersError.textContent = "";
    ordersError.classList.add("hidden");
    return;
  }
  ordersError.textContent = message;
  ordersError.classList.remove("hidden");
};

const renderOrders = (orders) => {
  ordersList.innerHTML = "";
  if (!orders.length) {
    ordersList.textContent = "لا توجد طلبات بعد.";
    return;
  }

  for (const order of orders) {
    const card = document.createElement("div");
    card.classList.add("order-card");

    const title = document.createElement("div");
    title.classList.add("order-title");
    title.textContent = `طلب #${order.id} - ${order.status}`;

    const meta = document.createElement("div");
    meta.classList.add("order-meta");
    meta.textContent = `النوع: ${order.order_type} | العملاء: ${order.customer_count}`;

    const actions = document.createElement("div");
    actions.classList.add("actions");

    const statusSelect = document.createElement("select");
    statusSelect.innerHTML = `
      <option value="preparing">تحضير</option>
      <option value="ready">جاهز</option>
      <option value="delivered">تم التسليم</option>
    `;
    statusSelect.value = order.status === "created" ? "preparing" : order.status;

    const updateBtn = document.createElement("button");
    updateBtn.classList.add("btn", "btn--ghost");
    updateBtn.textContent = "تحديث الحالة";
    updateBtn.disabled = order.status === "delivered" || order.status === "cancelled";
    updateBtn.addEventListener("click", async () => {
      setOrdersError("");
      const result = await window.orderApi.updateStatus(sessionToken, {
        orderId: order.id,
        toStatus: statusSelect.value,
      });
      if (!result.ok) {
        setOrdersError(result.error || "فشل تحديث الحالة");
        return;
      }
      await loadOrders();
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.classList.add("btn", "btn--danger");
    cancelBtn.textContent = "إلغاء";
    cancelBtn.disabled = order.status === "cancelled" || order.status === "delivered";
    cancelBtn.addEventListener("click", async () => {
      const reason = prompt("سبب الإلغاء:");
      if (!reason) return;
      setOrdersError("");
      const result = await window.orderApi.cancel(sessionToken, {
        orderId: order.id,
        reason,
      });
      if (!result.ok) {
        setOrdersError(result.error || "فشل إلغاء الطلب");
        return;
      }
      await loadOrders();
    });

    actions.append(statusSelect, updateBtn, cancelBtn);
    card.append(title, meta, actions);
    ordersList.appendChild(card);
  }
};

const loadOrders = async () => {
  if (!sessionToken || !activeShift) {
    renderOrders([]);
    return;
  }
  const result = await window.orderApi.list(sessionToken);
  if (!result.ok) {
    setOrdersError(result.error || "تعذر تحميل الطلبات");
    renderOrders([]);
    return;
  }
  setOrdersError("");
  renderOrders(result.orders || []);
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setError("");
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const result = await window.authApi.login(username, password);
  if (!result.ok) {
    setError(result.error || "فشل تسجيل الدخول");
    return;
  }
  sessionToken = result.sessionToken;
  await loadSession();
  passwordInput.value = "";
});

refreshSession.addEventListener("click", loadSession);

logoutBtn.addEventListener("click", async () => {
  if (!sessionToken) return;
  await window.authApi.logout(sessionToken);
  sessionToken = null;
  activeShift = null;
  renderShift();
  renderOrders([]);
  setSessionView(false);
});

shiftOpenForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!sessionToken) return;
  setShiftError("");
  const result = await window.shiftApi.open(
    sessionToken,
    shiftTypeInput.value,
    openingCashInput.value
  );
  if (!result.ok) {
    setShiftError(result.error || "فشل فتح الوردية");
    return;
  }
  openingCashInput.value = "";
  await loadShift();
});

shiftCloseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!sessionToken) return;
  setShiftError("");
  const result = await window.shiftApi.close(
    sessionToken,
    closingCashInput.value,
    closeReasonInput.value
  );
  if (!result.ok) {
    setShiftError(result.error || "فشل إغلاق الوردية");
    return;
  }
  closingCashInput.value = "";
  closeReasonInput.value = "";
  await loadShift();
});

orderCreateForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!sessionToken || !activeShift) return;
  setOrdersError("");
  const result = await window.orderApi.create(sessionToken, {
    orderType: orderTypeInput.value,
    customerCount: customerCountInput.value,
    items: [],
  });
  if (!result.ok) {
    setOrdersError(result.error || "فشل إنشاء الطلب");
    return;
  }
  await loadOrders();
});

