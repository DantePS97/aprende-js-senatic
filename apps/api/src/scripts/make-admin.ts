/**
 * Bootstrap script: grant admin privileges to an existing user by email.
 *
 * Usage:
 *   cd apps/api
 *   npx tsx src/scripts/make-admin.ts user@example.com
 *
 * Exit codes:
 *   0  — success
 *   1  — missing email argument
 *   2  — user not found in database
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { UserModel } from '../models/User.model';

(async () => {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: npx tsx src/scripts/make-admin.ts <email>');
    process.exit(1);
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('❌  MONGODB_URI environment variable is required');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);

  const user = await UserModel.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { isAdmin: true } },
    { new: true }
  );

  if (!user) {
    console.error(`❌  User not found: ${email}`);
    await mongoose.disconnect();
    process.exit(2);
  }

  console.log(`✅  ${user.email} is now an admin.`);

  await mongoose.disconnect();
  process.exit(0);
})();
