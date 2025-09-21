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

  // sort ascending by date
  const sorted = [...filtered].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  sorted.forEach(ev => {
    const model = models.find(m => m.name === ev.model) || { colorBG: "#6366f1", colorText: "#fff" };
    const card = document.createElement("div");
    card.className = "bg-neutral-900 rounded-2xl shadow-lg p-6 flex justify-between items-center";
    card.style.borderLeft = `8px solid ${model.colorBG}`;

    card.innerHTML = `
      <div>
        <span class="px-2 py-0.5 text-xs font-medium rounded-full mb-2 inline-block"
          style="background:${model.colorBG}; color:${model.colorText}">${ev.model || "-"}</span>
        <h3 class="text-2xl font-bold text-white mb-1">${ev.eventName || "-"}</h3>
        <p class="text-sm text-neutral-400 mb-2">${ev.location || "-"}</p>
        <p class="text-sm text-neutral-400">${ev.startDate || ""}${ev.endDate ? " – " + ev.endDate : ""}</p>
      </div>
      <div class="flex gap-2">
        <button data-edit="${ev.id}" class="w-24 text-center px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium">แก้ไข</button>
        <button data-del="${ev.id}" class="w-24 text-center px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium">ลบ</button>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => alert("TODO: edit event " + btn.dataset.edit));
  });
  container.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("ยืนยันการลบงานนี้?")) await remove("events", btn.dataset.del);
    });
  });
}

function renderStats(events) {
  const year = dayjs().year();
  const yearEvents = events.filter(ev => dayjs(ev.startDate).year() === year);
  const past = events.filter(ev => dayjs(ev.endDate || ev.startDate).isBefore(dayjs(), "day"));
  const upcoming = events.filter(ev => dayjs(ev.startDate).isAfter(dayjs(), "day"));

  $("statYear").textContent = yearEvents.length;
  $("statPast").textContent = past.length;
  $("statUpcoming").textContent = upcoming.length;
}

async function init() {
  modelsCache = await list("models");
  watch("events", (data) => {
    allEvents = data;
    renderEvents(allEvents, modelsCache);
    renderStats(allEvents);
  });
}

init();
