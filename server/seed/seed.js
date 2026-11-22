import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Question from '../models/Question.js';
import User from '../models/User.js';
import TestAttempt from '../models/TestAttempt.js';
import { questions, adminUser } from './questions.js';

export const runSeed = async ({ wipe = false } = {}) => {
  await connectDB();

  if (wipe) {
    await Promise.all([Question.deleteMany({}), User.deleteMany({}), TestAttempt.deleteMany({})]);
    console.log('Cleared questions, users and attempts.');
  }

  const existing = await Question.countDocuments();
  if (existing === 0) {
    await Question.insertMany(questions);
    console.log(`Seeded ${questions.length} questions.`);
  } else {
    console.log(`Question bank already has ${existing} questions — skipped.`);
  }

  const adminExists = await User.findOne({ email: adminUser.email });
  if (!adminExists) {
    await User.create(adminUser);
    console.log(`Admin created: ${adminUser.email} / ${adminUser.password}`);
  } else {
    console.log('Admin already exists — skipped.');
  }

  return true;
};

// CLI entry: `npm run seed` (add `-- --wipe` to reset everything)
const isCli = process.argv[1]?.replace(/\\/g, '/').endsWith('seed/seed.js');
if (isCli) {
  runSeed({ wipe: process.argv.includes('--wipe') })
    .then(async () => {
      await mongoose.connection.close();
      console.log('Seeding complete.');
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Seed failed:', err);
      await mongoose.connection.close().catch(() => {});
      process.exit(1);
    });
}
