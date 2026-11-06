const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { normalizeDomain } = require('../domain-utils.js');

function createOptionsPage() {
  const elements = new Map();
  const getElementById = id => {
    if (!elements.has(id)) {
      const handlers = {};
      elements.set(id, {
        id, value: '', textContent: '', placeholder: '', style: {}, handlers,
        classList: { classes: new Set(), add(name) { this.classes.add(name); }, remove(name) { this.classes.delete(name); } },
        addEventListener(type, fn) { (handlers[type] ||= []).push(fn); },
        focus() {},
      });
    }
    return elements.get(id);
  };
  const data = { trackedDomains: ['reddit.com'], lang: 'pt-BR' };
  let requestedOrigins = [];
  const chrome = {
    storage: { local: {
      get: async defaults => ({ ...defaults, ...data }),
      set: async (values, callback) => { Object.assign(data, values); callback?.(); },
    } },
    i18n: { getUILanguage: () => 'pt-BR' },
    permissions: {
      request({ origins }, callback) { requestedOrigins = origins; callback(true); },
      remove(_args, callback) { callback(); },
    },
  };
  const context = {
    chrome, document: { documentElement: {}, getElementById },
    normalizeDomain, URL, console,
  };
  const src = fs.readFileSync(path.join(__dirname, '..', 'options.js'), 'utf8');
  vm.runInNewContext(`${src}\nglobalThis.__options = { addDomain, setLanguage, COPY };`, context, { filename: 'options.js' });
  return { context, elements, data, requested: () => requestedOrigins };
}

test('options page adds a pasted URL as a normalized domain and saves permission', async () => {
  const app = createOptionsPage();
  await new Promise(resolve => setImmediate(resolve));
  app.elements.get('new-domain').value = 'https://www.youtube.com/shorts/example';
  app.context.__options.addDomain();
  assert.equal(app.elements.get('domains').value, 'reddit.com\nyoutube.com');
  assert.match(app.elements.get('status').textContent, /youtube\.com/);

  app.elements.get('save').handlers.click[0]();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(Array.from(app.data.trackedDomains), ['reddit.com', 'youtube.com']);
  assert.ok(app.requested().includes('https://*.youtube.com/*'));
  assert.ok(app.requested().includes('http://*.youtube.com/*'));
});

test('options page reports invalid and duplicate domains without corrupting the list', async () => {
  const app = createOptionsPage();
  await new Promise(resolve => setImmediate(resolve));
  const input = app.elements.get('new-domain');
  input.value = 'localhost';
  app.context.__options.addDomain();
  assert.ok(app.elements.get('status').classList.classes.has('error'));
  assert.equal(app.elements.get('domains').value, 'reddit.com');
  input.value = 'www.reddit.com';
  app.context.__options.addDomain();
  assert.match(app.elements.get('status').textContent, /already|lista/);
  assert.equal(app.elements.get('domains').value, 'reddit.com');
});

test('options copy supports Portuguese, English, Spanish and French', () => {
  const app = createOptionsPage();
  for (const locale of ['pt-BR', 'en', 'es', 'fr']) {
    app.context.__options.setLanguage(locale);
    assert.equal(app.elements.get('title').textContent, app.context.__options.COPY[locale].title);
    assert.equal(app.elements.get('add-domain').textContent, app.context.__options.COPY[locale].add);
  }
});
