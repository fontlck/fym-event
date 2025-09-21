import { watch, list, upsert, remove } from './api.js';

let modelsCache = [];
let currentMonth = dayjs();
let allEvents = [];

const $ = (id) => document.getElementById(id);

function renderCalendar(events, models) {
  const calendar = $("calendar");
  calendar.innerHTML = "";
  const startOfMonth = currentMonth.startOf("month").startOf("week");
  const endOfMonth = currentMonth.endOf("month").endOf("week");
  let date = startOfMonth;

  let html = `<div class='grid grid-cols-7 gap-2 text-center font-semibold mb-2'>
    <div>อา</div><div>จ</div><div>อ</div><div>พ</div><div>พฤ</div><div>ศ</div><div>ส</div>
  </div><div class='grid grid-cols-7 gap-2'>`;

  while (date.isBefore(endOfMonth)) {
    const dayEvents = events.filter(ev => {
      const start = dayjs(ev.startDate);
      const end = ev.endDate ? dayjs(ev.endDate) : start;
      return date.isBetween(start, end, 'day', '[]');
    });

    html += `<div class='bg-neutral-800 rounded-lg min-h-[80px] p-1 text-sm'>
      <div class='text-neutral-400 text-xs'>${date.date()}</div>`;

    dayEvents.forEach(ev => {
      const model = models.find(m => m.name === ev.model) || { colorBG: "#6366f1", colorText: "#fff" };
      html += `<div class='truncate px-1 rounded text-xs mb-1' style="background:${model.colorBG}; color:${model.colorText}">
                ${ev.model} ${ev.eventName}</div>`;
    });

    html += "</div>";
    date = date.add(1, "day");
  }
  html += "</div>";
  calendar.innerHTML = html;
}

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

  const sorted = [...filtered].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  sorted.forEach(ev => {
    const model = models.find(m => m.name === ev.model) || { colorBG: "#6366f1", colorText: "#fff" };
    const card = document.createElement("div");
    card.className = "bg-neutral-900 rounded-2xl shadow-lg p-6 mb-4";
    card.style.borderLeft = `8px solid ${model.colorBG}`;
    card.innerHTML = `
      <div class="flex justify-between">
        <div>
          <span class="px-2 py-0.5 text-xs font-medium rounded-full mb-2 inline-block"
            style="background:${model.colorBG}; color:${model.colorText}">${ev.model || "-"}</span>
          <h3 class="text-xl font-bold">${ev.eventName || "-"}</h3>
          <p class="text-sm text-neutral-400">${ev.location || ""}</p>
          <p class="text-sm text-neutral-400">${ev.startDate || ""}${ev.endDate ? " – " + ev.endDate : ""}</p>
          <p class="text-sm text-neutral-400">Staff: ${ev.staff || "-"}</p>
          <p class="text-sm text-neutral-400">Note: ${ev.note || "-"}</p>
        </div>
        <div class="flex flex-col gap-2 items-end">
          <button data-edit="${ev.id}" class="px-3 py-1 w-20 rounded-lg bg-indigo-500 text-white">แก้ไข</button>
          <button data-del="${ev.id}" class="px-3 py-1 w-20 rounded-lg bg-rose-600 text-white">ลบ</button>
        </div>
      </div>`;
    container.appendChild(card);
  });

  container.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => openEventModal(btn.dataset.edit)));
  container.querySelectorAll("[data-del]").forEach(btn => btn.addEventListener("click", async () => {
    if (confirm("ยืนยันการลบงานนี้?")) await remove("events", btn.dataset.del);
  }));
}

function fillModelSelect() {
  const sel = document.querySelector("#eventForm select[name='model']");
  sel.innerHTML = "";
  modelsCache.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.name;
    opt.textContent = m.name;
    sel.appendChild(opt);
  });
}

function openEventModal(id) {
  const modal = $("eventModal");
  const form = $("eventForm");
  form.reset();
  form.id.value = id || "";
  fillModelSelect();
  if (id) {
    const ev = allEvents.find(e => e.id === id);
    if (ev) Object.entries(ev).forEach(([k, v]) => { if (form[k]) form[k].value = v; });
  }
  modal.classList.remove("hidden");
}
function closeEventModal() { $("eventModal").classList.add("hidden"); }
function openModelModal() { $("modelModal").classList.remove("hidden"); }
function closeModelModal() { $("modelModal").classList.add("hidden"); }

function renderStats(events) {
  const now = dayjs();
  $("totalThisYear").textContent = events.filter(ev => dayjs(ev.startDate).isSame(now, "year")).length;
  $("pastEvents").textContent = events.filter(ev => dayjs(ev.endDate || ev.startDate).isBefore(now)).length;
  $("upcomingEvents").textContent = events.filter(ev => dayjs(ev.startDate).isAfter(now)).length;
}

function init() {
  $("addEventBtn").addEventListener("click", () => openEventModal());
  $("addModelBtn").addEventListener("click", () => openModelModal());
  $("closeEventModal").addEventListener("click", closeEventModal);
  $("closeModelModal").addEventListener("click", closeModelModal);

  $("eventForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());
    data.paidDeposit = form.paidDeposit.checked;
    data.paidFull = form.paidFull.checked;
    await upsert("events", data);
    closeEventModal();
  });

  $("modelForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    await upsert("models", data);
    closeModelModal();
  });

  watch("models", (models) => { modelsCache = models; renderCalendar(allEvents, models); renderEvents(allEvents, models); });
  watch("events", (events) => { allEvents = events; renderCalendar(events, modelsCache); renderEvents(events, modelsCache); renderStats(events); });
}
init();
