import { watch, upsert, remove } from './api.js';

let modelsCache = [];
let allEvents = [];
let currentMonth = dayjs();
let editingEvent = null;
let editingModel = null;

const $ = (id) => document.getElementById(id);

// helper สำหรับ normalize ชื่อ
function normalizeName(name) {
  return (name || "").trim().replace(/\s+/g, " ").toLowerCase();
}

// helper แปลง array -> map
function buildModelMap(models) {
  return new Map(models.map(m => [normalizeName(m.name), m]));
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
    card.className = "bg-neutral-900 rounded-2xl shadow-lg p-6 flex justify-between items-center mb-4";
    card.style.borderLeft = `8px solid ${modelColors.colorBG}`;

    card.innerHTML = `
      <div>
        <span class="px-2 py-0.5 text-xs font-medium rounded-full mb-2 inline-block"
          style="background:${modelColors.colorBG}; color:${modelColors.colorText}">${ev.model || "-"}</span>
        <h3 class="text-xl font-bold text-white">${ev.eventName || "-"}</h3>
        <p class="text-sm text-neutral-400">${ev.location || ""}</p>
        <p class="text-sm text-neutral-400">${ev.startDate || ""}${ev.endDate ? " – " + ev.endDate : ""}</p>
        <p class="text-sm text-neutral-400">เวลา: ${ev.openTime || "-"} - ${ev.closeTime || "-"}</p>
        <p class="text-sm text-neutral-400">Staff: ${ev.staff || "-"}</p>
        <p class="text-sm text-neutral-400">Note: ${ev.note || "-"}</p>
        <p class="text-sm text-neutral-400">ราคา: ${ev.price || "-"} | ค่าขนส่ง: ${ev.transportFee || "-"}</p>
      </div>
      <div class="flex flex-col gap-2">
        <button data-edit="${ev.id}" class="w-20 text-center px-3 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium">แก้ไข</button>
        <button data-del="${ev.id}" class="w-20 text-center px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium">ลบ</button>
      </div>
    `;
    container.appendChild(card);
  });

  attachEventActions();
}

/* ---------- Event Modal ---------- */
function openEventModal(event = null) {
  $("eventModal").classList.remove("hidden");
  if (event) {
    editingEvent = event;
    $("eventModalTitle").textContent = "Edit Event";
    $("eventName").value = event.eventName || "";
    $("eventModel").value = event.model || "";
    $("eventLocation").value = event.location || "";
    $("eventStart").value = event.startDate || "";
    $("eventEnd").value = event.endDate || "";
    $("eventNote").value = event.note || "";
  } else {
    editingEvent = null;
    $("eventModalTitle").textContent = "Add Event";
    $("eventName").value = "";
    $("eventModel").value = "";
    $("eventLocation").value = "";
    $("eventStart").value = "";
    $("eventEnd").value = "";
    $("eventNote").value = "";
  }
}
function closeEventModal() { $("eventModal").classList.add("hidden"); }

$("addEventBtn").addEventListener("click", () => openEventModal());
$("cancelEvent").addEventListener("click", closeEventModal);
$("saveEvent").addEventListener("click", async () => {
  const data = {
    id: editingEvent ? editingEvent.id : undefined,
    eventName: $("eventName").value,
    model: $("eventModel").value,
    location: $("eventLocation").value,
    startDate: $("eventStart").value,
    endDate: $("eventEnd").value,
    note: $("eventNote").value,
  };
  await upsert("events", data);
  closeEventModal();
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
  });

  watch("events", (events) => {
    allEvents = events;
    renderCalendar(allEvents, modelsCache);
    renderEvents(allEvents, modelsCache);
    renderStats(allEvents);
  });
}

init();
