// app.js
import { watch, list, upsert, remove } from './api.js';

let modelsCache = [];
let currentMonth = dayjs();
let allEvents = [];

const $ = (id) => document.getElementById(id);

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

  const sorted = [...filtered].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  sorted.forEach(ev => {
    const model = models.find(m => m.name === ev.model) || { colorBG: "#6366f1", colorText: "#fff" };
    const card = document.createElement("div");
    card.className = "bg-neutral-900 rounded-2xl shadow-lg p-6 flex flex-col md:flex-row justify-between items-center gap-6";
    card.style.borderLeft = `8px solid ${model.colorBG}`;

    card.innerHTML = `
      <div class="flex-1 min-w-0">
        <span class="px-2 py-0.5 text-xs font-medium rounded-full mb-2 inline-block"
          style="background:${model.colorBG}; color:${model.colorText}">${ev.model || "-"}</span>
        <h3 class="text-2xl font-bold text-white mb-1">${ev.eventName || "-"}</h3>
        <p class="text-sm text-neutral-400 mb-4">${ev.startDate || ""}${ev.endDate ? " – " + ev.endDate : ""}</p>
      </div>
      <div class="flex gap-2">
        <button data-edit="${ev.id}" class="w-24 text-center px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium">แก้ไข</button>
        <button data-del="${ev.id}" class="w-24 text-center px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium">ลบ</button>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => alert("TODO: แก้ไขงาน id=" + btn.dataset.edit));
  });
  container.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("ยืนยันการลบงานนี้?")) await remove("events", btn.dataset.del);
    });
  });
}

function renderStats(events) {
  const now = dayjs();
  $("statTotal").textContent = events.length;
  $("statPast").textContent = events.filter(e => dayjs(e.endDate || e.startDate).isBefore(now, "day")).length;
  $("statUpcoming").textContent = events.filter(e => dayjs(e.startDate).isAfter(now, "day")).length;
}

function init() {
  watch("models", data => {
    modelsCache = data;
    renderEvents(allEvents, modelsCache);
  });
  watch("events", data => {
    allEvents = data;
    renderEvents(allEvents, modelsCache);
    renderStats(allEvents);
  });
}
init();
