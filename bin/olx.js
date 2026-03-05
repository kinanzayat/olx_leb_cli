#!/usr/bin/env node

import { Command } from 'commander';
import { search, view, categories } from '../lib/olx.js';

const program = new Command();

program
  .name('olx')
  .description('CLI for browsing OLX Lebanon - optimized for AI agents')
  .version('1.0.0');

program
  .command('search <query>')
  .description('Search OLX Lebanon listings')
  .option('-l, --limit <number>', 'Max results to show', '20')
  .option('-p, --max-price <number>', 'Maximum price in USD')
  .option('--min-price <number>', 'Minimum price in USD')
  .option('-c, --category <slug>', 'Category slug (e.g., vehicles, properties)')
  .option('--location <area>', 'Location filter (e.g., beirut, metn)')
  .option('-s, --sort <type>', 'Sort: newest, price-asc, price-desc', 'newest')
  .option('-j, --json', 'Output as JSON')
  .action(async (query, options) => {
    try {
      const results = await search(query, options);
      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        printResults(results);
      }
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('view <id>')
  .description('View a specific listing by ID')
  .option('-j, --json', 'Output as JSON')
  .action(async (id, options) => {
    try {
      const listing = await view(id);
      if (options.json) {
        console.log(JSON.stringify(listing, null, 2));
      } else {
        printListing(listing);
      }
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('categories')
  .description('List available categories')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    try {
      const cats = await categories();
      if (options.json) {
        console.log(JSON.stringify(cats, null, 2));
      } else {
        console.log('\n📂 OLX Lebanon Categories\n');
        cats.forEach(c => console.log(`  ${c.slug.padEnd(25)} ${c.name}`));
        console.log();
      }
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

function printResults(results) {
  if (results.length === 0) {
    console.log('\nNo results found.\n');
    return;
  }
  
  console.log(`\n🔍 Found ${results.length} listings\n`);
  console.log('─'.repeat(70));
  
  results.forEach((r, i) => {
    const price = r.price ? `$${r.price}` : 'Price N/A';
    const negotiable = r.negotiable ? ' (Negotiable)' : '';
    console.log(`\n${i + 1}. ${r.title}`);
    console.log(`   💰 ${price}${negotiable}`);
    console.log(`   📍 ${r.location}`);
    console.log(`   🕐 ${r.time}`);
    console.log(`   🔗 ID: ${r.id}`);
    if (r.verified) console.log(`   ✅ ${r.verified}`);
  });
  
  console.log('\n' + '─'.repeat(70));
  console.log(`\nUse 'olx view <id>' for details\n`);
}

function printListing(listing) {
  console.log('\n' + '═'.repeat(70));
  console.log(`\n📦 ${listing.title}\n`);
  console.log('─'.repeat(70));
  
  console.log(`💰 Price: $${listing.price || 'N/A'}${listing.negotiable ? ' (Negotiable)' : ''}`);
  console.log(`📍 Location: ${listing.location}`);
  console.log(`🕐 Posted: ${listing.time}`);
  console.log(`🔗 URL: ${listing.url}`);
  
  if (listing.attributes && listing.attributes.length > 0) {
    console.log('\n📋 Details:');
    listing.attributes.forEach(a => console.log(`   • ${a}`));
  }
  
  if (listing.description) {
    console.log('\n📝 Description:');
    console.log('─'.repeat(70));
    console.log(listing.description);
  }
  
  if (listing.seller) {
    console.log('\n👤 Seller:');
    console.log(`   ${listing.seller.name}${listing.seller.verified ? ' ✅' : ''}`);
    if (listing.seller.memberSince) console.log(`   Member since: ${listing.seller.memberSince}`);
  }
  
  console.log('\n' + '═'.repeat(70) + '\n');
}

program.parse();
