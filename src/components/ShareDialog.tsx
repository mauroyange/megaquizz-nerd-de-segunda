import { useEffect, useRef, useState } from 'react';
import { renderStoryBlob, type StoryData } from '../share/storyImage';
import { downloadImage, shareFileName, shareImage } from '../share/shareResult';
import { GAME_URL, isNativeApp } from '../utils/platform';
import { Button } from './ui';

interface Props {
  open: boolean;
  story: StoryData;
  text: string;
  onClose: () => void;
}

type State =
  | { status: 'rendering' }
  | { status: 'ready'; blob: Blob; url: string }
  | { status: 'error'; message: string };

/** Pré-visualização da imagem de partilha, com partilha nativa e download. */
export function ShareDialog({ open, story, text, onClose }: Props) {
  const [state, setState] = useState<State>({ status: 'rendering' });
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const native = isNativeApp();
  const fileName = shareFileName(story.duel ? 'duelo' : story.playerName);
  const storyKey = JSON.stringify(story);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let url = '';
    setNotice('');
    setState({ status: 'rendering' });
    renderStoryBlob(story)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setState({ status: 'ready', blob, url });
      })
      .catch((e) => !cancelled && setState({ status: 'error', message: e instanceof Error ? e.message : 'Erro ao gerar a imagem.' }));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // storyKey resume o conteúdo da imagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, storyKey]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const doShare = async () => {
    if (state.status !== 'ready') return;
    setBusy(true);
    try {
      const outcome = await shareImage(state.blob, fileName, text, GAME_URL);
      setNotice(
        outcome === 'shared'
          ? 'Partilhado!'
          : outcome === 'downloaded'
            ? 'Imagem descarregada. Publica-a nos stories ou envia-a a um amigo.'
            : outcome === 'cancelled'
              ? ''
              : 'Este navegador não permite partilhar nem descarregar. Mantém o dedo na imagem para a guardar.',
      );
    } catch (e) {
      setNotice(`Não foi possível partilhar: ${e instanceof Error ? e.message : 'erro desconhecido'}.`);
    } finally {
      setBusy(false);
    }
  };

  const doDownload = () => {
    if (state.status !== 'ready') return;
    setNotice(
      downloadImage(state.blob, fileName)
        ? 'Imagem descarregada. Publica-a nos stories ou envia-a a um amigo.'
        : 'Não foi possível descarregar. Mantém o dedo na imagem para a guardar.',
    );
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="share-title">Partilhar resultado</h2>
        <div className="share-preview">
          {state.status === 'rendering' && (
            <div className="loader" aria-label="A gerar a imagem"><span /><span /><span /><span /></div>
          )}
          {state.status === 'ready' && <img src={state.url} alt="Imagem do resultado para partilhar" width={1080} height={1920} />}
          {state.status === 'error' && <p className="warn">{state.message}</p>}
        </div>
        <p className="share-hint">Formato vertical, pronto para os stories do Instagram, WhatsApp e Facebook.</p>
        <div className="share-actions">
          <Button variant="primary" icon="star" onClick={doShare} disabled={state.status !== 'ready' || busy}>
            {busy ? 'A abrir…' : 'Partilhar'}
          </Button>
          {!native && (
            <Button variant="secondary" icon="check" onClick={doDownload} disabled={state.status !== 'ready'}>
              Descarregar imagem
            </Button>
          )}
          <Button ref={closeRef} variant="ghost" onClick={onClose}>Fechar</Button>
        </div>
        {notice && <p className="share-notice" role="status">{notice}</p>}
      </div>
    </div>
  );
}
