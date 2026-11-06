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

test('summary duration labels use singular and plural forms correctly in every locale', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');
  const start = source.indexOf('const COPY =');
  const end = source.indexOf('\nfunction applyLanguage', start);
  const durationStart = source.indexOf('function formatCardDuration(');
  const durationEnd = source.indexOf('\nfunction fmtLive', durationStart);
  const context = {};
  vm.runInNewContext(`let currentLang = 'pt-BR';\n${source.slice(start, end)}\n${source.slice(durationStart, durationEnd)}\nglobalThis.duration = formatCardDuration; globalThis.catalog = COPY; globalThis.setLang = lang => { currentLang = lang; };`, context);

  const expected = {
    'pt-BR': ['minuto', 'minutos', 'hora', 'horas'],
    en: ['minute', 'minutes', 'hour', 'hours'],
    es: ['minuto', 'minutos', 'hora', 'horas'],
    fr: ['minute', 'minutes', 'heure', 'heures'],
  };
  for (const [locale, labels] of Object.entries(expected)) {
    context.setLang(locale);
    assert.deepEqual({ ...context.duration(1) }, { value: '1', unit: labels[0] });
    assert.deepEqual({ ...context.duration(2) }, { value: '2', unit: labels[1] });
    assert.deepEqual({ ...context.duration(60) }, { value: '1', unit: labels[2] });
    assert.deepEqual({ ...context.duration(120) }, { value: '2', unit: labels[3] });
  }
});
