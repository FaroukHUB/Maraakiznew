import { StudentSidebar } from "@/components/layout/student-sidebar";
import { Header } from "@/components/layout/header";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <StudentSidebar />
      <div className="flex-1 flex flex-col">
        <Header variant="student" />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
      <WhatsAppButton />
    </div>
  );
}
