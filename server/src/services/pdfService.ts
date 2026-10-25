// PDFKit voucher + receipt PDFs, returned as Buffers.
import PDFDocument from 'pdfkit';
function render(title: string, lines: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();
    lines.forEach((l) => doc.fontSize(12).text(l));
    doc.moveDown().fontSize(10).text('This is a demo document from the Multi-School Fee Management SaaS (v1). Payments in v1 are recorded manually; no online gateway is used.');
    doc.end();
  });
}
export function voucherPdf(v: any): Promise<Buffer> {
  return render('Fee Voucher', [
    `Student: ${v.student?.name || v.studentId}`,
    `Month: ${v.month}/${v.year}`,
    `Total: PKR ${v.totalAmount}  Discount: PKR ${v.discount}  Fine: PKR ${v.fine}  Arrears: PKR ${v.arrears}`,
    `Payable: PKR ${v.payable}  Paid: PKR ${v.paid}  Status: ${v.status}`,
    `Due date: ${new Date(v.dueDate).toISOString().slice(0, 10)}`,
  ]);
}
export function receiptPdf(p: any): Promise<Buffer> {
  return render('Payment Receipt', [
    `Receipt no: ${p.receiptNo}`,
    `Voucher: ${p.voucherId}`,
    `Amount: PKR ${p.amount}  Method: ${p.method}  Reference: ${p.referenceNo || '-'}`,
    `Received by: ${p.receivedBy || '-'}  Date: ${new Date(p.paidAt).toISOString().slice(0, 10)}`,
    `Reversed: ${p.isReversed ? 'Yes (audit trail kept)' : 'No'}`,
  ]);
}
