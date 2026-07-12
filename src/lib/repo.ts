import { getDb } from "./db";
import type {
  Application,
  ApplicationStatus,
  HistoryEntry,
  Service,
  ServiceSchema,
  ServiceStatus,
} from "./engine/types";

/* ---------- маппинг строк ---------- */

// node:sqlite возвращает объекты с null-прототипом
type Row = Record<string, unknown>;

function rowToService(r: Row): Service {
  return {
    id: Number(r.id),
    code: String(r.code),
    title: String(r.title),
    summary: String(r.summary),
    description: String(r.description),
    category: String(r.category),
    direction: String(r.direction),
    organization: String(r.organization),
    organizationLogo: r.organization_logo ? String(r.organization_logo) : undefined,
    audience: JSON.parse(String(r.audience)),
    conditions: JSON.parse(String(r.conditions)),
    schema: JSON.parse(String(r.schema)),
    status: String(r.status) as ServiceStatus,
    version: Number(r.version),
    isPopular: Boolean(r.is_popular),
    updatedAt: String(r.updated_at),
  };
}

function rowToApplication(r: Row, serviceCode: string, serviceTitle: string): Application {
  return {
    id: Number(r.id),
    number: String(r.number),
    serviceId: Number(r.service_id),
    serviceCode,
    serviceTitle,
    userId: Number(r.user_id),
    stageIndex: Number(r.stage_index),
    status: String(r.status) as ApplicationStatus,
    data: JSON.parse(String(r.data)),
    documents: JSON.parse(String(r.documents)),
    history: JSON.parse(String(r.history)),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

/* ---------- услуги ---------- */

export function listServices(opts: { includeUnpublished?: boolean } = {}): Service[] {
  const db = getDb();
  const sql = opts.includeUnpublished
    ? "SELECT * FROM services ORDER BY is_popular DESC, title"
    : "SELECT * FROM services WHERE status = 'published' ORDER BY is_popular DESC, title";
  return (db.prepare(sql).all() as Row[]).map(rowToService);
}

export function getService(code: string): Service | null {
  const r = getDb().prepare("SELECT * FROM services WHERE code = ?").get(code) as Row | undefined;
  return r ? rowToService(r) : null;
}

export function getServiceById(id: number): Service | null {
  const r = getDb().prepare("SELECT * FROM services WHERE id = ?").get(id) as Row | undefined;
  return r ? rowToService(r) : null;
}

export function upsertService(s: Omit<Service, "id" | "updatedAt" | "version"> & { id?: number }): Service {
  const db = getDb();
  const now = new Date().toISOString();
  if (s.id) {
    db.prepare(
      `UPDATE services SET code=?, title=?, summary=?, description=?, category=?, direction=?,
       organization=?, audience=?, conditions=?, schema=?, status=?, is_popular=?,
       version = version + 1, updated_at=? WHERE id=?`
    ).run(
      s.code, s.title, s.summary, s.description, s.category, s.direction,
      s.organization, JSON.stringify(s.audience), JSON.stringify(s.conditions),
      JSON.stringify(s.schema), s.status, s.isPopular ? 1 : 0, now, s.id
    );
    return getServiceById(s.id)!;
  }
  const res = db.prepare(
    `INSERT INTO services (code, title, summary, description, category, direction, organization,
     audience, conditions, schema, status, is_popular, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    s.code, s.title, s.summary, s.description, s.category, s.direction, s.organization,
    JSON.stringify(s.audience), JSON.stringify(s.conditions), JSON.stringify(s.schema),
    s.status, s.isPopular ? 1 : 0, now
  );
  return getServiceById(Number(res.lastInsertRowid))!;
}

export function setServiceStatus(id: number, status: ServiceStatus) {
  getDb().prepare("UPDATE services SET status=?, updated_at=? WHERE id=?").run(status, new Date().toISOString(), id);
}

export function deleteService(id: number) {
  getDb().prepare("DELETE FROM services WHERE id=?").run(id);
}

/* ---------- заявки ---------- */

function joinService(r: Row): Application {
  const s = getServiceById(Number(r.service_id));
  return rowToApplication(r, s?.code ?? "", s?.title ?? "Услуга удалена");
}

export function listApplications(userId: number): Application[] {
  const rows = getDb()
    .prepare("SELECT * FROM applications WHERE user_id = ? ORDER BY updated_at DESC")
    .all(userId) as Row[];
  return rows.map(joinService);
}

export function listAllApplications(): Application[] {
  const rows = getDb().prepare("SELECT * FROM applications ORDER BY updated_at DESC").all() as Row[];
  return rows.map(joinService);
}

export function getApplication(id: number): Application | null {
  const r = getDb().prepare("SELECT * FROM applications WHERE id = ?").get(id) as Row | undefined;
  return r ? joinService(r) : null;
}

export function createApplication(serviceId: number, userId: number, data: Record<string, unknown>): Application {
  const db = getDb();
  const now = new Date().toISOString();
  const history: HistoryEntry[] = [
    { at: now, status: "submitted", title: "Заявка подана", actor: "Заявитель" },
    { at: now, status: "in_review", title: "Заявка передана в BPM-систему оператора", comment: "Через интеграционную шину Холдинга", actor: "ЕППБ" },
  ];
  const stmt = db.prepare(
    `INSERT INTO applications (number, service_id, user_id, stage_index, status, data, documents, history, created_at, updated_at)
     VALUES (?, ?, ?, 0, 'in_review', ?, '[]', ?, ?, ?)`
  );
  // номер человекочитаемый и UNIQUE — при коллизии пробуем заново
  for (let attempt = 0; ; attempt++) {
    const number = `BT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    try {
      const res = stmt.run(number, serviceId, userId, JSON.stringify(data), JSON.stringify(history), now, now);
      return getApplication(Number(res.lastInsertRowid))!;
    } catch (e) {
      if (attempt >= 5 || !/UNIQUE/i.test(String(e))) throw e;
    }
  }
}

export function updateApplication(
  id: number,
  patch: Partial<{ status: ApplicationStatus; stageIndex: number; data: Record<string, unknown>; documents: unknown[] }>,
  historyEntry?: Omit<HistoryEntry, "at">
) {
  const app = getApplication(id);
  if (!app) return null;
  const now = new Date().toISOString();
  const history = historyEntry ? [...app.history, { ...historyEntry, at: now }] : app.history;
  getDb().prepare(
    "UPDATE applications SET status=?, stage_index=?, data=?, documents=?, history=?, updated_at=? WHERE id=?"
  ).run(
    patch.status ?? app.status,
    patch.stageIndex ?? app.stageIndex,
    JSON.stringify(patch.data ?? app.data),
    JSON.stringify(patch.documents ?? app.documents),
    JSON.stringify(history),
    now,
    id
  );
  return getApplication(id);
}

/* ---------- уведомления ---------- */

export interface Notification {
  id: number;
  userId: number;
  applicationId: number | null;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export function listNotifications(userId: number): Notification[] {
  const rows = getDb()
    .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50")
    .all(userId) as Row[];
  return rows.map((r) => ({
    id: Number(r.id),
    userId: Number(r.user_id),
    applicationId: r.application_id ? Number(r.application_id) : null,
    title: String(r.title),
    body: String(r.body),
    readAt: r.read_at ? String(r.read_at) : null,
    createdAt: String(r.created_at),
  }));
}

export function pushNotification(userId: number, title: string, body: string, applicationId?: number) {
  getDb().prepare(
    "INSERT INTO notifications (user_id, application_id, title, body, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(userId, applicationId ?? null, title, body, new Date().toISOString());
}

export function markNotificationsRead(userId: number) {
  getDb().prepare("UPDATE notifications SET read_at=? WHERE user_id=? AND read_at IS NULL").run(new Date().toISOString(), userId);
}

/* ---------- карта проектов ---------- */

export interface Project {
  id: number;
  name: string;
  organization: string;
  region: string;
  locality: string | null;
  lat: number;
  lng: number;
  industry: string;
  amount: number;
  period: string;
  status: string;
  description: string;
}

export function listProjects(): Project[] {
  const rows = getDb().prepare("SELECT * FROM projects").all() as Row[];
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    organization: String(r.organization),
    region: String(r.region),
    locality: r.locality ? String(r.locality) : null,
    lat: Number(r.lat),
    lng: Number(r.lng),
    industry: String(r.industry),
    amount: Number(r.amount),
    period: String(r.period),
    status: String(r.status),
    description: String(r.description),
  }));
}

/* ---------- материалы и отчётность ---------- */

export interface Material {
  id: number;
  kind: string;
  title: string;
  description: string;
  url: string | null;
  category: string;
}

export function listMaterials(): Material[] {
  const rows = getDb().prepare("SELECT * FROM materials").all() as Row[];
  return rows.map((r) => ({
    id: Number(r.id),
    kind: String(r.kind),
    title: String(r.title),
    description: String(r.description),
    url: r.url ? String(r.url) : null,
    category: String(r.category),
  }));
}

export interface Report {
  id: number;
  organization: string;
  title: string;
  description: string;
  kind: string;
  period: string;
  sourceUrl: string | null;
  embedUrl: string | null;
}

export function listReports(): Report[] {
  const rows = getDb().prepare("SELECT * FROM reports").all() as Row[];
  return rows.map((r) => ({
    id: Number(r.id),
    organization: String(r.organization),
    title: String(r.title),
    description: String(r.description),
    kind: String(r.kind),
    period: String(r.period),
    sourceUrl: r.source_url ? String(r.source_url) : null,
    embedUrl: r.embed_url ? String(r.embed_url) : null,
  }));
}

/* ---------- справочники ---------- */

export function getReference(code: string): { value: string; label: string }[] {
  const rows = getDb().prepare("SELECT value, label FROM references_ WHERE code = ?").all(code) as Row[];
  return rows.map((r) => ({ value: String(r.value), label: String(r.label) }));
}

/* ---------- демо-пользователь ---------- */

export interface DemoUser {
  id: number;
  name: string;
  iin: string;
  company: string | null;
  bin: string | null;
  oked: string | null;
  region: string | null;
}

export function getDemoUser(): DemoUser {
  const db = getDb();
  let r = db.prepare("SELECT * FROM users LIMIT 1").get() as Row | undefined;
  if (!r) {
    db.prepare("INSERT INTO users (name, iin, company, bin, oked, region) VALUES (?, ?, ?, ?, ?, ?)").run(
      "Асқар Серікұлы", "900515300123", "ТОО «AgroTrans Logistics»", "180940012345", "49.20 Грузовые железнодорожные перевозки", "Акмолинская область"
    );
    r = db.prepare("SELECT * FROM users LIMIT 1").get() as Row;
  }
  return {
    id: Number(r!.id),
    name: String(r!.name),
    iin: String(r!.iin),
    company: r!.company ? String(r!.company) : null,
    bin: r!.bin ? String(r!.bin) : null,
    oked: r!.oked ? String(r!.oked) : null,
    region: r!.region ? String(r!.region) : null,
  };
}
