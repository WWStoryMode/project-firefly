#!/usr/bin/env node

/**
 * Database Setup Script for Project Firefly
 *
 * Opens the SQL files in your browser's Supabase SQL Editor
 * for easy copy/paste execution.
 *
 * Usage:
 *   node scripts/setup-database.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local not found. Please create it first.');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    const proc = require('child_process').spawn('pbcopy');
    proc.stdin.write(text);
    proc.stdin.end();
    proc.on('close', resolve);
    proc.on('error', reject);
  });
}

async function main() {
  console.log('🔥 Project Firefly - Database Setup\n');
  console.log('='.repeat(50));

  // Load environment
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL not set in .env.local');
    process.exit(1);
  }

  // Extract project ref from URL
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  // Read SQL files
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
  const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  const seedSQL = fs.readFileSync(seedPath, 'utf-8');

  console.log('\n📋 STEP 1: Run the Migration\n');
  console.log('   The migration SQL has been copied to your clipboard.');
  console.log('   Opening Supabase SQL Editor...\n');

  // Copy migration to clipboard
  await copyToClipboard(migrationSQL);

  // Open SQL Editor
  exec(`open "${sqlEditorUrl}"`, (err) => {
    if (err) console.log('   Could not open browser automatically.');
  });

  console.log('   ✅ Migration SQL copied to clipboard!');
  console.log('   → Paste (Cmd+V) into the SQL Editor and click "Run"\n');

  // Wait for user
  console.log('-'.repeat(50));
  console.log('\n   Press ENTER after running the migration...');

  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  console.log('\n📋 STEP 2: Run the Seed Data\n');
  console.log('   The seed SQL has been copied to your clipboard.\n');

  // Copy seed to clipboard
  await copyToClipboard(seedSQL);

  console.log('   ✅ Seed SQL copied to clipboard!');
  console.log('   → Create a new query in SQL Editor');
  console.log('   → Paste (Cmd+V) and click "Run"\n');

  // Wait for user
  console.log('-'.repeat(50));
  console.log('\n   Press ENTER after running the seed...');

  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  console.log('\n='.repeat(50));
  console.log('\n🎉 Database setup complete!\n');
  console.log('   Your database now has:');
  console.log('   • All required tables (users, vendors, orders, etc.)');
  console.log('   • Demo vendor: Maria\'s Kitchen');
  console.log('   • 5 menu items');
  console.log('   • 1 delivery person\n');
  console.log('   Next: Restart your dev server and visit http://localhost:3000/vendors\n');
}

main().catch(console.error);
