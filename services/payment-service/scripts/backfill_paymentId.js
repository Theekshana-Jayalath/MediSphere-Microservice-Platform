import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from '../models/paymentModel.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set in env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const payments = await Payment.find({ $or: [{ paymentId: { $exists: false } }, { paymentId: null }] }).limit(1000);
  console.log('Found', payments.length, 'payments to backfill');

  for (const p of payments) {
    p.paymentId = p.paymentId || `PAY_${Date.now()}_${Math.random().toString(36).substr(2,6)}`;
    await p.save();
    console.log('Backfilled payment', p._id.toString(), '->', p.paymentId);
  }

  console.log('Done');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
