import { watch, upsert, remove } from './api.js';

let modelsCache = [];
let allEvents = [];
let currentMonth = dayjs();
let editingEvent = null;
let editingModel = null;

const $ = (id) => document.getElementById(id);

function normalizeName(name) {
  return (name || "").trim().replace(/\s+/g, " ").toLowerCase();
}
function buildModelMap(models) {
  return new Map(models.map(m => [normalizeName(m.name), m]));
}

/* ---------- เติม dropdown โมเดล ---------- */
function populateModelDropdown() {
  const select = $("eventModel");
  if (!select) return;
  select.innerHTML = `<option value="">-- เลือกโมเดล --</option>`;
  modelsCache.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.name;
    opt.textContent = m.name;
    select.appendChild(opt);
  });
}

/* ---------- Calendar ---------- */
function renderCalendar(events, models) {
  const calendar = $("calendar");
  const monthLabel = $("monthLabel");
  if (!calendar || !monthLabel) return;

  calendar.innerHTML = "";
  monthLabel.textContent = currentMonth.format("MMMM YYYY");

  const startOfMonth = currentMonth.startOf("month").day();
  const daysInMonth = currentMonth.daysInMonth();
  const modelMap = buildModelMap(models);

  for (let i = 0; i < startOfMonth; i++) {
    const empty = document.createElement("div");
    empty.className = "h-20 bg-neutral-800 rounded-lg";
    calendar.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = currentMonth.date(d);
    const dayBox = document.createElement("div");
    dayBox.className = "h-24 bg-neutral-800 rounded-lg p-1 text-xs overflow-y-auto";

    const dayEvents = events.filter(ev => {
      const start = dayjs(ev.startDate);
      const end = ev.endDate ? dayjs(ev.endDate) : start;
      return date.isBetween(start, end, 'day', '[]');
    });

    const label = document.createElement("div");
    label.className = "text-right text-neutral-400 text-xs";
    label.textContent = d;
    dayBox.appendChild(label);

    dayEvents.forEach(ev => {
      const evName = normalizeName(ev.model);
      const matched = modelMap.get(evName);
      const modelColors = matched || { colorBG: "#6366f1", colorText: "#fff" };

      const tag = document.createElement("div");
      tag.className = "rounded px-1 py-0.5 text-[10px] leading-tight mb-1";
      tag.style.background = modelColors.colorBG;
      tag.style.color = modelColors.colorText;
      tag.innerHTML = `<div>${ev.model || "-"}</div><div>${ev.eventName || "-"}</div>`;
      dayBox.appendChild(tag);
    });

    calendar.appendChild(dayBox);
  }
}

/* ---------- Stats ---------- */
function renderStats(events) {
  const total = $("totalEvents");
  const past = $("pastEvents");
  const upcoming = $("upcomingEvents");
  if (!total || !past || !upcoming) return;

  const thisYear = currentMonth.year();
  const now = dayjs();

  const yearEvents = events.filter(ev => dayjs(ev.startDate).year() === thisYear);
  const pastEvents = yearEvents.filter(ev => dayjs(ev.endDate || ev.startDate).isBefore(now, 'day'));
  const upcomingEvents = yearEvents.filter(ev => dayjs(ev.startDate).isAfter(now, 'day'));

  total.textContent = yearEvents.length;
  past.textContent = pastEvents.length;
  upcoming.textContent = upcomingEvents.length;
}

/* ---------- Events List ---------- */
function renderEvents(events, models) {
  const container = $("eventsList");
  const header = $("eventsHeader");
  if (!container || !header) return;
  container.innerHTML = "";

  const filtered = events.filter(ev => {
    const start = dayjs(ev.startDate);
    const end = ev.endDate ? dayjs(ev.endDate) : start;
    return start.isSame(currentMonth, "month") || end.isSame(currentMonth, "month");
  });

  header.textContent = `งานในเดือน ${currentMonth.format("MMMM YYYY")} (${filtered.length} งาน)`;

  if (!filtered.length) {
    container.innerHTML = `<p class="text-neutral-400">ไม่มีงานในเดือนนี้</p>`;
    return;
  }

  const sorted = [...filtered].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const modelMap = buildModelMap(models);

  sorted.forEach(ev => {
    const evName = normalizeName(ev.model);
    const matched = modelMap.get(evName);
    const modelColors = matched || { colorBG: "#6366f1", colorText: "#fff" };

    const card = document.createElement("div");
    card.className = "bg-neutral-900 rounded-2xl shadow-lg p-6 flex justify-between items-start mb-4";
    card.style.borderLeft = `12px solid ${modelColors.colorBG}`;

    card.innerHTML = `
      <div class="flex-1">
        <span class="px-3 py-1 text-sm font-semibold rounded-full mb-3 inline-block"
          style="background:${modelColors.colorBG}; color:${modelColors.colorText}">
          ${ev.model || "-"}
        </span>
        <h3 class="text-2xl font-bold text-white mb-3">${ev.eventName || "-"}</h3>

        <div class="grid grid-cols-2 gap-y-2 text-sm">
          <div>
            <p class="text-neutral-400">วันที่</p>
            <p class="font-medium">${ev.startDate || "-"} ${ev.endDate ? " – " + ev.endDate : ""}</p>
          </div>
          <div>
            <p class="text-neutral-400">สถานที่</p>
            <p class="font-medium">${ev.location || "-"}</p>
          </div>
          <div>
            <p class="text-neutral-400">วันที่ติดตั้ง</p>
            <p class="font-medium">${ev.installDate || "-"}</p>
          </div>
          <div>
            <p class="text-neutral-400">เวลาติดตั้ง</p>
            <p class="font-medium">${ev.installTime || "-"}</p>
          </div>
          <div>
            <p class="text-neutral-400">เวลาเปิด-ปิด</p>
            <p class="font-medium">${ev.openTime || "-"} - ${ev.closeTime || "-"}</p>
          </div>
          <div>
            <p class="text-neutral-400">Staff</p>
            <p class="font-medium">${ev.staff || "-"}</p>
          </div>
          <div>
            <p class="text-neutral-400">สถานะ</p>
            <p class="font-medium">
              ${ev.paidFull ? "ชำระครบแล้ว" : ev.paidDeposit ? "มัดจำแล้ว" : "-"}
            </p>
          </div>
          <div>
            <p class="text-neutral-400">Note</p>
            <p class="font-medium">${ev.note || "-"}</p>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2 ml-4">
        <button data-edit="${ev.id}" 
          class="px-4 py-2 rounded-lg font-semibold"
          style="background:${modelColors.colorBG}; color:${modelColors.colorText}">
          แก้ไข
        </button>
        <button data-del="${ev.id}" 
          class="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-neutral-200">
          ลบ
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  attachEventActions();
}

/* ---------- Models List ---------- */
function renderModels(models) {
  const container = $("modelsList");
  if (!container) return;
  container.innerHTML = "";

  if (!models.length) {
    container.innerHTML = `<p class="text-neutral-400">ยังไม่มีโมเดล</p>`;
    return;
  }

  models.forEach(m => {
    const card = document.createElement("div");
    card.className = "bg-neutral-900 rounded-xl shadow p-4 flex justify-between items-center mb-2";
    card.innerHTML = `
      <div>
        <span class="px-2 py-1 text-xs font-medium rounded" 
          style="background:${m.colorBG}; color:${m.colorText}">${m.name}</span>
        <p class="text-sm text-neutral-400">ขนาด: ${m.size || "-"}</p>
      </div>
      <div class="flex gap-2">
        <button data-edit-model="${m.id}" 
          class="px-3 py-1 rounded bg-indigo-500 hover:bg-indigo-400 text-white text-sm">แก้ไข</button>
        <button data-del-model="${m.id}" 
          class="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-sm">ลบ</button>
      </div>
    `;
    container.appendChild(card);
  });

  attachModelActions();
}

/* ---------- Attach Model Actions ---------- */
function attachModelActions() {
  document.querySelectorAll("[data-edit-model]").forEach(btn => {
    btn.addEventListener("click", () => {
      const model = modelsCache.find(m => m.id === btn.dataset.editModel);
      openModelModal(model);
    });
  });

  document.querySelectorAll("[data-del-model]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("ยืนยันการลบโมเดลนี้?")) {
        await remove("models", btn.dataset.delModel);
      }
    });
  });
}

/* ---------- Event Modal ---------- */
function openEventModal(event = null) {
  $("eventModal").classList.remove("hidden");
  populateModelDropdown();

  if (event) {
    editingEvent = event;
    $("eventModalTitle").textContent = "Edit Event";
    $("eventName").value = event.eventName || "";
    $("eventModel").value = event.model || "";
    $("eventLocation").value = event.location || "";
    $("eventMap").value = event.mapLink || "";
    $("eventStart").value = event.startDate || "";
    $("eventEnd").value = event.endDate || "";
    $("eventInstallDate").value = event.installDate || "";
    $("eventInstallTime").value = event.installTime || "";
    $("eventOpenTime").value = event.openTime || "";
    $("eventCloseTime").value = event.closeTime || "";
    $("eventStaff").value = event.staff || "";
    $("eventPrice").value = event.price || "";
    $("eventTransport").value = event.transportFee || "";
    $("eventPaidDeposit").checked = !!event.paidDeposit;
    $("eventPaidFull").checked = !!event.paidFull;
    $("eventNote").value = event.note || "";
  } else {
    editingEvent = null;
    $("eventModalTitle").textContent = "Add Event";
    $("eventName").value = "";
    $("eventModel").value = "";
    $("eventLocation").value = "";
    $("eventMap").value = "";
    $("eventStart").value = "";
    $("eventEnd").value = "";
    $("eventInstallDate").value = "";
    $("eventInstallTime").value = "";
    $("eventOpenTime").value = "";
    $("eventCloseTime").value = "";
    $("eventStaff").value = "";
    $("eventPrice").value = "";
    $("eventTransport").value = "";
    $("eventPaidDeposit").checked = false;
    $("eventPaidFull").checked = false;
    $("eventNote").value = "";
  }
}
function closeEventModal() { $("eventModal").classList.add("hidden"); }

$("addEventBtn").addEventListener("click", () => openEventModal());
$("cancelEvent").addEventListener("click", closeEventModal);
$("saveEvent").addEventListener("click", async () => {
  let data = {
    eventName: $("eventName").value,
    model: $("eventModel").value,
    location: $("eventLocation").value,
    mapLink: $("eventMap").value,
    startDate: $("eventStart").value,
    endDate: $("eventEnd").value,
    installDate: $("eventInstallDate").value,
    installTime: $("eventInstallTime").value,
    openTime: $("eventOpenTime").value,
    closeTime: $("eventCloseTime").value,
    staff: $("eventStaff").value,
    price: $("eventPrice").value,
    transportFee: $("eventTransport").value,
    paidDeposit: $("eventPaidDeposit").checked,
    paidFull: $("eventPaidFull").checked,
    note: $("eventNote").value,
  };

  // ✅ ใส่ id เฉพาะตอนแก้ไข
  if (editingEvent) {
    data.id = editingEvent.id;
  }

  try {
    console.log("Saving event:", data);
    await upsert("events", data);
    closeEventModal();
  } catch (err) {
    console.error("❌ Error saving event:", err);
    alert("บันทึกงานไม่สำเร็จ: " + err.message);
  }
});

/* ---------- Model Modal ---------- */
function openModelModal(model = null) {
  $("modelModal").classList.remove("hidden");
  if (model) {
    editingModel = model;
    $("modelModalTitle").textContent = "Edit Model";
    $("modelName").value = model.name || "";
    $("modelSize").value = model.size || "";
    $("modelColorBG").value = model.colorBG || "#6366f1";
    $("modelColorText").value = model.colorText || "#fff";
  } else {
    editingModel = null;
    $("modelModalTitle").textContent = "Add Model";
    $("modelName").value = "";
    $("modelSize").value = "";
    $("modelColorBG").value = "#6366f1";
    $("modelColorText").value = "#ffffff";
  }
}
function closeModelModal() { $("modelModal").classList.add("hidden"); }

$("addModelBtn").addEventListener("click", () => openModelModal());
$("cancelModel").addEventListener("click", closeModelModal);
$("saveModel").addEventListener("click", async () => {
  const data = {
    id: editingModel ? editingModel.id : undefined,
    name: $("modelName").value,
    size: $("modelSize").value,
    colorBG: $("modelColorBG").value,
    colorText: $("modelColorText").value,
  };
  await upsert("models", data);
  closeModelModal();
});

/* ---------- Attach Actions ---------- */
function attachEventActions() {
  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const ev = allEvents.find(e => e.id === btn.dataset.edit);
      openEventModal(ev);
    });
  });
  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("ยืนยันการลบงานนี้?")) {
        await remove("events", btn.dataset.del);
      }
    });
  });
}

/* ---------- Init ---------- */
function init() {
  $("prevMonth").addEventListener("click", () => {
    currentMonth = currentMonth.subtract(1, "month");
    renderCalendar(allEvents, modelsCache);
    renderEvents(allEvents, modelsCache);
    renderStats(allEvents);
  });
  $("nextMonth").addEventListener("click", () => {
    currentMonth = currentMonth.add(1, "month");
    renderCalendar(allEvents, modelsCache);
    renderEvents(allEvents, modelsCache);
    renderStats(allEvents);
  });

  watch("models", (models) => {
    modelsCache = models;
    renderCalendar(allEvents, modelsCache);
    renderEvents(allEvents, modelsCache);
    renderModels(modelsCache);
    populateModelDropdown(); // 🔑 update dropdown ทันที
  });

  watch("events", (events) => {
    allEvents = events;
    renderCalendar(allEvents, modelsCache);
    renderEvents(allEvents, modelsCache);
    renderStats(allEvents);
  });
}

init();
