// app.js — UI + logic
import { watch, list, upsert, remove } from './api.js';

let modelsCache = [];
let allEvents = [];
let currentMonth = dayjs();

// ==== helpers ====
const $ = (id) => document.getElementById(id);
const eventModal = () => $("#eventModal");
const modelModal = () => $("#modelModal");
const eventForm = () => $("#eventForm");
const modelForm = () => $("#modelForm");

function openModal(el){ el.classList.remove("hidden"); }
function closeModal(el){ el.classList.add("hidden"); }

// ==== calendar ====
function renderCalendar(events, models){
  const grid = $("#calendarGrid");
  const label = $("#monthLabel");
  if (!grid) return;

  label.textContent = currentMonth.format("MMMM YYYY");
  grid.innerHTML = "";

  const start = currentMonth.startOf("month").startOf("week");
  const end = currentMonth.endOf("month").endOf("week");

  let d = start;
  while (d.isBefore(end) || d.isSame(end, "day")){
    const inMonth = d.month() === currentMonth.month();
    const cell = document.createElement("div");
    cell.className = "min-h-[90px] p-1 rounded border " + (inMonth ? "border-neutral-700" : "border-neutral-900 bg-neutral-900 text-neutral-600");

    // date label
    const top = document.createElement("div");
    top.className = "text-xs mb-1 text-neutral-400";
    top.textContent = d.date();
    cell.appendChild(top);

    // events today
    const todays = events.filter(ev=>{
      const s = dayjs(ev.startDate);
      const e = ev.endDate ? dayjs(ev.endDate) : s;
      return d.isBetween(s, e, "day", "[]");
    });

    todays.forEach(ev=>{
      const m = models.find(x=>x.name === ev.model) || { colorBG:"#6366f1", colorText:"#fff" };
      const tag = document.createElement("div");
      tag.className = "rounded text-[10px] leading-tight px-1 py-0.5 mb-1";
      tag.style.background = m.colorBG;
      tag.style.color = m.colorText;
      tag.innerHTML = `<div class="truncate">${ev.model || "-"}</div><div class="truncate opacity-90">${ev.eventName || "-"}</div>`;
      cell.appendChild(tag);
    });

    grid.appendChild(cell);
    d = d.add(1,"day");
  }

  // legend
  const leg = $("#legend");
  leg.innerHTML = "";
  models.forEach(m=>{
    const b = document.createElement("div");
    b.className = "flex items-center gap-2 text-xs px-2 py-1 rounded border border-neutral-700";
    b.innerHTML = `<span class="inline-block w-3 h-3 rounded" style="background:${m.colorBG}"></span><span>${m.name}</span>`;
    leg.appendChild(b);
  });
}

// ==== stats ====
function renderStats(events){
  const now = dayjs();
  const year = now.year();
  const total = events.filter(e=>dayjs(e.startDate).year()===year).length;
  const past = events.filter(e=>dayjs(e.endDate||e.startDate).isBefore(now,"day")).length;
  const upcoming = events.length - past;
  $("#statTotal").textContent = total;
  $("#statPast").textContent = past;
  $("#statUpcoming").textContent = upcoming;
}

// ==== cards ====
function renderEvents(events, models){
  const list = $("#eventsList");
  const header = $("#eventsHeader");
  if (!list) return;
  list.innerHTML = "";

  const filtered = events.filter(ev=>{
    const s = dayjs(ev.startDate);
    const e = ev.endDate ? dayjs(ev.endDate) : s;
    return s.isSame(currentMonth,"month") || e.isSame(currentMonth,"month");
  });

  header.textContent = `${currentMonth.format("MMMM YYYY")} (${filtered.length} งาน)`;

  if (!filtered.length){
    list.innerHTML = `<p class="text-neutral-400">ไม่มีงานในเดือนนี้</p>`;
    return;
  }

  const sorted = [...filtered].sort((a,b)=> new Date(a.startDate) - new Date(b.startDate));

  sorted.forEach(ev=>{
    const m = models.find(x=>x.name === ev.model) || { colorBG:"#6366f1", colorText:"#fff" };
    const card = document.createElement("div");
    card.className = "bg-neutral-900 rounded-2xl shadow p-4 flex justify-between items-center border-l-8";
    card.style.borderLeftColor = m.colorBG;
    card.innerHTML = `
      <div class="flex-1 min-w-0">
        <span class="px-2 py-0.5 text-xs font-medium rounded-full mb-2 inline-block" style="background:${m.colorBG}; color:${m.colorText}">${ev.model || "-"}</span>
        <h3 class="text-xl font-bold">${ev.eventName || "-"}</h3>
        <p class="text-sm text-neutral-400">${ev.location || ""}</p>
        <p class="text-sm text-neutral-500">${ev.startDate || ""}${ev.endDate ? " – " + ev.endDate : ""}</p>
      </div>
      <div class="flex gap-2">
        <button data-edit="${ev.id}" class="w-24 text-center px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400">แก้ไข</button>
        <button data-del="${ev.id}" class="w-24 text-center px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500">ลบ</button>
      </div>
    `;
    list.appendChild(card);
  });

  // bind buttons
  list.querySelectorAll("[data-edit]").forEach(btn=>{
    btn.addEventListener("click", ()=> openEventModal(btn.dataset.edit));
  });
  list.querySelectorAll("[data-del]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      if (confirm("ยืนยันการลบงานนี้?")) await remove("events", btn.dataset.del);
    });
  });
}

// ==== modals ====
function openEventModal(id=null){
  // fill model options
  const sel = eventForm().querySelector('select[name="model"]');
  sel.innerHTML = modelsCache.map(m=>`<option value="${m.name}">${m.name}</option>`).join("");

  // reset / fill
  eventForm().reset();
  if (id){
    const ev = allEvents.find(e=>e.id===id);
    if (ev){
      Object.entries(ev).forEach(([k,v])=>{
        const el = eventForm().querySelector(`[name="${k}"]`);
        if (!el) return;
        if (el.type==="checkbox"){ el.checked = !!v; }
        else { el.value = v; }
      });
    }
  }
  openModal(eventModal());
}

// ==== init ====
function init(){
  // month controls
  $("#prevMonth").addEventListener("click", ()=>{
    currentMonth = currentMonth.subtract(1,"month");
    renderCalendar(allEvents, modelsCache);
    renderEvents(allEvents, modelsCache);
  });
  $("#nextMonth").addEventListener("click", ()=>{
    currentMonth = currentMonth.add(1,"month");
    renderCalendar(allEvents, modelsCache);
    renderEvents(allEvents, modelsCache);
  });

  // open modals
  $("#addEventBtn").addEventListener("click", ()=> openEventModal());
  $("#addModelBtn").addEventListener("click", ()=> openModal(modelModal()));

  // close modals
  $("#closeEvent").addEventListener("click", ()=> closeModal(eventModal()));
  $("#cancelEvent").addEventListener("click", ()=> closeModal(eventModal()));
  $("#closeModel").addEventListener("click", ()=> closeModal(modelModal()));
  $("#cancelModel").addEventListener("click", ()=> closeModal(modelModal()));

  // submit forms
  eventForm().addEventListener("submit", async (e)=>{
    e.preventDefault();
    const fd = new FormData(eventForm());
    const data = Object.fromEntries(fd.entries());
    data.paidDeposit = eventForm().querySelector('input[name="paidDeposit"]').checked;
    data.paidFull = eventForm().querySelector('input[name="paidFull"]').checked;
    await upsert("events", data);
    closeModal(eventModal());
  });

  modelForm().addEventListener("submit", async (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(modelForm()).entries());
    await upsert("models", data);
    closeModal(modelModal());
  });

  // data streams
  watch("models", (models)=>{
    modelsCache = models;
    renderCalendar(allEvents, modelsCache);
    renderEvents(allEvents, modelsCache);
  });

  watch("events", (events)=>{
    allEvents = events;
    renderCalendar(allEvents, modelsCache);
    renderStats(allEvents);
    renderEvents(allEvents, modelsCache);
  }, "startDate");
}

init();
