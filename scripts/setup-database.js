#!/usr/bin/env node

/**
 * Database Setup Script for Project Firefly
 *
 * Runs all migrations in order and optionally seeds demo data.
 * Loads environment variables based on the target environment.
 *
 * Usage:
 *   node scripts/setup-database.js --env dev       (migrations + seed)
 *   node scripts/setup-database.js --env staging   (migrations + seed)
 *   node scripts/setup-database.js --env prod      (migrations only, no seed)
 *   node scripts/setup-database.js                 (defaults to dev)
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const VALID_ENVS = ['dev', 'staging', 'prod'];
const SEED_ENVS = ['dev', 'staging'];

function parseArgs() {
  const args = process.argv.slice(2);
  let env = 'dev';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--env' && args[i + 1]) {
      env = args[i + 1];
      i++;
    }
  }

  if (!VALID_ENVS.includes(env)) {
    console.error(`Error: Invalid environment "${env}". Must be one of: ${VALID_ENVS.join(', ')}`);
    process.exit(1);
  }

  return { env };
}

function loadEnv(env) {
  // Try env-specific file first, then fall back to .env.local
  const envFiles = [
    path.join(__dirname, '..', `.env.${env}`),
    path.join(__dirname, '..', '.env.local'),
  ];

  let loaded = false;
  for (const envPath of envFiles) {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      });
      console.log(`   Loaded env from: ${path.basename(envPath)}`);
      loaded = true;
      break;
    }
  }

  if (!loaded) {
    console.error(`Error: No env file found. Create .env.${env} or .env.local`);
    process.exit(1);
  }
}

function discoverMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('Error: supabase/migrations directory not found.');
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  return files.map(f => ({
    name: f,
    path: path.join(migrationsDir, f),
    sql: fs.readFileSync(path.join(migrationsDir, f), 'utf-8'),
  }));
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

function waitForEnter() {
  return new Promise(resolve => {
    process.stdin.once('data', resolve);
  });
}

async function main() {
  const { env } = parseArgs();
  const shouldSeed = SEED_ENVS.includes(env);

  console.log('🔥 Project Firefly - Database Setup\n');
  console.log('='.repeat(50));
  console.log(`   Environment:  ${env}`);
  console.log(`   Seed data:    ${shouldSeed ? 'yes' : 'no (production)'}`);
  console.log('='.repeat(50));

  // Load environment
  loadEnv(env);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('\nError: NEXT_PUBLIC_SUPABASE_URL not set.');
    process.exit(1);
  }

  // Extract project ref and build SQL Editor URL
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  console.log(`   Supabase:     ${projectRef}`);
  console.log('');

  // Discover migrations
  const migrations = discoverMigrations();
  console.log(`   Found ${migrations.length} migration(s):`);
  migrations.forEach(m => console.log(`     • ${m.name}`));
  console.log('');

  // Open SQL Editor once
  exec(`open "${sqlEditorUrl}"`, (err) => {
    if (err) console.log('   Could not open browser automatically.');
  });

  // Run each migration
  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    const step = i + 1;

    console.log('-'.repeat(50));
    console.log(`\n📋 STEP ${step}/${migrations.length}: ${migration.name}\n`);

    await copyToClipboard(migration.sql);

    console.log('   ✅ SQL copied to clipboard!');
    console.log('   → Paste (Cmd+V) into the SQL Editor and click "Run"');
    console.log('\n   Press ENTER after running this migration...');

    await waitForEnter();
  }

  // Seed data (dev and staging only)
  if (shouldSeed) {
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');

    if (fs.existsSync(seedPath)) {
      const seedSQL = fs.readFileSync(seedPath, 'utf-8');

      console.log('-'.repeat(50));
      console.log('\n📋 SEED: Insert demo data\n');

      await copyToClipboard(seedSQL);

      console.log('   ✅ Seed SQL copied to clipboard!');
      console.log('   → Create a new query in SQL Editor');
      console.log('   → Paste (Cmd+V) and click "Run"');
      console.log('\n   Press ENTER after running the seed...');

      await waitForEnter();
    } else {
      console.log('\n   ⚠️  No seed.sql found, skipping seed step.');
    }
  } else {
    console.log('\n   ⏭️  Skipping seed data (production environment).');
  }

  // Done
  console.log('\n' + '='.repeat(50));
  console.log('\n🎉 Database setup complete!\n');
  console.log(`   Environment: ${env}`);
  console.log(`   Migrations:  ${migrations.length} applied`);
  console.log(`   Seed data:   ${shouldSeed ? 'applied' : 'skipped'}`);
  console.log('');

  if (shouldSeed) {
    console.log('   Your database now has:');
    console.log('   • All required tables (users, vendors, orders, etc.)');
    console.log('   • Demo vendor: Maria\'s Kitchen');
    console.log('   • 5 menu items');
    console.log('   • 1 delivery person');
    console.log('');
  }

  console.log('   Next: Restart your dev server and visit http://localhost:3000/vendors\n');
}

main().catch(console.error);
