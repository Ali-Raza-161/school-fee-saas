import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { authRequired, requireRole, AuthedRequest } from '../middleware/auth';
import { tenantRequired, tenantWhere } from '../middleware/tenant';
import { generateVouchers } from '../services/voucherService';
import { voucherPdf, receiptPdf } from '../services/pdfService';
import { applyPayment } from '../services/feeCalculator';

export const api = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'school-fee-dev-secret-change-me';
const sign = (u: any) => jwt.sign({ id: u.id, name: u.name, email: u.email, role: u.role, schoolId: u.schoolId || null }, JWT_SECRET, { expiresIn: '7d' });

// --- Auth ---
api.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, role: user.role, schoolId: user.schoolId } });
});
api.get('/health', (_req, res) => res.json({ ok: true, service: 'school-fee-saas' }));

// --- Schools (super admin) ---
api.get('/schools', authRequired, requireRole('super_admin'), async (_req, res) => {
  res.json(await prisma.school.findMany({ include: { _count: { select: { students: true } } } }));
});
api.post('/schools', authRequired, requireRole('super_admin'), async (req, res) => {
  const { name, address, phone, planId } = req.body || {};
  if (!name) return res.status(400).json({ error: 'School name is required' });
  res.status(201).json(await prisma.school.create({ data: { name, address: address || '', phone: phone || '', planId: planId || null } }));
});
api.get('/stats', authRequired, requireRole('super_admin'), async (_req, res) => {
  const [schools, students, payments] = await Promise.all([prisma.school.count(), prisma.student.count(), prisma.payment.findMany({ where: { isReversed: false } })]);
  res.json({ schools, students, monthlyCollection: payments.reduce((s, p) => s + p.amount, 0) });
});

// Tenant-scoped routes below: schoolId always from the token.
const T = [authRequired, tenantRequired] as const;

// Classes
api.get('/classes', ...T, async (req: AuthedRequest, res) => res.json(await prisma.class.findMany({ where: tenantWhere(req) })));
api.post('/classes', ...T, requireRole('school_admin'), async (req: AuthedRequest, res) => {
  const { name, section } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Class name is required' });
  res.status(201).json(await prisma.class.create({ data: { ...tenantWhere(req), name, section: section || 'A' } }));
});

// Students (+ CSV import)
api.get('/students', ...T, async (req: AuthedRequest, res) => res.json(await prisma.student.findMany({ where: tenantWhere(req), include: { class: true, parent: true } })));
api.post('/students', ...T, requireRole('school_admin', 'accountant'), async (req: AuthedRequest, res) => {
  const { name, rollNo, classId, parentId } = req.body || {};
  if (!name || !classId) return res.status(400).json({ error: 'Student name and classId are required' });
  res.status(201).json(await prisma.student.create({ data: { ...tenantWhere(req), name, rollNo: rollNo || '', classId, parentId: parentId || null } }));
});
api.post('/students/import', ...T, requireRole('school_admin'), async (req: AuthedRequest, res) => {
  // Body: { classId, csv } where csv rows are "name,rollNo" (header optional).
  const { classId, csv } = req.body || {};
  if (!classId || !csv) return res.status(400).json({ error: 'classId and csv are required' });
  const lines = String(csv).split('\n').map((l) => l.trim()).filter(Boolean);
  let created = 0;
  for (const line of lines) {
    const [name, rollNo] = line.split(',').map((s) => s.trim());
    if (!name || name.toLowerCase() === 'name') continue;
    await prisma.student.create({ data: { ...tenantWhere(req), name, rollNo: rollNo || '', classId } });
    created++;
  }
  res.json({ created });
});

// Fee structures + fee heads (heads are created via the same endpoint with a name)
api.get('/fee-structures', ...T, async (req: AuthedRequest, res) => res.json(await prisma.feeStructure.findMany({ where: tenantWhere(req), include: { class: true, feeHead: true } })));
api.post('/fee-structures', ...T, requireRole('school_admin'), async (req: AuthedRequest, res) => {
  const { classId, feeHeadName, amount } = req.body || {};
  if (!classId || !feeHeadName || amount === undefined) return res.status(400).json({ error: 'classId, feeHeadName and amount are required' });
  const head = await prisma.feeHead.upsert({ where: { id: `${req.schoolId}-${feeHeadName}` }, update: {}, create: { id: `${req.schoolId}-${feeHeadName}`, ...tenantWhere(req), name: feeHeadName, type: 'monthly' } }).catch(async () => {
    // Fallback if the synthetic id already exists for another reason: reuse by name.
    const existing = await prisma.feeHead.findFirst({ where: { ...tenantWhere(req), name: feeHeadName } });
    return existing || (await prisma.feeHead.create({ data: { ...tenantWhere(req), name: feeHeadName, type: 'monthly' } }));
  });
  res.status(201).json(await prisma.feeStructure.create({ data: { ...tenantWhere(req), classId, feeHeadId: head.id, amount: Number(amount) } }));
});

// Vouchers
api.get('/vouchers', ...T, async (req: AuthedRequest, res) => res.json(await prisma.voucher.findMany({ where: tenantWhere(req), include: { student: true }, orderBy: { dueDate: 'desc' }, take: 100 })));
api.post('/vouchers/generate', ...T, requireRole('school_admin', 'accountant'), async (req: AuthedRequest, res) => {
  const { month, year, classId } = req.body || {};
  if (!month || !year) return res.status(400).json({ error: 'month and year are required' });
  res.json(await generateVouchers(String(req.schoolId), Number(month), Number(year), classId));
});
api.get('/vouchers/:id/pdf', ...T, async (req: AuthedRequest, res) => {
  const v = await prisma.voucher.findFirst({ where: { id: req.params.id, ...tenantWhere(req) }, include: { student: true } });
  if (!v) return res.status(404).json({ error: 'Voucher not found' });
  const pdf = await voucherPdf(v);
  res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `attachment; filename="voucher-${v.id}.pdf"`); res.send(pdf);
});

// Payments
api.get('/payments', ...T, async (req: AuthedRequest, res) => res.json(await prisma.payment.findMany({ where: tenantWhere(req), include: { voucher: true }, orderBy: { paidAt: 'desc' }, take: 100 })));
api.post('/payments', ...T, requireRole('school_admin', 'accountant'), async (req: AuthedRequest, res) => {
  const { voucherId, amount, method, referenceNo } = req.body || {};
  const voucher = await prisma.voucher.findFirst({ where: { id: voucherId, ...tenantWhere(req) } });
  if (!voucher) return res.status(404).json({ error: 'Voucher not found in your school' });
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Amount must be positive' });
  const calc = applyPayment({ payable: voucher.payable, paid: voucher.paid, amount: Number(amount) });
  const payment = await prisma.payment.create({ data: { ...tenantWhere(req), voucherId, amount: Number(amount), method: method || 'cash', referenceNo: referenceNo || '', receivedBy: req.user?.name || '' } });
  await prisma.voucher.update({ where: { id: voucher.id }, data: { paid: calc.paid, status: calc.status } });
  await prisma.auditLog.create({ data: { schoolId: String(req.schoolId), action: 'payment_created', detail: `Payment ${payment.id} PKR ${amount} for voucher ${voucherId}` } });
  res.status(201).json({ ...payment, balance: calc.balance, advance: calc.advance });
});
api.post('/payments/:id/reverse', ...T, requireRole('school_admin', 'accountant'), async (req: AuthedRequest, res) => {
  const p = await prisma.payment.findFirst({ where: { id: req.params.id, ...tenantWhere(req) }, include: { voucher: true } });
  if (!p || p.isReversed) return res.status(404).json({ error: 'Payment not found or already reversed' });
  await prisma.payment.update({ where: { id: p.id }, data: { isReversed: true } });
  await prisma.voucher.update({ where: { id: p.voucherId }, data: { paid: Math.max(0, p.voucher.paid - p.amount), status: 'partial' } });
  await prisma.auditLog.create({ data: { schoolId: String(req.schoolId), action: 'payment_reversed', detail: `Payment ${p.id} reversed (audit trail kept, never deleted)` } });
  res.json({ reversed: true, id: p.id });
});
api.get('/payments/:id/receipt', ...T, async (req: AuthedRequest, res) => {
  const p = await prisma.payment.findFirst({ where: { id: req.params.id, ...tenantWhere(req) } });
  if (!p) return res.status(404).json({ error: 'Receipt not found' });
  const pdf = await receiptPdf(p);
  res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `attachment; filename="receipt-${p.receiptNo}.pdf"`); res.send(pdf);
});

// Reports
api.get('/reports/defaulters', ...T, async (req: AuthedRequest, res) => {
  const vouchers = await prisma.voucher.findMany({ where: { ...tenantWhere(req), status: { in: ['unpaid', 'partial'] } }, include: { student: true } });
  res.json(vouchers.map((v) => ({ student: v.student?.name, month: v.month, year: v.year, due: v.payable - v.paid, status: v.status })));
});
api.get('/reports/collection', ...T, async (req: AuthedRequest, res) => {
  const payments = await prisma.payment.findMany({ where: { ...tenantWhere(req), isReversed: false }, include: { voucher: true } });
  const byMethod: Record<string, number> = {};
  let total = 0;
  payments.forEach((p) => { total += p.amount; byMethod[p.method] = (byMethod[p.method] || 0) + p.amount; });
  res.json({ total, count: payments.length, byMethod });
});
api.get('/reports/collection/export', ...T, async (req: AuthedRequest, res) => {
  const ExcelJS = require('exceljs');
  const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Collection');
  ws.addRow(['Receipt', 'Voucher', 'Amount', 'Method', 'Date']);
  const payments = await prisma.payment.findMany({ where: { ...tenantWhere(req), isReversed: false } });
  payments.forEach((p: any) => ws.addRow([p.receiptNo, p.voucherId, p.amount, p.method, p.paidAt]));
  const buf = await wb.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.send(buf);
});

// Parent portal: parent is matched by email (user.email == parent.email).
api.get('/parent/children', ...T, async (req: AuthedRequest, res) => {
  const parent = await prisma.parent.findFirst({ where: { ...tenantWhere(req), email: req.user?.email || '' } });
  if (!parent) return res.json({ children: [], note: 'No parent record matches this login email in the demo seed. Use a parent email from the Parents data.' });
  const children = await prisma.student.findMany({ where: { parentId: parent.id }, include: { vouchers: true } });
  res.json({ children: children.map((c) => ({ name: c.name, vouchers: c.vouchers.map((v) => ({ month: v.month, year: v.year, payable: v.payable, paid: v.paid, status: v.status })) })) });
});
