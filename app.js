/* ============================================================
   ROC — training plan + Garmin  (vanilla JS PWA)
   ============================================================ */

/* ---------- Section 0: constants ---------- */
const Z = 'Z2 145–155', REC = 'REC ≤145', HARD = 'HARD 165–175';
const PLAN_START = '2026-06-22';   // Monday, Week 1
const RACE_DATE  = '2026-09-05';
const GARMIN_URL = 'https://gist.githubusercontent.com/walmsley01/5508c95d96946a81166c369ccfcc3cd1/raw/garmin-data.json';   // deploy.py injects the secret-gist raw URL here; empty = local file (dev)

const SPORTS = {
  run:      { label: 'Run',      icon: '<path d="M13 4a2 2 0 1 0 0-.001M7 21l3-6 4-2 2 3 3 1M5 12l3-3 4 1 3-3"/>' },
  bike:     { label: 'Bike',     icon: '<circle cx="6" cy="17" r="3.2"/><circle cx="18" cy="17" r="3.2"/><path d="M6 17l4-7h5l-3 7M10 10l2-3h3"/>' },
  swim:     { label: 'Swim',     icon: '<path d="M2 16c2 0 2 1.5 4 1.5S8 16 10 16s2 1.5 4 1.5S16 16 18 16s2 1.5 4 1.5M5 11l5 3M7 8l5 3M14 6.5a1.6 1.6 0 1 0 0-.01"/>' },
  strength: { label: 'Strength', icon: '<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>' },
  stairs:   { label: 'Stairs',   icon: '<path d="M4 20v-4h4v-4h4V8h4V4h4"/>' },
  mobility: { label: 'Mobility', icon: '<circle cx="12" cy="5" r="2"/><path d="M5 11l4 1 3-1 3 1 4-1M12 11v5l-3 4M12 16l3 4"/>' },
  rest:     { label: 'Rest',     icon: '<path d="M3 12a9 9 0 1 0 9-9 7 7 0 0 1-9 9z"/>' },
};

/* ---------- Section 1: plan seed (v4) ---------- */
const CAM   = { slot:'am', sport:'bike',     title:'Commute',      detail:'8 km easy', km:8 };
const CPM   = { slot:'pm', sport:'bike',     title:'Commute',      detail:'8 km easy', km:8 };
const MOB   = { slot:'pm', sport:'mobility', title:'Hip & mobility', detail:'8 min' };
const REST  = { slot:'am', sport:'rest',     title:'Rest',         detail:'Full recovery' };
const LOWER = { slot:'pm', sport:'strength', title:'Lower / Hip',  detail:'40 min · split squat, eccentric step-downs, SL RDL, glute med' };
const LOWERL= { slot:'pm', sport:'strength', title:'Lower / Hip',  detail:'40 min (light)' };
const UPPER = { slot:'pm', sport:'strength', title:'Upper',        detail:'45 min push / pull' };

const R     = (slot, detail, km) => ({ slot, sport:'run',  title:'Run',   detail, km, hr:Z });
const RIDE  = (slot, detail, km) => ({ slot, sport:'bike', title:'Ride',  detail, km, hr:Z });
const ST    = (min, extra='')    => ({ slot:'am', sport:'stairs', title:'Stairmaster', detail:`${min} min${extra}`, min });
const SW    = (detail, km, ow=false) => ({ slot:'pm', sport:'swim', title: ow?'Open-water swim':'Swim', detail, km });
const HILL  = (detail)           => ({ slot:'am', sport:'run', title:'Hill reps', detail, hr:HARD });
const BRICK = (detail, km)       => ({ slot:'am', sport:'run', title:'Brick run', detail, km, hr:Z });

// days array index: 0=Mon … 6=Sun
const WEEKS = [
  { n:1, start:'2026-06-22', phase:'Foundation', days:[
    [CAM, LOWER, CPM, MOB],
    [R('am','4 km continuous',4), CAM, CPM, MOB],
    [ST(20), MOB],
    [CAM, CPM, MOB],
    [REST, MOB],
    [RIDE('am','50 km',50)],
    [R('am','5 km · 6×(4 min jog / 1 min walk)',5)],
  ]},
  { n:2, start:'2026-06-29', phase:'Foundation', days:[
    [CAM, LOWER, CPM, MOB],
    [HILL('10 WU + 6×(60s hard / walk down) + 5 CD'), CAM, CPM, MOB],
    [ST(25), UPPER, MOB],
    [CAM, CPM, SW('#1 · 0.8 km (8×100)',0.8), MOB],
    [REST, MOB],
    [RIDE('am','60 km',60), BRICK('1.5 km off the bike',1.5)],
    [R('am','6 km · 5×(6 min jog / 1 min walk)',6)],
  ]},
  { n:3, start:'2026-07-06', phase:'Foundation', days:[
    [CAM, LOWER, CPM, MOB],
    [HILL('10 WU + 6×(75s hard / walk down) + 5 CD'), CAM, CPM, MOB],
    [ST(30,' · last 10 steady'), MOB],
    [R('am','5 km continuous',5), CAM, CPM, MOB],
    [REST, MOB],
    [RIDE('am','70 km (1× Box Hill)',70)],
    [R('am','7 km · 3×(12 min jog / 1 min walk)',7)],
  ]},
  { n:4, start:'2026-07-13', phase:'Deload', days:[
    [CAM, LOWERL, CPM, MOB],
    [R('am','4 km continuous',4), CAM, CPM, MOB],
    [ST(20), MOB],
    [CAM, CPM, SW('#2 · 1.2 km (200 + 1000 continuous)',1.2), MOB],
    [REST, MOB],
    [RIDE('am','50 km',50)],
    [R('am','5 km continuous',5)],
  ]},
  { n:5, start:'2026-07-20', phase:'Build', days:[
    [CAM, LOWER, CPM, MOB],
    [HILL('10 WU + 8×(60s hard / walk down) + 5 CD'), CAM, CPM, MOB],
    [ST(35,' +5 kg pack'), UPPER, MOB],
    [R('am','7 km continuous',7), CAM, CPM, MOB],
    [REST, MOB],
    [RIDE('am','75 km',75)],
    [R('am','9 km continuous',9)],
  ]},
  { n:6, start:'2026-07-27', phase:'Build', days:[
    [CAM, LOWER, CPM, MOB],
    [HILL('10 WU + 8×(90s hard / jog down last 2) + 5 CD'), CAM, CPM, MOB],
    [ST(40,' +5 kg pack'), UPPER, MOB],
    [R('am','7 km continuous',7), CAM, CPM, MOB],
    [REST, MOB],
    [RIDE('am','70 km',70)],
    [R('am','11 km continuous',11)],
  ]},
  { n:7, start:'2026-08-03', phase:'Build', days:[
    [CAM, LOWER, CPM, MOB],
    [HILL('10 WU + 10×(90s hard / jog down) + 5 CD'), CAM, CPM, MOB],
    [ST(45,' +5 kg pack'), UPPER, MOB],
    [R('am','5 km continuous',5), CAM, CPM, SW('#3 · 1.5 km continuous',1.5), MOB],
    [REST, MOB],
    [RIDE('am','100 km (go longer if good)',100), BRICK('1.5 km off the bike',1.5)],
    [R('am','8 km continuous (easy)',8)],
  ]},
  { n:8, start:'2026-08-10', phase:'Deload + OW', days:[
    [CAM, LOWER, CPM, MOB],
    [R('am','8 km continuous',8), CAM, CPM, MOB],
    [ST(35,' +5 kg pack'), UPPER, MOB],
    [CAM, CPM, SW('#4 · OW 1.5 km (wetsuit)',1.5,true), MOB],
    [REST, MOB],
    [RIDE('am','55 km',55), BRICK('1 km off the bike',1)],
    [R('am','13 km continuous',13)],
  ]},
  { n:9, start:'2026-08-17', phase:'Peak / Lakes', days:[
    [R('am','5 km continuous',5), CAM, CPM, MOB],
    [SW('#5 · OW 2.0 km (wetsuit)',2.0,true), MOB],
    [ST(40,' +5 kg pack'), { slot:'am', sport:'bike', title:'Stairs→bike brick', detail:'25 min easy spin immediately off stairs — simulate mountain-to-bike legs', km:8, hr:REC }, MOB],
    [REST, MOB],
    [RIDE('am','30 min easy / travel',10)],
    [{ slot:'am', sport:'run', title:'Mountain day', detail:'16–18 km · ~4–5 hr · hike + run + descents (Scafell)', km:17, hr:Z }],
    [RIDE('am','50–60 km Z2 or bike→mountain brick',55)],
  ]},
  { n:10, start:'2026-08-24', phase:'Taper', days:[
    [CAM, LOWERL, CPM, MOB],
    [R('am','6 km + 4×20s strides',6), CAM, CPM, MOB],
    [ST(25), MOB],
    [CAM, CPM, MOB],
    [REST, MOB],
    [RIDE('am','50 km',50)],
    [R('am','12 km continuous',12)],
  ]},
  { n:11, start:'2026-08-31', phase:'Race week', days:[
    [R('am','4 km + 3×20s strides',4), MOB],
    [SW('#6 · OW 1.5 km easy',1.5,true), MOB],
    [RIDE('am','30 min + 3×1 min openers',10)],
    [REST, MOB],
    [{ slot:'am', sport:'mobility', title:'Shakeout + gear prep', detail:'10 min jog · pack kit' }, MOB],
    [{ slot:'am', sport:'run', title:'🏁 RACE — ROC England', detail:'1.5k swim · 46.5k bike · 18k run · 45.5k bike · 1k run' }],
    [REST],
  ]},
];

/* ---------- Section 2: storage ---------- */
const KEYS = { plan:'roc_plan', hip:'roc_hip', settings:'roc_settings', garmin:'roc_garmin' };
const SEED_VERSION = 5;
const store = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); },
  remove(k){ localStorage.removeItem(k); },
};

function ymd(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function parseYMD(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function mondayOf(d){ const day=d.getDay(); const diff = day===0 ? -6 : 1-day; return addDays(d,diff); }

function buildSeed(){
  const out = [];
  for (const wk of WEEKS){
    const start = parseYMD(wk.start);
    wk.days.forEach((sessions, di) => {
      const date = ymd(addDays(start, di));
      sessions.forEach((s, si) => {
        out.push({ id:`${date}-${s.slot}-${si}`, date, status:'planned', actual:null, week:wk.n, phase:wk.phase, ...s });
      });
    });
  }
  return out;
}

function getPlan(){
  const saved = store.get(KEYS.plan);
  const settings = store.get(KEYS.settings) || {};
  if (saved && settings.seedVersion === SEED_VERSION) return saved;
  const seed = buildSeed();
  store.set(KEYS.plan, seed);
  store.set(KEYS.settings, { ...settings, seedVersion: SEED_VERSION });
  return seed;
}
function savePlan(p){ store.set(KEYS.plan, p); }
function getHip(){ return store.get(KEYS.hip) || {}; }
function saveHip(h){ store.set(KEYS.hip, h); }
function getGarmin(){ return store.get(KEYS.garmin) || null; }

/* ---------- Section 3: state ---------- */
const TODAY = ymd(new Date());
const state = {
  view: 'dashboard',
  plan: [],
  calWeekStart: null,   // Date (Monday)
  charts: [],
};

/* ---------- Section 4: plan helpers ---------- */
const isKey = s => s.sport !== 'rest' && s.sport !== 'mobility' && s.title !== 'Commute';
function sessionsOn(date){
  return state.plan.filter(s => s.date === date).sort((a,b)=> (a.slot===b.slot?0 : a.slot==='am'?-1:1));
}
function setStatus(id, status){
  const s = state.plan.find(x=>x.id===id); if(!s) return;
  s.status = s.status === status ? 'planned' : status;
  if (s.status !== 'done') s.autoMatched = false;
  savePlan(state.plan); rerender();
}
function updateSession(id, changes){
  const s = state.plan.find(x=>x.id===id); if(!s) return;
  Object.assign(s, changes); savePlan(state.plan); rerender();
}
function deleteSession(id){
  state.plan = state.plan.filter(x=>x.id!==id); savePlan(state.plan); rerender();
}
function addSession(date, slot){
  const id = `${date}-${slot}-${Date.now()}`;
  state.plan.push({ id, date, slot, sport:'run', title:'New session', detail:'', status:'planned', actual:null });
  savePlan(state.plan);
  openEditSheet(id);
}
function weekOf(date){
  // returns the WEEKS entry whose Mon–Sun contains date, or null
  const d = parseYMD(date);
  for (const wk of WEEKS){ const s=parseYMD(wk.start); if (d>=s && d<=addDays(s,6)) return wk; }
  return null;
}

/* ---------- Section 5: router ---------- */
function navigate(view){
  state.view = view;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav===view));
  rerender();
  document.getElementById('main-content').scrollTop = 0;
}
function rerender(){
  const v = state.view;
  if (v==='dashboard') renderDashboard();
  else if (v==='calendar') renderCalendar();
  else if (v==='trends') renderTrends();
  else if (v==='workouts') renderWorkouts();
}

/* ---------- Section 6: shared bits ---------- */
function sportIcon(sport){
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${SPORTS[sport]?.icon||''}</svg>`;
}
function sessionRow(s, opts={}){
  const tickCls = s.status==='done' ? (s.autoMatched?'tick auto':'tick on') : s.status==='skipped' ? 'tick skip' : 'tick';
  const tickIcon = s.status==='done'
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
    : s.status==='skipped' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>' : '';
  const detail = s.actual ? `${s.detail} · <span style="color:var(--accent);font-weight:600;">done ${s.actual.label}</span>` : s.detail;
  const hint = !s.actual ? paceHint(s) : null;
  const pills = [
    s.hr  ? `<span class="pill-hr">${s.hr}</span>` : '',
    hint  ? `<span class="pill-hint">${hint}</span>` : '',
  ].filter(Boolean).join('');
  const showTick = s.sport !== 'rest';
  return `
    <div class="sess ${s.status==='done'?'done':''}" data-action="edit-session" data-id="${s.id}">
      <div class="sess-icon ${s.sport}">${sportIcon(s.sport)}</div>
      <div class="sess-body">
        <div class="sess-title">${s.title}</div>
        ${detail ? `<div class="sess-detail">${detail}</div>`:''}
        ${pills  ? `<div class="sess-pills">${pills}</div>` : ''}
      </div>
      ${opts.slot===false ? '' : `<span class="sess-slot">${s.slot}</span>`}
      ${showTick ? `<div class="${tickCls}" data-action="tick" data-id="${s.id}">${tickIcon}</div>` : ''}
    </div>`;
}

/* ---------- Section 7: Dashboard ---------- */
function renderDashboard(){
  const mc = document.getElementById('main-content');
  const g = getGarmin();
  const today = sessionsOn(TODAY);
  const daysToRace = Math.max(0, Math.round((parseYMD(RACE_DATE)-parseYMD(TODAY))/86400000));

  // this week progress
  const wk = weekOf(TODAY);
  let progHTML = '';
  if (wk){
    const wkDates = Array.from({length:7},(_,i)=>ymd(addDays(parseYMD(wk.start),i)));
    const keys = state.plan.filter(s=>wkDates.includes(s.date) && isKey(s));
    const done = keys.filter(s=>s.status==='done').length;
    const pct = keys.length ? Math.round(done/keys.length*100) : 0;
    const keyListHTML = keys.map(s=>{
      const dow = parseYMD(s.date).toLocaleDateString('en-GB',{weekday:'short'});
      const dot = s.status==='done' ? `<span style="color:var(--accent);font-weight:700;">✓</span>`
                : s.status==='skipped' ? `<span style="color:var(--amber);font-weight:700;">–</span>`
                : `<span style="color:var(--text-3);">·</span>`;
      return `<div class="key-sess-row" data-action="edit-session" data-id="${s.id}">
        <span class="key-dow">${dow}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;">${s.title}</div>
          ${s.detail?`<div style="font-size:12px;color:var(--text-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.detail}</div>`:''}
          ${s.hr?`<div style="font-size:11px;color:var(--text-3);margin-top:1px;">${s.hr}</div>`:''}
        </div>
        ${dot}
      </div>`;
    }).join('');
    progHTML = `
      <div class="card" style="margin:0 16px 12px;">
        <div class="card-pad" style="cursor:pointer;" data-action="toggle-week-sessions">
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <div style="font-weight:700;">Week ${wk.n} · ${wk.phase}</div>
            <div style="font-size:13px;color:var(--text-2);">${done}/${keys.length} sessions <span id="week-tog" style="font-size:10px;opacity:0.6;">▾</span></div>
          </div>
          <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
        </div>
        <div id="week-key-list" style="display:none;border-top:1px solid var(--border);">${keyListHTML}</div>
      </div>`;
  }

  // readiness tiles
  const today_w = g?.wellness?.[TODAY];
  const tile = (label,val,sub,dot,mkey) => `
    <div class="metric${mkey?' metric-tap':''}" ${mkey?`data-action="metric-trend" data-metric="${mkey}"`:''}>
      <div class="metric-label">${dot?`<span class="metric-dot ${dot}"></span>`:''}${label}</div>
      <div class="metric-val ${val==null?'muted':''}">${val==null?'—':val}</div>
      <div class="metric-sub">${sub}${mkey?` <span style="font-size:10px;color:var(--text-3);">↗</span>`:''}</div>
    </div>`;
  const readiness = `
    <div class="section-label">Readiness ${today_w?'':'· sync Garmin to populate'}</div>
    <div class="dash-grid">
      ${tile('Sleep', today_w?.sleepScore??null, today_w?`${today_w.sleepHours??'–'} h`:'last night', '', 'sleepScore')}
      ${tile('HRV', today_w?.hrv??null, 'ms overnight', today_w?.hrvStatus==='balanced'?'dot-good':today_w?.hrvStatus?'dot-warn':'', 'hrv')}
      ${tile('Resting HR', today_w?.restingHr??null, 'bpm', '', 'restingHr')}
      ${tile('Body Battery', today_w?.bodyBattery??null, 'now', '', 'bodyBattery')}
    </div>`;

  // training load
  const acwr = computeAcwr(g);
  const loadHTML = (acwr && acwr.acute>0) ? `
    <div class="section-label">Training load</div>
    <div class="dash-grid">
      <div class="metric"><div class="metric-label">7-day load</div><div class="metric-val">${acwr.acute}</div><div class="metric-sub">acute</div></div>
      <div class="metric"><div class="metric-label"><span class="metric-dot ${acwrDot(acwr.acwr)}"></span>ACWR</div><div class="metric-val">${acwr.acwr ?? '—'}</div><div class="metric-sub">${acwrText(acwr.acwr)}</div></div>
    </div>` : '';

  // hip logger
  const hip = getHip();
  const todayHip = hip[TODAY];
  const hipDots = Array.from({length:11},(_,i)=>`<div class="hip-dot ${todayHip===i?'sel':''}" data-action="hip" data-val="${i}">${i}</div>`).join('');

  // next 3 days
  let upcoming = '';
  for (let i=1;i<=3;i++){
    const d = ymd(addDays(parseYMD(TODAY),i));
    const ss = sessionsOn(d).filter(isKey);
    if (!ss.length) continue;
    const dd = parseYMD(d);
    upcoming += `<div class="section-label" style="margin:14px 0 6px;">${dd.toLocaleDateString('en-GB',{weekday:'long', day:'numeric', month:'short'})}</div>
      <div class="card">${ss.map(s=>sessionRow(s)).join('')}</div>`;
  }

  mc.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">RO<span class="accent">C</span></div>
        <div class="page-sub">${daysToRace} days to race day</div></div>
    </div>

    <div class="section-label">Today · ${parseYMD(TODAY).toLocaleDateString('en-GB',{weekday:'long', day:'numeric', month:'short'})}</div>
    ${today.length
      ? `<div class="card">${today.map(s=>sessionRow(s)).join('')}</div>`
      : `<div class="card card-pad" style="color:var(--text-2);font-size:14px;">No sessions today. ${TODAY < PLAN_START ? 'Your plan starts Monday 22 Jun.' : 'Rest up.'}</div>`}

    ${progHTML}
    ${readiness}
    ${loadHTML}

    <div class="section-label">Right hip today (0 = perfect · 10 = bad)</div>
    <div class="card card-pad"><div class="hip-scale">${hipDots}</div></div>

    ${upcoming ? `<div class="section-label" style="margin-top:18px;">Coming up</div>${upcoming}` : ''}
    <div style="height:8px;"></div>
  `;
}

/* ---------- Section 8: Calendar ---------- */
function renderCalendar(){
  const mc = document.getElementById('main-content');
  if (!state.calWeekStart){
    const base = TODAY < PLAN_START ? parseYMD(PLAN_START) : new Date();
    state.calWeekStart = mondayOf(base);
  }
  const start = state.calWeekStart;
  const wk = weekOf(ymd(start));
  const range = `${start.toLocaleDateString('en-GB',{day:'numeric',month:'short'})} – ${addDays(start,6).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}`;

  let daysHTML = '';
  for (let i=0;i<7;i++){
    const d = addDays(start,i);
    const ds = ymd(d);
    const ss = sessionsOn(ds);
    const am = ss.filter(s=>s.slot==='am');
    const pm = ss.filter(s=>s.slot==='pm');
    const isToday = ds===TODAY;
    const wkTag = weekOf(ds);
    daysHTML += `
      <div class="day-block" data-date="${ds}">
        <div class="day-block-head ${isToday?'today':''}">
          <span class="dow">${d.toLocaleDateString('en-GB',{weekday:'short'})}</span>
          <span class="dom">${d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>
          ${wkTag?`<span class="day-tag">Wk ${wkTag.n} · ${wkTag.phase}</span>`:''}
        </div>
        <div class="slot-group">
          ${slotBlock('AM', am, ds, 'am')}
          ${slotBlock('PM', pm, ds, 'pm')}
          <button class="add-sess-btn" data-action="add-session" data-date="${ds}" data-slot="am">+ Add session</button>
        </div>
      </div>`;
  }

  mc.innerHTML = `
    <div class="page-header" style="padding-bottom:6px;"><div class="page-title">Calendar</div></div>
    <div class="cal-head">
      <button class="cal-nav-btn" data-action="cal-prev"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
      <div><div class="cal-week-label">${wk?`Week ${wk.n} · ${wk.phase}`:'Off-plan week'}</div><div class="cal-week-sub" style="text-align:center;">${range}</div></div>
      <button class="cal-nav-btn" data-action="cal-next"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
    </div>
    <div style="text-align:center;margin-bottom:8px;"><button class="cal-today-btn" data-action="cal-today">Jump to today</button></div>
    ${daysHTML}
    <div style="height:8px;"></div>
  `;
}
function slotBlock(label, sessions, ds, slot){
  return `<div class="slot-head">${label}</div>
    ${sessions.length ? sessions.map(s=>sessionRow(s,{slot:false})).join('')
      : `<div class="day-empty">—</div>`}`;
}

/* ---------- Section 9: Trends (placeholder until Garmin sync) ---------- */
function renderTrends(){
  const mc = document.getElementById('main-content');
  const g = getGarmin();
  if (!g){
    mc.innerHTML = `
      <div class="page-header"><div class="page-title">Trends</div></div>
      <div class="empty-state">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>
        <div class="empty-state-title">Graphs land with Garmin sync</div>
        <div class="empty-state-sub">MAF pace, resting HR &amp; HRV, weekly volume, training load and more will populate here once the nightly Garmin sync is connected.</div>
      </div>`;
    return;
  }
  const card = (id,title,sub)=>`<div class="trend-card"><div class="trend-title">${title}</div><div class="trend-sub">${sub}</div><div class="chart-wrap"><canvas id="c-${id}"></canvas></div><div class="trend-empty" id="n-${id}"></div></div>`;
  mc.innerHTML = `<div class="page-header"><div class="page-title">Trends</div></div>
    ${card('maf','MAF pace','Avg easy-run pace at HR ≤155 — lower is fitter')}
    ${card('vol','Weekly volume','Kilometres per sport')}
    ${card('rhr','Resting heart rate','Lower = better recovered')}
    ${card('hrv','HRV overnight','Higher &amp; stable = recovered')}
    ${card('vo2','VO₂max','Aerobic fitness estimate')}
    <div style="height:8px;"></div>`;
  destroyCharts();
  drawMaf(g);
  drawWeeklyVol(g);
  drawWellness(g,'rhr','restingHr','#ef4444');
  drawWellness(g,'hrv','hrv','#16a34a');
  drawVo2(g);
}

/* ---------- Section 10: Workouts (placeholder + Garmin feed) ---------- */
function renderWorkouts(){
  const mc = document.getElementById('main-content');
  const g = getGarmin();
  const acts = g?.activities || [];
  if (!acts.length){
    mc.innerHTML = `
      <div class="page-header"><div class="page-title">Workouts</div></div>
      <div class="empty-state">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
        <div class="empty-state-title">No Garmin activities yet</div>
        <div class="empty-state-sub">Once the nightly sync runs, your rides, runs and swims appear here with full stats — and tick off the matching planned session automatically.</div>
      </div>`;
    return;
  }
  mc.innerHTML = `<div class="page-header"><div class="page-title">Workouts</div></div>
    ${acts.map(a=>workoutCard(a)).join('')}<div style="height:8px;"></div>`;
}
function workoutCard(a){
  const pill = (l,v)=> v==null?'':`<span class="wk-pill">${l} <b>${v}</b></span>`;
  return `<div class="wk-card">
    <div class="wk-top"><div class="sess-icon ${a.sport}">${sportIcon(a.sport)}</div>
      <div class="wk-title">${a.title||SPORTS[a.sport]?.label}</div>
      ${a.matched?'<span class="wk-match">✓ matched</span>':''}
      <span class="wk-date">${parseYMD(a.date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</span></div>
    <div class="wk-stats">
      ${pill('Dist', a.km!=null?a.km+' km':null)}
      ${pill('Time', a.duration)}
      ${pill('Avg HR', a.avgHr?a.avgHr+' bpm':null)}
      ${pill('Pace', a.pace)}
      ${pill('Z2', a.z2pct!=null?a.z2pct+'%':null)}
      ${pill('Climb', a.elevation!=null?a.elevation+' m':null)}
    </div></div>`;
}

/* ---------- Section 11: Garmin apply (dormant until JSON exists) ---------- */
const GARMIN_SPORT = { running:'run', trail_running:'run', cycling:'bike', road_biking:'bike', virtual_ride:'bike', lap_swimming:'swim', open_water_swimming:'swim' };
function autoTick(){
  const g = getGarmin(); if (!g?.activities) return;
  let changed = false;
  for (const a of g.activities){
    a.matched = false;
    const cand = state.plan.filter(s =>
      s.sport === a.sport && isKey(s) && s.status !== 'done' &&
      Math.abs((parseYMD(s.date)-parseYMD(a.date))/86400000) <= 1
    );
    // best by distance closeness (fallback: any same-day same-sport)
    let best = null, bestDiff = Infinity;
    for (const s of cand){
      const sk = s.km, ak = a.km;
      let diff = 0;
      if (sk && ak) { const r = Math.abs(sk-ak)/sk; if (r > 0.45) continue; diff = r; }
      if (diff < bestDiff){ bestDiff = diff; best = s; }
    }
    if (best){ best.status='done'; best.autoMatched=true; best.actual={ label:a.km?`${a.km} km`:a.duration }; a.matched=true; changed=true; }
  }
  if (changed) savePlan(state.plan);
}
async function loadGarmin(){
  try{
    const res = await fetch(GARMIN_URL || 'garmin-data.json', { cache:'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    (data.activities||[]).forEach(a => { a.sport = GARMIN_SPORT[a.type] || a.type; });
    store.set(KEYS.garmin, data);
    autoTick();
    rerender();
  } catch { /* no file yet — fine */ }
}

/* ---------- Section 12: edit / add sheet ---------- */
let _sheetOnOpen = null;
function openSheet(title, html, onOpen){
  _sheetOnOpen = onOpen || null;
  document.getElementById('sheet-content').innerHTML = `<div class="sheet-title">${title}</div>${html}`;
  document.getElementById('sheet-overlay').classList.add('open');
  if (_sheetOnOpen) setTimeout(_sheetOnOpen, 50);
}
function closeSheet(){ document.getElementById('sheet-overlay').classList.remove('open'); }

let _metricChart = null;
function openMetricTrend(key){
  if(_metricChart){ try{_metricChart.destroy();}catch{} _metricChart=null; }
  const META = {
    sleepScore:  {title:'Sleep score',      color:'#6366f1', unit:''},
    hrv:         {title:'HRV overnight',    color:'#16a34a', unit:' ms'},
    restingHr:   {title:'Resting HR',       color:'#ef4444', unit:' bpm'},
    bodyBattery: {title:'Body Battery',     color:'#f59e0b', unit:''},
  };
  const m = META[key]; if(!m) return;
  const g = getGarmin();
  const days = Object.keys(g?.wellness||{}).sort().slice(-30);
  const pts = days.map(d=>({d, v:g.wellness[d]?.[key]})).filter(p=>p.v!=null);
  openSheet(m.title, `
    <div style="position:relative;height:200px;">
      <canvas id="mc" role="img" aria-label="${m.title} trend chart"></canvas>
    </div>
    ${pts.length
      ? `<div style="display:flex;justify-content:space-between;margin-top:14px;font-size:12px;color:var(--text-2);">
           <span>Last ${pts.length} readings</span>
           <span>Latest: <b style="color:var(--text);">${pts.at(-1).v}${m.unit}</b></span>
         </div>`
      : `<p style="text-align:center;color:var(--text-3);font-size:13px;margin-top:20px;">No data yet — keep syncing Garmin nightly.</p>`}
  `, ()=>{
    if(!pts.length) return;
    _metricChart = new Chart(document.getElementById('mc'),{
      type:'line',
      data:{ labels:pts.map(p=>p.d.slice(5)),
             datasets:[{data:pts.map(p=>p.v), borderColor:m.color,
                        backgroundColor:m.color+'20', fill:true, tension:0.35,
                        borderWidth:2, pointRadius:3, pointBackgroundColor:m.color}] },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{ x:{grid:{display:false},ticks:{color:'#9aa8a0',font:{size:11},maxTicksLimit:10}},
                 y:{grid:{color:'#eef2ef'},ticks:{color:'#9aa8a0',font:{size:11}}} } }
    });
  });
}

function openEditSheet(id){
  const s = state.plan.find(x=>x.id===id); if(!s) return;
  const sportOpts = Object.keys(SPORTS).map(k=>`<option value="${k}" ${s.sport===k?'selected':''}>${SPORTS[k].label}</option>`).join('');
  openSheet('Edit session', `
    <div class="form-group"><label class="form-label">Title</label>
      <input class="form-input" id="f-title" value="${(s.title||'').replace(/"/g,'&quot;')}"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Sport</label>
        <select class="form-select" id="f-sport">${sportOpts}</select></div>
      <div class="form-group"><label class="form-label">Slot</label>
        <div class="segmented" id="f-slot">
          <button class="seg-btn ${s.slot==='am'?'active':''}" data-slot="am">AM</button>
          <button class="seg-btn ${s.slot==='pm'?'active':''}" data-slot="pm">PM</button>
        </div></div>
    </div>
    <div class="form-group"><label class="form-label">Detail / target</label>
      <input class="form-input" id="f-detail" value="${(s.detail||'').replace(/"/g,'&quot;')}"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Distance (km)</label>
        <input class="form-input" id="f-km" inputmode="decimal" value="${s.km??''}"></div>
      <div class="form-group"><label class="form-label">Date</label>
        <input class="form-input" id="f-date" type="date" value="${s.date}"></div>
    </div>
    <div class="form-group"><label class="form-label">Status</label>
      <div class="segmented" id="f-status">
        <button class="seg-btn ${s.status==='planned'?'active':''}" data-status="planned">Planned</button>
        <button class="seg-btn ${s.status==='done'?'active':''}" data-status="done">Done</button>
        <button class="seg-btn ${s.status==='skipped'?'active':''}" data-status="skipped">Skipped</button>
      </div></div>
    <button class="btn-primary-full" id="f-save">Save</button>
    <button class="btn-danger-text" data-action="delete-session" data-id="${id}">Delete session</button>
  `, () => {
    let slot = s.slot, status = s.status;
    document.querySelectorAll('#f-slot .seg-btn').forEach(b=>b.addEventListener('click',()=>{ slot=b.dataset.slot; document.querySelectorAll('#f-slot .seg-btn').forEach(x=>x.classList.toggle('active',x===b)); }));
    document.querySelectorAll('#f-status .seg-btn').forEach(b=>b.addEventListener('click',()=>{ status=b.dataset.status; document.querySelectorAll('#f-status .seg-btn').forEach(x=>x.classList.toggle('active',x===b)); }));
    document.getElementById('f-save').addEventListener('click',()=>{
      const kmv = parseFloat(document.getElementById('f-km').value);
      updateSession(id, {
        title: document.getElementById('f-title').value.trim() || 'Session',
        sport: document.getElementById('f-sport').value,
        detail: document.getElementById('f-detail').value.trim(),
        km: isNaN(kmv)?undefined:kmv,
        date: document.getElementById('f-date').value || s.date,
        slot, status,
        autoMatched: status==='done' ? s.autoMatched : false,
      });
      closeSheet();
      showToast('Saved');
    });
  });
}

/* ---------- Section 13: toast ---------- */
function showToast(msg, type='info'){
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<div class="toast-dot"></div>${msg}`;
  c.appendChild(t);
  setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(),280); }, 2600);
}

/* ---------- Section 14: charts ---------- */
function paceLabel(secPerKm){
  const m = Math.floor(secPerKm/60), s = Math.round(secPerKm%60);
  return `${m}:${String(s).padStart(2,'0')}`;
}
function paceHint(s){
  if (s.sport==='run' && s.hr && s.hr.includes('145') && s.title!=='Brick run'){
    const g = getGarmin();
    const mafPts = (g?.maf||[]).filter(p=>p.pace).slice(-5);
    if (mafPts.length>=2){
      const avg = mafPts.reduce((a,p)=>a+p.pace,0)/mafPts.length;
      return `~${paceLabel(Math.round(avg))} /km (MAF)`;
    }
    return '~7:00–7:30 /km';
  }
  if (s.sport==='bike' && s.title==='Ride' && s.hr && s.hr.includes('145')) return 'aim 22–28 km/h';
  if (s.sport==='stairs') return 'no hands on rails';
  return null;
}
function destroyCharts(){ (state.charts||[]).forEach(c=>{ try{c.destroy();}catch{} }); state.charts=[]; }
function noData(id){ const c=document.getElementById('c-'+id); if(c)c.style.display='none'; const n=document.getElementById('n-'+id); if(n)n.textContent='Not enough data yet — keep syncing.'; }
function axes(extraY){ return { x:{grid:{display:false},ticks:{color:'#9aa8a0',font:{size:11}}}, y: extraY || {grid:{color:'#eef2ef'},ticks:{color:'#9aa8a0',font:{size:11}}} }; }

function drawMaf(g){
  const pts=(g.maf||[]).filter(p=>p.pace); if(pts.length<1) return noData('maf');
  state.charts.push(new Chart(document.getElementById('c-maf'),{ type:'line',
    data:{ labels:pts.map(p=>p.date.slice(5)), datasets:[{ data:pts.map(p=>p.pace), borderColor:'#16a34a', backgroundColor:'rgba(34,197,94,0.10)', fill:true, tension:0.3, borderWidth:2, pointRadius:3, pointBackgroundColor:'#16a34a' }] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>paceLabel(c.parsed.y)+' /km'}} },
      scales: axes({ reverse:true, grid:{color:'#eef2ef'}, ticks:{color:'#9aa8a0',font:{size:11}, callback:v=>paceLabel(v)} }) } }));
}
function drawWellness(g,id,key,color){
  const days=Object.keys(g.wellness||{}).sort(); const labels=[],data=[];
  for(const d of days){ const v=g.wellness[d]?.[key]; if(v!=null){ labels.push(d.slice(5)); data.push(v); } }
  if(data.length<1) return noData(id);
  state.charts.push(new Chart(document.getElementById('c-'+id),{ type:'line',
    data:{ labels, datasets:[{ data, borderColor:color, backgroundColor:color+'1a', fill:true, tension:0.3, borderWidth:2, pointRadius:3, pointBackgroundColor:color }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales: axes() } }));
}
function drawVo2(g){
  const pts=g.vo2||[]; if(pts.length<1) return noData('vo2');
  state.charts.push(new Chart(document.getElementById('c-vo2'),{ type:'line',
    data:{ labels:pts.map(p=>p.date.slice(5)), datasets:[{ data:pts.map(p=>p.value), borderColor:'#7c3aed', backgroundColor:'rgba(124,58,237,0.10)', fill:true, tension:0.3, borderWidth:2, pointRadius:3, pointBackgroundColor:'#7c3aed' }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales: axes() } }));
}
function drawWeeklyVol(g){
  const acts=(g.activities||[]).filter(a=>a.km); if(!acts.length) return noData('vol');
  const wk={};
  for(const a of acts){ const mon=ymd(mondayOf(parseYMD(a.date))); wk[mon]=wk[mon]||{run:0,bike:0,swim:0}; const s=GARMIN_SPORT[a.type]||a.type; if(wk[mon][s]!=null) wk[mon][s]+=a.km; }
  const labels=Object.keys(wk).sort();
  const ds=(sport,color)=>({ label:sport, data:labels.map(l=>+wk[l][sport].toFixed(1)), backgroundColor:color, stack:'v', borderRadius:4 });
  state.charts.push(new Chart(document.getElementById('c-vol'),{ type:'bar',
    data:{ labels:labels.map(l=>l.slice(5)), datasets:[ds('run','#22c55e'),ds('bike','#0284c7'),ds('swim','#06b6d4')] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:true,labels:{boxWidth:10,font:{size:11},color:'#5b6b60'}} },
      scales:{ x:{stacked:true,grid:{display:false},ticks:{color:'#9aa8a0',font:{size:10}}}, y:{stacked:true,grid:{color:'#eef2ef'},ticks:{color:'#9aa8a0',font:{size:11}}} } } }));
}

function computeAcwr(g){
  if(!g?.activities) return null;
  const byDay={}; g.activities.forEach(a=>{ if(a.load) byDay[a.date]=(byDay[a.date]||0)+a.load; });
  const today=parseYMD(TODAY); let acute=0, chronic=0;
  for(let i=0;i<28;i++){ const l=byDay[ymd(addDays(today,-i))]||0; chronic+=l; if(i<7) acute+=l; }
  const chronicWeekly=chronic/4;
  return { acute:Math.round(acute), acwr: chronicWeekly>0 ? +(acute/chronicWeekly).toFixed(2) : null };
}
function acwrDot(v){ if(v==null) return ''; if(v>1.5) return 'dot-bad'; if(v>=0.8&&v<=1.3) return 'dot-good'; return 'dot-warn'; }
function acwrText(v){ if(v==null) return 'sweet spot 0.8–1.3'; if(v>1.5) return 'high — ease off'; if(v<0.8) return 'building'; if(v<=1.3) return 'sweet spot'; return 'elevated'; }

/* ---------- Section 15a: calendar drag-and-drop (long press) ---------- */
let _drag = {}, _dragTimer = null;

function cancelDrag(){
  clearTimeout(_dragTimer); _dragTimer = null;
  if(_drag.ghost) _drag.ghost.remove();
  if(_drag.el) _drag.el.style.opacity = '';
  document.querySelectorAll('.day-block').forEach(b=>b.classList.remove('drag-over'));
  _drag = {};
}

function handleTouchMove(e){
  if(_drag.id && !_drag.active){
    const t = e.touches[0];
    if(Math.abs(t.clientX-_drag.sx)>8 || Math.abs(t.clientY-_drag.sy)>8) cancelDrag();
    return;
  }
  if(!_drag.active) return;
  e.preventDefault();
  const t = e.touches[0];
  if(_drag.ghost){ _drag.ghost.style.left=(t.clientX-_drag.ox)+'px'; _drag.ghost.style.top=(t.clientY-_drag.oy)+'px'; }
  document.querySelectorAll('.day-block').forEach(b=>b.classList.remove('drag-over'));
  const hit = document.elementFromPoint(t.clientX,t.clientY)?.closest('.day-block[data-date]');
  if(hit) hit.classList.add('drag-over');
}

function handleTouchEnd(e){
  if(!_drag.active){ cancelDrag(); return; }
  const t = (e.changedTouches||[])[0];
  if(t){
    const hit = document.elementFromPoint(t.clientX,t.clientY)?.closest('.day-block[data-date]');
    if(hit){
      const newDate = hit.dataset.date;
      const sess = state.plan.find(s=>s.id===_drag.id);
      if(sess && sess.date!==newDate){
        updateSession(_drag.id,{date:newDate});
        showToast('Moved to '+parseYMD(newDate).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}));
      }
    }
  }
  cancelDrag();
}

/* ---------- Section 15: events ---------- */
function handleClick(e){
  const t = e.target.closest('[data-action]'); if(!t) return;
  const a = t.dataset.action;
  if (a==='tick'){ e.stopPropagation(); setStatus(t.dataset.id, 'done'); return; }
  if (a==='edit-session'){ openEditSheet(t.dataset.id); return; }
  if (a==='delete-session'){ deleteSession(t.dataset.id); closeSheet(); showToast('Deleted'); return; }
  if (a==='add-session'){ addSession(t.dataset.date, t.dataset.slot); return; }
  if (a==='hip'){ const h=getHip(); const v=+t.dataset.val; h[TODAY] = h[TODAY]===v?undefined:v; saveHip(h); renderDashboard(); return; }
  if (a==='cal-prev'){ state.calWeekStart = addDays(state.calWeekStart,-7); renderCalendar(); return; }
  if (a==='cal-next'){ state.calWeekStart = addDays(state.calWeekStart, 7); renderCalendar(); return; }
  if (a==='cal-today'){ state.calWeekStart = mondayOf(TODAY<PLAN_START?parseYMD(PLAN_START):new Date()); renderCalendar(); return; }
  if (a==='toggle-week-sessions'){
    const list = document.getElementById('week-key-list');
    const tog  = document.getElementById('week-tog');
    if(!list) return;
    const open = list.style.display==='none';
    list.style.display = open?'block':'none';
    if(tog) tog.textContent = open?'▴':'▾';
    return;
  }
  if (a==='metric-trend'){ openMetricTrend(t.dataset.metric); return; }
}
function initEvents(){
  const mc = document.getElementById('main-content');
  mc.addEventListener('click', handleClick);
  document.getElementById('sheet-overlay').addEventListener('click', e=>{
    if (e.target===document.getElementById('sheet-overlay')) closeSheet();
    else handleClick(e);
  });
  document.getElementById('bottom-nav').addEventListener('click', e=>{
    const b=e.target.closest('[data-nav]'); if(b) navigate(b.dataset.nav);
  });
  // Calendar long-press drag
  mc.addEventListener('touchstart', e=>{
    if(state.view!=='calendar') return;
    const sess = e.target.closest('.sess[data-id]');
    if(!sess || e.target.closest('[data-action="tick"]')) return;
    const touch = e.touches[0];
    _drag = { id:sess.dataset.id, el:sess, sx:touch.clientX, sy:touch.clientY, active:false };
    _dragTimer = setTimeout(()=>{
      if(!_drag.id) return;
      _drag.active = true;
      const rect = sess.getBoundingClientRect();
      _drag.ox = touch.clientX-rect.left; _drag.oy = touch.clientY-rect.top;
      const g = sess.cloneNode(true);
      g.style.cssText = `position:fixed;width:${rect.width}px;left:${touch.clientX-_drag.ox}px;top:${touch.clientY-_drag.oy}px;z-index:999;opacity:0.92;pointer-events:none;box-shadow:0 10px 36px rgba(0,0,0,0.22);border-radius:12px;background:var(--surface);`;
      document.body.appendChild(g);
      _drag.ghost = g;
      sess.style.opacity = '0.25';
      if(navigator.vibrate) navigator.vibrate(40);
    }, 500);
  }, {passive:true});
  document.addEventListener('touchmove', handleTouchMove, {passive:false});
  document.addEventListener('touchend', handleTouchEnd);
  document.addEventListener('touchcancel', cancelDrag);
}

/* ---------- Section 16: init ---------- */
function init(){
  state.plan = getPlan();
  autoTick();
  initEvents();
  navigate('dashboard');
  loadGarmin();   // fetch garmin-data.json if present
}
document.addEventListener('DOMContentLoaded', init);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
