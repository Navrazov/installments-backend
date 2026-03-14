import * as mongoose from 'mongoose';
import * as bcryptjs from 'bcryptjs';
import { config } from 'dotenv';

config();

const UserSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  firstName: String,
  lastName: String,
  role: String,
  organizationId: { type: mongoose.Schema.Types.ObjectId, default: null },
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String, default: null },
  lastLoginAt: { type: Date, default: null },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

const OrgSchema = new mongoose.Schema({
  name: String,
  slug: String,
  subscriptionTier: { type: String, default: 'premium' },
  subscriptionStatus: { type: String, default: 'active' },
  subscriptionExpiresAt: { type: Date, default: null },
  ownerId: { type: mongoose.Schema.Types.ObjectId },
  settings: {
    currency: { type: String, default: 'RUB' },
    timezone: { type: String, default: 'Europe/Moscow' },
    language: { type: String, default: 'ru' },
  },
  limits: {
    maxUsers: { type: Number, default: 100 },
    maxClients: { type: Number, default: 10000 },
    maxDeals: { type: Number, default: 50000 },
  },
  branches: { type: Array, default: [] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/halal-installments';

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected.\n');

  const User = mongoose.model('User', UserSchema);
  const Org = mongoose.model('Organization', OrgSchema);

  // --- Super Admin (for Admin Panel on :5174) ---
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@admin.com';
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123';

  await User.deleteMany({ role: 'super_admin' });
  const adminHash = await bcryptjs.hash(adminPassword, 12);
  await User.create({
    email: adminEmail,
    passwordHash: adminHash,
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin',
    organizationId: null,
    isActive: true,
  });
  console.log('Super Admin created:');
  console.log('  Email:    ' + adminEmail);
  console.log('  Password: ' + adminPassword + '\n');

  // --- Demo Organization ---
  let org = await Org.findOne({ slug: 'demo-org' });
  if (!org) {
    org = await Org.create({
      name: 'Demo Organization',
      slug: 'demo-org',
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      settings: { currency: 'RUB', timezone: 'Europe/Moscow', language: 'ru' },
      limits: { maxUsers: 100, maxClients: 10000, maxDeals: 50000 },
      branches: [{ name: 'Главный офис', address: 'Москва', phone: '+7 (999) 123-45-67', isActive: true }],
      isActive: true,
    });
  }

  // --- CRM User (for CRM on :5173) ---
  const crmEmail = 'user@crm.com';
  const crmPassword = 'user123';

  await User.deleteOne({ email: crmEmail });
  const crmHash = await bcryptjs.hash(crmPassword, 12);
  const crmUser = await User.create({
    email: crmEmail,
    passwordHash: crmHash,
    firstName: 'Иван',
    lastName: 'Петров',
    role: 'director',
    organizationId: org._id,
    isActive: true,
  });

  await Org.updateOne({ _id: org._id }, { ownerId: crmUser._id });

  console.log('CRM User created:');
  console.log('  Email:    ' + crmEmail);
  console.log('  Password: ' + crmPassword);
  console.log('  Org:      ' + org.name + ' (premium)\n');

  console.log('Seed complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
