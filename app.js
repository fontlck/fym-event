import { watch, list, upsert, remove } from './api.js';

let modelsCache = [];
let currentMonth = dayjs();
let allEvents = [];

// Modal Functions
window.openEventModal = (id) => {
  document.getElementById("eventModal").classList.remove("hidden");
};
window.closeEventModal = () => {
  document.getElementById("eventModal").classList.add("hidden");
};
window.openModelModal = () => {
  document.getElementById("modelModal").classList.remove("hidden");
};
window.closeModelModal = () => {
  document.getElementById("modelModal").classList.add("hidden");
};

// Render Events
function renderEvents(events, models) {
  const container = document.getElementById("eventsList");
  const header = document.getElementById("eventsHeader");
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
    card.className = "bg-neutral-900 rounded-2xl shadow-lg p-6 mb-4 flex flex-col md:flex-row justify-between";
    card.style.borderLeft = `8px solid ${model.colorBG}`;

    card.innerHTML = `
      <div>
        <span class="px-2 py-0.5 text-xs font-medium rounded-full mb-2 inline-block"
          style="background:${model.colorBG}; color:${model.colorText}">${ev.model || "-"}</span>
        <h3 class="text-xl font-bold">${ev.eventName}</h3>
        <p class="text-neutral-400">${ev.location || ""}</p>
        <p class="text-sm text-neutral-400">${ev.startDate}${ev.endDate ? " – " + ev.endDate : ""}</p>
      </div>
      <div class="flex flex-row gap-2 items-start md:items-end">
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

// Init
function init() {
  const addEventBtn = document.getElementById("addEventBtn");
  const addModelBtn = document.getElementById("addModelBtn");
  const eventForm = document.getElementById("eventForm");
  const modelForm = document.getElementById("modelForm");

  if (addEventBtn) addEventBtn.addEventListener("click", () => openEventModal());
  if (addModelBtn) addModelBtn.addEventListener("click", () => openModelModal());

  if (eventForm) eventForm.addEventListener("submit", e => {
    e.preventDefault();
    closeEventModal();
  });

  if (modelForm) modelForm.addEventListener("submit", e => {
    e.preventDefault();
    closeModelModal();
  });

  watch("models", data => {
    modelsCache = data;
    renderEvents(allEvents, modelsCache);
  });

  watch("events", data => {
    allEvents = data;
    renderEvents(allEvents, modelsCache);
  });
}

init();
