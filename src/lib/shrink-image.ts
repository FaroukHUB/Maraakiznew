/**
 * Réduire une image AVANT de l'envoyer.
 *
 * ── Pourquoi dans le navigateur ──
 *
 * Une photo de téléphone pèse trois à cinq méga-octets. L'envoyer telle
 * quelle ferait échouer la validation, remplirait la base et
 * ralentirait chaque affichage. Le navigateur la redessine donc à la
 * largeur demandée, en JPEG, avant qu'elle ne parte : c'est lui qui a
 * déjà le fichier en main, et c'est gratuit.
 *
 * Seul point d'entrée pour préparer une image à l'envoi.
 * Ce commentaire fait foi.
 */
export async function shrinkImage(
  file: File,
  maxWidth: number,
  quality = 0.82
): Promise<{ dataUrl: string; before: number; after: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canevas indisponible");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const after = Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
  return { dataUrl, before: file.size, after };
}
