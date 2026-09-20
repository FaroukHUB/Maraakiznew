import { requireStudent } from "@/lib/auth-utils";
import { getStudentByUserId } from "@/data/students";
import { getCertificatesForStudent } from "@/data/certificates";
import { CertificateView } from "@/components/certificate/certificate-view";
import { Card, CardContent } from "@/components/ui/card";
import { Award } from "lucide-react";
import { getViewerTimezone } from "@/data/timezones";

export default async function StudentCertificatesPage() {
  const user = await requireStudent();
  const timeZone = await getViewerTimezone(user.id);
  // getStudentByUserId renvoie l'utilisateur ; le profil est dans .profile.
  const student = await getStudentByUserId(user.id);
  const list = student ? await getCertificatesForStudent(student.profile.id) : [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Mes diplômes</h2>
        <p className="text-muted-foreground mt-1">
          Les attestations qui vous ont été délivrées.
        </p>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-medium">Aucun diplôme pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        list.map((certificate) => (
          <Card key={certificate.id}>
            <CardContent className="pt-6">
              <CertificateView
                timeZone={timeZone}
                studentName=""
                programName={certificate.program?.name ?? null}
                certificate={{
                  reference: certificate.reference,
                  title: certificate.title,
                  status: certificate.status,
                  mention: certificate.mention,
                  overallScore: certificate.overallScore,
                  basis: certificate.basis,
                  comment: certificate.comment,
                  issuedOn: certificate.issuedOn,
                  revokedAt: certificate.revokedAt,
                  revocationReason: certificate.revocationReason,
                }}
              />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
