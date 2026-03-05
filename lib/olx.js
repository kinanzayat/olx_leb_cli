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
  const price = hit.price?.value ? parseInt(hit.price.value) : 
                hit.extraFields?.price ? parseInt(hit.extraFields.price) : null;
  
  const negotiable = hit.price?.type === 'negotiable' || 
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
  
  const category = hit.category?.[hit.category.length - 1]?.name || 
                   hit['category.lvl1']?.name || 
                   hit['category.lvl0']?.name || '';
  
  return {
    id: hit.externalID || '',
    title: hit.title || '',
    price,
    negotiable,
    location,
    time,
    verified,
    url: hit.friendlyURL ? `${BASE_URL}${hit.friendlyURL}` : `${BASE_URL}/ad/item-ID${hit.externalID}.html`,
    category
  };
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${diffWeeks} wk ago`;
}

export async function search(query, options = {}) {
  const limit = parseInt(options.limit) || 20;
  
  const querySlug = query.toLowerCase().replace(/\s+/g, '-');
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
  
  const html = await fetchPage(url);
  let results = extractHitsFromHtml(html);
  
  // Apply filters
  if (options.minPrice) {
    const min = parseInt(options.minPrice);
    results = results.filter(r => r.price && r.price >= min);
  }
  if (options.maxPrice) {
    const max = parseInt(options.maxPrice);
    results = results.filter(r => r.price && r.price <= max);
  }
  
  // Sort
  if (options.sort === 'price-asc') {
    results.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
  } else if (options.sort === 'price-desc') {
    results.sort((a, b) => (b.price || 0) - (a.price || 0));
  }
  
  return results.slice(0, limit);
}

export async function view(id) {
  const html = await fetchPage(`${BASE_URL}/ads/`);
  const hits = extractHitsFromHtml(html);
  let listing = hits.find(h => h.id === id);
  
  if (!listing) {
    throw new Error(`Listing ${id} not found. Search for it first.`);
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
