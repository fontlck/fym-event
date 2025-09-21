import { watch, list, upsert, remove } from './api.js';

let modelsCache = [];
let currentMonth = dayjs();
let allEvents = [];

// ---------- UI helpers
const $ = (id) => document.getElementById(id);
const eventModal = $("eventModal");
const modelModal = $("modelModal");
const eventForm = $("eventForm");
const modelForm = $("modelForm");

// ---------- Render Cards (horizontal full width)
function renderEvents(events, models) {
  const container = $("eventsList");
  if (!container) return;
  container.innerHTML = "";

  // filter เฉพาะงานในเดือนที่เลือก
  const filtered = events.filter(ev => {
    const start = dayjs(ev.startDate);
    const end = ev.endDate ? dayjs(ev.endDate) : start;
    return start.isSame(currentMonth, "month") || end.isSame(currentMonth, "month");
  });

  if (!filtered.length) {
    container.innerHTML = `<p class="text-neutral-400">ไม่มีงานในเดือนนี้</p>`;
    return;
  }

  const sorted = [...filtered].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  sorted.forEach(ev => {
    const model = models.find(m => m.name === ev.model) || { colorBG: "#6366f1", colorText: "#fff" };
    const card = document.createElement("div");
    card.className = "bg-neutral-900 rounded-2xl shadow-lg p-6 mb-4 flex flex-col md:flex-row gap-6";
    card.style.borderLeft = `8px solid ${model.colorBG}`;

    card.innerHTML = `
      <div class="flex-1 min-w-0">
        <span class="px-2 py-0.5 text-xs font-medium rounded-full mb-2 inline-block"
          style="background:${model.colorBG}; color:${model.colorText}">${ev.model || "-"}</span>

        <h3 class="text-2xl font-bold text-white mb-1">${ev.eventName || "-"}</h3>
        <p class="text-sm text-neutral-400 mb-4">${ev.startDate || ""}${ev.endDate ? " – " + ev.endDate : ""}</p>

        <div class="grid sm:grid-cols-3 gap-4 text-sm">
          <div><span class="text-neutral-400 block">สถานที่</span>${ev.location || "-"}</div>
          <div><span class="text-neutral-400 block">วันที่ติดตั้ง</span>${ev.installDate || "-"} ${ev.installTime || ""}</div>
          <div><span class="text-neutral-400 block">เวลาเปิด-ปิด</span>${ev.openTime || "-"} - ${ev.closeTime || "-"}</div>
          <div><span class="text-neutral-400 block">Staff</span>${ev.staff || "-"}</div>
          <div><span class="text-neutral-400 block">ราคา</span>${ev.price || "-"}</div>
          <div><span class="text-neutral-400 block">ค่าขนส่ง</span>${ev.transportFee || "-"}</div>
          <div class="sm:col-span-3"><span class="text-neutral-400 block">Note</span>${ev.note || "-"}</div>
        </div>
      </div>

      <div class="flex flex-row md:flex-col gap-2 items-start md:items-end">
        <button data-edit="${ev.id}" class="px-5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium">แก้ไข</button>
        <button data-del="${ev.id}" class="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium">ลบ</button>
      </div>
    `;

    container.appendChild(card);
  });

  // bind buttons
  container.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openEventModal(btn.dataset.edit));
  });
  container.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("ยืนยันการลบงานนี้?")) await remove("events", btn.dataset.del);
    });
  });
}

// ---------- Render Calendar
function renderCalendar(events, models) {
  const grid = $("calendarGrid");
  const label = $("monthLabel");
  if (!grid || !label) return;

  grid.innerHTML = "";
  label.textContent = currentMonth.format("MMMM YYYY");

  const monthStart = currentMonth.startOf("month");
  const monthEnd = currentMonth.endOf("month");
  const start = monthStart.startOf("week");
  const end = monthEnd.endOf("week");

  let d = start.clone();
  while (d.isBefore(end) || d.isSame(end, "day")) {
    const cell = document.createElement("div");
    cell.className = "min-h-[90px] p-2 border border-neutral-800 rounded relative";

    const dayNum = document.createElement("div");
    dayNum.className = "text-xs text-neutral-400";
    dayNum.textContent = d.date();
    cell.appendChild(dayNum);

    const dayEvents = events.filter(ev => {
      const s = dayjs(ev.startDate);
      const e = ev.endDate ? dayjs(ev.endDate) : s;
      return d.isSame(s, "day") || d.isSame(e, "day") || (d.isAfter(s, "day") && d.isBefore(e, "day"));
    });

    dayEvents.forEach(ev => {
      const model = models.find(m => m.name === ev.model) || { colorBG: "#6366f1", colorText: "#fff" };
      const tag = document.createElement("div");
      tag.className = "mt-1 text-[10px] px-1 rounded";
      tag.style.backgroundColor = model.colorBG;
      tag.style.color = model.colorText;
      tag.innerHTML = `<div class="font-semibold truncate">${ev.model || "-"}</div><div class="truncate">${ev.eventName || "-"}</div>`;
      cell.appendChild(tag);
    });

    grid.appendChild(cell);
    d = d.add(1, "day");
  }

  // Legend
  const legend = $("legend");
  legend.innerHTML = models.map(m => 
    `<span class="text-xs px-2 py-1 rounded-full" style="background:${m.colorBG}; color:${m.colorText}">${m.name}</span>`
  ).join(" ");
}

// ---------- Stats
function renderStats(events) {
  const now = dayjs();
  const year = now.year();
  const total = events.filter(ev => dayjs(ev.startDate).year() === year).length;
  const past = events.filter(ev => dayjs(ev.endDate || ev.startDate).isBefore(now, "day")).length;
  const upcoming = events.filter(ev => dayjs(ev.startDate).isAfter(now.subtract(1, "day"), "day")).length;

  $("statTotal").textContent = total;
  $("statPast").textContent = past;
  $("statUpcoming").textContent = upcoming;
}

// ---------- Modal: Event
function openEventModal(id = null) {
  // reset
  eventForm.reset();
  eventForm.id.value = "";

  // fill model dropdown
  const sel = $("eventModelSelect");
  sel.innerHTML = modelsCache.map(m => `<option value="${m.name}">${m.name}</option>`).join("");

  if (id) {
    const ev = allEvents.find(x => x.id === id);
    if (ev) {
      Object.keys(ev).forEach(k => {
        if (eventForm[k] !== undefined) {
          if (eventForm[k].type === "checkbox") {
            eventForm[k].checked = !!ev[k];
          } else {
            eventForm[k].value = ev[k];
          }
        }
      });
    }
  }

  eventModal.classList.remove("hidden");
}
function closeEventModal() { eventModal.classList.add("hidden"); }
$("addEventBtn").addEventListener("click", () => openEventModal());
$("closeEventModal").addEventListener("click", closeEventModal);
$("cancelEvent").addEventListener("click", closeEventModal);

eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(eventForm).entries());
  // convert checkbox
  data.paidDeposit = !!eventForm.paidDeposit.checked;
  data.paidFull = !!eventForm.paidFull.checked;
  await upsert("events", data);
  closeEventModal();
});

// ---------- Modal: Model
function openModelModal(id = null) {
  modelForm.reset();
  modelForm.id.value = "";

  if (id) {
    const m = modelsCache.find(x => x.id === id);
    if (m) {
      Object.keys(m).forEach(k => {
        if (modelForm[k] !== undefined) modelForm[k].value = m[k];
      });
    }
  }

  modelModal.classList.remove("hidden");
}
function closeModelModal() { modelModal.classList.add("hidden"); }
$("addModelBtn").addEventListener("click", () => openModelModal());
$("closeModelModal").addEventListener("click", closeModelModal);
$("cancelModel").addEventListener("click", closeModelModal);

modelForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(modelForm).entries());
  await upsert("models", data);
  closeModelModal();
});

// ---------- Month Controls
$("prevMonth").addEventListener("click", () => {
  currentMonth = currentMonth.subtract(1, "month");
  renderCalendar(allEvents, modelsCache);
  renderEvents(allEvents, modelsCache);
});
$("nextMonth").addEventListener("click", () => {
  currentMonth = currentMonth.add(1, "month");
  renderCalendar(allEvents, modelsCache);
  renderEvents(allEvents, modelsCache);
});

// ---------- Init realtime
async function init() {
  modelsCache = await list("models");
  renderCalendar([], modelsCache);
  renderStats([]);

  watch("events", (data) => {
    allEvents = data;
    renderCalendar(allEvents, modelsCache);
    renderEvents(allEvents, modelsCache);
    renderStats(allEvents);
  });

  watch("models", (mods) => {
    modelsCache = mods;
    renderCalendar(allEvents, modelsCache);
    renderEvents(allEvents, modelsCache);
  });
}
init();
