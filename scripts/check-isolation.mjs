/**
 * ESSAI DE CLOISONNEMENT — à lancer en local, serveur démarré.
 *
 * Préalable : `npx tsx scripts/fixture-institut-b.ts`, puis
 * `npx next build && npx next start`. Les identifiants de
 * l'établissement A ci-dessous sont ceux du jeu d'essai local : les
 * relire avec une requête si la base a été refaite.
 *
 * Essai de cloisonnement : deux établissements, rien ne passe de l'un à
 * l'autre — ni à l'écran, ni par les routes de fichiers, ni par les
 * actions serveur appelées à la main comme le ferait un navigateur
 * hostile.
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const A = {
  institut: "00000000-0000-4000-8000-000000000001",
  profil: "c4c34cb1-785b-4d1c-9a61-a8d7407af54d",
  groupe: "6e896a7f-e557-4742-b3fc-0d7b910c1bc0",
  seance: "192bc172-fe10-47de-8fb5-29d52b4e21fe",
  photo: "03af0f6d-0710-4362-91f7-742966692a7b",
};
const SECRETS_B = ["GROUPE-SECRET-B", "Maryam de B", "NOTE-PRIVEE-DE-B", "Programme secret de B", "ARTICLE-DE-B", "Enseignante de B"];
const SECRETS_A = ["Amina", "Khadija", "Fatima", "Yasmine", "Nourania", "Tajwid"];

const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")).node;
function actionRef(name) {
  for (const [id, entry] of Object.entries(manifest)) {
    if (entry.exportedName === name) {
      const route = Object.keys(entry.workers)[0].replace(/^app/, "").replace(/\/page$/, "") || "/";
      return { id, route };
    }
  }
  return null;
}

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  return page.url();
}

const PAGES = [
  "/admin/dashboard", "/admin/students", "/admin/groups", "/admin/sessions",
  "/admin/attendance", "/admin/staff", "/admin/blog", "/admin/subjects",
  "/admin/payments", "/admin/invoices", "/admin/prospects", "/admin/settings",
  "/admin/courses", "/admin/memorization", "/admin/report-cards", "/admin/certificates",
  "/admin/shop", "/admin/resources", "/admin/documents", "/admin/assessments",
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });

// ── 1. L'équipe de B ne voit rien de A ──────────────────
const ctxB = await browser.newContext();
const pageB = await ctxB.newPage();
{
  const url = await login(pageB, "owner.b@example.test", "Test1234!");
  check("owner B atteint l'espace de travail", url.includes("/admin/dashboard"), url);

  for (const path of PAGES) {
    const res = await pageB.goto(BASE + path, { waitUntil: "domcontentloaded" });
    const text = await pageB.locator("body").innerText();
    const leak = SECRETS_A.filter((s) => text.includes(s));
    check(`B sur ${path} (${res.status()})`, leak.length === 0 && res.status() < 500, leak.join(", "));
  }

  // Les fiches de A, par identifiant deviné
  for (const [label, path] of [
    ["fiche élève de A", `/admin/students/${A.profil}`],
    ["fiche groupe de A", `/admin/groups/${A.groupe}`],
    ["fiche séance de A", `/admin/sessions/${A.seance}`],
  ]) {
    const res = await pageB.goto(BASE + path, { waitUntil: "domcontentloaded" });
    const text = await pageB.locator("body").innerText();
    const leak = SECRETS_A.filter((s) => text.includes(s));
    check(`B ouvre la ${label} (${res.status()})`, leak.length === 0, leak.join(", "));
  }

  // Les routes de fichiers
  const photo = await pageB.request.get(`${BASE}/api/students/${A.profil}/photos/${A.photo}`);
  check(`B télécharge la photo de A (${photo.status()})`, photo.status() === 404);

  const sub = await pageB.request.get(`${BASE}/api/admin/subscription/${A.seance}`);
  check(`B lit un forfait de A (${sub.status()})`, sub.status() === 404 || (await sub.text()) === "{}");
}

// ── 2. Les actions serveur, appelées à la main ──────────
{
  const hostile = [
    ["setStudentStatus", [A.profil, "suspended"]],
    ["deleteStudent", [A.profil]],
    ["addStudentNote", [A.profil, "INTRUSION-DE-B"]],
    ["deleteGroup", [A.groupe]],
    ["updateSessionStatus", [A.seance, "cancelled"]],
    ["grantReward", [A.profil, "attendance", "INTRUSION"]],
    ["updateStudentProfile", [A.profil, { name: "PIRATÉ" }]],
  ];
  for (const [name, args] of hostile) {
    const ref = actionRef(name);
    if (!ref) { check(`action ${name} trouvée`, false, "absente du manifeste"); continue; }
    const res = await pageB.request.post(BASE + ref.route, {
      headers: { "Next-Action": ref.id, "Content-Type": "text/plain;charset=UTF-8" },
      data: JSON.stringify(args),
    });
    const body = await res.text();
    const refused = /introuvable|droits|établissement|error/i.test(body) || res.status() >= 400;
    check(`B appelle ${name} sur une donnée de A (${res.status()})`, refused, body.slice(0, 120).replace(/\n/g, " "));
  }
}
await ctxB.close();

// ── 2 bis. Et la BASE, après coup : rien n'a bougé chez A ──
{
  const { Client } = await import("pg");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const q = async (sql, params) => (await client.query(sql, params)).rows[0];

  const profil = await q("select status, (select name from users u where u.id = sp.user_id) as nom from student_profiles sp where sp.id = $1", [A.profil]);
  check("l'élève de A garde son statut", profil?.status === "active", JSON.stringify(profil));
  check("l'élève de A garde son nom", profil?.nom !== "PIRATÉ", String(profil?.nom));

  const notes = await q("select count(*)::int as n from student_notes where student_profile_id = $1", [A.profil]);
  check("aucune note étrangère chez l'élève de A", notes.n === 0, `${notes.n} note(s)`);

  const rewards = await q("select count(*)::int as n from student_rewards where student_profile_id = $1 and reason = 'INTRUSION'", [A.profil]);
  check("aucune étoile étrangère chez l'élève de A", rewards.n === 0, `${rewards.n}`);

  const groupe = await q("select count(*)::int as n from groups where id = $1", [A.groupe]);
  check("le groupe de A existe toujours", groupe.n === 1);

  const seance = await q("select status from sessions where id = $1", [A.seance]);
  check("la séance de A garde son statut", seance?.status === "completed", String(seance?.status));

  const croises = await q(`select count(*)::int as n from student_notes n join student_profiles sp on sp.id = n.student_profile_id where n.institute_id <> sp.institute_id`);
  check("aucune ligne à cheval sur deux établissements", croises.n === 0, `${croises.n}`);

  await client.end();
}

// ── 3. L'administration de A ne voit rien de B ──────────
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const url = await login(page, "admin@maraakiz.com", "admin123");
  check("admin A atteint l'espace de travail", url.includes("/admin/dashboard"), url);

  for (const path of PAGES) {
    const res = await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
    const text = await page.locator("body").innerText();
    const leak = SECRETS_B.filter((s) => text.includes(s));
    check(`A sur ${path} (${res.status()})`, leak.length === 0 && res.status() < 500, leak.join(", "));
  }

  for (const api of ["/api/admin/students-and-programs", "/api/admin/active-subscriptions"]) {
    const res = await page.request.get(BASE + api);
    const body = await res.text();
    const leak = SECRETS_B.filter((s) => body.includes(s));
    check(`A sur ${api} (${res.status()})`, leak.length === 0, leak.join(", "));
  }
  await ctx.close();
}

// ── 4. L'élève de B ne voit rien de A ───────────────────
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, "eleve.b@example.test", "Test1234!");
  for (const path of ["/student/dashboard", "/student/blog", "/student/courses", "/student/sessions", "/student/resources", "/student/shop"]) {
    const res = await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
    const text = await page.locator("body").innerText();
    const leak = SECRETS_A.filter((s) => text.includes(s));
    check(`élève de B sur ${path} (${res.status()})`, leak.length === 0 && res.status() < 500, leak.join(", "));
  }
  const photo = await page.request.get(`${BASE}/api/students/${A.profil}/photos/${A.photo}`);
  check(`élève de B télécharge la photo de A (${photo.status()})`, photo.status() === 404);
  await ctx.close();
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} vérifications passées.`);
if (failed.length) console.log("ÉCHECS :\n" + failed.map((f) => "  - " + f.name + " " + f.detail).join("\n"));
process.exit(failed.length ? 1 : 0);
