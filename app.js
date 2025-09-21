// app.js
import { watch, list, upsert, remove } from './api.js';

let modelsCache = [];
let currentMonth = dayjs();
let allEvents = [];

const $ = (id) => document.getElementById(id);

function renderCalendar(events, models) {
  const cal = $("calendar");
  cal.innerHTML = "";

  // ชื่อเดือน + ปี
  const monthHeader = document.createElement("div");
  monthHeader.className = "text-center text-xl font-bold text-white mb-4";
  monthHeader.textContent = currentMonth.format("MMMM YYYY");
  cal.appendChild(monthHeader);

  const grid = document.createElement("div");
  grid.className = "grid grid-cols-7 gap-2";
  cal.appendChild(grid);

  const start = currentMonth.startOf("month").startOf("week");
  const end = currentMonth.endOf("month").endOf("week");

  let day = start.clone();
  while (day.isBefore(end, "day")) {
    const cell = document.createElement("div");
    cell.className = "min-h-[100px] bg-neutral-800 rounded p-1 text-xs text-white";

    const dayLabel = document.createElement("div");
    dayLabel.className = "text-right text-neutral-400 mb-1";
    dayLabel.textContent = day.date();
    cell.appendChild(dayLabel);

    // event ของวันนี้
    const todays = events.filter(ev => {
      const s = dayjs(ev.startDate);
      const e = ev.endDate ? dayjs(ev.endDate) : s;
      return day.isBetween(s, e, "day", "[]");
    });

    todays.forEach(ev => {
      const model = models.find(m => m.name === ev.model) || { colorBG: "#6366f1", colorText: "#fff" };
      const tag = document.createElement("div");
      tag.className = "rounded px-1 mb-1 text-xs";
      tag.style.background = model.colorBG;
      tag.style.color = model.colorText;
      tag.innerHTML = `<div>${ev.model || "-"}</div><div>${ev.eventName || "-"}</div>`;
      cell.appendChild(tag);
    });

    grid.appendChild(cell);
    day = day.add(1, "day");
  }
}

function renderEvents(events, models) {
  const container = $("eventsList");
  const header = $("eventsHeader");
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

  sorted.forEach(ev => {
    const model = models.find(m => m.name === ev.model) || { colorBG: "#6366f1", colorText: "#fff" };
    const card = document.createElement("div");
    card.className = "bg-neutral-900 rounded-2xl shadow-lg p-6 mb-4";

    card.innerHTML = `
      <div class="mb-2">
        <span class="px-2 py-0.5 text-xs font-medium rounded" 
          style="background:${model.colorBG};color:${model.colorText}">
          ${ev.model || "-"}
        </span>
      </div>
      <h3 class="text-xl font-bold text-white">${ev.eventName || "-"}</h3>
      <p class="text-neutral-300">${ev.location || ""}</p>
      <p class="text-neutral-400 text-sm">${ev.startDate}${ev.endDate ? " – " + ev.endDate : ""}</p>
      <p class="text-neutral-400 text-sm">Staff: ${ev.staff || "-"}</p>
      <p class="text-neutral-400 text-sm">Note: ${ev.note || "-"}</p>
      <div class="flex gap-2 mt-4">
        <button data-edit="${ev.id}" class="w-24 px-4 py-2 rounded bg-indigo-500 text-white">แก้ไข</button>
        <button data-del="${ev.id}" class="w-24 px-4 py-2 rounded bg-rose-600 text-white">ลบ</button>
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

function renderStats(events) {
  const now = dayjs();
  const thisYear = events.filter(ev => dayjs(ev.startDate).isSame(now, "year"));
  const past = events.filter(ev => dayjs(ev.endDate || ev.startDate).isBefore(now, "day"));
  const upcoming = events.filter(ev => dayjs(ev.startDate).isAfter(now, "day"));

  $("statTotal").textContent = thisYear.length;
  $("statPast").textContent = past.length;
  $("statUpcoming").textContent = upcoming.length;
}

function render(events, models) {
  renderCalendar(events, models);
  renderStats(events);
  renderEvents(events, models);
}

function init() {
  watch("events", async (evs) => {
    allEvents = evs;
    render(allEvents, modelsCache);
  });

  watch("models", (mds) => {
    modelsCache = mds;
    render(allEvents, modelsCache);
  });

  // ปุ่มเปลี่ยนเดือน
  $("prevMonth").addEventListener("click", () => {
    currentMonth = currentMonth.subtract(1, "month");
    render(allEvents, modelsCache);
  });
  $("nextMonth").addEventListener("click", () => {
    currentMonth = currentMonth.add(1, "month");
    render(allEvents, modelsCache);
  });
}

init();
