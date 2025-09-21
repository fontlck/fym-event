// calendar.js — utilities for month grid and event placement
export const Calendar = {
  build(ym){ // ym = 'YYYY-MM'
    const [y,m] = ym.split('-').map(Number);
    const first = new Date(y, m-1, 1);
    const label = first.toLocaleDateString('th-TH',{year:'numeric', month:'long'});
    const start = new Date(first);
    start.setDate(1 - ((first.getDay()+6)%7)); // start Monday
    const weeks = [];
    for(let w=0; w<6; w++){
      const row = [];
      for(let d=0; d<7; d++){
        const dt = new Date(start);
        dt.setDate(start.getDate()+w*7+d);
        row.push(dt.getMonth()===(m-1) ? dt.toISOString().slice(0,10) : '');
      }
      weeks.push(row);
    }
    return { weeks, label };
  },
  shiftMonth(ym,delta){
    const [y,m]=ym.split('-').map(Number);
    const dt=new Date(y,m-1+delta,1);
    return dt.toISOString().slice(0,7);
  },
  eventsByDate(events){
    const map={};
    for(const e of events){
      const s=e.startDate, eend=e.endDate||e.startDate;
      if(!s) continue;
      let d=new Date(s+'T00:00:00');
      const last=new Date(eend+'T00:00:00');
      while(d<=last){
        const key=d.toISOString().slice(0,10);
        (map[key] ||= []).push(e);
        d.setDate(d.getDate()+1);
      }
    }
    return map;
  }
};
