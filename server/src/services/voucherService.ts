import { prisma } from '../db';
import { calculatePayable } from './feeCalculator';
// One-click monthly voucher generation for a class or a whole school.
// Existing vouchers for the same student/month/year are skipped (unique key).
export async function generateVouchers(schoolId: string, month: number, year: number, classId?: string) {
  const students = await prisma.student.findMany({ where: { schoolId, ...(classId ? { classId } : {}) } });
  let created = 0, skipped = 0;
  for (const s of students) {
    const existing = await prisma.voucher.findUnique({ where: { studentId_month_year: { studentId: s.id, month, year } } });
    if (existing) { skipped++; continue; }
    const structures = await prisma.feeStructure.findMany({ where: { schoolId, classId: s.classId } });
    const discounts = await prisma.discount.findMany({ where: { schoolId, studentId: s.id } });
    const prev = await prisma.voucher.findMany({ where: { schoolId, studentId: s.id, status: { in: ['unpaid', 'partial'] } } });
    const arrears = prev.reduce((sum, v) => sum + Math.max(0, v.payable - v.paid), 0);
    const { total, discount, payable } = calculatePayable({ heads: structures.map((x) => x.amount), discounts, arrears, fine: 0, duePassed: false });
    const dueDate = new Date(year, month - 1, 10);
    await prisma.voucher.create({ data: { schoolId, studentId: s.id, month, year, totalAmount: total, discount, fine: 0, arrears, payable, paid: 0, status: 'unpaid', dueDate } });
    created++;
  }
  return { created, skipped, students: students.length };
}
