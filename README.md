# OLX Lebanon CLI

A command-line interface for browsing OLX Lebanon listings — optimized for AI agents.

## Installation

```bash
npm install -g olx-leb
# or
npx olx-leb search "iphone"
```

## Usage

### Search Listings

```bash
# Basic search
olx search "iphone 15"

# With price filter
olx search "macbook" --max-price 1000

# With location
olx search "car" --location beirut

# Sort by price
olx search "ps5" --sort price-asc

# JSON output (for agents)
olx search "apartment" --json
```

### View Listing Details

```bash
# View by ID (from search results)
olx view 116739688

# JSON output
olx view 116739688 --json
```

### List Categories

```bash
olx categories
```

## Options

### Search Options

| Option | Description | Example |
|--------|-------------|---------|
| `-l, --limit <n>` | Max results (default: 20) | `--limit 50` |
| `-p, --max-price <n>` | Maximum price in USD | `--max-price 500` |
| `--min-price <n>` | Minimum price in USD | `--min-price 100` |
| `-c, --category <slug>` | Category filter | `--category vehicles` |
| `--location <area>` | Location filter | `--location metn` |
| `-s, --sort <type>` | Sort: newest, price-asc, price-desc | `--sort price-asc` |
| `-j, --json` | Output as JSON | `--json` |

## For AI Agents

Use `--json` flag for structured output:

```bash
olx search "laptop" --max-price 800 --json | jq '.[] | {title, price, id}'
```

## Categories

- vehicles
- properties
- mobile-phones-accessories
- electronics-home-appliances
- home-furniture-decor
- fashion-beauty
- pets
- kids-babies
- sports-equipment
- jobs
- services
- business-industrial

## License

MIT
