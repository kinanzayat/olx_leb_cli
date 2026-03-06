import test from 'node:test';
import assert from 'node:assert/strict';

import { __test__ } from '../lib/olx.js';

const {
  applySearchFilters,
  buildSearchUrl,
  extractJsonObjectAfterMarker,
  extractListingFromHtml
} = __test__;

test('extractJsonObjectAfterMarker extracts nested JSON object', () => {
  const html = '<script>window.state = {"a":1,"b":{"c":[{"d":"x"}]}};window.foo=1;</script>';
  const extracted = extractJsonObjectAfterMarker(html, 'window.state =');

  assert.equal(extracted, '{"a":1,"b":{"c":[{"d":"x"}]}}');
  assert.deepEqual(JSON.parse(extracted), { a: 1, b: { c: [{ d: 'x' }] } });
});

test('extractListingFromHtml returns detailed listing from window.state', () => {
  const state = {
    ad: {
      data: {
        externalID: '12345',
        title: 'Toyota Corolla 2015',
        extraFields: { price: 9000, price_type: 'price' },
        location: [{ name: 'Lebanon' }, { name: 'Beirut' }],
        createdAt: 1700000000,
        isSellerVerified: true,
        contactInfo: { name: 'Rany' },
        formattedExtraFields: [
          { name: 'Year', formattedValue: '2015' },
          { name: 'Features', formattedValue: ['ABS', 'Airbags'] }
        ],
        description: 'Clean car',
        category: [
          { name: 'Vehicles', slug: 'vehicles' },
          { name: 'Cars for Sale', slug: 'cars-for-sale' }
        ],
        slug: 'toyota-corolla-2015'
      }
    }
  };

  const html = `<script>window.state = ${JSON.stringify(state)};window.webpackBundles={};</script>`;
  const listing = extractListingFromHtml(
    html,
    '12345',
    'https://www.olx.com.lb/ad/item-ID12345.html'
  );

  assert.equal(listing.id, '12345');
  assert.equal(listing.title, 'Toyota Corolla 2015');
  assert.equal(listing.price, 9000);
  assert.equal(listing.location, 'Lebanon, Beirut');
  assert.equal(listing.categorySlug, 'cars-for-sale');
  assert.equal(listing.description, 'Clean car');
  assert.deepEqual(listing.attributes, ['Year: 2015', 'Features: ABS, Airbags']);
  assert.deepEqual(listing.seller, {
    name: 'Rany',
    verified: true,
    memberSince: null
  });
  assert.match(listing.url, /toyota-corolla-2015-ID12345\.html$/);
  assert.equal(typeof listing.time, 'string');
  assert.notEqual(listing.time.length, 0);
});

test('applySearchFilters filters by category, location, price and sort', () => {
  const results = [
    {
      id: '1',
      title: 'A',
      price: 9500,
      location: 'Lebanon, Beirut',
      category: 'Cars for Sale',
      categorySlug: 'cars-for-sale'
    },
    {
      id: '2',
      title: 'B',
      price: 8500,
      location: 'Lebanon, Metn',
      category: 'Cars for Sale',
      categorySlug: 'cars-for-sale'
    },
    {
      id: '3',
      title: 'C',
      price: 7000,
      location: 'Lebanon, Beirut',
      category: 'SUV',
      categorySlug: 'suv'
    }
  ];

  const filtered = applySearchFilters(results, {
    category: 'cars-for-sale',
    location: 'beirut',
    maxPrice: '10000',
    sort: 'price-asc'
  });

  assert.deepEqual(
    filtered.map(item => item.id),
    ['1']
  );
});

test('buildSearchUrl encodes query and attaches price filters', () => {
  const url = buildSearchUrl('BMW X5 +', { minPrice: '5000', maxPrice: '10000' });

  assert.equal(
    url,
    'https://www.olx.com.lb/ads/q-bmw-x5-%2B/?filter=price_between_5000_and_10000'
  );
});
