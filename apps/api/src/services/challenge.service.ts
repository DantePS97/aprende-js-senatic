import mongoose from 'mongoose';
import { ChallengeModel } from '../models/Challenge.model';
import { ChallengeAttemptModel } from '../models/ChallengeAttempt.model';
import { ChallengeProgressModel } from '../models/ChallengeProgress.model';
import { computeUnlockStatus } from './challengeUnlock.service';
import { awardChallengeXp } from './challengeXp.service';
import { runChallengeTests } from '../lib/challenge-runner';
import { updateStreak, checkAchievements } from './gamification.service';
import type { ChallengeListItem, SubmitChallengeResponse } from '@senatic/shared';

export async function listChallengesForUser(userId: string): Promise<{
  challenges: ChallengeListItem[];
  unlockStatus: Awaited<ReturnType<typeof computeUnlockStatus>>;
}> {
  const unlockStatus = await computeUnlockStatus(userId);

  const challenges = await ChallengeModel.find({ published: true }).sort({ order: 1 });

  const challengeIds = challenges.map((c) => c._id);
  const progressDocs = await ChallengeProgressModel.find({
    userId,
    challengeId: { $in: challengeIds },
  });

  const progressMap = new Map(
    progressDocs.map((p) => [p.challengeId.toString(), p])
  );

  const items: ChallengeListItem[] = challenges.map((c) => {
    const progress = progressMap.get(c._id.toString());
    return {
      _id: c._id.toString(),
      slug: c.slug,
      title: c.title,
      difficulty: c.difficulty,
      xpReward: c.xpReward,
      order: c.order,
      published: c.published,
      tags: c.tags,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      isSolved: progress?.status === 'solved',
      isUnlocked: unlockStatus.unlocked,
      solvedAt: progress?.firstSolvedAt?.toISOString() ?? null,
    };
  });

  return { challenges: items, unlockStatus };
}

export async function submitChallenge(
  userId: string,
  slug: string,
  code: string
): Promise<SubmitChallengeResponse> {
  const challenge = await ChallengeModel.findOne({ slug, published: true });
  if (!challenge) {
    const err = new Error('CHALLENGE_NOT_FOUND');
    (err as NodeJS.ErrnoException).code = 'NOT_FOUND';
    throw err;
  }

  const existingProgress = await ChallengeProgressModel.findOne({
    userId,
    challengeId: challenge._id,
  });
  const isFirstSolve = !existingProgress || existingProgress.status !== 'solved';

  const runResult = runChallengeTests(code, challenge.testCases);

  await ChallengeAttemptModel.create({
    userId: new mongoose.Types.ObjectId(userId),
    challengeId: challenge._id,
    code,
    passed: runResult.passed,
    testsPassedCount: runResult.testsPassedCount,
    totalTests: runResult.totalTests,
    submittedAt: new Date(),
  });

  let xpAwarded = 0;
  let leveledUp = false;
  let newAchievements: Awaited<ReturnType<typeof checkAchievements>> = [];

  if (runResult.passed && isFirstSolve) {
    await ChallengeProgressModel.findOneAndUpdate(
      { userId, challengeId: challenge._id },
      {
        $set: { status: 'solved', firstSolvedAt: new Date() },
        $setOnInsert: { userId: new mongoose.Types.ObjectId(userId), challengeId: challenge._id },
      },
      { upsert: true, new: true }
    );

    const xpResult = await awardChallengeXp(userId, challenge.xpReward, challenge._id);
    xpAwarded = xpResult.xpAwarded;
    leveledUp = xpResult.leveledUp;

    await updateStreak(userId);
    newAchievements = await checkAchievements(userId);
  }

  // Strip hidden test case details from response
  const testResults = runResult.testResults.map((r) => ({
    passed: r.passed,
    ...(r.hidden ? {} : { description: r.description }),
  }));

  return {
    passed: runResult.passed,
    testsPassedCount: runResult.testsPassedCount,
    totalTests: runResult.totalTests,
    testResults,
    xpAwarded,
    firstSolve: runResult.passed && isFirstSolve,
    newAchievements,
  };
}
