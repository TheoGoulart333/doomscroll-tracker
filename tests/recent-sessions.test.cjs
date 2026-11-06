const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('recent activity combines visits to the same site and preserves the latest visit', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');
  const start = source.indexOf('function aggregateRecentSessions(');
  const end = source.indexOf('\nfunction formatRecentDuration', start);
  const context = {};
  vm.runInNewContext(`${source.slice(start, end)}\nglobalThis.aggregate = aggregateRecentSessions;`, context);

  const result = context.aggregate([
    { domain: 'youtube.com', date: '2026-11-05', start: '21:29', seconds: 9 },
    { domain: 'youtube.com', date: '2026-11-05', start: '21:28', seconds: 10 },
    { domain: 'reddit.com', date: '2026-11-05', start: '21:27', seconds: 42 },
    { domain: 'youtube.com', date: '2026-11-05', start: '21:27', seconds: 5 },
  ]);

  assert.equal(result.length, 2);
  assert.deepEqual({ ...result[0] }, {
    domain: 'youtube.com', date: '2026-11-05', start: '21:29', visits: 3, seconds: 24,
  });
  assert.deepEqual({ ...result[1] }, {
    domain: 'reddit.com', date: '2026-11-05', start: '21:27', visits: 1, seconds: 42,
  });
});

test('recent activity safely handles older minute-only records and missing domains', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');
  const start = source.indexOf('function aggregateRecentSessions(');
  const end = source.indexOf('\nfunction formatRecentDuration', start);
  const context = {};
  vm.runInNewContext(`${source.slice(start, end)}\nglobalThis.aggregate = aggregateRecentSessions;`, context);

  const result = context.aggregate([
    { domain: 'example.com', minutes: 2 },
    { minutes: 3 },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].seconds, 120);
  assert.equal(result[0].visits, 1);
});
