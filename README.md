# 🇱🇧 OLX Lebanon CLI

Browse OLX Lebanon from your terminal — no more endless scrolling through the website!

Perfect for:
- 🤖 **AI Agents** (Claude, GPT, etc.) — structured JSON output
- 👨‍💻 **Developers** — automate price tracking, alerts
- 🛒 **Bargain Hunters** — quickly filter and sort listings

## ⚡ Quick Start

```bash
# Clone and install
git clone https://github.com/kinanzayat/olx_leb_cli.git
cd olx_leb_cli
npm install
npm link

# Search for iPhones
olx search "iphone 15"

# Find cars under $20k in Beirut
olx search "car" --max-price 20000 --location beirut
```

## 📦 Installation

### Option 1: Clone (Recommended)
```bash
git clone https://github.com/kinanzayat/olx_leb_cli.git
cd olx_leb_cli
npm install
npm link  # Makes 'olx' available globally
```

### Option 2: NPX (No install)
```bash
npx olx-leb search "iphone"
```

## 🔍 Search Listings

```bash
# Basic search
olx search "macbook"

# Limit results
olx search "ps5" --limit 5

# Price range
olx search "laptop" --min-price 300 --max-price 800

# Filter by location
olx search "apartment" --location metn

# Sort by price (cheapest first)
olx search "iphone" --sort price-asc

# Sort by price (most expensive first)
olx search "rolex" --sort price-desc
```

### Example Output
```
🔍 Found 5 listings
──────────────────────────────────────────────────────────────────────

1. IPhone 15 pro max 256 GB
   💰 $800
   📍 Lebanon, Beirut, Achrafieh
   🕐 3 wk ago
   🔗 ID: 116739688

2. iPhone 14 Pro 256GB
   💰 $609
   📍 Lebanon, Metn, Dekwaneh
   🕐 1 wk ago
   🔗 ID: 116190941

──────────────────────────────────────────────────────────────────────
Use 'olx view <id>' for details
```

## 📋 View Listing Details

Get full details for any listing using its ID:

```bash
olx view 116739688
```

### Example Output
```
══════════════════════════════════════════════════════════════════════

📦 IPhone 15 pro max 256 GB

──────────────────────────────────────────────────────────────────────
💰 Price: $800
📍 Location: Lebanon, Beirut, Achrafieh
🕐 Posted: 3 wk ago
🔗 URL: https://www.olx.com.lb/ad/iphone-15-pro-max-256-gb-ID116739688.html

📋 Details:
   • Brand: Apple
   • Color: Silver
   • Model: 15 Pro Max
   • Storage: 256 GB
   • Condition: Used

📝 Description:
──────────────────────────────────────────────────────────────────────
phone is like new no scratches and never been opened. BATTERY AT 80%

👤 Seller:
   imad saade ✅

══════════════════════════════════════════════════════════════════════
```

## 📂 Categories

```bash
olx categories
```

| Slug | Category |
|------|----------|
| `vehicles` | Cars, Motorcycles, Boats |
| `properties` | Apartments, Houses, Land |
| `mobile-phones-accessories` | Phones, Tablets, Accessories |
| `electronics-home-appliances` | TVs, Laptops, Kitchen |
| `home-furniture-decor` | Furniture, Decor, Garden |
| `fashion-beauty` | Clothing, Watches, Jewelry |
| `pets` | Dogs, Cats, Birds |
| `kids-babies` | Toys, Strollers, Clothing |
| `sports-equipment` | Gym, Bikes, Outdoors |
| `jobs` | Job Listings |
| `services` | Professional Services |
| `business-industrial` | Equipment, Machinery |

## 🤖 For AI Agents (Claude, GPT, etc.)

Use the `--json` flag to get structured output perfect for AI processing:

```bash
olx search "macbook" --max-price 1000 --json
```

### JSON Output
```json
[
  {
    "id": "116797302",
    "title": "Macbook pro m3 8/512 ssd",
    "price": 850,
    "negotiable": false,
    "location": "Lebanon, Beirut, Mar Elias",
    "time": "1 wk ago",
    "url": "https://www.olx.com.lb/ad/...",
    "category": "Laptops, Tablets, Computers"
  }
]
```

### Teaching Your AI Agent

Copy this into your agent's instructions:

```markdown
## OLX Lebanon Skill

I can search OLX Lebanon using the `olx` CLI:

**Search:** `olx search "query" --limit 10 --json`
**View:** `olx view <id> --json`
**Categories:** `olx categories`

Options:
- `--max-price <n>` — filter by max price
- `--min-price <n>` — filter by min price  
- `--location <area>` — filter by location (beirut, metn, etc.)
- `--sort price-asc` — cheapest first
- `--sort price-desc` — most expensive first
- `--json` — structured output for processing
```

## 🛠️ All Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--limit` | `-l` | Max results | 20 |
| `--max-price` | `-p` | Maximum price (USD) | - |
| `--min-price` | | Minimum price (USD) | - |
| `--category` | `-c` | Category slug | - |
| `--location` | | Location filter | - |
| `--sort` | `-s` | `newest`, `price-asc`, `price-desc` | newest |
| `--json` | `-j` | JSON output | false |

## 💡 Tips & Tricks

### Find the Best Deals
```bash
# Cheapest iPhones
olx search "iphone" --sort price-asc --limit 10

# Negotiable items only (check titles)
olx search "negotiable" --category mobile-phones-accessories
```

### Location Shortcuts
```bash
--location beirut
--location metn
--location tripoli
--location jounieh
--location saida
```

### Pipe to Other Tools
```bash
# Pretty print with jq
olx search "car" --json | jq '.[0]'

# Save results
olx search "apartment" --json > apartments.json

# Count results
olx search "laptop" --json | jq 'length'
```

## 🧪 Running Tests

```bash
npm test
```

## 📝 License

MIT — use it however you want!

## 🤝 Contributing

PRs welcome! Built by [@kinanzayat](https://github.com/kinanzayat)

---

*No more scrolling through OLX. Just ask.* 🚀
