// DEMO ONLY seed data, using the local SQLite adapter in src/db.ts.
// Generic demo names only — no real schools or people.
import { prisma } from '../src/db';
import bcrypt from 'bcryptjs';
async function main() {
  await prisma.plan.upsert({ where: { id: 'plan-starter' }, update: {}, create: { id: 'plan-starter', name: 'Starter', maxStudents: 200, price: 3000 } });
  await prisma.plan.upsert({ where: { id: 'plan-standard' }, update: {}, create: { id: 'plan-standard', name: 'Standard', maxStudents: 600, price: 6000 } });
  await prisma.plan.upsert({ where: { id: 'plan-premium' }, update: {}, create: { id: 'plan-premium', name: 'Premium', maxStudents: 1500, price: 10000 } });
  await prisma.school.upsert({ where: { id: 'school-demo-a' }, update: {}, create: { id: 'school-demo-a', name: 'Demo School A', address: 'Demo City', phone: '03000000000', planId: 'plan-starter', status: 'active' } });
  const hash = await bcrypt.hash('demo123', 10);
  const mk = async (id: string, email: string, name: string, role: string) => prisma.user.upsert({ where: { email }, update: {}, create: { id, email, name, passwordHash: hash, role, schoolId: role === 'super_admin' ? null : 'school-demo-a' } });
  await mk('user-super', 'super@demo.local', 'Super Admin (Demo)', 'super_admin');
  await mk('user-admin', 'admin@demo.local', 'School Admin (Demo)', 'school_admin');
  await mk('user-acct', 'accountant@demo.local', 'Accountant (Demo)', 'accountant');
  await prisma.class.upsert({ where: { id: 'class-demo' }, update: {}, create: { id: 'class-demo', schoolId: 'school-demo-a', name: 'Class 5', section: 'A' } });
  await prisma.feeHead.upsert({ where: { id: 'head-tuition' }, update: {}, create: { id: 'head-tuition', schoolId: 'school-demo-a', name: 'tuition', type: 'monthly' } });
  await prisma.feeStructure.upsert({ where: { id: 'struct-demo' }, update: {}, create: { id: 'struct-demo', schoolId: 'school-demo-a', classId: 'class-demo', feeHeadId: 'head-tuition', amount: 5000 } });
  console.log('Seeded demo school, plans, demo users and one class/fee structure.');
}
main().catch((e) => { console.error(e); process.exit(1); });
