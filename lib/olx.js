import fetch from 'node-fetch';

const BASE_URL = 'https://www.olx.com.lb';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    }
  });
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  
  return res.text();
}

function parsePrice(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number.parseInt(String(value).replace(/[^\d]/g, ''), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
}

function extractJsonObjectAfterMarker(text, marker) {
  const markerIndex = text.indexOf(marker);
  if (markerIndex === -1) return null;

  let pos = markerIndex + marker.length;
  while (pos < text.length && /\s/.test(text[pos])) {
    pos += 1;
  }

  if (text[pos] !== '{') return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = pos; i < text.length; i += 1) {
    const c = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (c === '\\' && inString) {
      escape = true;
      continue;
    }

    if (c === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (c === '{') depth += 1;
      if (c === '}') {
        depth -= 1;
        if (depth === 0) {
          return text.substring(pos, i + 1);
        }
      }
    }
  }

  return null;
}

function extractStateFromHtml(html) {
  const stateJson = extractJsonObjectAfterMarker(html, 'window.state =');
  if (!stateJson) return null;

  try {
    return JSON.parse(stateJson);
  } catch {
    return null;
  }
}

function extractHitsFromHtml(html) {
  // Find the "hits" array
  const hitsStart = html.indexOf('"hits":[');
  if (hitsStart === -1) return [];
  
  // Find where hits ends by looking for "]," after it with proper nesting
  let pos = hitsStart + 8; // after '"hits":['
  let depth = 1;
  let inString = false;
  let escape = false;
  
  while (pos < html.length && depth > 0) {
    const c = html[pos];
    
    if (escape) {
      escape = false;
      pos++;
      continue;
    }
    
    if (c === '\\' && inString) {
      escape = true;
      pos++;
      continue;
    }
    
    if (c === '"') {
      inString = !inString;
    } else if (!inString) {
      if (c === '[' || c === '{') depth++;
      else if (c === ']' || c === '}') depth--;
    }
    pos++;
  }
  
  // Extract the hits array
  const hitsJson = html.substring(hitsStart + 7, pos);
  
  try {
    const hits = JSON.parse(hitsJson);
    return hits.map(parseHit).filter(h => h.id && h.title);
  } catch (e) {
    console.error('Parse error:', e.message);
    return [];
  }
}

function parseHit(hit) {
  const price = parsePrice(hit.price?.value ?? hit.extraFields?.price);
  
  const negotiable = hit.price?.type === 'negotiable' ||
                     hit.extraFields?.price_type === 'negotiable' ||
                     (hit.title || '').toLowerCase().includes('negotiable');
  
  const locations = hit.location || [];
  const location = locations.map(l => l.name).filter(Boolean).join(', ');
  
  let time = '';
  if (hit.createdAt) {
    time = getTimeAgo(new Date(hit.createdAt * 1000));
  }
  
  let verified = null;
  if (hit.user?.roles?.includes('business') || hit.contactInfo?.roles?.includes('business')) {
    verified = 'Verified Business';
  } else if (hit.user?.verified || hit.contactInfo?.verified) {
    verified = 'Verified User';
  }
  
  const categoryNode = hit.category?.[hit.category.length - 1];
  const category = categoryNode?.name || 
                   hit['category.lvl1']?.name || 
                   hit['category.lvl0']?.name || '';
  const categorySlug = categoryNode?.slug ||
                       hit['category.lvl1']?.slug ||
                       hit['category.lvl0']?.slug || '';
  
  return {
    id: String(hit.externalID || ''),
    title: hit.title || '',
    price,
    negotiable,
    location,
    time,
    verified,
    url: hit.friendlyURL ? `${BASE_URL}${hit.friendlyURL}` : `${BASE_URL}/ad/item-ID${hit.externalID}.html`,
    category,
    categorySlug
  };
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  if (!Number.isFinite(diffMs) || diffMs <= 0) return 'just now';

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return `${diffWeeks} wk ago`;
}

function formatAttributeValue(value) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value ?? '').trim();
}

function parseAdToListing(ad, fallbackUrl) {
  const location = (ad.location || []).map(l => l.name).filter(Boolean).join(', ');
  const createdAt = ad.createdAt || ad.timestamp;
  const categoryNode = ad.category?.[ad.category.length - 1];

  const attributes = (ad.formattedExtraFields || [])
    .map(field => {
      if (!field?.name) return null;
      const value = formatAttributeValue(field.formattedValue);
      return value ? `${field.name}: ${value}` : null;
    })
    .filter(Boolean);

  const sellerName = ad.contactInfo?.name || ad.agency?.name || null;
  const seller = sellerName
    ? {
        name: sellerName,
        verified: Boolean(ad.isSellerVerified),
        memberSince: null
      }
    : null;

  const id = String(ad.externalID || '');
  const slugUrl = ad.slug && id
    ? `${BASE_URL}/ad/${ad.slug}-ID${id}.html`
    : null;

  return {
    id,
    title: ad.title || '',
    price: parsePrice(ad.extraFields?.price ?? ad.price),
    negotiable: ad.extraFields?.price_type === 'negotiable',
    location,
    time: createdAt ? getTimeAgo(new Date(createdAt * 1000)) : '',
    verified: ad.isSellerVerified ? 'Verified User' : null,
    url: slugUrl || fallbackUrl || `${BASE_URL}/ad/item-ID${id}.html`,
    category: categoryNode?.name || '',
    categorySlug: categoryNode?.slug || '',
    attributes,
    description: ad.description || ad.rawDescription || '',
    seller
  };
}

function extractListingFromHtml(html, id, fallbackUrl) {
  const state = extractStateFromHtml(html);
  const ad = state?.ad?.data;

  if (ad && String(ad.externalID || '') === String(id)) {
    return parseAdToListing(ad, fallbackUrl);
  }

  const hits = extractHitsFromHtml(html);
  const listing = hits.find(h => String(h.id) === String(id));
  if (!listing) return null;

  return {
    ...listing,
    attributes: [],
    description: '',
    seller: null
  };
}

function buildSearchUrl(query, options = {}) {
  const querySlug = encodeURIComponent(
    String(query || '').trim().toLowerCase().replace(/\s+/g, '-')
  );
  let url = `${BASE_URL}/ads/q-${querySlug}/`;

  const params = [];
  if (options.minPrice && options.maxPrice) {
    params.push(`filter=price_between_${options.minPrice}_and_${options.maxPrice}`);
  } else if (options.minPrice) {
    params.push(`filter=price_min_${options.minPrice}`);
  } else if (options.maxPrice) {
    params.push(`filter=price_max_${options.maxPrice}`);
  }

  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }

  return url;
}

function applySearchFilters(inputResults, options = {}) {
  let results = [...inputResults];

  if (options.minPrice) {
    const min = Number.parseInt(options.minPrice, 10);
    if (!Number.isNaN(min)) {
      results = results.filter(r => r.price !== null && r.price >= min);
    }
  }
  if (options.maxPrice) {
    const max = Number.parseInt(options.maxPrice, 10);
    if (!Number.isNaN(max)) {
      results = results.filter(r => r.price !== null && r.price <= max);
    }
  }

  if (options.category) {
    const categoryFilter = normalizeSlug(options.category);
    results = results.filter(r => {
      const slug = normalizeSlug(r.categorySlug);
      const name = normalizeSlug(r.category);
      return slug === categoryFilter || name === categoryFilter || name.includes(categoryFilter);
    });
  }

  if (options.location) {
    const locationFilter = String(options.location).trim().toLowerCase();
    results = results.filter(r => String(r.location || '').toLowerCase().includes(locationFilter));
  }

  if (options.sort === 'price-asc') {
    results.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
  } else if (options.sort === 'price-desc') {
    results.sort((a, b) => (b.price || 0) - (a.price || 0));
  }

  return results;
}

export async function search(query, options = {}) {
  const parsedLimit = Number.parseInt(options.limit, 10);
  const limit = Number.isNaN(parsedLimit) || parsedLimit <= 0 ? 20 : parsedLimit;
  const url = buildSearchUrl(query, options);
  
  const html = await fetchPage(url);
  const rawResults = extractHitsFromHtml(html);
  const results = applySearchFilters(rawResults, options);
  
  return results.slice(0, limit);
}

export async function view(id) {
  const listingId = String(id || '').trim();
  if (!listingId) {
    throw new Error('Listing ID is required.');
  }

  const url = `${BASE_URL}/ad/item-ID${encodeURIComponent(listingId)}.html`;
  const html = await fetchPage(url);
  const listing = extractListingFromHtml(html, listingId, url);

  if (!listing) {
    throw new Error(`Listing ${listingId} not found.`);
  }
  
  return listing;
}

export async function categories() {
  return [
    { slug: 'vehicles', name: 'Vehicles' },
    { slug: 'properties', name: 'Properties' },
    { slug: 'mobile-phones-accessories', name: 'Mobiles & Tablets' },
    { slug: 'electronics-home-appliances', name: 'Electronics' },
    { slug: 'home-furniture-decor', name: 'Furniture & Decor' },
    { slug: 'fashion-beauty', name: 'Fashion & Beauty' },
    { slug: 'pets', name: 'Pets' },
    { slug: 'kids-babies', name: 'Kids & Babies' },
    { slug: 'sports-equipment', name: 'Sports' },
    { slug: 'jobs', name: 'Jobs' },
    { slug: 'services', name: 'Services' },
    { slug: 'business-industrial', name: 'Business' },
  ];
}

export const __test__ = {
  applySearchFilters,
  buildSearchUrl,
  extractJsonObjectAfterMarker,
  extractListingFromHtml,
  extractStateFromHtml,
  parseAdToListing
};
