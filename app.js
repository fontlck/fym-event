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
  let html = '<div class="grid grid-cols-7 gap-2 text-sm text-neutral-400 mb-2"><div>อา</div><div>จ</div><div>อ</div><div>พ</div><div>พฤ</div><div>ศ</div><div>ส</div></div>';
  html += '<div class="grid grid-cols-7 gap-2">';
  while (d.isBefore(end) || d.isSame(end)) {
    const inMonth = d.month() === currentMonth.month();
    let tags = '';
    const todays = events.filter(ev => {
      const s = dayjs(ev.startDate);
      const e = ev.endDate ? dayjs(ev.endDate) : s;
      return d.isBetween(s, e, 'day', '[]');
    });
    todays.forEach(ev => {
      const model = models.find(m => m.name === ev.model) || { colorBG:'#6366f1', colorText:'#fff' };
      tags += `<div class="rounded text-[10px] px-1 mb-1" style="background:${model.colorBG}; color:${model.colorText}">${ev.model}<br>${ev.eventName}</div>`;
    });
    html += `<div class="h-24 p-1 rounded ${inMonth ? 'bg-neutral-800' : 'bg-neutral-900 text-neutral-600'}">
      <div class="text-xs text-right">${d.date()}</div>
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
  const total = events.filter(ev => dayjs(ev.startDate).year()===year).length;
  const past = events.filter(ev => (ev.endDate?dayjs(ev.endDate):dayjs(ev.startDate)).isBefore(now,'day')).length;
  const upcoming = events.length - past;
  $('statTotal').textContent = total;
  $('statPast').textContent = past;
  $('statUpcoming').textContent = upcoming;
}

function renderEvents(events, models) {
  const container = $('eventsList');
  const header = $('eventsHeader');
  container.innerHTML='';
  const filtered = events.filter(ev => {
    const s=dayjs(ev.startDate);
    const e=ev.endDate?dayjs(ev.endDate):s;
    return s.isSame(currentMonth,'month')||e.isSame(currentMonth,'month');
  });
  header.textContent=`งานในเดือน ${currentMonth.format('MMMM YYYY')} (${filtered.length} งาน)`;
  const sorted=[...filtered].sort((a,b)=>new Date(a.startDate)-new Date(b.startDate));
  sorted.forEach(ev=>{
    const model=models.find(m=>m.name===ev.model)||{colorBG:'#6366f1',colorText:'#fff'};
    const card=document.createElement('div');
    card.className='bg-neutral-900 rounded-xl p-4 mb-3 flex justify-between border-l-8';
    card.style.borderLeftColor=model.colorBG;
    card.innerHTML=`<div>
      <span class="px-2 py-0.5 text-xs rounded-full" style="background:${model.colorBG}; color:${model.colorText}">${ev.model||''}</span>
      <h3 class="text-lg font-bold">${ev.eventName||''}</h3>
      <p class="text-sm text-neutral-400">${ev.startDate}${ev.endDate?' - '+ev.endDate:''}</p>
    </div>
    <div class="flex gap-2">
      <button data-edit="${ev.id}" class="px-3 py-1 bg-indigo-500 rounded">แก้ไข</button>
      <button data-del="${ev.id}" class="px-3 py-1 bg-rose-500 rounded">ลบ</button>
    </div>`;
    container.appendChild(card);
  });
  container.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openEventModal(b.dataset.edit)));
  container.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',async()=>{if(confirm('ยืนยันการลบ?'))await remove('events',b.dataset.del);}));
}

function openEventModal(){ $('eventModal').classList.remove('hidden'); }
function closeEventModal(){ $('eventModal').classList.add('hidden'); }
function openModelModal(){ $('modelModal').classList.remove('hidden'); }
function closeModelModal(){ $('modelModal').classList.add('hidden'); }

function init(){
  $('addEventBtn').addEventListener('click',()=>openEventModal());
  $('addModelBtn').addEventListener('click',()=>openModelModal());
  $('closeEventModal').addEventListener('click',()=>closeEventModal());
  $('closeModelModal').addEventListener('click',()=>closeModelModal());
  $('eventForm').addEventListener('submit',async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target).entries());await upsert('events',data);closeEventModal();});
  $('modelForm').addEventListener('submit',async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target).entries());await upsert('models',data);closeModelModal();});

  $('prevMonth').addEventListener('click',()=>{currentMonth=currentMonth.subtract(1,'month');renderAll();});
  $('nextMonth').addEventListener('click',()=>{currentMonth=currentMonth.add(1,'month');renderAll();});

  watch('models',data=>{modelsCache=data;renderAll();});
  watch('events',data=>{allEvents=data;renderAll();});
}

function renderAll(){
  renderCalendar(allEvents,modelsCache);
  renderStats(allEvents);
  renderEvents(allEvents,modelsCache);
}

document.addEventListener('DOMContentLoaded',init);
