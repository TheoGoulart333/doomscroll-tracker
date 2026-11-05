// popup.js v2 — completo, humano, animado

// ── Dados de domínio ──────────────────────────────────────────
const DOMAIN_META = {
  'reddit.com':    { icon:'🤖', color:'#ff4500' },
  'twitter.com':   { icon:'🐦', color:'#1da1f2' },
  'x.com':         { icon:'𝕏',  color:'#ffffff' },
  'youtube.com':   { icon:'▶️', color:'#ff0000' },
  'instagram.com': { icon:'📸', color:'#e1306c' },
  'tiktok.com':    { icon:'🎵', color:'#69c9d0' },
  'facebook.com':  { icon:'👥', color:'#1877f2' },
  'huffpost.com':  { icon:'📰', color:'#00aeef' },
  'buzzfeed.com':  { icon:'🐝', color:'#ee3322' },
  'twitch.tv':     { icon:'🎮', color:'#9146ff' },
  'linkedin.com':  { icon:'💼', color:'#0a66c2' },
};

const DAYS_SHORT = { 'pt-BR':['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'], en:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] };

// ── Estado global ─────────────────────────────────────────────
let currentDomains = [];
let liveInterval   = null;
let liveElapsed    = 0;
let statsCache     = {};
let currentLang    = 'pt-BR';

const COPY = {
  'pt-BR': {
    today:'Hoje', week:'Semana', settings:'Ajustes', active:'Contando', paused:'Pausado',
    minutes:'minutos', hours:'horas', day:'dia', days:'dias', record:'Recorde',
    todayCompare:'vs ontem', weekCompare:'vs semana passada',
    limitReached:'Limite alcançado por hoje. Se puder, faça uma pausa.',
    noSites:'Nenhum site monitorado por enquanto.',
    startTitle:'Seu tempo, com mais intenção.', startCopy:'Acompanhe seus hábitos sem julgamentos. Você escolhe quais sites entram na conta e define seu próprio ritmo.',
    privacy:'🔒 Seus dados ficam neste navegador. O Doomscroll Tracker não envia histórico para nenhum servidor.',
    language:'Idioma', start:'Ativar monitoramento', skip:'Continuar sem monitorar', permissionExplainer:'O Chrome vai pedir acesso apenas aos sites da sua lista, para reconhecer quando você está neles.', permissionDenied:'Sem esse acesso, a extensão não consegue contar o tempo. Você pode tentar de novo ou continuar sem monitorar por enquanto.', permissionMissing:'Para contar o tempo, escolha os sites e autorize o acesso a eles em Configurações.', savePermissionDenied:'O acesso aos sites não foi autorizado; as alterações não foram salvas.', saved:'Ajustes salvos.', limit:'Limite diário', weekLabel:'Esta semana',
    streak:'dias dentro da sua meta', streakStart:'Seu primeiro dia começa hoje',
    goal:'Meta: {limit} min/dia — {left} min restantes', left:'{left} min restantes hoje',
    hit:'Limite alcançado ({limit} min)', sitesToday:'Sites hoje', last7:'Últimos 7 dias',
    topSites:'Sites mais acessados', sessions:'Sessões recentes', export:'📥 Exportar CSV',
    avg:'Média (min)', best:'Menor uso', worst:'Maior uso',
    alert:'Alertas de limite', alertSub:'Avisos ao chegar a 80% e 100%',
    setLimit:'Aviso ao atingir', setLimitSub:'Escolha uma referência diária que faça sentido para você',
    notifications:'Notificações', monitored:'Sites monitorados', weeklyReport:'Resumo semanal', weeklyToggle:'Lembrete semanal', weeklySub:'Receba um resumo uma vez por semana', livePrefix:'Agora em', add:'+ Adicionar',
    save:'Salvar ajustes', saved:'Salvo', more:'Mais opções', reset:'Apagar histórico',
    emptySessions:'Nenhuma sessão registrada ainda.', nothing:'Nada registrado ainda hoje.',
    confirmReset:'Apagar todo o histórico deste navegador? Essa ação não pode ser desfeita.',
    onTrack:'Dentro da sua meta. Seu uso hoje: {today} min.', gentle:'Você está chegando à sua meta diária. Que tal uma pausa?',
    progress:'Você já chegou à sua meta de hoje. Uma pausa pode ajudar.',
  },
  en: {
    today:'Today', week:'Week', settings:'Settings', active:'Tracking', paused:'Paused',
    minutes:'minutes', hours:'hours', day:'day', days:'days', record:'Best',
    todayCompare:'vs yesterday', weekCompare:'vs last week',
    limitReached:'That’s your daily goal. Consider taking a break.',
    noSites:'No tracked sites yet.',
    startTitle:'Make more room for your time.', startCopy:'Notice your habits without judgment. Choose which sites count and set a pace that feels right for you.',
    privacy:'🔒 Your data stays in this browser. Doomscroll Tracker never sends your browsing history to a server.',
    language:'Language', start:'Enable tracking', skip:'Continue without tracking', permissionExplainer:'Chrome will ask for access only to sites in your list so the extension can recognize when you visit them.', permissionDenied:'Without this access, the extension cannot count time. Try again or continue without tracking for now.', permissionMissing:'To count time, choose sites and allow access to them in Settings.', savePermissionDenied:'Site access was not granted, so settings were not saved.', saved:'Settings saved.', limit:'Daily goal', weekLabel:'This week',
    streak:'days within your goal', streakStart:'Today is a fresh start',
    goal:'Goal: {limit} min/day — {left} min left', left:'{left} min left today',
    hit:'Daily goal reached ({limit} min)', sitesToday:'Sites today', last7:'Last 7 days',
    topSites:'Most visited sites', sessions:'Recent sessions', export:'📥 Export CSV',
    avg:'Average (min)', best:'Lowest day', worst:'Highest use',
    alert:'Goal alerts', alertSub:'Alerts at 80% and 100%',
    setLimit:'Daily goal', setLimitSub:'Choose a daily reference that works for you',
    notifications:'Notifications', monitored:'Tracked sites', weeklyReport:'Weekly summary', weeklyToggle:'Weekly reminder', weeklySub:'Get a short summary once a week', livePrefix:'Now on', add:'+ Add',
    save:'Save settings', saved:'Saved', more:'More options', reset:'Clear history',
    emptySessions:'No sessions recorded yet.', nothing:'Nothing recorded today yet.',
    confirmReset:'Clear all history in this browser? This cannot be undone.',
    onTrack:'Within your goal. Today’s usage: {today} min.', gentle:'You’re nearing your daily goal. How about a short break?',
    progress:'You’ve reached today’s goal. A break may help.',
  }
};
function tr(key, vars = {}) { return (COPY[currentLang][key] || COPY['pt-BR'][key] || key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');}
function applyLanguage(lang) {
  currentLang = lang === 'en' ? 'en' : 'pt-BR';
  document.documentElement.lang = currentLang;
  document.getElementById('welcome-title').textContent = tr('startTitle');
  document.getElementById('welcome-copy').textContent = tr('startCopy');
  document.getElementById('welcome-privacy').textContent = tr('privacy');
  document.getElementById('permission-explainer').textContent = tr('permissionExplainer');
  document.getElementById('welcome-skip').textContent = tr('skip');
  document.getElementById('welcome-language-label').textContent = tr('language');
  document.getElementById('welcome-start').textContent = tr('start');
  document.getElementById('language-label').textContent = tr('language');
  document.querySelectorAll('.tab').forEach((el,i) => el.textContent = [tr('today'),tr('week'),tr('settings')][i]);
  document.querySelector('.tabs').setAttribute('aria-label', currentLang === 'en' ? 'Doomscroll Tracker navigation' : 'Navegação do Doomscroll Tracker');
  document.querySelectorAll('.card-label').forEach((el,i) => el.textContent = [tr('today'),tr('weekLabel')][i]);
  document.getElementById('best-label').textContent = tr('record');
  document.getElementById('progress-label').textContent = tr('limit');
  document.getElementById('live-prefix').textContent = tr('livePrefix');
  document.getElementById('weekly-label').textContent = tr('weeklyReport');
  document.getElementById('weekly-toggle-label').textContent = tr('weeklyToggle');
  document.getElementById('weekly-toggle-sub').textContent = tr('weeklySub');
  document.getElementById('best-unit').textContent = tr('days');
  document.getElementById('pause-btn').title = currentLang === 'en' ? 'Pause or resume tracking' : 'Pausar ou retomar a contagem';
  document.getElementById('today-unit').textContent = tr('minutes');
  document.getElementById('week-unit').textContent = tr('minutes');
  document.querySelectorAll('.section-label').forEach((el,i) => el.textContent = [tr('sitesToday'),tr('last7'),tr('topSites'),tr('sessions')][i]);
  document.querySelectorAll('.set-label').forEach((el,i) => el.textContent = [tr('limit'),tr('notifications'),tr('weeklyReport'),tr('monitored'),tr('language')][i]);
  document.querySelectorAll('.set-row-label').forEach((el,i) => el.textContent = [tr('setLimit'),tr('alert'),tr('weeklyToggle')][i]);
  document.querySelectorAll('.set-row-sub').forEach((el,i) => el.textContent = [tr('setLimitSub'),tr('alertSub'),tr('weeklySub')][i]);
  document.getElementById('domain-input').placeholder = currentLang === 'en' ? 'e.g. twitch.tv' : 'ex.: twitch.tv';
  document.getElementById('domain-add-btn').textContent = tr('add');
  document.getElementById('export-btn').textContent = tr('export');
  document.getElementById('save-settings-btn').textContent = tr('save');
  document.getElementById('options-btn').textContent = `⚙️ ${tr('more')}`;
  document.getElementById('reset-btn').textContent = `⌫ ${tr('reset')}`;
  document.getElementById('language-input').value = currentLang;
  document.getElementById('welcome-lang').value = currentLang;
  if (statsCache && Object.keys(statsCache).length) { renderToday(statsCache); renderWeek(statsCache); updateStatusPill(statsCache.isPaused); }
}


// ── Helpers ───────────────────────────────────────────────────

function todayStr() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

function last7DaysArr() {
  return Array.from({length:7}, (_,i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6-i));
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
}

function fmt(min) {
  if (min < 60) return `${min}`;
  const h = Math.floor(min/60), m = min%60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtLive(seconds) {
  const m = Math.floor(seconds/60), s = seconds%60;
  return `${m}:${String(s).padStart(2,'0')}`;
}

function domainIcon(d)  { return (DOMAIN_META[d] || {}).icon  || '🌐'; }

// ── Mensagens dinâmicas (com personalidade) ────────────────────

function getMood(todayMin, limit) {
  const pct = (todayMin/limit)*100;
  if (todayMin === 0)
    return { emoji:'😌', text:currentLang === 'en' ? '<strong>A fresh start.</strong><br>No tracked time yet today.' : '<strong>Um novo dia por aqui.</strong><br>Nenhum tempo monitorado ainda.' };
  if (pct <= 20)
    return { emoji:'🌿', text:currentLang === 'en' ? `<strong>A calm start.</strong><br>${todayMin} min of tracked time today.` : `<strong>Um começo tranquilo.</strong><br>${todayMin} min de tempo monitorado hoje.` };
  if (pct <= 50)
    return { emoji:'😐', text:currentLang === 'en' ? `<strong>Steady so far.</strong><br>${todayMin} min of tracked time.` : `<strong>Até aqui, tudo bem.</strong><br>${todayMin} min de tempo monitorado.` };
  if (pct <= 70)
    return { emoji:'🌿', text:currentLang === 'en' ? `<strong>Getting close to your goal.</strong><br>${todayMin} min today. A short pause can help.` : `<strong>Chegando perto da sua meta.</strong><br>${todayMin} min hoje. Uma pausa pode ajudar.` };
  if (pct <= 90)
    return { emoji:'🌿', text:currentLang === 'en' ? `<strong>You’re near your goal.</strong><br>${limit - todayMin} min left, if you want to keep track.` : `<strong>Você está perto da sua meta.</strong><br>Restam ${limit - todayMin} min, se quiser seguir acompanhando.` };
  if (pct < 100)
    return { emoji:'🌿', text:currentLang === 'en' ? `<strong>Almost at your goal.</strong><br>${limit - todayMin} min remaining today.` : `<strong>Quase na sua meta.</strong><br>Restam ${limit - todayMin} min hoje.` };
  return { emoji:'🌱', text:`<strong>${tr('limitReached')}</strong><br>${currentLang === 'en' ? 'You can adjust this goal any time.' : 'Você pode mudar essa meta quando quiser.'}` };
}

function getStreakMessage(streak) {
  if (streak === 0) return tr('streakStart');
  if (streak === 1) return currentLang === 'en' ? 'First day within your goal 👏' : 'Primeiro dia dentro da sua meta 👏';
  if (streak < 4)  return currentLang === 'en' ? `${streak} days within your goal` : `${streak} dias dentro da sua meta`;
  if (streak < 7)  return currentLang === 'en' ? `${streak} days in a row — nice work` : `${streak} dias seguidos — bom ritmo`;
  if (streak < 14) return currentLang === 'en' ? `${streak} days — impressive 🌟` : `${streak} dias — que sequência 🌟`;
  return currentLang === 'en' ? `${streak} days in a row 🏆` : `${streak} dias seguidos 🏆`;
}

// ── Carrega dados ─────────────────────────────────────────────

async function loadStats() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type:'getStats' }, res => {
      if (chrome.runtime.lastError || !res) return resolve({});
      resolve(res);
    });
  });
}

// ── Render: Hoje ───────────────────────────────────────────────

function renderToday(s) {
  const { today:storedToday=0, week:storedWeek=0, yesterday=0, lastWeek=0, dailyLimit:limit=60, streak=0, bestStreak=0, siteDaily={} } = s;
  const liveMinutes = s.liveSession ? Math.floor((s.liveSession.elapsedSec || 0) / 60) : 0;
  const today = storedToday + liveMinutes;
  const week = storedWeek + liveMinutes;

  // Data header
  document.getElementById('h-date').textContent = new Date().toLocaleDateString(currentLang === 'en' ? 'en-US' : 'pt-BR', {weekday:'long',day:'numeric',month:'long'});

  // Hero
  document.getElementById('today-val').textContent = fmt(today);
  document.getElementById('today-unit').textContent = today < 60 ? tr('minutes') : tr('hours');
  document.getElementById('week-val').textContent   = fmt(week);
  document.getElementById('week-unit').textContent  = week  < 60 ? tr('minutes') : tr('hours');

  // Deltas
  const deltaToday = today - yesterday;
  const deltaEl    = document.getElementById('today-delta');
  if (yesterday > 0) {
    const pct  = Math.abs(Math.round((deltaToday/yesterday)*100));
    const sign = deltaToday >= 0 ? '↑' : '↓';
    deltaEl.textContent = `${sign} ${pct}% ${tr('todayCompare')}`;
    deltaEl.className   = `card-delta ${deltaToday >= 0 ? 'up' : 'down'}`;
  } else { deltaEl.textContent = ''; }

  const deltaWeek = week - lastWeek;
  const deltaWEl  = document.getElementById('week-delta');
  if (lastWeek > 0) {
    const pct  = Math.abs(Math.round((deltaWeek/lastWeek)*100));
    const sign = deltaWeek >= 0 ? '↑' : '↓';
    deltaWEl.textContent = `${sign} ${pct}% ${tr('weekCompare')}`;
    deltaWEl.className   = `card-delta ${deltaWeek >= 0 ? 'up' : 'down'}`;
  } else { deltaWEl.textContent = ''; }

  // Mood
  const mood = s.trackingPermissionGranted === false
    ? { emoji:'🔒', text:`<strong>${tr('permissionMissing')}</strong>` }
    : getMood(today, limit);
  document.getElementById('mood-emoji').textContent = mood.emoji;
  document.getElementById('mood-text').innerHTML    = mood.text;

  // Streak
  document.getElementById('streak-num').textContent   = streak;
  document.getElementById('streak-desc').textContent  = getStreakMessage(streak);
  document.getElementById('best-streak').textContent  = bestStreak;
  document.getElementById('streak-flame').textContent = streak >= 7 ? '🏆' : streak >= 3 ? '🔥' : '🌱';

  // Progress bar
  const pct  = Math.min(Math.round((today/limit)*100), 100);
  const bar  = document.getElementById('limit-bar');
  const pctEl= document.getElementById('limit-pct');
  const hint = document.getElementById('limit-hint');

  bar.style.width  = `${pct}%`;
  pctEl.textContent = `${pct}%`;
  bar.className = 'progress-bar-fill ' + (pct >= 90 ? 'pf-high' : pct >= 60 ? 'pf-mid' : 'pf-low');
  pctEl.style.color = pct >= 90 ? 'var(--rose)' : pct >= 60 ? 'var(--amber)' : 'var(--accent2)';

  if (pct >= 100) {
    hint.textContent   = tr('hit', {limit});
    hint.style.color   = 'var(--rose)';
  } else if (pct >= 70) {
    hint.textContent   = tr('left', {left: limit - today});
    hint.style.color   = 'var(--amber)';
  } else {
    hint.textContent   = tr('goal', {limit, left: limit - today});
    hint.style.color   = '';
  }

  // Sites hoje
  const todayKey  = todayStr();
  const todaySites = { ...(siteDaily[todayKey] || {}) };
  if (s.liveSession && liveMinutes > 0) todaySites[s.liveSession.domain] = (todaySites[s.liveSession.domain] || 0) + liveMinutes;
  renderSites('sites-today', todaySites);

  // Celebração se streak novo > 3
  if (streak > 3 && today === 0) triggerConfetti();
}

// ── Render: Semana ─────────────────────────────────────────────

function renderWeek(s) {
  const { daily={}, siteDaily={}, sessions=[], dailyLimit:limit=60 } = s;
  const days = last7DaysArr();
  const todayKey = todayStr();
  const effectiveDaily = { ...daily };
  const liveMinutes = s.liveSession ? Math.floor((s.liveSession.elapsedSec || 0) / 60) : 0;
  if (liveMinutes) effectiveDaily[todayKey] = (effectiveDaily[todayKey] || 0) + liveMinutes;
  const values   = days.map(d => effectiveDaily[d] || 0);
  const max      = Math.max(...values, 1);

  // Bars
  const barsEl = document.getElementById('weekly-bars');
  barsEl.innerHTML = '';
  days.forEach((dateStr, i) => {
    const val    = values[i];
    const pct    = Math.max((val/max)*100, val > 0 ? 5 : 2);
    const dayName= DAYS_SHORT[currentLang][new Date(dateStr+'T12:00:00').getDay()];
    const isToday= dateStr === todayKey;

    const col = document.createElement('div');
    col.className = 'bar-col';
    col.title = `${dayName}: ${val} min`;

    const bar = document.createElement('div');
    bar.style.height = `${pct}%`;
    bar.className = 'bar' +
      (isToday ? ' is-today' : val > limit ? ' over-limit' : val > 0 ? ' has-data' : '');

    const lbl = document.createElement('div');
    lbl.className = 'bar-label' + (isToday ? ' active' : '');
    lbl.textContent = dayName;

    col.appendChild(bar);
    col.appendChild(lbl);
    barsEl.appendChild(col);
  });

  // Summary pills
  const nonZero  = values.filter(v=>v>0);
  const avg      = nonZero.length ? Math.round(nonZero.reduce((a,b)=>a+b,0)/nonZero.length) : 0;
  const best     = Math.min(...values.filter(v=>v>0), Infinity);
  const worst    = Math.max(...values, 0);
  const sumEl    = document.getElementById('chart-summary');
  sumEl.innerHTML = `
    <div class="chart-pill"><div class="cp-val">${avg}</div><div class="cp-lbl">Média (min)</div></div>
    <div class="chart-pill"><div class="cp-val">${best === Infinity ? '—' : best}</div><div class="cp-lbl">Melhor dia</div></div>
    <div class="chart-pill"><div class="cp-val">${worst}</div><div class="cp-lbl">Pior dia</div></div>
  `;

  // Top sites da semana
  const weekSites = {};
  for (const day of days) {
    if (!siteDaily[day]) continue;
    for (const [d,m] of Object.entries(siteDaily[day]))
      weekSites[d] = (weekSites[d]||0) + m;
  }
  if (s.liveSession && liveMinutes > 0) weekSites[s.liveSession.domain] = (weekSites[s.liveSession.domain] || 0) + liveMinutes;
  renderSites('sites-week', weekSites);

  // Sessions
  const sessEl = document.getElementById('sessions-list');
  if (!sessions.length) {
    sessEl.innerHTML = `<div class="empty-state"><div class="e-emoji">📋</div>${tr('emptySessions')}</div>`;
    return;
  }
  sessEl.innerHTML = '';
  sessions.slice(0,6).forEach(s => {
    const item = document.createElement('div');
    item.className = 'session-item';
    const icon = document.createElement('span'); icon.style.fontSize = '14px'; icon.textContent = domainIcon(s.domain);
    const domain = document.createElement('span'); domain.className = 'si-domain'; domain.textContent = s.domain;
    const date = document.createElement('span'); date.className = 'si-date'; date.textContent = `${s.date} ${s.start}`;
    const duration = document.createElement('span'); duration.className = 'si-time'; duration.textContent = `${s.minutes}m`;
    item.append(icon, domain, date, duration);
    sessEl.appendChild(item);
  });
}

// ── Render: Sites genérico ─────────────────────────────────────

function renderSites(containerId, sitesObj) {
  const el     = document.getElementById(containerId);
  const sorted = Object.entries(sitesObj).sort((a,b)=>b[1]-a[1]).slice(0,5);
  if (!sorted.length) {
    el.innerHTML = `<div class="empty-state"><div class="e-emoji">👀</div>${tr('noSites')}</div>`;
    return;
  }
  const maxVal = sorted[0][1];
  el.innerHTML = '';
  sorted.forEach(([domain,min]) => {
    const pct  = Math.round((min/maxVal)*100);
    const icon = domainIcon(domain);
    const row = document.createElement('div');
    row.className = 'site-row';
    const ico = document.createElement('div'); ico.className = 'site-ico'; ico.textContent = icon;
    const name = document.createElement('div'); name.className = 'site-name'; name.textContent = domain;
    const track = document.createElement('div'); track.className = 'site-bar-bg';
    const fill = document.createElement('div'); fill.className = 'site-bar-fill'; fill.style.width = `${pct}%`;
    track.appendChild(fill);
    const time = document.createElement('div'); time.className = 'site-time'; time.textContent = `${fmt(min)}m`;
    row.append(ico, name, track, time);
    el.appendChild(row);
  });
}

// ── Render: Configurações ──────────────────────────────────────

function renderSettings(s) {
  const { dailyLimit=60, notificationsEnabled=true, weeklyReportEnabled=false, trackedDomains=[], lang='pt-BR' } = s;
  applyLanguage(lang);
  currentDomains = [...trackedDomains];

  document.getElementById('limit-input').value   = dailyLimit;
  document.getElementById('limit-display').textContent = `${dailyLimit} min`;
  document.getElementById('notif-toggle').checked = notificationsEnabled;
  document.getElementById('weekly-toggle').checked = weeklyReportEnabled;
  document.getElementById('language-input').value = currentLang;

  renderDomainChips();
}

function renderDomainChips() {
  const container = document.getElementById('domain-chips');
  container.innerHTML = '';
  currentDomains.forEach((d,i) => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    const label = document.createElement('span'); label.textContent = `${domainIcon(d)} ${d}`;
    const remove = document.createElement('button'); remove.className = 'rm'; remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', currentLang === 'en' ? `Remove ${d}` : `Remover ${d}`);
    chip.append(label, remove);
    remove.addEventListener('click', () => {
      currentDomains.splice(i,1);
      renderDomainChips();
    });
    container.appendChild(chip);
  });
}

// ── Live session ticker ────────────────────────────────────────

function startLiveTicker(ls) {
  const lsEl    = document.getElementById('live-session');
  const domainEl= document.getElementById('ls-domain');
  const timeEl  = document.getElementById('ls-elapsed');

  if (!ls) { lsEl.classList.add('hidden'); clearInterval(liveInterval); return; }

  lsEl.classList.remove('hidden');
  domainEl.textContent = ls.domain;
  liveElapsed = ls.elapsedSec ?? (ls.elapsed * 60);

  clearInterval(liveInterval);
  liveInterval = setInterval(() => {
    liveElapsed++;
    timeEl.textContent = fmtLive(liveElapsed);
  }, 1000);
  timeEl.textContent = fmtLive(liveElapsed);
}

// ── Status pill (pause) ────────────────────────────────────────

function updateStatusPill(isPaused) {
  const pill = document.getElementById('pause-btn');
  const text = document.getElementById('status-text');
  pill.setAttribute('aria-pressed', String(isPaused));
  if (isPaused) {
    pill.classList.add('paused');
    text.textContent = tr('paused');
  } else {
    pill.classList.remove('paused');
    text.textContent = tr('active');
  }
}

// ── Export CSV ─────────────────────────────────────────────────

function exportCSV(data) {
  const { daily={}, sessions=[] } = data;
  let csv = 'Data,Total (min)\n';
  for (const [date, min] of Object.entries(daily).sort())
    csv += `${date},${min}\n`;
  csv += '\nDomínio,Data,Início,Duração (min)\n';
  for (const s of sessions)
    csv += `${s.domain},${s.date},${s.start},${s.minutes}\n`;

  const blob = new Blob([csv], { type:'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `doomscroll_${todayStr()}.csv`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
}

// ── Confetti ──────────────────────────────────────────────────

function triggerConfetti() {
  const wrap   = document.getElementById('confetti-wrap');
  const colors = ['#8b5cf6','#c084fc','#2dd4bf','#fb7185','#fbbf24'];
  for (let i = 0; i < 28; i++) {
    const el = document.createElement('div');
    el.className = 'conf';
    el.style.left         = `${Math.random()*100}%`;
    el.style.background   = colors[Math.floor(Math.random()*colors.length)];
    el.style.animationDelay = `${Math.random()*0.6}s`;
    el.style.animationDuration = `${1.2+Math.random()*0.8}s`;
    wrap.appendChild(el);
    el.addEventListener('animationend', ()=>el.remove());
  }
}

// ── Init principal ────────────────────────────────────────────

async function init() {
  const s = await loadStats();
  if (!s || !Object.keys(s).length) return;
  statsCache = s;
  currentLang = s.lang || currentLang;
  const welcome = document.getElementById('onboarding');
  welcome.hidden = Boolean(s.onboardingDone);

  renderToday(s);
  renderWeek(s);
  renderSettings(s);
  updateStatusPill(s.isPaused);
  startLiveTicker(s.liveSession);
}

// ── Tab switching ─────────────────────────────────────────────

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
    document.querySelectorAll('.tab').forEach(t => { if (t !== tab) t.setAttribute('aria-selected', 'false'); });
  });
});

// ── Event listeners ───────────────────────────────────────────
function normalizeDomain(input) {
  const raw = input.trim().toLowerCase();
  if (!raw || raw.length > 253 || /\s/.test(raw)) return null;
  let host = raw;
  try { host = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.toLowerCase(); } catch { return null; }
  host = host.replace(/^www\./, '').replace(/\.$/, '');
  if (!host.includes('.') || host.split('.').some(label => !label || label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) return null;
  return host;
}

// Pause/retomar
document.getElementById('pause-btn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type:'togglePause' }, res => {
    if (res) updateStatusPill(res.isPaused);
  });
});

// Slider de limite
document.getElementById('limit-input').addEventListener('input', e => {
  document.getElementById('limit-display').textContent = `${e.target.value} min`;
});

// Adicionar domínio
document.getElementById('domain-add-btn').addEventListener('click', () => {
  const inp = document.getElementById('domain-input');
  const val = normalizeDomain(inp.value);
  if (!val) { inp.setCustomValidity(currentLang === 'en' ? 'Enter a valid domain, such as reddit.com.' : 'Digite um domínio válido, como reddit.com.'); inp.reportValidity(); return; }
  inp.setCustomValidity('');
  if (val && !currentDomains.some(d => d === val || d.endsWith(`.${val}`) || val.endsWith(`.${d}`))) {
    currentDomains.push(val);
    renderDomainChips();
    inp.value = '';
  } else if (val) { inp.setCustomValidity(currentLang === 'en' ? 'This site is already in your list.' : 'Esse site já está na lista.'); inp.reportValidity(); }
});
document.getElementById('domain-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('domain-add-btn').click();
});

// Salvar configurações
document.getElementById('save-settings-btn').addEventListener('click', () => {
  const dailyLimit = parseInt(document.getElementById('limit-input').value);
  const notificationsEnabled = document.getElementById('notif-toggle').checked;
  const weeklyReportEnabled = document.getElementById('weekly-toggle').checked;
  const lang = document.getElementById('language-input').value;
  const status = document.getElementById('settings-status');
  const origins = permissionOrigins(currentDomains);
  const previousOrigins = permissionOrigins(statsCache.trackedDomains || []);
  const save = () => {
    const persist = () => chrome.runtime.sendMessage({
      type:'saveSettings', dailyLimit, notificationsEnabled, weeklyReportEnabled,
      trackedDomains:currentDomains, lang,
    }, () => {
      status.textContent = tr('saved'); status.style.color = 'var(--teal)';
      currentLang = lang; applyLanguage(lang);
    });
    const removed = previousOrigins.filter(origin => !origins.includes(origin));
    if (removed.length) chrome.permissions.remove({ origins: removed }, persist);
    else persist();
  };
  if (!origins.length) { save(); return; }
  chrome.permissions.request({ origins }, granted => {
    if (!granted) { status.textContent = tr('savePermissionDenied'); status.style.color = 'var(--amber)'; return; }
    save();
  });
});

// Export CSV
document.getElementById('export-btn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type:'exportCSV' }, data => {
    if (data) exportCSV(data);
  });
});

// Opções completas
document.getElementById('options-btn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Resetar tudo
document.getElementById('reset-btn').addEventListener('click', () => {
  if (confirm(tr('confirmReset'))) {
    chrome.runtime.sendMessage({ type:'resetData' }, () => init());
  }
});

document.getElementById('welcome-lang').addEventListener('change', e => applyLanguage(e.target.value));
document.getElementById('language-input').addEventListener('change', e => applyLanguage(e.target.value));
function finishOnboarding(lang) {
  const domains = currentDomains.length ? currentDomains : (statsCache.trackedDomains || ['reddit.com','twitter.com','x.com','youtube.com','instagram.com','tiktok.com','facebook.com','huffpost.com','buzzfeed.com','twitch.tv','linkedin.com']);
  chrome.runtime.sendMessage({ type:'saveSettings', dailyLimit:statsCache.dailyLimit || 60, notificationsEnabled:statsCache.notificationsEnabled !== false, weeklyReportEnabled:statsCache.weeklyReportEnabled === true, trackedDomains:domains, lang }, () => {
    chrome.runtime.sendMessage({ type:'completeOnboarding' }, () => { document.getElementById('onboarding').hidden = true; init(); });
  });
}
function permissionOrigins(domains) {
  return [...new Set(domains.flatMap(domain => [`https://*.${domain}/*`, `http://*.${domain}/*`]))];
}
document.getElementById('welcome-start').addEventListener('click', () => {
  const lang = document.getElementById('welcome-lang').value;
  const origins = permissionOrigins(currentDomains.length ? currentDomains : (statsCache.trackedDomains || []));
  const message = document.getElementById('permission-message');
  chrome.permissions.request({ origins }, granted => {
    if (!granted) { message.hidden = false; message.textContent = tr('permissionDenied'); return; }
    message.hidden = true;
    finishOnboarding(lang);
  });
});
document.getElementById('welcome-skip').addEventListener('click', () => finishOnboarding(document.getElementById('welcome-lang').value));

// ── Kick off ─────────────────────────────────────────────────

init();
const refreshInterval = setInterval(init, 30000);
window.addEventListener('unload', () => {
  clearInterval(refreshInterval);
  clearInterval(liveInterval);
});
