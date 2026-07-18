import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { LOCAL_COOKIES, LOCAL_GIFT_BOXES } from '../src/db/supabase.js';

// Get current directory path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to manually parse .env.local file
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error("Error: .env.local file not found at project root!");
    console.error("Please add your credentials to the .env.local file first.");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const config = {};
  
  envContent.split(/\r?\n/).forEach(line => {
    // Strip comments
    const cleanedLine = line.replace(/#.*/, '').trim();
    if (!cleanedLine) return;
    
    const parts = cleanedLine.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      config[key] = value;
    }
  });

  return config;
}

async function seed() {
  console.log("Loading environment configuration...");
  const config = loadEnv();

  const supabaseUrl = config.VITE_SUPABASE_URL;
  const serviceRoleKey = config.SUPABASE_SERVICE_ROLE_KEY || config.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_PROJECT_URL') {
    console.error("Error: VITE_SUPABASE_URL is not configured in .env.local!");
    process.exit(1);
  }
  if (!serviceRoleKey || serviceRoleKey.startsWith('YOUR_')) {
    console.error("Error: SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY is not configured in .env.local!");
    process.exit(1);
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  // Initialize client with admin key / anon key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  console.log("Preparing database tables...");
  console.log("Make sure you have created the tables in Supabase SQL editor using this schema first:\n");
  console.log(`
  CREATE TABLE IF NOT EXISTS public.cookies (
    id bigint PRIMARY KEY,
    name text NOT NULL,
    ingredients text NOT NULL,
    description text NOT NULL,
    price numeric NOT NULL,
    image text NOT NULL,
    top_seller boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.gift_boxes (
    id bigint PRIMARY KEY,
    name text NOT NULL,
    curated_for text NOT NULL,
    description text NOT NULL,
    contents text NOT NULL,
    price numeric NOT NULL,
    image text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
  );
  \n`);

  console.log(`Seeding ${LOCAL_COOKIES.length} cookies into Supabase...`);

  for (const cookie of LOCAL_COOKIES) {
    console.log(`-> Seeding Cookie: ${cookie.name}`);
    const { error } = await supabase
      .from('cookies')
      .upsert({
        id: cookie.id,
        name: cookie.name,
        ingredients: cookie.ingredients,
        description: cookie.description,
        price: cookie.price,
        image: cookie.image,
        top_seller: cookie.top_seller
      }, { onConflict: 'id' });

    if (error) {
      console.error(`Error seeding ${cookie.name}:`, error.message);
      process.exit(1);
    }
  }

  console.log(`\nSeeding ${LOCAL_GIFT_BOXES.length} curated gift boxes into Supabase...`);

  for (const box of LOCAL_GIFT_BOXES) {
    console.log(`-> Seeding Gift Box: ${box.name}`);
    const { error } = await supabase
      .from('gift_boxes')
      .upsert({
        id: box.id,
        name: box.name,
        curated_for: box.curated_for,
        description: box.description,
        contents: box.contents,
        price: box.price,
        image: box.image
      }, { onConflict: 'id' });

    if (error) {
      console.error(`Error seeding gift box ${box.name}:`, error.message);
      console.log("Hint: Ensure you created the 'gift_boxes' table in your Supabase SQL editor first.");
      process.exit(1);
    }
  }

  console.log("\nSuccess! All cookies and gift boxes successfully seeded to Supabase.");
  console.log("\n--- Next Steps for ImageKit Integration ---");
  console.log("1. Add the URL endpoint to VITE_IMAGEKIT_URL_ENDPOINT inside .env.local");
  console.log("2. Upload the files inside your local 'assets/' folder directly to your ImageKit Media Library root or an 'assets' folder.");
  console.log("3. Once configured, Vite will deliver all dynamic cookie media via ImageKit CDN!");
}

seed().catch(err => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});
