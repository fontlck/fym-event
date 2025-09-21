// app.js
import { watch, upsert, remove, list } from './api.js';

let modelsCache = [];
let currentMonth = dayjs();
let allEvents = [];

const $ = (id) => document.getElementById(id);
const eventForm = $("eventForm");
const modelForm = $("modelForm");
const eventModal = $("eventModal");
const modelModal = $("modelModal");

// ===== Render Events =====
function renderEvents(events, models) {
  const container = $("eventsList");
  const header = $("eventsHeader");
  if (!container) return;
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

  // sort ascending by date
  const sorted = [...filtered].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  sorted.forEach(ev => {
    const model = models.find(m => m.name === ev.model) || { colorBG: "#6366f1", colorText: "#fff" };
    const card = document.createElement("div");
    card.className = "bg-neutral-900 rounded-2xl shadow-lg p-6 mb-4 flex justify-between items-center";
    card.style.borderLeft = `8px solid ${model.colorBG}`;

    card.innerHTML = `
      <div class="flex-1 min-w-0">
        <span class="px-2 py-0.5 text-xs font-medium rounded-full mb-2 inline-block"
          style="background:${model.colorBG}; color:${model.colorText}">${ev.model || "-"}</span>
        <h3 class="text-xl font-bold text-white mb-1">${ev.eventName || "-"}</h3>
        <p class="text-sm text-neutral-400">${ev.startDate || ""}${ev.endDate ? " – " + ev.endDate : ""}</p>
      </div>
      <div class="flex gap-2">
        <button data-edit="${ev.id}" class="w-20 text-center px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium">แก้ไข</button>
        <button data-del="${ev.id}" class="w-20 text-center px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium">ลบ</button>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openEventModal(btn.dataset.edit));
  });
  container.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("ยืนยันการลบงานนี้?")) await remove("events", btn.dataset.del);
    });
  });
}

// ===== Render Calendar =====
function renderCalendar(events, models) {
  const cal = $("calendar");
  if (!cal) return;

  cal.innerHTML = "";

  const startOfMonth = currentMonth.startOf("month");
  const endOfMonth = currentMonth.endOf("month");
  const startDay = startOfMonth.day();
  const daysInMonth = currentMonth.daysInMonth();

  // เติมช่องว่างก่อนวันแรกของเดือน
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement("div");
    cal.appendChild(empty);
  }

  // วนวันของเดือน
  for (let d = 1; d <= daysInMonth; d++) {
    const date = currentMonth.date(d);
    const cell = document.createElement("div");
    cell.className =
      "h-24 border border-neutral-700 p-1 relative text-sm rounded-md";

    const label = document.createElement("div");
    label.className = "text-neutral-400 text-xs mb-1";
    label.textContent = d;
    cell.appendChild(label);

    const todaysEvents = events.filter(ev => {
      const start = dayjs(ev.startDate);
      const end = ev.endDate ? dayjs(ev.endDate) : start;
      return date.isBetween(start, end, "day", "[]");
    });

    todaysEvents.forEach(ev => {
      const model = models.find(m => m.name === ev.model) || {
        colorBG: "#6366f1",
        colorText: "#fff"
      };

      const tag = document.createElement("div");
      tag.className = "truncate text-xs rounded px-1 mb-1";
      tag.style.background = model.colorBG;
      tag.style.color = model.colorText;
      tag.textContent = ev.eventName;
      cell.appendChild(tag);
    });

    cal.appendChild(cell);
  }
}

// ===== Render Stats =====
function renderStats(events) {
  const now = dayjs();
  const year = now.year();

  const total = events.filter(ev => dayjs(ev.startDate).year() === year).length;
  const past = events.filter(ev => dayjs(ev.endDate || ev.startDate).isBefore(now, "day")).length;
  const upcoming = events.filter(ev => dayjs(ev.startDate).isAfter(now, "day")).length;

  $("totalEvents").textContent = total;
  $("pastEvents").textContent = past;
  $("upcomingEvents").textContent = upcoming;
}

// ===== Modal Helpers =====
function openEventModal(id) {
  eventModal.classList.remove("hidden");
  if (id) {
    const ev = allEvents.find(e => e.id === id);
    if (ev) {
      Object.keys(ev).forEach(k => {
        if ($(k)) $(k).value = ev[k];
      });
      $("id").value = ev.id;
    }
  } else {
    eventForm.reset();
    $("id").value = "";
  }
}

function openModelModal(id) {
  modelModal.classList.remove("hidden");
}

function closeModals() {
  eventModal.classList.add("hidden");
  modelModal.classList.add("hidden");
}

// ===== Init =====
async function init() {
  modelsCache = await list("models");

  watch("events", async (events) => {
    allEvents = events;
    renderCalendar(allEvents, modelsCache);
    renderEvents(allEvents, modelsCache);
    renderStats(allEvents);
  });

  $("addEventBtn").onclick = () => openEventModal();
  $("addModelBtn").onclick = () => openModelModal();

  $("closeEvent").onclick = closeModals;
  $("closeModel").onclick = closeModals;

  eventForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(eventForm).entries());
    await upsert("events", data);
    closeModals();
  };

  modelForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(modelForm).entries());
    await upsert("models", data);
    closeModals();
  };
}

init();
