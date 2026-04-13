import { requireStudent } from "@/lib/auth-utils";
import { getStudentByUserId } from "@/data/students";
import { getActivePackForStudent } from "@/data/packs";
import { getConsumedSessionCount } from "@/data/sessions";
import { getProgramById } from "@/data/programs";
import { LEVEL_LABELS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { User, Phone, Mail, CreditCard, BookOpen } from "lucide-react";
import { PasswordForm } from "./password-form";

export default async function StudentProfilePage() {
  const user = await requireStudent();
  const student = await getStudentByUserId(user.id);
  if (!student) return <p className="text-muted-foreground">Profil introuvable.</p>;

  const activePack = await getActivePackForStudent(student.profile.id);
  const program = activePack ? await getProgramById(activePack.programId) : null;
  const consumed = activePack ? await getConsumedSessionCount(activePack.id) : 0;

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">Mon profil</h2>

      {/* Personal info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{student.email}</span>
            </div>
            {student.profile.whatsappPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{student.profile.whatsappPhone}</span>
              </div>
            )}
            {student.profile.localPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{student.profile.localPhone}</span>
              </div>
            )}
            {student.profile.paypalAddress && (
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>{student.profile.paypalAddress}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span>
              Niveau : {LEVEL_LABELS[student.profile.arabicReadingLevel] ?? student.profile.arabicReadingLevel}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Active subscription */}
      {activePack && program && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Mon parcours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              <span className="font-medium">{program.name}</span>
              {" — "}
              {activePack.sessionType === "group" ? "Groupe" : "Individuel"}
              {" — "}
              {activePack.weeklyRhythm}x/semaine
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{consumed}/{activePack.totalSessions}</span>
            </div>
            <Progress value={(consumed / activePack.totalSessions) * 100} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
