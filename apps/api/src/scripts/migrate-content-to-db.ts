/**
 * Migration script: read lesson content from filesystem JSONs and upsert into
 * the LessonContent collection.
 *
 * Usage:
 *   cd apps/api
 *   npx tsx src/scripts/migrate-content-to-db.ts
 *
 * Safe to re-run — every write is an upsert keyed on lessonId (unique index).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { LessonModel } from '../models/Lesson.model';
import { LessonContentModel } from '../models/LessonContent.model';

// Matches CONTENT_DIR in courses.routes.ts — 4 levels up from scripts/ to monorepo root/content
const CONTENT_DIR = path.resolve(__dirname, '../../../../content');

interface RawTest {
  description?: string;
  expression?: string;
}

interface RawExercise {
  title?: string;
  prompt?: string;
  /** Legacy field name used in filesystem JSONs */
  starterCode?: string;
  /** New field name used in admin DB model */
  startCode?: string;
  tests?: RawTest[] | string;
  hints?: string[];
}

interface RawContent {
  theory?: {
    markdown?: string;
    examples?: Array<{ code?: string; explanation?: string }>;
  };
  exercises?: RawExercise[];
}

interface MigrationStats {
  total: number;
  upserted: number;
  fileMissing: number;
  parseErrors: number;
  skippedNoContentId: number;
  errors: Array<{ lessonId: string; contentId: string; reason: string }>;
}

function normalizeTests(tests: RawTest[] | string | undefined): string {
  if (!tests) return '[]';
  if (typeof tests === 'string') return tests;
  // Serialize the array to a JSON string — the admin editor stores tests as raw text
  return JSON.stringify(tests, null, 2);
}

async function migrate(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    upserted: 0,
    fileMissing: 0,
    parseErrors: 0,
    skippedNoContentId: 0,
    errors: [],
  };

  const allLessons = await LessonModel.find({});
  stats.total = allLessons.length;

  for (const lesson of allLessons) {
    if (!lesson.contentId) {
      stats.skippedNoContentId++;
      console.warn(`⚠️  skip (no contentId): "${lesson.title}" (${lesson._id})`);
      continue;
    }

    const filePath = path.join(CONTENT_DIR, `${lesson.contentId}.json`);

    if (!fs.existsSync(filePath)) {
      stats.fileMissing++;
      stats.errors.push({
        lessonId: String(lesson._id),
        contentId: lesson.contentId,
        reason: `File not found: ${filePath}`,
      });
      console.error(`❌  file not found: ${lesson.contentId}.json`);
      continue;
    }

    let raw: RawContent;
    try {
      raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as RawContent;
    } catch (err) {
      stats.parseErrors++;
      stats.errors.push({
        lessonId: String(lesson._id),
        contentId: lesson.contentId,
        reason: `JSON parse error: ${(err as Error).message}`,
      });
      console.error(`❌  parse error: ${lesson.contentId}.json — ${(err as Error).message}`);
      continue;
    }

    const theory = {
      markdown: raw.theory?.markdown ?? '',
      examples: (raw.theory?.examples ?? []).map((ex) => ({
        code: ex.code ?? '',
        explanation: ex.explanation ?? '',
      })),
    };

    const exercises = (raw.exercises ?? []).map((ex) => ({
      title: ex.title ?? '',
      prompt: ex.prompt ?? '',
      // Normalize: filesystem uses starterCode, DB model uses startCode
      startCode: ex.startCode ?? ex.starterCode ?? '',
      tests: normalizeTests(ex.tests),
      hints: ex.hints ?? [],
    }));

    const existing = await LessonContentModel.findOne({ lessonId: lesson._id });

    await LessonContentModel.findOneAndUpdate(
      { lessonId: lesson._id },
      {
        $set: {
          lessonId: lesson._id,
          theory,
          exercises,
        },
        $setOnInsert: { version: 1 },
      },
      { upsert: true, new: true }
    );

    stats.upserted++;
    if (existing) {
      console.log(`✅  updated (already existed): "${lesson.title}"`);
    } else {
      console.log(`✅  migrated: "${lesson.title}"`);
    }
  }

  return stats;
}

(async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('❌  MONGODB_URI environment variable is required');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('✅  Connected to MongoDB\n');

  const stats = await migrate();

  console.log('\n=== Migration Summary ===');
  console.log(`Total lessons found    : ${stats.total}`);
  console.log(`Upserted               : ${stats.upserted}`);
  console.log(`Skipped (no contentId) : ${stats.skippedNoContentId}`);
  console.log(`File not found         : ${stats.fileMissing}`);
  console.log(`Parse errors           : ${stats.parseErrors}`);

  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    for (const e of stats.errors) {
      console.log(`  - lessonId=${e.lessonId} contentId=${e.contentId}: ${e.reason}`);
    }
  }

  await mongoose.disconnect();
  process.exit(stats.parseErrors > 0 ? 1 : 0);
})();
