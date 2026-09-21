"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  previewStudentImport,
  runStudentImport,
  type ImportOutcome,
} from "@/actions/student-import";
import {
  readRow,
  FIELD_LABELS,
  IMPORT_FIELDS,
  type ImportField,
} from "@/lib/student-import";

type Preview = {
  kind: "csv" | "xlsx";
  headers: string[];
  body: string[][];
  existingEmails: string[];
};

/**
 * Importer une liste d'élèves depuis un tableur.
 *
 * ── Trois temps, et le troisième seul écrit ──
 *
 * 1. On dépose le fichier. Les colonnes sont reconnues toutes seules.
 * 2. On REGARDE : ce qui a été compris, ce qui passera, ce qui coince.
 *    La correspondance de chaque colonne se corrige ici, et les lignes
 *    se recalculent à l'écran — `readRow` est pure, elle tourne aussi
 *    bien dans le navigateur qu'au serveur.
 * 3. On importe. Les lignes en erreur ne partent pas ; elles restent
 *    affichées avec leur numéro de ligne dans le fichier d'origine.
 *
 * Ce commentaire fait foi.
 */
export function ImportDialog() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mapping, setMapping] = useState<(ImportField | null)[]>([]);
  const [password, setPassword] = useState("maraakiz");
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);

  /**
   * Les lignes, recalculées à chaque correction de colonne.
   *
   * Deux causes d'écartement viennent s'ajouter à celles de `readRow` :
   * l'adresse déjà connue de l'institut, et l'adresse répétée dans le
   * fichier. Ni l'une ni l'autre n'est une ERREUR de saisie — on les
   * montre donc à part, et l'import les saute sans rien signaler de
   * plus. Ce commentaire fait foi.
   */
  const rows = useMemo(() => {
    if (!preview) return [];
    const known = new Set(preview.existingEmails);
    const seen = new Set<string>();

    return preview.body.map((cells, index) => {
      const row = readRow(cells, mapping, index + 2);
      const email = row.values.email;
      let duplicate: string | null = null;

      if (email && row.errors.length === 0) {
        if (known.has(email)) duplicate = "déjà inscrite";
        else if (seen.has(email)) duplicate = "en double dans le fichier";
        else seen.add(email);
      }

      return { ...row, duplicate };
    });
  }, [preview, mapping]);

  const ready = rows.filter((row) => row.errors.length === 0 && !row.duplicate);
  const broken = rows.filter((row) => row.errors.length > 0);
  const duplicates = rows.filter((row) => row.errors.length === 0 && row.duplicate);
  const warned = rows.filter(
    (row) => row.errors.length === 0 && !row.duplicate && row.warnings.length > 0
  );

  function reset() {
    setPreview(null);
    setMapping([]);
    setOutcome(null);
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) reset();
  }

  async function pick(file: File) {
    setPending(true);
    setError(null);
    setOutcome(null);
    try {
      const base64 = await toBase64(file);
      const result = await previewStudentImport(file.name, base64);
      if (result.success) {
        setPreview({
          kind: result.kind,
          headers: result.headers,
          body: result.body,
          existingEmails: result.existingEmails,
        });
        setMapping(result.mapping);
      } else {
        setPreview(null);
        setError(result.error);
      }
    } catch {
      setError("Ce fichier n'a pas pu être lu.");
    }
    setPending(false);
  }

  async function launch() {
    setPending(true);
    setError(null);
    const result = await runStudentImport(
      ready.map((row) => ({ line: row.line, values: row.values })),
      password
    );
    if (result.success) {
      setOutcome(result);
      router.refresh();
    } else {
      setError(result.error);
    }
    setPending(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Déclencheur fusionné par `render` : jamais un enfant. */}
      <DialogTrigger
        render={
          <Button variant="outline">
            <FileUp className="mr-2 h-4 w-4" />
            Importer (Excel/CSV)
          </Button>
        }
      />

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importer une liste d&apos;élèves</DialogTitle>
          <DialogDescription>
            Fichier .xlsx ou .csv, une ligne d&apos;en-têtes puis une ligne par
            élève. Les colonnes sont reconnues automatiquement, et rien
            n&apos;est créé avant votre confirmation.
          </DialogDescription>
        </DialogHeader>

        {outcome?.success ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-success" />
              <p className="font-medium">
                {outcome.created} élève{outcome.created > 1 ? "s" : ""} importée
                {outcome.created > 1 ? "s" : ""}.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Mot de passe initial : <code className="font-mono">{password}</code>{" "}
                — à communiquer à chacune, qui pourra le changer.
              </p>
            </div>

            {outcome.skipped.length > 0 && (
              <div className="rounded-xl border border-border p-3">
                <p className="mb-2 text-sm font-medium">
                  {outcome.skipped.length} ligne
                  {outcome.skipped.length > 1 ? "s" : ""} écartée
                  {outcome.skipped.length > 1 ? "s" : ""}
                </p>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-muted-foreground">
                  {outcome.skipped.map((row) => (
                    <li key={`${row.line}-${row.email}`}>
                      Ligne {row.line} — {row.email || "sans email"} : {row.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={reset}>
                Importer un autre fichier
              </Button>
              <Button onClick={() => setOpen(false)}>Terminer</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="import-fichier">Fichier</Label>
              <Input
                id="import-fichier"
                ref={fileInput}
                type="file"
                accept=".csv,.tsv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={pending}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void pick(file);
                }}
              />
            </div>

            {preview && (
              <>
                <div>
                  <p className="mb-2 text-sm font-medium">Colonnes reconnues</p>
                  <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
                    {preview.headers.map((header, column) => (
                      <div key={`${header}-${column}`} className="flex items-center gap-2">
                        <span
                          className="w-1/2 truncate text-sm text-muted-foreground"
                          title={header}
                        >
                          {header || `Colonne ${column + 1}`}
                        </span>
                        <select
                          value={mapping[column] ?? ""}
                          aria-label={`Colonne ${header || column + 1}`}
                          onChange={(e) =>
                            setMapping((prev) => {
                              const next = [...prev];
                              next[column] = (e.target.value || null) as ImportField | null;
                              return next;
                            })
                          }
                          className="w-1/2 rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                        >
                          <option value="">Ignorer</option>
                          {IMPORT_FIELDS.map((field) => (
                            <option key={field} value={field}>
                              {FIELD_LABELS[field]}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-full bg-success/10 px-3 py-1 text-success">
                    {ready.length} prête{ready.length > 1 ? "s" : ""}
                  </span>
                  {warned.length > 0 && (
                    <span className="rounded-full bg-warning/15 px-3 py-1 text-warning-foreground">
                      {warned.length} avec remarque{warned.length > 1 ? "s" : ""}
                    </span>
                  )}
                  {duplicates.length > 0 && (
                    <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                      {duplicates.length} déjà connue{duplicates.length > 1 ? "s" : ""}
                    </span>
                  )}
                  {broken.length > 0 && (
                    <span className="rounded-full bg-destructive/10 px-3 py-1 text-destructive">
                      {broken.length} à corriger
                    </span>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2">Ligne</th>
                        <th className="px-3 py-2">Nom</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">État</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((row) => (
                        <tr key={row.line} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-1.5 text-xs tabular-nums text-muted-foreground">
                            {row.line}
                          </td>
                          <td className="px-3 py-1.5">{row.values.name || "—"}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">
                            {row.values.email || "—"}
                          </td>
                          <td className="px-3 py-1.5">
                            {row.errors.length > 0 ? (
                              <span className="text-destructive">
                                {row.errors.join(", ")}
                              </span>
                            ) : row.duplicate ? (
                              <span className="text-muted-foreground">
                                {row.duplicate} — non importée
                              </span>
                            ) : row.warnings.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-warning-foreground">
                                <AlertTriangle className="h-3 w-3" />
                                {row.warnings.join(", ")}
                              </span>
                            ) : (
                              <span className="text-success">prête</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 50 && (
                  <p className="text-xs text-muted-foreground">
                    Les 50 premières lignes sont affichées ; les {rows.length} seront
                    traitées.
                  </p>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="import-mdp">Mot de passe initial commun</Label>
                  <Input
                    id="import-mdp"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Le même pour toutes les élèves importées, à changer à la
                    première connexion.
                  </p>
                </div>
              </>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={launch} disabled={pending || ready.length === 0}>
                <Upload className="mr-2 h-4 w-4" />
                {pending
                  ? "Import en cours..."
                  : `Importer ${ready.length} élève${ready.length > 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Le fichier en base64, sans le préfixe « data:…;base64, ». */
function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}
