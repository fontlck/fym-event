import { watch, list, remove } from './api.js';

let modelsCache = [];

function renderEvents(events, models) {
  const container = document.getElementById("eventsList");
  if (!container) return;

  container.innerHTML = "";

  if (events.length === 0) {
    container.innerHTML = `<p class="text-neutral-400">ไม่มีงานในระบบ</p>`;
    return;
  }

  events.forEach(ev => {
    const model = models.find(m => m.name === ev.model) || { colorBG: "#333", colorText: "#fff" };

    const card = document.createElement("div");
    card.className = "bg-neutral-900 rounded-2xl border border-neutral-800 shadow p-6 hover:shadow-indigo-500/20 transition";

    card.innerHTML = `
      <div class="flex justify-between items-start gap-4 mb-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[11px] px-2 py-0.5 rounded-full"
              style="background:${model.colorBG};color:${model.colorText}">${ev.model || '-'}</span>
            <span class="text-xs text-neutral-400 truncate">${dayjs(ev.startDate).format("MMM YYYY")}</span>
          </div>
          <h3 class="text-xl font-bold truncate">${ev.eventName || '-'}</h3>
          <p class="text-sm text-neutral-400">${ev.startDate} – ${ev.endDate || ev.startDate}</p>
        </div>
        <div class="flex gap-2 shrink-0">
          <button onclick="editEvent('${ev.id}')" class="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white">แก้ไข</button>
          <button onclick="deleteEvent('${ev.id}')" class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white">ลบ</button>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-4 text-sm leading-relaxed">
        <div><span class="text-neutral-400">📍 สถานที่:</span> ${ev.location || "-"}</div>
        <div><span class="text-neutral-400">⏰ เวลา:</span> ${(ev.openTime || "")} - ${(ev.closeTime || "")}</div>
        <div><span class="text-neutral-400">🛠 ติดตั้ง:</span> ${(ev.installDate || "-")} ${(ev.installTime || "")}</div>
        <div><span class="text-neutral-400">👤 Staff:</span> ${ev.staff || "-"}</div>
        <div><span class="text-neutral-400">💰 ราคา:</span> ${ev.price || "-"}</div>
        <div><span class="text-neutral-400">🚚 ค่าขนส่ง:</span> ${ev.transportFee || "-"}</div>
        <div><span class="text-neutral-400">📌 สถานะ:</span> 
          ${ev.paidFull ? "ชำระครบแล้ว" : ev.paidDeposit ? "มัดจำแล้ว" : "รอชำระ"}
        </div>
        <div class="sm:col-span-2"><span class="text-neutral-400">📝 Note:</span> ${ev.note || "-"}</div>
      </div>
    `;

    container.appendChild(card);
  });
}

// global functions for buttons
window.editEvent = (id) => {
  alert("Edit event: " + id); // you can hook into dialog open
};
window.deleteEvent = async (id) => {
  if(confirm("ยืนยันการลบงานนี้?")) {
    await remove("events", id);
  }
};

async function init() {
  modelsCache = await list("models");

  watch("events", (data) => {
    renderEvents(data, modelsCache);
  });
}

init();
