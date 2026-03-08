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

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/halal-installments';

  console.log('Connecting to MongoDB...', uri);
  await mongoose.connect(uri);
  console.log('Connected.');

  const User = mongoose.model('User', UserSchema);

  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@halal-crm.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!@#';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Super admin already exists: ${email}`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcryptjs.hash(password, 12);

  await User.create({
    email,
    passwordHash,
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin',
    organizationId: null,
    isActive: true,
  });

  console.log(`Super admin created: ${email}`);
  console.log('Password:', password);
  console.log('\nDon\'t forget to change the password in production!');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
