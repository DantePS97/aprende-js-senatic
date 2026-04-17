import Dexie from 'dexie';
import { db } from '../lib/db';

export async function resetDb(): Promise<void> {
  await db.close();
  await Dexie.delete(db.name);
  await db.open();
}

export async function seedDb(fixtures: Record<string, unknown[]>): Promise<void> {
  if (!db.isOpen()) await db.open();
  for (const [tableName, rows] of Object.entries(fixtures)) {
    const table = (db as any)[tableName];
    if (table) await table.bulkAdd(rows);
  }
}
