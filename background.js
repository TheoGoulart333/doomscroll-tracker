// background.js v2 — rastreamento completo com streaks, notificações e sessões

const DEFAULT_DOMAINS = [
  "reddit.com","twitter.com","x.com","youtube.com",
  "instagram.com","tiktok.com","facebook.com",
  "huffpost.com","buzzfeed.com","twitch.tv","linkedin.com"
];

let activeTabId     = null;
let startTimestamp  = null;
let activeDomain    = null;
let notifiedToday   = false; // evita spam de notificação

// ── Helpers ─────────────────────────────────────────────────

function todayKey()  { return new Date().toISOString().slice(0, 10); }
function yesterdayKey() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
function getWeekKey(date = new Date()) {
  const oneJan = new Date(date.getFullYear(), 0, 1);
  const days   = Math.floor((date - oneJan) / 86400000);
  const week   = Math.ceil((date.getDay() + 1 + days) / 7);
  return `${date.getFullYear()}-W${week}`;
}
function extractDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return null; }
}
async function getTrackedDomains() {
  const r = await chrome.storage.local.get({ trackedDomains: DEFAULT_DOMAINS });
  return r.trackedDomains;
}
async function getDailyLimit() {
  const r = await chrome.storage.local.get({ dailyLimit: 60 });
  return r.dailyLimit;
}
async function getNotificationsEnabled() {
  const r = await chrome.storage.local.get({ notificationsEnabled: true });
  return r.notificationsEnabled;
}

async function matchesDoomscroll(url) {
  const domain = extractDomain(url);
  if (!domain) return null;
  const domains = await getTrackedDomains();
  return domains.find(d => domain.endsWith(d)) ? domain : null;
}

// ── Tracking core ───────────────────────────────────────────

async function startTracking(tabId, url) {
  const domain = await matchesDoomscroll(url);
  if (domain) {
    activeTabId    = tabId;
    activeDomain   = domain;
    startTimestamp = Date.now();
  } else {
    await stopTracking();
  }
}

async function stopTracking() {
  if (activeTabId !== null && startTimestamp !== null && activeDomain) {
    const durationMs = Date.now() - startTimestamp;
    const minutes    = Math.round(durationMs / 60000);
    if (minutes > 0) {
      const today = todayKey();
      const week  = getWeekKey();
      const data  = await chrome.storage.local.get({
        daily: {}, weekly: {}, siteDaily: {}, sessions: []
      });

      // Globais
      data.daily[today] = (data.daily[today] || 0) + minutes;
      data.weekly[week] = (data.weekly[week] || 0) + minutes;

      // Por site/dia
      if (!data.siteDaily[today]) data.siteDaily[today] = {};
      data.siteDaily[today][activeDomain] =
        (data.siteDaily[today][activeDomain] || 0) + minutes;

      // Sessões (últimas 50)
      const session = {
        domain: activeDomain,
        date: today,
        start: new Date(startTimestamp).toTimeString().slice(0, 5),
        minutes,
      };
      data.sessions = [session, ...data.sessions].slice(0, 50);

      await chrome.storage.local.set({
        daily:    data.daily,
        weekly:   data.weekly,
        siteDaily:data.siteDaily,
        sessions: data.sessions,
      });

      // Atualiza streak
      await updateStreak(data.daily);

      // Notificação de limite
      await checkLimit(data.daily[today]);
    }
  }
  activeTabId    = null;
  startTimestamp = null;
  activeDomain   = null;
}

// ── Streak ──────────────────────────────────────────────────

async function updateStreak(daily) {
  const limit     = await getDailyLimit();
  const today     = todayKey();
  let streak      = 0;
  let d           = new Date();

  // Conta dias consecutivos ABAIXO do limite (a partir de ontem)
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const key   = d.toISOString().slice(0, 10);
    const spent = daily[key] || 0;
    if (spent <= limit) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }

  // Inclui hoje se também estiver abaixo
  const todaySpent = daily[today] || 0;
  if (todaySpent <= limit) streak++;

  const prev = await chrome.storage.local.get({ streak: 0, bestStreak: 0 });
  const best  = Math.max(streak, prev.bestStreak || 0);
  await chrome.storage.local.set({ streak, bestStreak: best });
}

// ── Notificações ─────────────────────────────────────────────

async function checkLimit(todayMin) {
  const limit     = await getDailyLimit();
  const enabled   = await getNotificationsEnabled();
  if (!enabled) return;

  if (todayMin >= limit && !notifiedToday) {
    notifiedToday = true;
    chrome.notifications.create('limit_reached', {
      type:    'basic',
      iconUrl: 'icons/icon-48.png',
      title:   '🚨 Doomscroll Tracker',
      message: `Você atingiu ${limit} min hoje. Que tal fazer uma pausa? 🧘`,
      priority: 2,
    });
  } else if (todayMin >= Math.round(limit * 0.8) && !notifiedToday) {
    chrome.notifications.create('limit_80', {
      type:    'basic',
      iconUrl: 'icons/icon-48.png',
      title:   '⚠️ Quase no limite',
      message: `Já são ${todayMin} min hoje (limite: ${limit} min). Vai devagar!`,
      priority: 1,
    });
  }
}

// Resetar flag de notificação à meia-noite
chrome.alarms.create('midnight_reset', {
  when:         getNextMidnight(),
  periodInMinutes: 1440,
});
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'midnight_reset') notifiedToday = false;
});

function getNextMidnight() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime();
}

// ── Listeners ────────────────────────────────────────────────

chrome.tabs.onActivated.addListener(async info => {
  try {
    const tab = await chrome.tabs.get(info.tabId);
    await stopTracking();
    await startTracking(tab.id, tab.url || '');
  } catch {}
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.url) {
    await stopTracking();
    await startTracking(tabId, changeInfo.url);
  }
});

chrome.idle.onStateChanged.addListener(async state => {
  if (state !== 'active') await stopTracking();
});

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({
    trackedDomains:      DEFAULT_DOMAINS,
    daily:               {},
    weekly:              {},
    siteDaily:           {},
    sessions:            [],
    streak:              0,
    bestStreak:          0,
    dailyLimit:          60,
    notificationsEnabled:true,
    isPaused:            false,
  });
});

// ── Mensagens do popup ────────────────────────────────────────

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === 'getStats') {
    (async () => {
      const today  = todayKey();
      const week   = getWeekKey();
      const yest   = yesterdayKey();
      const prevWeekKey = getWeekKey((() => { const d=new Date(); d.setDate(d.getDate()-7); return d; })());

      const data = await chrome.storage.local.get([
        'daily','weekly','siteDaily','sessions','streak','bestStreak',
        'dailyLimit','notificationsEnabled','isPaused','trackedDomains'
      ]);

      // Sessão ativa ao vivo
      let liveSession = null;
      if (activeTabId && startTimestamp && activeDomain) {
        liveSession = {
          domain:  activeDomain,
          elapsed: Math.round((Date.now() - startTimestamp) / 60000),
        };
      }

      sendResponse({
        today:          (data.daily || {})[today] || 0,
        week:           (data.weekly || {})[week] || 0,
        yesterday:      (data.daily || {})[yest] || 0,
        lastWeek:       (data.weekly || {})[prevWeekKey] || 0,
        daily:          data.daily || {},
        siteDaily:      data.siteDaily || {},
        sessions:       (data.sessions || []).slice(0, 10),
        streak:         data.streak || 0,
        bestStreak:     data.bestStreak || 0,
        dailyLimit:     data.dailyLimit || 60,
        notificationsEnabled: data.notificationsEnabled !== false,
        isPaused:       data.isPaused || false,
        trackedDomains: data.trackedDomains || DEFAULT_DOMAINS,
        liveSession,
      });
    })();
    return true;
  }

  if (req.type === 'resetData') {
    chrome.storage.local.set({
      daily: {}, weekly: {}, siteDaily: {}, sessions: [], streak: 0
    }, () => { notifiedToday = false; sendResponse({ ok: true }); });
    return true;
  }

  if (req.type === 'saveSettings') {
    chrome.storage.local.set({
      dailyLimit:          req.dailyLimit,
      notificationsEnabled:req.notificationsEnabled,
      trackedDomains:      req.trackedDomains,
    }, () => sendResponse({ ok: true }));
    return true;
  }

  if (req.type === 'togglePause') {
    chrome.storage.local.get({ isPaused: false }, async data => {
      const paused = !data.isPaused;
      await chrome.storage.local.set({ isPaused: paused });
      if (paused) await stopTracking();
      sendResponse({ isPaused: paused });
    });
    return true;
  }

  if (req.type === 'exportCSV') {
    (async () => {
      const data = await chrome.storage.local.get(['daily','siteDaily','sessions']);
      sendResponse({ daily: data.daily, siteDaily: data.siteDaily, sessions: data.sessions });
    })();
    return true;
  }
});
