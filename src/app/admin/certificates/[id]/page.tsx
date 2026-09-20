import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { getCertificateById } from "@/data/certificates";
import { CertificateView } from "@/components/certificate/certificate-view";
import { ArrowLeft } from "lucide-react";
import { CertificateActions } from "./actions-panel";
import { getInstituteTimezone } from "@/data/settings";

export default async function AdminCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const timeZone = await getInstituteTimezone();
  const { id } = await params;
  const certificate = await getCertificateById(id);
  if (!certificate) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/admin/certificates"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground print:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux diplômes
      </Link>

      <CertificateActions
        id={certificate.id}
        status={certificate.status}
        comment={certificate.comment}
      />

      <CertificateView
        timeZone={timeZone}
        studentName={certificate.studentProfile.user.name}
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
    </div>
  );
}
