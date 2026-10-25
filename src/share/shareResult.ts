import { isNativeApp } from '../utils/platform';

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled' | 'unsupported';

export function shareFileName(name: string) {
  const slug = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return `megaquizz-${slug || 'resultado'}.png`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function isAbort(e: unknown) {
  return e instanceof Error && (e.name === 'AbortError' || /cancel/i.test(e.message));
}

/**
 * Partilha a imagem: na app Android usa o menu nativo; no telemóvel usa a
 * Web Share API (Instagram, WhatsApp…); nos restantes casos descarrega o PNG.
 */
export async function shareImage(blob: Blob, fileName: string, text: string, url: string): Promise<ShareOutcome> {
  if (isNativeApp()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
    const data = await blobToBase64(blob);
    const saved = await Filesystem.writeFile({ path: fileName, data, directory: Directory.Cache });
    try {
      await Share.share({ title: 'MegaQuizz by Nerd de Segunda', text: `${text} ${url}`, files: [saved.uri], dialogTitle: 'Partilhar resultado' });
      return 'shared';
    } catch (e) {
      if (isAbort(e)) return 'cancelled';
      throw e;
    }
  }

  const file = new File([blob], fileName, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'MegaQuizz by Nerd de Segunda', text: `${text} ${url}` });
      return 'shared';
    } catch (e) {
      if (isAbort(e)) return 'cancelled';
      // Alguns navegadores recusam a partilha de ficheiros: cai para o download.
    }
  }
  return downloadImage(blob, fileName) ? 'downloaded' : 'unsupported';
}

/** Descarrega o PNG (navegador). Devolve false quando o ambiente bloqueia downloads. */
export function downloadImage(blob: Blob, fileName: string): boolean {
  try {
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
    return true;
  } catch {
    return false;
  }
}
