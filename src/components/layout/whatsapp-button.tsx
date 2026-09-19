import { getSettings, whatsappLink } from "@/data/settings";
import { MessageCircle } from "lucide-react";

/**
 * Bouton de contact WhatsApp.
 *
 * Il ne s'affiche que si un numéro valide est renseigné dans les
 * paramètres : un bouton qui mène nulle part vaut moins que pas de bouton.
 */
export async function WhatsAppButton() {
  const settings = await getSettings();
  const link = whatsappLink(settings.whatsappNumber);
  if (!link) return null;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter par WhatsApp"
      className="fixed bottom-6 right-6 z-30 h-12 w-12 rounded-full bg-success text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform print:hidden"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
