// app.js — main UI logic
import * as API from './api.js';

// state
const state = {
  events: [],
  models: [],
};

// elements
const addEventBtn = document.getElementById('addEventBtn');
const addModelBtn = document.getElementById('addModelBtn');
const searchInput = document.getElementById('searchInput');
const eventDialog = document.getElementById('eventDialog');
const modelDialog = document.getElementById('modelDialog');
const eventForm = document.getElementById('eventForm');
const modelForm = document.getElementById('modelForm');
const calendarGrid = document.getElementById('calendarGrid');
const monthLabel = document.getElementById('monthLabel');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const legend = document.getElementById('legend');
const eventsList = document.getElementById('eventsList'); // ใช้แทนตาราง

// helpers
function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function normalizeDate(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().split("T")[0];
  return String(value).split("T")[0];
}

// dialogs
function openEventDialog(id = null) {
  if (id) {
    const e = state.events.find(x => x.id === id);
    for (let k in e) {
      if (eventForm[k]) eventForm[k].value = e[k];
    }
    eventForm.id.value = e.id;
  } else {
    eventForm.reset();
    eventForm.id.value = '';
  }
  eventDialog.showModal();
}

function openModelDialog(id = null) {
  if (id) {
    const m = state.models.find(x => x.id === id);
    for (let k in m) {
      if (modelForm[k]) modelForm[k].value = m[k];
    }
    modelForm.id.value = m.id;
  } else {
    modelForm.reset();
    modelForm.id.value = '';
  }
  modelDialog.showModal();
}

// render card view
function render() {
  const q = (searchInput.value || '').toLowerCase();
  const filtered = state.events.filter(e =>
    !q || [e.eventName, e.location, e.staff, e.model].some(s => (s || '').toLowerCase().includes(q))
  );

  eventsList.innerHTML = filtered.map(e => {
    const m = state.models.find(x => x.name === e.model);
    return `
      <div class="bg-neutral-900 rounded-2xl shadow p-6 border border-neutral-800">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-xl font-bold text-white">${e.eventName || '-'}</h2>
            <p class="text-sm text-neutral-400">${fmtDate(e.startDate)}${e.endDate ? ' – ' + fmtDate(e.endDate) : ''}</p>
          </div>
          <div class="space-x-2">
            <button class="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white" data-id="${e.id}">แก้ไข</button>
            <button class="px-3 py-1.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white" data-del="${e.id}">ลบ</button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><span class="text-neutral-400">📍 สถานที่:</span> ${e.location || '-'}</div>
          <div><span class="text-neutral-400">🖼 โมเดล:</span> ${e.model || '-'}</div>
          <div><span class="text-neutral-400">🛠 ติดตั้ง:</span> ${fmtDate(e.installDate)} ${e.installTime || ''}</div>
          <div><span class="text-neutral-400">👤 Staff:</span> ${e.staff || '-'}</div>
          <div><span class="text-neutral-400">⏰ เวลา:</span> ${[e.openTime, e.closeTime].filter(Boolean).join(' - ')}</div>
          <div><span class="text-neutral-400">💰 ราคา:</span> ${e.price || '-'}</div>
          <div><span class="text-neutral-400">📌 สถานะ:</span> ${(e.paidDeposit ? 'มัดจำ ' : '') + (e.paidFull ? 'ชำระครบ' : '')}</div>
          <div class="col-span-2"><span class="text-neutral-400">📝 Note:</span> ${e.note || ''}</div>
        </div>
      </div>
    `;
  }).join('');

  // bind edit/delete
  eventsList.querySelectorAll('button[data-id]').forEach(b =>
    b.onclick = () => openEventDialog(b.dataset.id)
  );
  eventsList.querySelectorAll('button[data-del]').forEach(b =>
    b.onclick = async () => {
      if(confirm('ยืนยันการลบงานนี้?')) await API.remove('events', b.dataset.del);
    }
  );
}

// render models legend
function renderModelsToSelect() {
  const modelSelect = eventForm.model;
  modelSelect.innerHTML = ['<option value=""></option>']
    .concat(state.models.map(m=>`<option value="${m.name}">${m.name}</option>`))
    .join('');
  legend.innerHTML = state.models
    .map(m=>`<span class="text-xs px-2 py-1 rounded-full" style="background:${m.colorBG};color:${m.colorText}">${m.name}</span>`)
    .join(' ');
}

// init
function init() {
  API.watch('events', rows => {
    state.events = rows;
    render();
  });

  API.watch('models', rows => {
    state.models = rows;
    renderModelsToSelect();
    render();
  });

  addEventBtn.onclick = () => openEventDialog();
  addModelBtn.onclick = () => openModelDialog();

  // save event
  eventForm.onsubmit = async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(eventForm).entries());
    if (data.id) {
      await API.upsert('events', data);
    } else {
      await API.upsert('events', data);
    }
    eventDialog.close();
  };

  // save model
  modelForm.onsubmit = async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(modelForm).entries());
    if (data.id) {
      await API.upsert('models', data);
    } else {
      await API.upsert('models', data);
    }
    modelDialog.close();
  };
}

init();
