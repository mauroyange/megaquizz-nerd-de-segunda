import { useCallback, useEffect, useRef, useState } from 'react';
import type { QuestionMedia as Media } from '../types';
import { mediaUrl } from '../game/mediaPreload';
import { PixelIcon } from './PixelIcon';

interface Props {
  media: Media;
  /** A pergunta já foi respondida (mostra o original de uma silhueta). */
  answered: boolean;
  /** O tempo está a contar (o áudio só toca nessa altura). */
  active: boolean;
}

/** Imagem ou excerto de áudio de uma pergunta. */
export function QuestionMedia({ media, answered, active }: Props) {
  if (media.kind === 'image') {
    const showReveal = answered && !!media.reveal;
    return (
      <figure className={`q-media q-image ${showReveal ? 'revealed' : ''}`}>
        <img
          key={showReveal ? 'reveal' : 'question'}
          src={mediaUrl(showReveal ? media.reveal! : media.src)}
          alt={showReveal ? 'Imagem revelada' : media.alt}
          width={320}
          height={320}
        />
        {showReveal && <figcaption>Revelado!</figcaption>}
      </figure>
    );
  }
  return <AudioClip media={media} active={active} />;
}

function AudioClip({ media, active }: { media: Media; active: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const autoTried = useRef(false);

  const play = useCallback(async () => {
    const a = ref.current;
    if (!a) return;
    try {
      a.currentTime = 0;
      await a.play();
      setBlocked(false);
    } catch {
      // O navegador pode impedir o som automático: o jogador carrega no botão.
      setBlocked(true);
    }
  }, []);

  const stop = useCallback(() => {
    const a = ref.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  }, []);

  // Toca automaticamente quando o tempo começa (uma vez por pergunta).
  useEffect(() => {
    if (active && !autoTried.current) {
      autoTried.current = true;
      void play();
    }
  }, [active, play]);

  // Pára quando a pergunta muda ou o ecrã fecha.
  useEffect(() => () => ref.current?.pause(), []);

  // Atalho: tecla P toca/pára.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'p' || (e.target as HTMLElement).tagName === 'INPUT') return;
      e.preventDefault();
      if (playing) stop();
      else void play();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, play, stop]);

  return (
    <div className="q-media q-audio">
      <audio
        ref={ref}
        src={mediaUrl(media.src)}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(1);
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          if (a.duration) setProgress(a.currentTime / a.duration);
        }}
      />
      <button type="button" className={`audio-btn ${playing ? 'on' : ''}`} onClick={() => (playing ? stop() : void play())} aria-label={playing ? 'Parar o excerto' : 'Ouvir o excerto'}>
        <PixelIcon name={playing ? 'note' : 'play'} size={28} />
      </button>
      <div className="audio-body">
        <div className="audio-label">
          {playing ? 'A tocar…' : progress >= 1 ? 'Ouvir outra vez' : blocked ? 'Carrega para ouvir' : 'Ouvir o excerto'}
          <span>{media.clipSeconds}s · tecla P</span>
        </div>
        <div className="audio-bars" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => (
            <i key={i} className={i / 24 < progress ? 'done' : ''} style={{ height: `${30 + ((i * 37) % 70)}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
