export const FEED_SCHEMA = "brierfield.release-catalogue.v1";

export function assertStagingBranch(branch) {
  if (branch === "main") {
    throw new Error("Refusing Hub release sync on production branch main.");
  }
  if (branch !== "staging") {
    throw new Error(
      "Hub release sync may run only on the staging branch; current branch is " + branch
    );
  }
}

export function validateFeed(feed) {
  if (!feed || typeof feed !== "object" || Array.isArray(feed)) {
    throw new Error("Hub release handoff must be a JSON object.");
  }
  if (feed.schema !== FEED_SCHEMA) {
    throw new Error(
      "Unsupported Hub release feed schema: " + String(feed.schema || "")
    );
  }
  if (!Array.isArray(feed.records)) {
    throw new Error("Hub release feed records must be an array.");
  }
  if (feed.record_count !== feed.records.length) {
    throw new Error("Hub release feed record_count does not match records.");
  }

  for (const record of feed.records) {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      throw new Error("Hub release feed contains a non-object record.");
    }
    if (!record.title_slug || !record.title || !record.author) {
      throw new Error("Hub release feed record is missing title identity.");
    }
    if (!record.publication_date) {
      throw new Error(
        "Hub release feed record is missing publication_date for " +
          record.title_slug
      );
    }
    if (!Array.isArray(record.retailers)) {
      throw new Error(
        "Hub release feed retailers must be an array for " + record.title_slug
      );
    }
  }
  return feed;
}

export function displayReleaseDate(isoDate) {
  const match = String(isoDate || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error("Invalid Hub publication date: " + isoDate);
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  );
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function isPreferredRecord(candidate, current) {
  if (!current) return true;

  const candidateLive = candidate.availability === "live" ? 1 : 0;
  const currentLive = current.availability === "live" ? 1 : 0;
  if (candidateLive !== currentLive) return candidateLive > currentLive;

  const dateOrder = String(candidate.publication_date).localeCompare(
    String(current.publication_date)
  );
  if (dateOrder) return dateOrder > 0;

  const candidateEdition = Number(candidate.edition_number ?? -1);
  const currentEdition = Number(current.edition_number ?? -1);
  if (candidateEdition !== currentEdition) return candidateEdition > currentEdition;

  return String(candidate.record_key).localeCompare(String(current.record_key)) < 0;
}

export function overlayBooks(websiteBooks, rawFeed) {
  const feed = validateFeed(rawFeed);
  const bySlug = new Map();
  for (const record of feed.records) {
    const current = bySlug.get(record.title_slug);
    if (isPreferredRecord(record, current)) {
      bySlug.set(record.title_slug, record);
    }
  }

  return websiteBooks.map(book => {
    const record = bySlug.get(book.slug);
    if (!record) return { ...book };

    const next = {
      ...book,
      title: record.title,
      author: record.author,
      releaseDate: record.publication_date,
      releaseDateDisplay: displayReleaseDate(record.publication_date),
      meta:
        record.availability === "live"
          ? "Released " + displayReleaseDate(record.publication_date)
          : "Published " + displayReleaseDate(record.publication_date)
    };

    if (record.description) next.description = record.description;

    delete next.amazonUrl;
    delete next.productUrl;
    delete next.productRetailer;

    if (record.availability === "live" && record.retailers.length) {
      const retailer = record.retailers[0];
      if (retailer.product_url && retailer.retailer) {
        next.productUrl = retailer.product_url;
        next.productRetailer = retailer.retailer;
      }
    }

    return next;
  });
}

export function recentReleaseBooks(books, limit = 2) {
  return books
    .filter(book => book.releaseDate)
    .slice()
    .sort((a, b) => {
      const dateOrder = String(b.releaseDate).localeCompare(String(a.releaseDate));
      if (dateOrder) return dateOrder;
      return String(a.slug).localeCompare(String(b.slug));
    })
    .slice(0, limit);
}
