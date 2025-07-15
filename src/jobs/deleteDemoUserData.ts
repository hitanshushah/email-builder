import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../../utils/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.join(__dirname, 'cron.log');

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  console.log(logEntry);
  fs.appendFileSync(LOG_FILE, logEntry + '\n', 'utf8');
}

function cleanOldLogs() {
  try {
    const contents = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = contents.split('\n');
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    const filtered = lines.filter(line => {
      const match = line.match(/^\[(.*?)\]/);
      if (!match) return false;
      const time = new Date(match[1]).getTime();
      return time >= cutoff;
    });

    fs.writeFileSync(LOG_FILE, filtered.join('\n'), 'utf8');
  } catch (err) {
    console.error('[CRON] Failed to clean old logs:', err);
  }
}

export async function deleteDemoUserData() {
  log('🔁 Cron job started');

  try {
    const userResult = await db.query('SELECT id FROM users WHERE name = $1', ['demo-user']);
    if (userResult.rows.length === 0) {
      log('⚠️ No demo user found.');
      return;
    }

    const demoUserId = userResult.rows[0].id;

    const templateResult = await db.query('SELECT id FROM templates WHERE user_id = $1', [demoUserId]);
    const templateIds = templateResult.rows.map(row => row.id);

    const categoryResult = await db.query('SELECT id FROM categories WHERE user_id = $1', [demoUserId]);
    const categoryIds = categoryResult.rows.map(row => row.id);

    if (templateIds.length > 0) {
      await db.query('DELETE FROM template_categories WHERE template_id = ANY($1)', [templateIds]);
      await db.query('DELETE FROM versions WHERE template_id = ANY($1)', [templateIds]);
      await db.query('DELETE FROM templates WHERE id = ANY($1)', [templateIds]);
    }

    if (categoryIds.length > 0) {
      await db.query('DELETE FROM template_categories WHERE category_id = ANY($1)', [categoryIds]);
      await db.query('DELETE FROM categories WHERE id = ANY($1)', [categoryIds]);
    }

    log('✅ Cron job completed successfully.');
  } catch (err: any) {
    log(`❌ Cron job failed: ${err.message}`);
    console.error('[CRON] Error:', err);
  } finally {
    cleanOldLogs();
  }
}
