import { db, getDefaultState } from './src/config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data/property_rent_db.json');

const newState = getDefaultState();
fs.writeFileSync(DB_FILE, JSON.stringify(newState, null, 2), 'utf-8');
console.log('Database updated successfully with Tamil First for Calls & English First for WhatsApp!');
