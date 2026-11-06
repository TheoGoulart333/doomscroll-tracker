const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeDomain, extractDomain, matchesTrackedDomain } = require('../domain-utils.js');

test('accepts domains and full URLs, then stores only the normalized host', () => {
  assert.equal(normalizeDomain('reddit.com'), 'reddit.com');
  assert.equal(normalizeDomain('WWW.YouTube.com/watch?v=abc'), 'youtube.com');
  assert.equal(normalizeDomain('https://m.youtube.com/shorts/abc?feature=share'), 'm.youtube.com');
  assert.equal(normalizeDomain('http://news.example.co.uk:8080/story'), 'news.example.co.uk');
  assert.equal(normalizeDomain('https://xn--bcher-kva.example/article'), 'xn--bcher-kva.example');
});

test('rejects malformed, local-only, IP, whitespace and overlong hostnames', () => {
  assert.equal(normalizeDomain(''), null);
  assert.equal(normalizeDomain('not a domain'), null);
  assert.equal(normalizeDomain('localhost'), null);
  assert.equal(normalizeDomain('127.0.0.1'), null);
  assert.equal(normalizeDomain('https://bad..example'), null);
  assert.equal(normalizeDomain(`${'a'.repeat(64)}.example`), null);
  assert.equal(normalizeDomain(`https://${'a'.repeat(250)}.example/path`), null);
});

test('matches registered domains and their subdomains without suffix collisions', () => {
  const domains = ['youtube.com', 'example.co.uk', 'custom.site'];
  assert.equal(extractDomain('https://www.youtube.com/watch?v=1'), 'youtube.com');
  assert.equal(matchesTrackedDomain('https://m.youtube.com/shorts/1', domains), 'youtube.com');
  assert.equal(matchesTrackedDomain('https://deep.sub.example.co.uk/page', domains), 'example.co.uk');
  assert.equal(matchesTrackedDomain('https://media.custom.site/video', domains), 'custom.site');
  assert.equal(matchesTrackedDomain('https://notyoutube.com/', domains), null);
  assert.equal(matchesTrackedDomain('https://other.test/', domains), null);
});

test('uses the same matching rules for every built-in and user-defined website', () => {
  const sites = ['reddit.com', 'twitter.com', 'x.com', 'youtube.com', 'instagram.com', 'tiktok.com', 'facebook.com', 'huffpost.com', 'buzzfeed.com', 'twitch.tv', 'linkedin.com', 'my-custom.example'];
  for (const site of sites) {
    assert.equal(normalizeDomain(`https://www.${site}/some/path`), site);
    assert.equal(matchesTrackedDomain(`http://www.${site}/some/path`, [site]), site);
  }
});
