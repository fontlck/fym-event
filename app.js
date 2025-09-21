import { watch, upsert, remove } from './api.js';

let modelsCache = [];
let allEvents = [];
let currentMonth = dayjs();

const $ = (id) => document.getElementById(id);

function renderCalendar(events, models) {
  const cal = $('calendar');
  const label = $('monthLabel');
  if (label) label.textContent = currentMonth.format('MMMM YYYY');
  if (!cal) return;

  const start = currentMonth.startOf('month').startOf('week');
  const end = currentMonth.endOf('month').endOf('week');
  let d = start;

  let html = '<div class="grid grid-cols-7 gap-2 text-xs text-neutral-400 mb-2">';
  ['อา','จ','อ','พ','พฤ','ศ','ส'].forEach(w=>{ html += `<div class="text-center">${w}</div>`; });
  html += '</div><div class="grid grid-cols-7 gap-2">';

  while (d.isBefore(end) || d.isSame(end)) {
    const inMonth = d.month() === currentMonth.month();
    const todays = events.filter(ev => {
      const s = dayjs(ev.startDate);
      const e = ev.endDate ? dayjs(ev.endDate) : s;
      return d.isBetween(s, e, 'day', '[]');
    });
    let tags = '';
    todays.forEach(ev => {
      const model = models.find(m => m.name === ev.model) || { colorBG:'#6366f1', colorText:'#fff'};
      tags += `<div class="rounded px-1 py-0.5 text-[10px] leading-tight mb-1 truncate" 
                  style="background:${model.colorBG}; color:${model.colorText}">
                  <div class="font-semibold">${ev.model || ''}</div>
                  <div class="truncate">${ev.eventName || ''}</div>
               </div>`;
    });
    html += `<div class="h-28 p-1 rounded ${inMonth ? 'bg-neutral-800' : 'bg-neutral-900 text-neutral-600'}">
               <div class="text-[10px] text-right mb-0.5">${d.date()}</div>
               ${tags}
             </div>`;
    d = d.add(1,'day');
  }
  html += '</div>';
  cal.innerHTML = html;
}

function renderStats(events) {
  const now = dayjs();
  const year = now.year();
  const total = events.filter(ev => dayjs(ev.startDate).year() === year).length;
  const past = events.filter(ev => (ev.endDate ? dayjs(ev.endDate) : dayjs(ev.startDate)).isBefore(now,'day')).length;
  const upcoming = events.length - past;
  $('statTotal').textContent = total;
  $('statPast').textContent = past;
  $('statUpcoming').textContent = upcoming;
}

function renderEvents(events, models) {
  const container = $('eventsList');
  const header = $('eventsHeader');
  if (!container) return;
  container.innerHTML = '';

  const filtered = events.filter(ev => {
    const s = dayjs(ev.startDate);
    const e = ev.endDate ? dayjs(ev.endDate) : s;
    return s.isSame(currentMonth,'month') || e.isSame(currentMonth,'month');
  });

  header.textContent = `งานในเดือน ${currentMonth.format('MMMM YYYY')} (${filtered.length} งาน)`;

  const sorted = [...filtered].sort((a,b)=> new Date(a.startDate) - new Date(b.startDate));

  sorted.forEach(ev => {
    const model = models.find(m => m.name === ev.model) || { colorBG:'#6366f1', colorText:'#fff'};
    const card = document.createElement('div');
    card.className = "bg-neutral-900 rounded-2xl p-4 border-l-8 flex flex-col md:flex-row md:items-center justify-between gap-4";
    card.style.borderLeftColor = model.colorBG;

    const left = document.createElement('div');
    left.className = "flex-1 min-w-0";
    left.innerHTML = `
      <span class="px-2 py-0.5 text-xs font-medium rounded-full mb-2 inline-block"
            style="background:${model.colorBG}; color:${model.colorText}">${ev.model || '-'}</span>
      <h3 class="text-xl font-bold mb-0.5">${ev.eventName || '-'}</h3>
      <p class="text-sm text-neutral-300 mb-1">${ev.location || '-'}</p>
      <p class="text-sm text-neutral-400 mb-1">${ev.startDate || ''}${ev.endDate ? ' – ' + ev.endDate : ''}</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-sm text-neutral-300">
        <div>เวลาติดตั้ง: <span class="text-white">${ev.installTime || '-'}</span></div>
        <div>วันติดตั้ง: <span class="text-white">${ev.installDate || '-'}</span></div>
        <div>เวลา: <span class="text-white">${ev.openTime || '-'} - ${ev.closeTime || '-'}</span></div>
        <div>Staff: <span class="text-white">${ev.staff || '-'}</span></div>
        <div>ราคา: <span class="text-white">${ev.price || '-'}</span></div>
        <div>ค่าขนส่ง: <span class="text-white">${ev.transportFee || '-'}</span></div>
        <div class="md:col-span-2">Note: <span class="text-white">${ev.note || '-'}</span></div>
      </div>
    `;

    const right = document.createElement('div');
    right.className = "flex gap-2 shrink-0";
    right.innerHTML = `
      <button data-edit="${ev.id}" class="w-24 text-center px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium">แก้ไข</button>
      <button data-del="${ev.id}" class="w-24 text-center px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium">ลบ</button>
    `;

    card.appendChild(left);
    card.appendChild(right);
    container.appendChild(card);
  });

  container.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openEventModal(btn.dataset.edit));
  });
  container.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('ยืนยันการลบงานนี้?')) await remove('events', btn.dataset.del);
    });
  });
}

function fillModelSelect() {
  const sel = document.querySelector('#eventForm select[name="model"]');
  if (!sel) return;
  sel.innerHTML = '';
  modelsCache.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.name;
    opt.textContent = m.name;
    sel.appendChild(opt);
  });
}

function openEventModal(id) {
  const modal = $('eventModal'); modal.classList.remove('hidden');
  const form = $('eventForm');
  form.reset();
  form.id.value = id || '';
  if (id) {
    const ev = allEvents.find(e => e.id === id);
    if (ev) {
      Object.entries(ev).forEach(([k,v]) => {
        if (form[k] !== undefined && form[k] !== null) form[k].value = v;
      });
    }
  }
  fillModelSelect();
}

function closeEventModal(){ $('eventModal').classList.add('hidden'); }
function openModelModal(){ $('modelModal').classList.remove('hidden'); }
function closeModelModal(){ $('modelModal').classList.add('hidden'); }

function renderAll(){
  renderCalendar(allEvents, modelsCache);
  renderStats(allEvents);
  renderEvents(allEvents, modelsCache);
}

function init(){
  $('prevMonth').addEventListener('click', () => { currentMonth = currentMonth.subtract(1,'month'); renderAll(); });
  $('nextMonth').addEventListener('click', () => { currentMonth = currentMonth.add(1,'month'); renderAll(); });

  $('addEventBtn').addEventListener('click', () => openEventModal());
  $('addModelBtn').addEventListener('click', () => openModelModal());
  $('closeEventModal').addEventListener('click', () => closeEventModal());
  $('closeModelModal').addEventListener('click', () => closeModelModal());

  $('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    await upsert('events', data);
    closeEventModal();
  });
  $('modelForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    await upsert('models', data);
    closeModelModal();
  });

  // realtime
  watch('models', data => { modelsCache = data; renderAll(); });
  watch('events', data => { allEvents = data; renderAll(); });
}

document.addEventListener('DOMContentLoaded', init);
