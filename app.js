import * as API from './api.js';
import { Calendar } from './calendar.js';

const state = { events:[], models:[], editingId:null, month:new Date().toISOString().slice(0,7) };

// DOM
const todayText = document.getElementById('todayText');
const addEventBtn = document.getElementById('addEventBtn');
const addModelBtn = document.getElementById('addModelBtn');
const eventDialog = document.getElementById('eventDialog');
const modelDialog = document.getElementById('modelDialog');
const eventForm = document.getElementById('eventForm');
const modelForm = document.getElementById('modelForm');
const modelSelect = document.getElementById('modelSelect');
const deleteEventBtn = document.getElementById('deleteEventBtn');
const saveEventBtn = document.getElementById('saveEventBtn');
const saveModelBtn = document.getElementById('saveModelBtn');
const closeEventDialog = document.getElementById('closeEventDialog');
const closeModelDialog = document.getElementById('closeModelDialog');
const tbody = document.getElementById('eventsTableBody');
const upcomingList = document.getElementById('upcomingList');
const searchInput = document.getElementById('searchInput');
const monthLabel = document.getElementById('monthLabel');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const calendarGrid = document.getElementById('calendarGrid');
const legend = document.getElementById('legend');

const tz='Asia/Bangkok';
function fmtDate(s){ return s? new Date(s+'T00:00:00').toLocaleDateString('th-TH',{timeZone:tz,year:'numeric',month:'short',day:'numeric'}):''; }

async function init(){
  todayText.textContent = new Date().toLocaleString('th-TH',{timeZone:tz,weekday:'long',year:'numeric',month:'long',day:'numeric'});
  bindEvents();

  // realtime watch
  API.watch('models', (rows)=>{ state.models = rows; renderModelsToSelect(); render(); renderCalendar(); });
  API.watch('events', (rows)=>{ state.events = rows.map(normalizeEvent); render(); renderCalendar(); });
  renderCalendar();
}

function normalizeEvent(e){
  function fixDate(d){ if(!d) return ''; return String(d).split('T')[0]; }
  return { ...e, startDate: fixDate(e.startDate), endDate: fixDate(e.endDate), installDate: fixDate(e.installDate) };
}

function bindEvents(){
  addEventBtn.onclick = ()=> openEventDialog();
  addModelBtn.onclick = ()=> openModelDialog();
  closeEventDialog.onclick = ()=> eventDialog.close();
  closeModelDialog.onclick = ()=> modelDialog.close();
  saveEventBtn.onclick = onSaveEvent;
  saveModelBtn.onclick = onSaveModel;
  deleteEventBtn.onclick = onDeleteEvent;
  searchInput.oninput = render;
  prevMonthBtn.onclick = ()=>{ state.month = Calendar.shiftMonth(state.month,-1); renderCalendar(); };
  nextMonthBtn.onclick = ()=>{ state.month = Calendar.shiftMonth(state.month, 1); renderCalendar(); };
}

function render(){
  const q=(searchInput.value||'').toLowerCase();
  const filtered = state.events.filter(e => !q || [e.eventName,e.location,e.staff,e.model].some(s => (s||'').toLowerCase().includes(q)));
  tbody.innerHTML = filtered.map(e=>`
    <tr class="hover:bg-neutral-800 cursor-pointer">
      <td>${fmtDate(e.startDate)}${e.endDate? ' – '+fmtDate(e.endDate): ''}</td>
      <td>${e.eventName||''}</td><td>${e.location||''}</td><td>${e.model||''}</td>
      <td>${[e.openTime,e.closeTime].filter(Boolean).join(' - ')}</td>
      <td>${e.price||''}</td>
      <td>${e.paidDeposit?'มัดจำ':''} ${e.paidFull?'ชำระครบ':''}</td>
      <td><button class="px-2 py-1 text-xs bg-neutral-700 rounded" data-id="${e.id}">แก้ไข</button></td>
    </tr>
  `).join('');
  tbody.querySelectorAll('button[data-id]').forEach(b=> b.onclick = ()=> openEventDialog(b.dataset.id));

  const today = new Date().toISOString().slice(0,10);
  const upcoming = [...state.events].filter(e=>(e.startDate||'')>=today).sort((a,b)=>a.startDate.localeCompare(b.startDate)).slice(0,5);
  upcomingList.innerHTML = upcoming.map(e=>{
    const m = state.models.find(x=>x.name===e.model);
    const bg = m?.colorBG || '#222', fg=m?.colorText || '#fff';
    return `<div class="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
      <div class="flex items-center justify-between">
        <div class="text-sm text-neutral-400">${fmtDate(e.startDate)}${e.endDate? ' - '+fmtDate(e.endDate): ''}</div>
        <span class="text-xs px-2 py-1 rounded-full" style="background:${bg};color:${fg}">${e.model||'-'}</span>
      </div>
      <div class="mt-1 font-semibold">${e.eventName||'-'}</div>
      <div class="text-sm text-neutral-300">${e.location||''}</div>
    </div>`;
  }).join('');
}

function renderModelsToSelect(){
  modelSelect.innerHTML = ['<option value=""></option>'].concat(state.models.map(m=>`<option value="${m.name}">${m.name}</option>`)).join('');
  legend.innerHTML = state.models.map(m=>`<span class="text-xs px-2 py-1 rounded-full" style="background:${m.colorBG};color:${m.colorText}">${m.name}</span>`).join(' ');
}

// dialogs
function openEventDialog(id=null){
  eventForm.reset();
  state.editingId=id;
  const isEdit = !!id;
  deleteEventBtn.classList.toggle('hidden', !isEdit);
  renderModelsToSelect();
  if(isEdit){
    const e = state.events.find(x=>x.id===id);
    if(e){ for(const [k,v] of Object.entries(e)){ if(eventForm[k]) eventForm[k].value = v ?? ''; } }
  }
  if(typeof eventDialog.showModal==='function') eventDialog.showModal(); else eventDialog.setAttribute('open','true');
}
function openModelDialog(id=null){
  modelForm.reset();
  if(typeof modelDialog.showModal==='function') modelDialog.showModal(); else modelDialog.setAttribute('open','true');
}

async function onSaveEvent(ev){
  ev.preventDefault();
  const fd=new FormData(eventForm);
  const data=Object.fromEntries(fd.entries());
  if(state.editingId) data.id=state.editingId;
  data.paidDeposit = fd.get('paidDeposit')==='on';
  data.paidFull = fd.get('paidFull')==='on';
  await API.upsert('events', data);
  eventDialog.close();
}
async function onDeleteEvent(ev){
  ev.preventDefault();
  if(!state.editingId) return;
  await API.remove('events', state.editingId);
  eventDialog.close();
}
async function onSaveModel(ev){
  ev.preventDefault();
  const fd=new FormData(modelForm);
  const data=Object.fromEntries(fd.entries());
  await API.upsert('models', data);
  modelDialog.close();
}

// calendar
function renderCalendar(){
  const {weeks,label}=Calendar.build(state.month);
  monthLabel.textContent=label;
  const map=Calendar.eventsByDate(state.events);
  calendarGrid.innerHTML = weeks.map(week=>`<div class="contents">${week.map(day=> day? cell(day, map[day]||[]) : cell('',[],true)).join('')}</div>`).join('');
}
function cell(dateStr, events, muted=false){
  const dayNum = dateStr? Number(dateStr.split('-')[2]) : '';
  const items = events.map(e=>{
    const m = state.models.find(x=>x.name===e.model);
    const bg = m?.colorBG || '#222', fg=m?.colorText || '#fff';
    return `<div class="px-2 py-1 rounded mb-1" style="background:${bg};color:${fg}">
      <div class="font-semibold text-[11px]">${e.model||'-'}</div>
      <div class="text-[11px] truncate">${e.eventName||''}</div>
    </div>`;
  }).join('');
  return `<div class="h-28 border border-neutral-800 rounded-lg p-2 ${muted?'opacity-30':''}">
    <div class="text-xs text-neutral-400 mb-1">${dayNum}</div>
    <div>${items}</div>
  </div>`;
}

init();
