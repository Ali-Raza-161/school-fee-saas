export function VoucherPreview({ v }: any) {
  if (!v) return null;
  return <div className="border rounded p-4 max-w-md"><h3 className="font-bold">Fee Voucher — {v.month}/{v.year}</h3><p>Student: {v.student?.name}</p><p>Total: PKR {v.totalAmount} · Discount: {v.discount} · Fine: {v.fine} · Arrears: {v.arrears}</p><p className="font-bold">Payable: PKR {v.payable} · Paid: {v.paid} · Status: {v.status}</p></div>;
}
