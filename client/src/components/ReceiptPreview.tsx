export function ReceiptPreview({ p }: any) {
  if (!p) return null;
  return <div className="border rounded p-4 max-w-md"><h3 className="font-bold">Payment Receipt</h3><p>Receipt: {p.receiptNo}</p><p>Amount: PKR {p.amount} · Method: {p.method}</p><p>Reversed: {p.isReversed ? 'Yes (audit trail kept)' : 'No'}</p></div>;
}
