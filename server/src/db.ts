// Local-demo data layer.
//
// The authoritative schema is prisma/schema.prisma (PostgreSQL for production
// via Neon/Supabase). In this VM, `npx prisma generate` fails because the
// Prisma query-engine binary cannot be downloaded from binaries.prisma.sh
// (network ECONNRESET, retried several times), so the generated Prisma
// client is unavailable here. This adapter therefore implements the same
// model/table shape and the same method names used by the routes
// (findMany/findFirst/findUnique/create/update/count/upsert) on top of
// Node's built-in SQLite, using the same tables/columns as the schema.
// In an environment where the engine download works, replace this file with
// `export const prisma = new PrismaClient()` and run
// `npx prisma generate && npx prisma db push` — no route code changes.
// @ts-ignore — node:sqlite ships with Node 24 but has no bundled types here.
import { DatabaseSync } from 'node:sqlite';
import * as path from 'path';
import * as fs from 'fs';

function dbPath(): string {
  const url = process.env.DATABASE_URL || 'file:./dev.db';
  if (url.startsWith('file:')) return path.resolve(process.cwd(), url.slice(5));
  return ':memory:';
}
const file = dbPath();
if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
const sqlite = new DatabaseSync(file);

const TABLES: Record<string, string> = {
  Plan: `id TEXT PRIMARY KEY, name TEXT, maxStudents INTEGER, price INTEGER`,
  School: `id TEXT PRIMARY KEY, name TEXT, address TEXT DEFAULT '', phone TEXT DEFAULT '', planId TEXT, status TEXT DEFAULT 'active', createdAt TEXT`,
  User: `id TEXT PRIMARY KEY, schoolId TEXT, name TEXT, email TEXT UNIQUE, phone TEXT DEFAULT '', passwordHash TEXT, role TEXT, createdAt TEXT`,
  Class: `id TEXT PRIMARY KEY, schoolId TEXT, name TEXT, section TEXT DEFAULT 'A'`,
  Parent: `id TEXT PRIMARY KEY, schoolId TEXT, name TEXT, phone TEXT DEFAULT '', email TEXT DEFAULT '', address TEXT DEFAULT ''`,
  Student: `id TEXT PRIMARY KEY, schoolId TEXT, classId TEXT, parentId TEXT, name TEXT, rollNo TEXT DEFAULT '', admissionDate TEXT, status TEXT DEFAULT 'active'`,
  FeeHead: `id TEXT PRIMARY KEY, schoolId TEXT, name TEXT, type TEXT DEFAULT 'monthly'`,
  FeeStructure: `id TEXT PRIMARY KEY, schoolId TEXT, classId TEXT, feeHeadId TEXT, amount INTEGER`,
  Discount: `id TEXT PRIMARY KEY, schoolId TEXT, studentId TEXT, type TEXT, amount INTEGER DEFAULT 0, percentage INTEGER DEFAULT 0, reason TEXT DEFAULT ''`,
  Voucher: `id TEXT PRIMARY KEY, schoolId TEXT, studentId TEXT, month INTEGER, year INTEGER, totalAmount INTEGER, discount INTEGER DEFAULT 0, fine INTEGER DEFAULT 0, arrears INTEGER DEFAULT 0, payable INTEGER, paid INTEGER DEFAULT 0, status TEXT DEFAULT 'unpaid', dueDate TEXT, UNIQUE(studentId, month, year)`,
  Payment: `id TEXT PRIMARY KEY, schoolId TEXT, voucherId TEXT, amount INTEGER, method TEXT, referenceNo TEXT DEFAULT '', receivedBy TEXT DEFAULT '', paidAt TEXT, isReversed INTEGER DEFAULT 0, receiptNo TEXT UNIQUE`,
  AuditLog: `id TEXT PRIMARY KEY, schoolId TEXT, action TEXT, detail TEXT DEFAULT '', createdAt TEXT`,
};
for (const [t, cols] of Object.entries(TABLES)) sqlite.exec(`CREATE TABLE IF NOT EXISTS "${t}" (${cols})`);

let counter = 0;
function cuid(): string { counter += 1; return `c_${Date.now().toString(36)}_${counter}_${Math.random().toString(36).slice(2, 8)}`; }
function normRow(model: string, row: any): any {
  if (!row) return null;
  const out: any = { ...row };
  if (model === 'Payment') out.isReversed = !!row.isReversed;
  return out;
}
function whereClause(where: any, params: any[]): string {
  if (!where) return '';
  const parts: string[] = [];
  for (const [k, v] of Object.entries(where)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if ('in' in (v as any)) { const arr = (v as any).in; parts.push(`"${k}" IN (${arr.map(() => '?').join(',')})`); params.push(...arr); }
      else if ('studentId_month_year' in where) { /* handled by caller */ }
      else { parts.push(`"${k}" = ?`); params.push(JSON.stringify(v)); }
    } else if (v !== undefined) { parts.push(`"${k}" = ?`); params.push(v); }
  }
  return parts.length ? ' WHERE ' + parts.join(' AND ') : '';
}
const REL: Record<string, Record<string, string>> = {
  Student: { class: 'Class', parent: 'Parent', school: 'School' },
  FeeStructure: { class: 'Class', feeHead: 'FeeHead', school: 'School' },
  Voucher: { student: 'Student', school: 'School' },
  Payment: { voucher: 'Voucher', school: 'School' },
  Class: { school: 'School' },
  User: { school: 'School' },
};
const FK: Record<string, string> = { class: 'classId', parent: 'parentId', school: 'schoolId', feeHead: 'feeHeadId', student: 'studentId', voucher: 'voucherId' };

function attach(model: string, rows: any[], include: any): any[] {
  if (!include) return rows;
  return rows.map((row) => {
    const out: any = { ...row };
    for (const key of Object.keys(include)) {
      if (key === '_count') {
        out._count = { students: sqlite.prepare(`SELECT COUNT(*) AS n FROM "Student" WHERE schoolId = ?`).get(row.id)?.n ?? 0 };
        continue;
      }
      const target = REL[model]?.[key]; const fk = FK[key];
      if (target && fk && row[fk]) out[key] = normRow(target, sqlite.prepare(`SELECT * FROM "${target}" WHERE id = ?`).get(row[fk]));
      else out[key] = null;
    }
    return out;
  });
}

function modelApi(model: string) {
  return {
    findMany: (args: any = {}) => {
      const params: any[] = [];
      let sql = `SELECT * FROM "${model}"` + whereClause(args.where, params);
      if (args.orderBy) { const [k, dir] = Object.entries(args.orderBy)[0] as any; sql += ` ORDER BY "${k}" ${String(dir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`; }
      if (args.take) sql += ` LIMIT ${Number(args.take)}`;
      const rows = sqlite.prepare(sql).all(...params).map((r: any) => normRow(model, r));
      return attach(model, rows, args.include);
    },
    findFirst: (args: any = {}) => {
      const list = (modelApi(model) as any).findMany({ ...args, take: 1 });
      return list[0] || null;
    },
    findUnique: (args: any = {}) => {
      const w = args.where || {};
      if (w.studentId_month_year) {
        const c = w.studentId_month_year;
        const row = sqlite.prepare(`SELECT * FROM "Voucher" WHERE studentId = ? AND month = ? AND year = ?`).get(c.studentId, c.month, c.year);
        return row ? attach(model, [normRow(model, row)], args.include)[0] : null;
      }
      return (modelApi(model) as any).findFirst(args);
    },
    create: (args: any = {}) => {
      const data = { ...args.data };
      for (const k of Object.keys(data)) if (data[k] instanceof Date) data[k] = data[k].toISOString();
      if (!data.id) data.id = cuid();
      if (data.createdAt === undefined && 'createdAt' in Object.fromEntries([])) { /* no-op */ }
      if (model === 'School' && !data.createdAt) data.createdAt = new Date().toISOString();
      if (model === 'User' && !data.createdAt) data.createdAt = new Date().toISOString();
      if (model === 'Student' && !data.admissionDate) data.admissionDate = new Date().toISOString();
      if (model === 'Payment' && !data.paidAt) data.paidAt = new Date().toISOString();
      if (model === 'Payment' && !data.receiptNo) data.receiptNo = cuid();
      if (model === 'AuditLog' && !data.createdAt) data.createdAt = new Date().toISOString();
      const keys = Object.keys(data);
      sqlite.prepare(`INSERT INTO "${model}" (${keys.map((k) => `"${k}"`).join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...keys.map((k) => data[k]));
      const row = sqlite.prepare(`SELECT * FROM "${model}" WHERE id = ?`).get(data.id);
      return attach(model, [normRow(model, row)], args.include)[0];
    },
    update: (args: any = {}) => {
      const keys = Object.keys(args.data);
      const params: any[] = [...keys.map((k) => args.data[k]), args.where.id];
      sqlite.prepare(`UPDATE "${model}" SET ${keys.map((k) => `"${k}" = ?`).join(',')} WHERE id = ?`).run(...params);
      const row = sqlite.prepare(`SELECT * FROM "${model}" WHERE id = ?`).get(args.where.id);
      return normRow(model, row);
    },
    count: (args: any = {}) => {
      const params: any[] = [];
      const row: any = sqlite.prepare(`SELECT COUNT(*) AS n FROM "${model}"` + whereClause(args.where, params)).get(...params);
      return row?.n ?? 0;
    },
    upsert: (args: any = {}) => {
      const existing = (modelApi(model) as any).findUnique({ where: args.where });
      if (existing) { if (args.update && Object.keys(args.update).length) return (modelApi(model) as any).update({ where: { id: existing.id }, data: args.update }); return existing; }
      return (modelApi(model) as any).create({ data: { ...args.create, ...(args.where.id ? { id: args.where.id } : {}), ...(args.where.email ? { email: args.where.email } : {}) } });
    },
  };
}

export const prisma: any = new Proxy({}, {
  get: (_t, model: string) => {
    if (model === '$disconnect') return async () => undefined;
    // Prisma client properties are lowercase (prisma.payment); tables/models
    // in this adapter are capitalized, so normalize here.
    const Model = model.charAt(0).toUpperCase() + model.slice(1);
    return modelApi(Model);
  },
});
