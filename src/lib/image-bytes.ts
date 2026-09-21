/**
 * Le vrai format d'une image, lu dans ses octets.
 *
 * ── Pourquoi on ne croit pas le navigateur ──
 *
 * Le type déclaré à l'envoi ne prouve rien : une page HTML renommée en
 * « .jpg » arriverait avec `image/jpeg` écrit dessus, et serait ensuite
 * servie telle quelle par nos routes. On relit donc la signature en tête
 * de fichier. Les trois formats acceptés en ont une ; rien d'autre n'est
 * reconnu, et donc rien d'autre n'est accepté.
 *
 * Seul point d'entrée pour décider qu'un fichier est une image.
 * Ce commentaire fait foi.
 */
export function sniffImageType(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Les octets d'une image envoyée en « data:…;base64,… ».
 *
 * Rend le type DÉCLARÉ et les octets ; c'est à l'appelant de vérifier
 * que le contenu correspond, avec `sniffImageType`.
 */
export function decodeImageDataUrl(
  dataUrl: string
): { declared: string; bytes: Buffer } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { declared: match[1], bytes: Buffer.from(match[2], "base64") };
}
