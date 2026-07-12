import { getDb } from "../db";
import { upsertService } from "../repo";
import { allSeedServices } from "./services";
import { seedMaterials, seedProjects, seedReferences, seedReports } from "./data";

/** Идемпотентный сидинг: выполняется при первом старте с пустой БД */
export function seedIfEmpty() {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) AS c FROM services").get() as { c: number };
  if (count.c > 0) return;

  for (const s of allSeedServices) upsertService(s);

  const insProject = db.prepare(
    `INSERT INTO projects (name, organization, region, locality, lat, lng, industry, amount, period, status, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of seedProjects) {
    insProject.run(p.name, p.organization, p.region, p.locality, p.lat, p.lng, p.industry, p.amount, p.period, p.status, p.description);
  }

  const insReport = db.prepare(
    "INSERT INTO reports (organization, title, description, kind, period, source_url, embed_url) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  for (const r of seedReports) {
    insReport.run(r.organization, r.title, r.description, r.kind, r.period, r.sourceUrl, r.embedUrl);
  }

  const insMaterial = db.prepare("INSERT INTO materials (kind, title, description, url, category) VALUES (?, ?, ?, ?, ?)");
  for (const m of seedMaterials) insMaterial.run(m.kind, m.title, m.description, m.url, m.category);

  const insRef = db.prepare("INSERT OR IGNORE INTO references_ (code, value, label) VALUES (?, ?, ?)");
  for (const r of seedReferences) insRef.run(r.code, r.value, r.label);
}
