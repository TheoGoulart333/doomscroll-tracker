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

const DAYS_SHORT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

// ── Estado global ─────────────────────────────────────────────
let currentDomains = [];
let liveInterval   = null;
let liveElapsed    = 0;
let statsCache     = {};

// ── Helpers ───────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().slice(0,10); }

function last7DaysArr() {
  return Array.from({length:7}, (_,i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6-i));
    return d.toISOString().slice(0,10);
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
    return { emoji:'😌', text:'<strong>Tudo certo por aqui!</strong><br>Você ainda não acessou nenhum site monitorado hoje.' };
  if (pct <= 20)
    return { emoji:'🌿', text:`<strong>Boa! Só ${todayMin} min hoje.</strong><br>Continue assim que tá indo muito bem.` };
  if (pct <= 50)
    return { emoji:'😐', text:`<strong>Indo de boa...</strong><br>${todayMin} min no relógio. Ainda tá tranquilo.` };
  if (pct <= 70)
    return { emoji:'⚡', text:`<strong>Atenção: já passou metade do limite.</strong><br>${todayMin} min hoje. Dá uma pausa?` };
  if (pct <= 90)
    return { emoji:'😬', text:`<strong>Ei! Quase no limite.</strong><br>Só ${limit - todayMin} min restantes. Vai devagar...` };
  if (pct < 100)
    return { emoji:'🔴', text:`<strong>Atenção máxima!</strong><br>Faltam apenas ${limit - todayMin} min pro limite diário.` };
  return { emoji:'🚨', text:`<strong>Limite atingido hoje.</strong><br>Que tal fechar o feed e fazer algo diferente? 😄` };
}

function getStreakMessage(streak) {
  if (streak === 0) return 'Comece hoje!';
  if (streak === 1) return 'Primeiro dia abaixo do limite 👏';
  if (streak < 4)  return `${streak} dias seguidos abaixo do limite`;
  if (streak < 7)  return `${streak} dias seguidos — você está voando 🚀`;
  if (streak < 14) return `${streak} dias!! Impressionante 🌟`;
  return `${streak} dias seguidos!! Você é incrível 🏆`;
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
  const { today=0, week=0, yesterday=0, lastWeek=0, dailyLimit:limit=60, streak=0, bestStreak=0, siteDaily={} } = s;

  // Data header
  document.getElementById('h-date').textContent = new Date().toLocaleDateString('pt-BR', {weekday:'long',day:'numeric',month:'long'});

  // Hero
  document.getElementById('today-val').textContent = fmt(today);
  document.getElementById('today-unit').textContent = today < 60 ? 'minutos' : 'horas';
  document.getElementById('week-val').textContent   = fmt(week);
  document.getElementById('week-unit').textContent  = week  < 60 ? 'minutos' : 'horas';

  // Deltas
  const deltaToday = today - yesterday;
  const deltaEl    = document.getElementById('today-delta');
  if (yesterday > 0) {
    const pct  = Math.abs(Math.round((deltaToday/yesterday)*100));
    const sign = deltaToday >= 0 ? '↑' : '↓';
    deltaEl.textContent = `${sign} ${pct}% vs ontem`;
    deltaEl.className   = `card-delta ${deltaToday >= 0 ? 'up' : 'down'}`;
  } else { deltaEl.textContent = ''; }

  const deltaWeek = week - lastWeek;
  const deltaWEl  = document.getElementById('week-delta');
  if (lastWeek > 0) {
    const pct  = Math.abs(Math.round((deltaWeek/lastWeek)*100));
    const sign = deltaWeek >= 0 ? '↑' : '↓';
    deltaWEl.textContent = `${sign} ${pct}% vs semana passada`;
    deltaWEl.className   = `card-delta ${deltaWeek >= 0 ? 'up' : 'down'}`;
  } else { deltaWEl.textContent = ''; }

  // Mood
  const mood = getMood(today, limit);
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
    hint.textContent   = `🚨 Limite atingido! (${limit} min)`;
    hint.style.color   = 'var(--rose)';
  } else if (pct >= 70) {
    hint.textContent   = `⚠️ ${limit - today} min restantes hoje`;
    hint.style.color   = 'var(--amber)';
  } else {
    hint.textContent   = `Meta: ${limit} min/dia — ${limit - today} min restantes`;
    hint.style.color   = '';
  }

  // Sites hoje
  const todayKey  = todayStr();
  const todaySites= siteDaily[todayKey] || {};
  renderSites('sites-today', todaySites);

  // Celebração se streak novo > 3
  if (streak > 3 && today === 0) triggerConfetti();
}

// ── Render: Semana ─────────────────────────────────────────────

function renderWeek(s) {
  const { daily={}, siteDaily={}, sessions=[], dailyLimit:limit=60 } = s;
  const days = last7DaysArr();
  const todayKey = todayStr();
  const values   = days.map(d => daily[d] || 0);
  const max      = Math.max(...values, 1);

  // Bars
  const barsEl = document.getElementById('weekly-bars');
  barsEl.innerHTML = '';
  days.forEach((dateStr, i) => {
    const val    = values[i];
    const pct    = Math.max((val/max)*100, val > 0 ? 5 : 2);
    const dayName= DAYS_SHORT[new Date(dateStr+'T12:00:00').getDay()];
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
  renderSites('sites-week', weekSites);

  // Sessions
  const sessEl = document.getElementById('sessions-list');
  if (!sessions.length) {
    sessEl.innerHTML = '<div class="empty-state"><div class="e-emoji">📋</div>Sem sessões ainda.</div>';
    return;
  }
  sessEl.innerHTML = '';
  sessions.slice(0,6).forEach(s => {
    const item = document.createElement('div');
    item.className = 'session-item';
    item.innerHTML = `
      <span style="font-size:14px">${domainIcon(s.domain)}</span>
      <span class="si-domain">${s.domain}</span>
      <span class="si-date">${s.date} ${s.start}</span>
      <span class="si-time">${s.minutes}m</span>
    `;
    sessEl.appendChild(item);
  });
}

// ── Render: Sites genérico ─────────────────────────────────────

function renderSites(containerId, sitesObj) {
  const el     = document.getElementById(containerId);
  const sorted = Object.entries(sitesObj).sort((a,b)=>b[1]-a[1]).slice(0,5);
  if (!sorted.length) {
    el.innerHTML = `<div class="empty-state"><div class="e-emoji">👀</div>Nenhum site ainda.</div>`;
    return;
  }
  const maxVal = sorted[0][1];
  el.innerHTML = '';
  sorted.forEach(([domain,min]) => {
    const pct  = Math.round((min/maxVal)*100);
    const icon = domainIcon(domain);
    const row  = document.createElement('div');
    row.className = 'site-row';
    row.innerHTML = `
      <div class="site-ico">${icon}</div>
      <div class="site-name">${domain}</div>
      <div class="site-bar-bg"><div class="site-bar-fill" style="width:${pct}%"></div></div>
      <div class="site-time">${fmt(min)}m</div>
    `;
    el.appendChild(row);
  });
}

// ── Render: Configurações ──────────────────────────────────────

function renderSettings(s) {
  const { dailyLimit=60, notificationsEnabled=true, trackedDomains=[] } = s;
  currentDomains = [...trackedDomains];

  document.getElementById('limit-input').value   = dailyLimit;
  document.getElementById('limit-display').textContent = `${dailyLimit} min`;
  document.getElementById('notif-toggle').checked = notificationsEnabled;

  renderDomainChips();
}

function renderDomainChips() {
  const container = document.getElementById('domain-chips');
  container.innerHTML = '';
  currentDomains.forEach((d,i) => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `${domainIcon(d)} ${d}<span class="rm" data-i="${i}">✕</span>`;
    chip.querySelector('.rm').addEventListener('click', () => {
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
  liveElapsed = ls.elapsed * 60; // convert min → seconds for precision display

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
  if (isPaused) {
    pill.classList.add('paused');
    text.textContent = 'Pausado';
  } else {
    pill.classList.remove('paused');
    text.textContent = 'Ativo';
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
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
  });
});

// ── Event listeners ───────────────────────────────────────────

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
  const val = inp.value.trim().toLowerCase().replace(/^www\./,'');
  if (val && !currentDomains.includes(val)) {
    currentDomains.push(val);
    renderDomainChips();
    inp.value = '';
  }
});
document.getElementById('domain-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('domain-add-btn').click();
});

// Salvar configurações
document.getElementById('save-settings-btn').addEventListener('click', () => {
  const dailyLimit = parseInt(document.getElementById('limit-input').value);
  const notificationsEnabled = document.getElementById('notif-toggle').checked;
  chrome.runtime.sendMessage({
    type: 'saveSettings',
    dailyLimit, notificationsEnabled, trackedDomains: currentDomains,
  }, () => {
    const btn = document.getElementById('save-settings-btn');
    btn.textContent = '✅ Salvo!';
    setTimeout(()=>{ btn.textContent = '💾 Salvar configurações'; }, 1800);
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
  if (confirm('Apagar todos os dados de rastreamento? Essa ação não pode ser desfeita.')) {
    chrome.runtime.sendMessage({ type:'resetData' }, () => init());
  }
});

// ── Kick off ─────────────────────────────────────────────────

init();
const refreshInterval = setInterval(init, 30000);
window.addEventListener('unload', () => {
  clearInterval(refreshInterval);
  clearInterval(liveInterval);
});
