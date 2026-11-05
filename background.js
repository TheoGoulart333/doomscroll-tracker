// background.js v3 — badge, context menu, weekly report, i18n-ready

const DEFAULT_DOMAINS = [
  "reddit.com","twitter.com","x.com","youtube.com",
  "instagram.com","tiktok.com","facebook.com",
  "huffpost.com","buzzfeed.com","twitch.tv","linkedin.com"
];

let activeTabId     = null;
let startTimestamp  = null;
let activeDomain    = null;
let notified80      = false;
let notified100     = false;

// ── Helpers ─────────────────────────────────────────────────

function todayKey()  { return dateKey(new Date()); }
function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function yesterdayKey() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return dateKey(d);
}
function getWeekKey(date = new Date()) {
  const oneJan = new Date(date.getFullYear(), 0, 1);
  const days   = Math.floor((date - oneJan) / 86400000);
  const week   = Math.ceil((date.getDay() + 1 + days) / 7);
  return `${date.getFullYear()}-W${week}`;
}
function originsForDomains(domains = []) {
  return [...new Set(domains.flatMap(domain => [`https://*.${domain}/*`, `http://*.${domain}/*`]))];
}
function extractDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return null; }
}
async function getSetting(key, def) {
  const r = await chrome.storage.local.get({ [key]: def });
  return r[key];
}
async function getTrackedDomains() {
  return getSetting('trackedDomains', DEFAULT_DOMAINS);
}
async function matchesDoomscroll(url) {
  const domain  = extractDomain(url);
  if (!domain) return null;
  const domains = await getTrackedDomains();
  return domains.find(d => domain === d || domain.endsWith(`.${d}`)) ? domain : null;
}

// ── Badge ────────────────────────────────────────────────────

async function updateBadge(todayMin) {
  const text  = todayMin > 0 ? (todayMin >= 60 ? `${Math.floor(todayMin/60)}h` : `${todayMin}`) : '';
  const color = todayMin === 0 ? '#8b5cf6' : todayMin >= 90 ? '#f43f5e' : todayMin >= 60 ? '#fbbf24' : '#8b5cf6';
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
}

// Badge live update every minute while tracking
chrome.alarms.create('badge_tick', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === 'badge_tick') {
    await restoreTrackingSession();
    const { daily = {} } = await chrome.storage.local.get('daily');
    const liveMinutes = startTimestamp ? Math.floor((Date.now() - startTimestamp) / 60000) : 0;
    await updateBadge((daily[todayKey()] || 0) + liveMinutes);
  }
  if (alarm.name === 'midnight_reset') {
    notified80 = false; notified100 = false;
    await chrome.action.setBadgeText({ text: '' });
  }
  if (alarm.name === 'weekly_report') {
    await sendWeeklyReport();
  }
});

// ── Tracking ─────────────────────────────────────────────────

async function startTracking(tabId, url) {
  const { isPaused = false } = await chrome.storage.local.get('isPaused');
  if (isPaused) return;
  const domain = await matchesDoomscroll(url);
  if (domain) {
    activeTabId    = tabId;
    activeDomain   = domain;
    startTimestamp = Date.now();
    await chrome.storage.session.set({ trackingSession: { tabId, domain, startTimestamp } });
  } else {
    await stopTracking();
  }
}

async function stopTracking() {
  if (activeTabId === null) await restoreTrackingSession();
  if (activeTabId !== null && startTimestamp !== null && activeDomain) {
    const durationMs = Date.now() - startTimestamp;
    const minutes    = Math.round(durationMs / 60000);
    if (minutes > 0) {
      const today = todayKey();
      const week  = getWeekKey();
      const data  = await chrome.storage.local.get({
        daily: {}, weekly: {}, siteDaily: {}, sessions: []
      });
      data.daily[today]  = (data.daily[today] || 0) + minutes;
      data.weekly[week]  = (data.weekly[week] || 0) + minutes;
      if (!data.siteDaily[today]) data.siteDaily[today] = {};
      data.siteDaily[today][activeDomain] = (data.siteDaily[today][activeDomain] || 0) + minutes;
      const session = {
        domain: activeDomain, date: today,
        start: new Date(startTimestamp).toTimeString().slice(0, 5), minutes,
      };
      data.sessions = [session, ...data.sessions].slice(0, 50);
      await chrome.storage.local.set({
        daily: data.daily, weekly: data.weekly,
        siteDaily: data.siteDaily, sessions: data.sessions,
      });
      await updateBadge(data.daily[today]);
      await updateStreak(data.daily);
      await checkLimitNotification(data.daily[today]);
    }
  }
  activeTabId = null; startTimestamp = null; activeDomain = null;
  await chrome.storage.session.remove('trackingSession');
}

// ── Streak ──────────────────────────────────────────────────

async function updateStreak(daily) {
  const limit = await getSetting('dailyLimit', 60);
  const today = todayKey();
  let streak  = 0;
  const d     = new Date();
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const key = dateKey(d);
    if ((daily[key] || 0) <= limit) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  if ((daily[today] || 0) <= limit) streak++;
  const prev = await chrome.storage.local.get({ bestStreak: 0 });
  await chrome.storage.local.set({ streak, bestStreak: Math.max(streak, prev.bestStreak) });
}

// ── Notifications ─────────────────────────────────────────────

async function checkLimitNotification(todayMin) {
  const limit   = await getSetting('dailyLimit', 60);
  const enabled = await getSetting('notificationsEnabled', true);
  const lang    = await getSetting('lang', 'pt-BR');
  if (!enabled) return;

  const msgs = {
    'pt-BR': {
      warn:  [`Você já chegou a ${todayMin} min hoje (meta: ${limit} min).`, 'Perto da sua meta'],
      limit: [`Você chegou à meta de ${limit} min. Que tal fazer uma pausa?`, 'Doomscroll Tracker'],
    },
    'en': {
      warn:  [`You have reached ${todayMin} min today (goal: ${limit} min).`, 'Near your daily goal'],
      limit: [`You reached your ${limit} min goal. Consider taking a break.`, 'Doomscroll Tracker'],
    },
  };
  const m = msgs[lang] || msgs['en'];

  if (!notified100 && todayMin >= limit) {
    notified100 = true;
    chrome.notifications.create('limit_100', {
      type: 'basic', iconUrl: 'icons/icon-48.png',
      title: m.limit[1], message: m.limit[0], priority: 2,
    });
  } else if (!notified80 && todayMin >= Math.round(limit * 0.8)) {
    notified80 = true;
    chrome.notifications.create('limit_80', {
      type: 'basic', iconUrl: 'icons/icon-48.png',
      title: m.warn[1], message: m.warn[0], priority: 1,
    });
  }
}

// ── Weekly Report ─────────────────────────────────────────────

async function sendWeeklyReport() {
  const enabled = await getSetting('weeklyReportEnabled', false);
  if (!enabled) return;
  const lang    = await getSetting('lang', 'pt-BR');
  const { weekly = {} } = await chrome.storage.local.get('weekly');
  const prevWeekKey = getWeekKey((() => { const d=new Date(); d.setDate(d.getDate()-7); return d; })());
  const mins = weekly[prevWeekKey] || 0;
  const h    = Math.floor(mins / 60);
  const m    = mins % 60;
  const timeStr = h > 0 ? `${h}h ${m}min` : `${m}min`;

  const title   = lang === 'pt-BR' ? 'Resumo semanal — Doomscroll Tracker' : 'Weekly report — Doomscroll Tracker';
  const message = lang === 'pt-BR'
    ? `Na semana passada você passou ${timeStr} em sites monitorados. Veja seus detalhes!`
    : `Last week you spent ${timeStr} on tracked sites. Check your stats!`;

  chrome.notifications.create('weekly_report', {
    type: 'basic', iconUrl: 'icons/icon-48.png',
    title, message, priority: 1,
  });
}

// Weekly report every Sunday at 9am (approximate via periodic alarm)
chrome.alarms.get('weekly_report', alarm => {
  if (!alarm) chrome.alarms.create('weekly_report', { when: getNextWeeklyReport(), periodInMinutes: 7 * 24 * 60 });
});
function getNextWeeklyReport() {
  const next = new Date();
  const daysUntilSunday = (7 - next.getDay()) % 7;
  next.setDate(next.getDate() + daysUntilSunday);
  next.setHours(9, 0, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 7);
  return next.getTime();
}

// ── Context Menu ──────────────────────────────────────────────

function rebuildContextMenu(lang = 'pt-BR') {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'toggle-track-site',
      title: lang === 'en' ? 'Track this site' : 'Monitorar este site',
      contexts: ['page'],
    });
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'toggle-track-site') return;
  const domain = extractDomain(tab?.url || '');
  if (!domain) return;

  const origins = originsForDomains([domain]);
  chrome.permissions.request({ origins }, granted => {
    if (!granted) return;
    (async () => {
      const domains = await getTrackedDomains();
      if (domains.some(d => domain === d || domain.endsWith(`.${d}`))) return;
      const updated = [...domains, domain];
      await chrome.storage.local.set({ trackedDomains: updated });
      await startTracking(tab.id, tab.url || '');
      const lang = await getSetting('lang', 'pt-BR');
      chrome.notifications.create({
        type: 'basic', iconUrl: 'icons/icon-48.png',
        title: 'Doomscroll Tracker',
        message: lang === 'en' ? `${domain} is now tracked.` : `${domain} agora está sendo monitorado.`,
      });
    })();
  });
});

// ── Listeners ─────────────────────────────────────────────────

chrome.tabs.onActivated.addListener(async info => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab || tab.id !== info.tabId) return;
    await stopTracking();
    await startTracking(tab.id, tab.url || '');
  } catch {}
});
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (!changeInfo.url) return;
  const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!activeTab || activeTab.id !== tabId) return;
  await stopTracking();
  await startTracking(tabId, changeInfo.url);
});
chrome.windows.onFocusChanged.addListener(async windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) { await stopTracking(); return; }
  const [tab] = await chrome.tabs.query({ active: true, windowId });
  await stopTracking();
  if (tab) await startTracking(tab.id, tab.url || '');
});
chrome.tabs.onRemoved.addListener(async tabId => {
  if (tabId === activeTabId) await stopTracking();
});
chrome.idle.onStateChanged.addListener(async state => {
  if (state !== 'active') await stopTracking();
  else {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab) await startTracking(tab.id, tab.url || '');
  }
});

async function restoreTrackingSession() {
  if (activeTabId !== null) return;
  try {
    const { trackingSession } = await chrome.storage.session.get('trackingSession');
    if (!trackingSession) return;
    activeTabId = trackingSession.tabId;
    activeDomain = trackingSession.domain;
    startTimestamp = trackingSession.startTimestamp;
  } catch (error) {
    console.warn('Could not restore the active tracking session.', error);
  }
}

async function resumeActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab) await startTracking(tab.id, tab.url || '');
}
chrome.runtime.onStartup.addListener(async () => {
  await chrome.storage.session.remove('trackingSession');
  activeTabId = null; startTimestamp = null; activeDomain = null;
  await resumeActiveTab();
});

// Midnight reset
chrome.alarms.create('midnight_reset', { when: getNextMidnight(), periodInMinutes: 1440 });
function getNextMidnight() {
  const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime();
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  const defaults = {
    trackedDomains: DEFAULT_DOMAINS,
    daily: {}, weekly: {}, siteDaily: {}, sessions: [],
    streak: 0, bestStreak: 0,
    dailyLimit: 60, notificationsEnabled: true, weeklyReportEnabled: false,
    isPaused: false,
    lang: chrome.i18n.getUILanguage().toLowerCase().startsWith('pt') ? 'pt-BR' : 'en',
    onboardingDone: false,
  };
  const existing = await chrome.storage.local.get(Object.keys(defaults));
  const missing = Object.fromEntries(Object.entries(defaults).filter(([key]) => existing[key] === undefined));
  if (Object.keys(missing).length) await chrome.storage.local.set(missing);
  rebuildContextMenu(existing.lang || defaults.lang);
  if (reason === 'update' && existing.onboardingDone) {
    const migrationOrigins = originsForDomains(existing.trackedDomains || DEFAULT_DOMAINS);
    let accessGranted = false;
    try { accessGranted = await chrome.permissions.contains({ origins: migrationOrigins }); }
    catch (error) { console.warn('Could not verify optional site access.', error); }
    if (!accessGranted) await chrome.storage.local.set({ onboardingDone: false });
  }
  if (reason === 'install') await chrome.action.setBadgeText({ text: '' });
  await resumeActiveTab();
});

// ── Messages ──────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {

  if (req.type === 'getStats') {
    (async () => {
      await restoreTrackingSession();
      const today  = todayKey();
      const week   = getWeekKey();
      const yest   = yesterdayKey();
      const prevW  = getWeekKey((() => { const d=new Date(); d.setDate(d.getDate()-7); return d; })());
      const data   = await chrome.storage.local.get([
        'daily','weekly','siteDaily','sessions','streak','bestStreak',
        'dailyLimit','notificationsEnabled','weeklyReportEnabled','isPaused','trackedDomains','lang','onboardingDone'
      ]);

      // Ensure defaults
      const trackedDomains = data.trackedDomains || DEFAULT_DOMAINS;
      let trackingPermissionGranted = false;
      try { trackingPermissionGranted = await chrome.permissions.contains({ origins: originsForDomains(trackedDomains) }); }
      catch (error) { console.warn('Could not verify optional site access.', error); }
      const daily          = data.daily || {};

      let liveSession = null;
      if (activeTabId && startTimestamp && activeDomain) {
        liveSession = {
          domain: activeDomain,
          elapsed: Math.round((Date.now() - startTimestamp) / 60000),
          elapsedSec: Math.round((Date.now() - startTimestamp) / 1000),
        };
      }

      sendResponse({
        today:          daily[today]  || 0,
        week:           (data.weekly || {})[week]  || 0,
        yesterday:      daily[yest]   || 0,
        lastWeek:       (data.weekly || {})[prevW] || 0,
        daily,
        siteDaily:      data.siteDaily || {},
        sessions:       (data.sessions || []).slice(0, 10),
        streak:         data.streak   || 0,
        bestStreak:     data.bestStreak || 0,
        dailyLimit:     data.dailyLimit || 60,
        notificationsEnabled: data.notificationsEnabled !== false,
        weeklyReportEnabled: data.weeklyReportEnabled === true,
        isPaused:       data.isPaused || false,
        trackedDomains,
        trackingPermissionGranted,
        lang:           data.lang     || 'pt-BR',
        onboardingDone: data.onboardingDone || false,
        liveSession,
      });
    })().catch(error => {
      console.error('Could not load Doomscroll Tracker stats.', error);
      sendResponse({ error: true });
    });
    return true;
  }

  if (req.type === 'resetData') {
    chrome.storage.local.set(
      { daily:{}, weekly:{}, siteDaily:{}, sessions:[], streak:0, bestStreak:0 },
      async () => { notified80=false; notified100=false; await updateBadge(0); sendResponse({ok:true}); }
    );
    return true;
  }

  if (req.type === 'saveSettings') {
    chrome.storage.local.set({
      dailyLimit:          req.dailyLimit,
      notificationsEnabled:req.notificationsEnabled,
      weeklyReportEnabled:req.weeklyReportEnabled === true,
      trackedDomains:      req.trackedDomains,
      lang:                req.lang,
    }, () => {
      rebuildContextMenu(req.lang || 'pt-BR');
      sendResponse({ ok: true });
    });
    return true;
  }

  if (req.type === 'setLang') {
    chrome.storage.local.set({ lang: req.lang }, () => sendResponse({ ok: true }));
    return true;
  }

  if (req.type === 'togglePause') {
    chrome.storage.local.get({ isPaused: false }, async data => {
      const paused = !data.isPaused;
      await chrome.storage.local.set({ isPaused: paused });
      if (paused) await stopTracking();
      else await resumeActiveTab();
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

  if (req.type === 'completeOnboarding') {
    chrome.storage.local.set({ onboardingDone: true }, () => sendResponse({ ok: true }));
    return true;
  }
});
