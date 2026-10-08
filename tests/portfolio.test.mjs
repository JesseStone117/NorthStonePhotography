import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { categories, descriptions, favorites, orderPortfolio, filterPortfolio, inquiryEmail } from '../src/portfolio.js';
import { site } from '../src/site.js';
const photos = JSON.parse(await readFile(new URL('../src/generated/catalog.json', import.meta.url), 'utf8'));

test('Every provided portrait belongs to a distinct collection and has descriptive text', () => {
  const counts = { graduation: 11, couples: 17, family: 12, maternity: 7 };
  const portfolio = orderPortfolio(photos);
  assert.equal(portfolio.length, 47);
  assert.equal(new Set(portfolio.map(photo => photo.id)).size, 47);
  for (const category of categories) {
    const collection = filterPortfolio(portfolio, category.id);
    assert.equal(collection.length, counts[category.id]);
    assert.ok(collection.some(photo => photo.id === category.cover));
  }
  for (const photo of portfolio) assert.ok(descriptions[photo.id], `Missing alt text for ${photo.id}`);
  for (const id of favorites) assert.ok(portfolio.some(photo => photo.id === id), `Missing favorite ${id}`);
  assert.equal(filterPortfolio(portfolio, 'all').length, 47);
  assert.equal(filterPortfolio(portfolio, 'missing-category').length, 0);
});

test('The email draft reaches Sarah and preserves special characters and all session details', () => {
  const data = { name: ' Alex & Jo ', email: 'alex+photos@example.com', session: 'couples', date: '2026-11-01', location: 'Park & gardens', message: 'Celebrating our engagement!\nWe love woods, wildflowers & sunsets.' };
  const uri = new URL(inquiryEmail(data, site.email));
  assert.equal(uri.protocol, 'mailto:');
  assert.equal(uri.pathname, 'northstonephotography@outlook.com');
  assert.equal(uri.searchParams.get('subject'), 'Couples & Engagement session inquiry — Alex & Jo');
  const body = uri.searchParams.get('body');
  for (const expected of ['alex+photos@example.com', '2026-11-01', 'Park & gardens', data.message]) assert.ok(body.includes(expected));
  assert.equal([...uri.searchParams.keys()].length, 2);
});

test('Blank inquiries and unsupported session types cannot produce an email draft', () => {
  assert.throws(() => inquiryEmail({ session: 'wedding' }, site.email), /choose a session/);
  assert.throws(() => inquiryEmail({ session: 'family', name: ' ', email: 'a@example.com', message: 'Hi' }, site.email), /add your name/);
});
