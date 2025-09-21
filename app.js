import { list, watch, upsert, remove } from "./api.js";

let modelsCache = [];
let allEvents = [];
let currentMonth = dayjs();

// ===== Helper =====
const $ = (id) => document.getElementById(id);
function openModal(id) {
  $(id).classList.remove("hidden");
}
function closeModal(id) {
  $(id).classList.add("hidden");
}

// ===== Render Calendar =====
function renderCalendar(events, models) {
  const cal = $("calendar");
  if (!cal) return;

  const startOfMonth = currentMonth.startOf("month").startOf("week");
  const endOfMonth = currentMonth.endOf("month").endOf("week");

  let html = `<div class="grid grid-cols-7 gap-2 text-center">`;
  const days = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  days.forEach((d) => (html += `<div class="font-bold">${d}</div>`));

  let date = startOfMonth;
  while (date.isBefore(endOfMonth)) {
    const inMonth = date.month() === currentMonth.month();
    const dayEvents = events.filter((ev) => {
      const start = dayjs(ev.startDate);
      const end = ev.endDate ? dayjs(ev.endDate) : start;
      return date.isBetween(start, end, "day", "[]");
    });

    html += `<div class="h-20 p-1 rounded ${
      inMonth ? "bg-neutral-800" : "bg-neutral-900 text-neutral-600"
    }">`;
    html += `<div class="text-sm">${date.date()}</div>`;
    dayEvents.forEach((ev) => {
      const model = models.find((m) => m.name === ev.model) || {
        colorBG: "#6366f1",
        colorText: "#fff",
      };
      html += `<span class="block text-xs px-1 rounded mt-0.5" style="background:${model.colorBG}; color:${model.colorText}">${ev.eventName}</span>`;
    });
    html += `</div>`;
    date = date.add(1, "day");
  }
  html += `</div>`;

  cal.innerHTML = html;
}

// ===== Render Stats =====
function renderStats(events) {
  const thisYear = dayjs().year();
  const countYear = events.filter((e) =>
    dayjs(e.startDate).isSame(thisYear, "year")
  ).length;
  const past = events.filter((e) => dayjs(e.endDate || e.startDate).isBefore(dayjs())).length;
  const upcoming = events.length - past;

  $("statsThisYear").textContent = countYear;
  $("statsPast").textContent = past;
  $("statsUpcoming").textContent = upcoming;
}

// ===== Render Events Card =====
function renderEvents(events, models) {
  const container = $("eventsList");
  const header = $("eventsHeader");
  if (!container) return;
  container.innerHTML = "";

  const filtered = events.filter((ev) => {
    const start = dayjs(ev.startDate);
    const end = ev.endDate ? dayjs(ev.endDate) : start;
    return start.isSame(currentMonth, "month") || end.isSame(currentMonth, "month");
  });

  header.textContent = `งานในเดือน ${currentMonth.format("MMMM YYYY")} (${filtered.length} งาน)`;

  if (!filtered.length) {
    container.innerHTML = `<p class="text-neutral-400">ไม่มีงานในเดือนนี้</p>`;
    return;
  }

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate)
  );

  sorted.forEach((ev) => {
    const model = models.find((m) => m.name === ev.model) || {
      colorBG: "#6366f1",
      colorText: "#fff",
    };
    const card = document.createElement("div");
    card.className =
      "bg-neutral-900 rounded-2xl shadow p-4 flex justify-between items-center border-l-8 mb-3";
    card.style.borderLeftColor = model.colorBG;

    card.innerHTML = `
      <div>
        <span class="px-2 py-0.5 text-xs font-medium rounded-full mb-2 inline-block"
          style="background:${model.colorBG}; color:${model.colorText}">
          ${ev.model || "-"}
        </span>
        <h3 class="text-xl font-bold">${ev.eventName || "-"}</h3>
        <p class="text-sm text-neutral-400">
          ${ev.startDate}${ev.endDate ? " – " + ev.endDate : ""}
        </p>
      </div>
      <div class="flex space-x-2">
        <button data-edit="${ev.id}" class="w-20 px-3 py-2 rounded bg-indigo-500 hover:bg-indigo-400 text-white">แก้ไข</button>
        <button data-del="${ev.id}" class="w-20 px-3 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white">ลบ</button>
      </div>
    `;
    container.appendChild(card);
  });

  // bind events
  container.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openModal("eventModal"));
  });
  container.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("ยืนยันการลบงานนี้?")) await remove("events", btn.dataset.del);
    });
  });
}

// ===== Init =====
async function init() {
  modelsCache = await list("models");

  watch("events", (data) => {
    allEvents = data;
    renderCalendar(allEvents, modelsCache);
    renderStats(allEvents);
    renderEvents(allEvents, modelsCache);
  });

  $("addEventBtn").onclick = () => openModal("eventModal");
  $("addModelBtn").onclick = () => openModal("modelModal");
}

init();
