import { watch, list, remove } from './api.js';

let modelsCache = [];

// ---- Render Cards (sorted latest first, badge + border by model color)
function renderEvents(events, models) {
  const container = document.getElementById("eventsList");
  if (!container) return;
  container.innerHTML = "";

  if (!events.length) {
    container.innerHTML = `<p class="text-neutral-400">ไม่มีงานในระบบ</p>`;
    return;
  }

  const sorted = [...events].sort((a, b) => {
    const da = new Date(a.startDate || "1970-01-01");
    const db = new Date(b.startDate || "1970-01-01");
    return db - da; // ใหม่ -> เก่า
  });

  sorted.forEach(ev => {
    const model = models.find(m => m.name === ev.model) || { colorBG: "#6366f1", colorText: "#fff" };

    const card = document.createElement("div");
    card.className = "bg-neutral-900 rounded-2xl shadow-lg p-6 mb-6";
    card.style.borderLeft = `8px solid ${model.colorBG}`;

    card.innerHTML = `
      <div class="flex items-start justify-between mb-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 text-xs font-medium rounded-full"
              style="background:${model.colorBG};color:${model.colorText}">
              ${ev.model || "-"}
            </span>
          </div>
          <h3 class="text-2xl font-bold text-white">${ev.eventName || "-"}</h3>
        </div>
        <div class="flex gap-2">
          <button onclick="editEvent('${ev.id}')" class="px-5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium">แก้ไข</button>
          <button onclick="deleteEvent('${ev.id}')" class="px-5 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black font-medium">ลบ</button>
        </div>
      </div>
      <div class="grid sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
        <div>
          <span class="text-neutral-400 block">วันที่</span>
          <span class="font-medium">${ev.startDate || "-"} – ${ev.endDate || ev.startDate || "-"}</span>
        </div>
        <div>
          <span class="text-neutral-400 block">สถานที่</span>
          <span class="font-medium">${ev.location || "-"}</span>
        </div>
        <div>
          <span class="text-neutral-400 block">เวลาเปิด-ปิด</span>
          <span class="font-medium">${ev.openTime || "-"} - ${ev.closeTime || "-"}</span>
        </div>
        <div>
          <span class="text-neutral-400 block">วันที่ติดตั้ง</span>
          <span class="font-medium">${ev.installDate || "-"}</span>
        </div>
        <div>
          <span class="text-neutral-400 block">เวลาติดตั้ง</span>
          <span class="font-medium">${ev.installTime || "-"}</span>
        </div>
        <div>
          <span class="text-neutral-400 block">Staff</span>
          <span class="font-medium">${ev.staff || "-"}</span>
        </div>
        <div>
          <span class="text-neutral-400 block">ราคา</span>
          <span class="font-medium">${ev.price || "-"}</span>
        </div>
        <div>
          <span class="text-neutral-400 block">ค่าขนส่ง</span>
          <span class="font-medium">${ev.transportFee || "-"}</span>
        </div>
        <div>
          <span class="text-neutral-400 block">สถานะ</span>
          <span class="font-medium">
            ${ev.paidFull ? "ชำระครบแล้ว" : ev.paidDeposit ? "มัดจำแล้ว" : "รอชำระ"}
          </span>
        </div>
        <div class="sm:col-span-2">
          <span class="text-neutral-400 block">Note</span>
          <span class="font-medium">${ev.note || "-"}</span>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// ---- Render Calendar (current month) with colored border tags by model
function renderCalendar(events, models) {
  const grid = document.getElementById("calendarGrid");
  const label = document.getElementById("monthLabel");
  if (!grid || !label) return;

  grid.innerHTML = "";

  const today = dayjs();
  label.textContent = today.format("MMMM YYYY");

  const monthStart = today.startOf("month");
  const monthEnd = today.endOf("month");
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

    // events that cover this day
    const dayEvents = events.filter(ev => {
      const s = dayjs(ev.startDate);
      const e = ev.endDate ? dayjs(ev.endDate) : s;
      return (d.isSame(s, "day") || d.isSame(e, "day") || (d.isAfter(s, "day") && d.isBefore(e, "day")));
    });

    dayEvents.forEach(ev => {
      const model = models.find(m => m.name === ev.model) || { colorBG: "#6366f1", colorText: "#fff" };
      const tag = document.createElement("div");
      tag.className = "mt-1 text-[10px] px-1 rounded border";
      tag.style.borderColor = model.colorBG;
      tag.style.color = model.colorText;
      tag.innerHTML = `<div class="font-semibold truncate">${ev.model || "-"}</div><div class="truncate">${ev.eventName || "-"}</div>`;
      cell.appendChild(tag);
    });

    grid.appendChild(cell);
    d = d.add(1, "day");
  }

  // Legend
  const legend = document.getElementById("legend");
  legend.innerHTML = models.map(m => 
    `<span class="text-xs px-2 py-1 rounded-full" style="border:1px solid ${m.colorBG}; color:${m.colorText}">${m.name}</span>`
  ).join(" ");
}

// ---- Global handlers (you can wire to modal later)
window.editEvent = (id) => alert("Edit event: " + id);
window.deleteEvent = async (id) => {
  if (confirm("ยืนยันการลบงานนี้?")) await remove("events", id);
};

// ---- Init realtime
async function init() {
  modelsCache = await list("models");

  // Initial calendar render (empty events first)
  renderCalendar([], modelsCache);

  watch("events", (data) => {
    renderEvents(data, modelsCache);
    renderCalendar(data, modelsCache);
  });

  // Watch models too (for color changes)
  watch("models", (mods) => {
    modelsCache = mods;
    // re-render to reflect color changes
    // we need current events snapshot again, so list once
    list("events").then(evts => {
      renderEvents(evts, modelsCache);
      renderCalendar(evts, modelsCache);
    });
  });
}

init();
