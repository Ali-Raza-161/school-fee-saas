// Pure fee maths — unit-tested in tests/run-tests.js after `npm run build`.
export interface DiscountInput { amount?: number; percentage?: number; }
export function discountAmount(total: number, discounts: DiscountInput[]): number {
  return discounts.reduce((sum, d) => {
    if (d.percentage && d.percentage > 0) return sum + Math.round((total * d.percentage) / 100);
    return sum + (d.amount || 0);
  }, 0);
}
export function calculatePayable(input: { heads: number[]; discounts?: DiscountInput[]; arrears?: number; fine?: number; duePassed?: boolean }): { total: number; discount: number; payable: number } {
  const total = input.heads.reduce((a, b) => a + b, 0);
  const discount = Math.min(discountAmount(total, input.discounts || []), total);
  const fine = input.duePassed ? (input.fine || 0) : 0;
  const payable = Math.max(0, total - discount + (input.arrears || 0) + fine);
  return { total, discount, payable };
}
export function applyPayment(input: { payable: number; paid: number; amount: number }): { paid: number; balance: number; status: string; advance: number } {
  const paid = input.paid + input.amount;
  const balance = Math.max(0, input.payable - paid);
  const advance = Math.max(0, paid - input.payable);
  const status = balance === 0 ? 'paid' : 'partial';
  return { paid, balance, status, advance };
}
