import assert from "node:assert/strict";

import {
  FEED_SCHEMA,
  assertStagingBranch,
  displayReleaseDate,
  overlayBooks,
  recentReleaseBooks,
  validateFeed
} from "./hub-release-feed.mjs";

assert.doesNotThrow(() => assertStagingBranch("staging"));
assert.throws(() => assertStagingBranch("main"), /production branch main/);
assert.throws(() => assertStagingBranch("feature/test"), /only on the staging branch/);

const feed = {
  schema: FEED_SCHEMA,
  record_count: 2,
  records: [
    {
      record_key: "new-book:edition-01:paperback",
      title: "New Book",
      title_slug: "new-book",
      subtitle: null,
      tagline: null,
      description: "Hub-owned public description.",
      author: "Public Author",
      series: null,
      edition_number: 1,
      format: "paperback",
      format_label: "Paperback",
      publication_date: "2026-10-03",
      availability: "live",
      publisher: "Brierfield Publishing",
      isbn: "9780000000001",
      retailers: [
        {
          retailer: "Amazon UK",
          market: "UK",
          product_url: "https://example.test/new-book",
          provider_identifier: "NEW-1",
          first_live_date: "2026-10-03",
          verified_on: "2026-10-05"
        }
      ]
    },
    {
      record_key: "older-book:edition-01:paperback",
      title: "Older Book",
      title_slug: "older-book",
      subtitle: null,
      tagline: null,
      description: null,
      author: "Older Author",
      series: null,
      edition_number: 1,
      format: "paperback",
      format_label: "Paperback",
      publication_date: "2026-09-11",
      availability: "retired",
      publisher: "Brierfield Publishing",
      isbn: null,
      retailers: []
    }
  ]
};

assert.equal(validateFeed(feed), feed);
assert.throws(
  () => validateFeed({ ...feed, schema: "wrong" }),
  /Unsupported Hub release feed schema/
);
assert.throws(
  () => validateFeed({ ...feed, record_count: 99 }),
  /record_count/
);
assert.equal(displayReleaseDate("2026-10-03"), "3 October 2026");

const websiteBooks = [
  {
    slug: "new-book",
    title: "Old Site Title",
    author: "Old Site Author",
    meta: "Coming soon",
    category: "Website Category",
    image: "assets/site-owned.jpg",
    description: "Old site description",
    amazonUrl: "https://stale.example.test"
  },
  {
    slug: "older-book",
    title: "Older Site Book",
    author: "Older Site Author",
    meta: "Old",
    category: "Fiction",
    image: null,
    description: "Preserve me when Hub has no description.",
    amazonUrl: "https://stale.example.test/older"
  },
  {
    slug: "website-only",
    title: "Website Only",
    author: "Site Author",
    meta: "In development",
    category: "Fiction",
    image: null,
    description: "Untouched."
  }
];

const overlaid = overlayBooks(websiteBooks, feed);
const newer = overlaid[0];
assert.equal(newer.title, "New Book");
assert.equal(newer.author, "Public Author");
assert.equal(newer.description, "Hub-owned public description.");
assert.equal(newer.meta, "Released 3 October 2026");
assert.equal(newer.releaseDate, "2026-10-03");
assert.equal(newer.releaseDateDisplay, "3 October 2026");
assert.equal(newer.productUrl, "https://example.test/new-book");
assert.equal(newer.productRetailer, "Amazon UK");
assert.equal(newer.category, "Website Category");
assert.equal(newer.image, "assets/site-owned.jpg");
assert.equal("amazonUrl" in newer, false);

const older = overlaid[1];
assert.equal(older.meta, "Published 11 September 2026");
assert.equal(older.description, "Preserve me when Hub has no description.");
assert.equal("productUrl" in older, false);
assert.equal("amazonUrl" in older, false);

assert.deepEqual(overlaid[2], websiteBooks[2]);
assert.deepEqual(
  recentReleaseBooks(overlaid, 2).map(book => book.slug),
  ["new-book", "older-book"]
);

const multiEditionFeed = {
  schema: FEED_SCHEMA,
  record_count: 3,
  records: [
    {
      ...feed.records[0],
      record_key: "new-book:edition-01:paperback",
      edition_number: 1,
      publication_date: "2026-09-01",
      availability: "live",
      description: "Older live edition."
    },
    {
      ...feed.records[0],
      record_key: "new-book:edition-02:paperback",
      edition_number: 2,
      publication_date: "2026-10-04",
      availability: "live",
      description: "Current live edition."
    },
    {
      ...feed.records[0],
      record_key: "new-book:edition-03:paperback",
      edition_number: 3,
      publication_date: "2026-10-05",
      availability: "retired",
      description: "Newer date but retired edition."
    }
  ]
};
const selected = overlayBooks([websiteBooks[0]], multiEditionFeed)[0];
assert.equal(selected.description, "Current live edition.");
assert.equal(selected.releaseDate, "2026-10-04");

console.log("Hub release feed staging overlay contract: OK");
