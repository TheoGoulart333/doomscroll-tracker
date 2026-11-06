const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('popup has complete Spanish and French copy and localized weekday labels', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');
  const start = source.indexOf('const DAYS_SHORT');
  const end = source.indexOf('function tr(', start);
  const context = {};
  vm.runInNewContext(`${source.slice(start, end)}\nglobalThis.catalog = COPY; globalThis.weekdays = DAYS_SHORT;`, context);
  for (const locale of ['pt-BR', 'en', 'es', 'fr']) {
    assert.ok(context.catalog[locale]);
    assert.equal(context.weekdays[locale].length, 7);
    for (const key of Object.keys(context.catalog.en)) assert.notEqual(context.catalog[locale][key], undefined, `${locale} is missing ${key}`);
  }
  assert.equal(context.catalog.es.language, 'Idioma');
  assert.equal(context.catalog.fr.language, 'Langue');
});
