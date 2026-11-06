const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { normalizeDomain, extractDomain, matchesTrackedDomain } = require('../domain-utils.js');

function createTracker({ trackedDomains = ['youtube.com'], local = {}, session = {}, now = Date.UTC(2026, 10, 5, 12), alarmFailure = false, silent = false } = {}) {
  let clock = now;
  class FakeDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock])); }
    static now() { return clock; }
  }
  const listeners = {};
  const alarms = new Map();
  const event = name => ({ addListener: handler => { (listeners[name] ||= []).push(handler); } });
  const localData = { trackedDomains, ...local };
  const sessionData = { ...session };
  const read = (data, keys) => {
    if (keys == null) return { ...data };
    if (Array.isArray(keys)) return Object.fromEntries(keys.filter(key => key in data).map(key => [key, data[key]]));
    if (typeof keys === 'string') return keys in data ? { [keys]: data[keys] } : {};
    return Object.fromEntries(Object.entries(keys).map(([key, fallback]) => [key, key in data ? data[key] : fallback]));
  };
  const store = data => ({
    get: async keys => read(data, keys),
    set: async (values, callback) => { Object.assign(data, values); callback?.(); },
    remove: async keys => { for (const key of Array.isArray(keys) ? keys : [keys]) delete data[key]; },
  });
  const chrome = {
    alarms: {
      create(name, info) { if (alarmFailure) throw new Error('simulated alarm API failure'); alarms.set(name, { name, ...info }); },
      get: async name => alarms.get(name),
      onAlarm: event('alarms.onAlarm'),
    },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
    storage: { local: store(localData), session: store(sessionData) },
    permissions: { async contains() { return true; } },
    notifications: { create() {} },
    tabs: { query: async () => [], onActivated: event('tabs.onActivated'), onUpdated: event('tabs.onUpdated'), onRemoved: event('tabs.onRemoved') },
    windows: { WINDOW_ID_NONE: -1, onFocusChanged: event('windows.onFocusChanged') },
    idle: { onStateChanged: event('idle.onStateChanged') },
    i18n: { getUILanguage: () => 'en-US' },
    runtime: { lastError: null, onStartup: event('runtime.onStartup'), onInstalled: event('runtime.onInstalled'), onMessage: event('runtime.onMessage') },
  };
  const context = {
    chrome, Date: FakeDate, URL, console: silent ? { error() {}, warn() {} } : console, setTimeout, clearTimeout,
    importScripts() {},
    normalizeDomain, extractDomain, matchesTrackedDomain,
  };
  const src = fs.readFileSync(path.join(__dirname, '..', 'background.js'), 'utf8');
  vm.runInNewContext(`${src}\nglobalThis.__tracker = { startTracking, stopTracking, restoreTrackingSession, initializeAlarms };`, context, { filename: 'background.js' });
  return {
    tracker: context.__tracker,
    data: localData,
    sessionData,
    listeners,
    alarms,
    advance(seconds) { clock += seconds * 1000; },
  };
}

test('background starts without contextMenus and registers its required listeners', () => {
  const app = createTracker();
  assert.ok(app.listeners['runtime.onMessage']?.length);
  assert.ok(app.listeners['tabs.onActivated']?.length);
  assert.equal('contextMenus' in app.listeners, false);
});

test('alarm initialization creates the badge, midnight, and weekly schedules', async () => {
  const app = createTracker();
  await app.tracker.initializeAlarms();
  assert.deepEqual([...app.alarms.keys()].sort(), ['badge_tick', 'midnight_reset', 'weekly_report']);
});

test('alarm setup failure is contained and does not block the stats service worker', async () => {
  const app = createTracker({ alarmFailure: true, silent: true });
  await app.tracker.initializeAlarms();
  assert.ok(app.listeners['runtime.onMessage']?.length);
  const response = await new Promise(resolve => {
    app.listeners['runtime.onMessage'][0]({ type: 'getStats' }, {}, resolve);
  });
  assert.equal(response.error, undefined);
});

test('legacy streak values are ignored so missing history cannot appear as completed days', async () => {
  const app = createTracker({ local: { streak: 366, bestStreak: 366 } });
  const response = await new Promise(resolve => {
    app.listeners['runtime.onMessage'][0]({ type: 'getStats' }, {}, resolve);
  });
  assert.equal('streak' in response, false);
  assert.equal('bestStreak' in response, false);
});

test('short visits to a site accumulate across leaving and returning', async () => {
  const app = createTracker({ trackedDomains: ['youtube.com'] });
  await app.tracker.startTracking(7, 'https://www.youtube.com/watch?v=first');
  app.advance(15);
  await app.tracker.stopTracking();
  assert.equal(app.data.dailySeconds['2026-11-05'], 15);
  assert.equal(app.data.daily['2026-11-05'], 0);

  await app.tracker.startTracking(7, 'https://m.youtube.com/shorts/second');
  app.advance(48);
  await app.tracker.stopTracking();
  assert.equal(app.data.dailySeconds['2026-11-05'], 63);
  assert.equal(app.data.daily['2026-11-05'], 1);
  assert.equal(app.data.siteDailySeconds['2026-11-05']['youtube.com'], 63);
  assert.equal(app.data.siteDaily['2026-11-05']['youtube.com'], 1);
});

test('the live site clock resumes from the time already accumulated today', async () => {
  const app = createTracker({ trackedDomains: ['youtube.com'] });
  await app.tracker.startTracking(7, 'https://youtube.com/watch?v=first');
  app.advance(45);
  await app.tracker.stopTracking();
  await app.tracker.startTracking(7, 'https://m.youtube.com/shorts/second');
  app.advance(20);

  const response = await new Promise(resolve => {
    app.listeners['runtime.onMessage'][0]({ type: 'getStats' }, {}, resolve);
  });
  assert.equal(response.todaySeconds, 45);
  assert.equal(response.liveSession.siteElapsedSec, 65);
  assert.equal(response.liveSiteMinutes, 1);
});

test('switching between custom tracked domains closes the old session and starts the new one', async () => {
  const app = createTracker({ trackedDomains: ['video.custom-site.org', 'news.example.net'] });
  await app.tracker.startTracking(12, 'https://video.custom-site.org/watch/1');
  app.advance(35);
  await app.tracker.startTracking(12, 'https://sub.news.example.net/article');
  assert.equal(app.data.siteDailySeconds['2026-11-05']['video.custom-site.org'], 35);
  app.advance(41);
  await app.tracker.startTracking(12, 'https://untracked.test/');
  assert.equal(app.data.siteDailySeconds['2026-11-05']['news.example.net'], 41);
  assert.equal(app.data.dailySeconds['2026-11-05'], 76);
});

test('restores an in-progress session after the service worker restarts', async () => {
  const first = createTracker({ trackedDomains: ['example.org'] });
  await first.tracker.startTracking(3, 'https://www.example.org/home');
  first.advance(34);

  const restarted = createTracker({
    trackedDomains: ['example.org'],
    local: first.data,
    session: first.sessionData,
    now: Date.UTC(2026, 10, 5, 12) + 56_000,
  });
  await restarted.tracker.restoreTrackingSession();
  await restarted.tracker.stopTracking();
  assert.equal(restarted.data.dailySeconds['2026-11-05'], 56);
  assert.equal(restarted.data.daily['2026-11-05'], 0);
});
