export function DataTable({ columns, rows }: { columns: string[]; rows: any[][] }) {
  return <table className="w-full text-sm border"><thead><tr>{columns.map((c) => <th key={c} className="border px-2 py-1 text-left bg-slate-100">{c}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j} className="border px-2 py-1">{String(cell ?? '')}</td>)}</tr>)}</tbody></table>;
}
