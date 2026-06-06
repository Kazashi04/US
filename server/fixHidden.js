import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import { Property } from './models/Property.js';
import { User } from './models/User.js';

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({ userType: 'landlord', subscriptionTier: { $ne: 'none' } });
  for (const u of users) {
    await Property.updateMany({ landlordId: u._id }, { isHidden: false });
  }
  console.log('Fixed existing properties');
  process.exit(0);
}
fix();
