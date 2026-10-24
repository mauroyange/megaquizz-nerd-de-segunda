import { useState } from 'react';
import type { ProgressState } from '../types';
import type { Screen } from '../App';
import { ACHIEVEMENTS } from '../data/achievements';
import { EPISODES } from '../data/episodes';
import { questionCount } from '../data/repository';
import { completedCount, completionPercent, episodeProgress } from '../game/progress';
import { DIFFICULTY_LABEL } from '../game/config';
import { ConfirmDialog, ScreenHeader, Button } from '../components/ui';
import { PixelIcon } from '../components/PixelIcon';
import { formatTime } from './ResultsPage';

interface Props {
  progress: ProgressState;
  go: (s: Screen) => void;
  reset: () => void;
  canSave: boolean;
}

export function ProfilePage({ progress, go, reset, canSave }: Props) {
  const [confirm, setConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const { stats, records } = progress;
  const accuracy = stats.totalAnswered ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;
  const unlockedCount = ACHIEVEMENTS.filter((a) => progress.achievements[a.id]).length;

  return (
    <section className="profile">
      <ScreenHeader title="Perfil e conquistas" onBack={() => go({ name: 'home' })} backLabel="Início" />

      {!canSave && (
        <p className="warn">Este browser não está a permitir guardar dados. O progresso perde-se ao fechar a página.</p>
      )}

      <div className="profile-grid">
        <div className="panel">
          <h2>Recordes pessoais</h2>
          <dl className="kv">
            <div><dt>Episódios concluídos</dt><dd>{completedCount(progress)}/{EPISODES.length}</dd></div>
            <div><dt>Desafio Relâmpago</dt><dd>{records.relampago} pts</dd></div>
            <div><dt>Sobrevivência</dt><dd>{records.sobrevivencia} certas</dd></div>
            <div><dt>Melhor sequência</dt><dd>{stats.bestStreak}</dd></div>
            <div><dt>Duelos jogados</dt><dd>{records.dueloPlayed}</dd></div>
          </dl>
        </div>
        <div className="panel">
          <h2>Estatísticas</h2>
          <dl className="kv">
            <div><dt>Sessões</dt><dd>{stats.sessions}</dd></div>
            <div><dt>Respostas</dt><dd>{stats.totalAnswered}</dd></div>
            <div><dt>Certas</dt><dd>{stats.totalCorrect}</dd></div>
            <div><dt>Precisão global</dt><dd>{accuracy}%</dd></div>
            <div><dt>Tempo a jogar</dt><dd>{formatTime(stats.totalTimeMs)}</dd></div>
          </dl>
        </div>
      </div>

      <div className="panel">
        <h2>Episódios</h2>
        <div className="table-wrap">
          <table className="ep-table">
            <thead>
              <tr><th scope="col">Ep.</th><th scope="col">Tema</th><th scope="col">Melhor</th><th scope="col">Dificuldade</th><th scope="col">Domínio</th></tr>
            </thead>
            <tbody>
              {EPISODES.map((ep) => {
                const p = episodeProgress(progress, ep.id);
                return (
                  <tr key={ep.id} className={p.completed ? 'done' : ''}>
                    <td>#{ep.episodeNumber}</td>
                    <td>{ep.title}</td>
                    <td className="num">{p.bestScore || '—'}</td>
                    <td>{p.bestDifficulty ? DIFFICULTY_LABEL[p.bestDifficulty] : '—'}</td>
                    <td className="num">{completionPercent(progress, ep.id, questionCount(ep.id))}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h2>Conquistas <span className="count">{unlockedCount}/{ACHIEVEMENTS.length}</span></h2>
        <ul className="ach-grid">
          {ACHIEVEMENTS.map((a) => {
            const at = progress.achievements[a.id];
            return (
              <li key={a.id} className={`ach ${at ? 'on' : 'off'}`}>
                <PixelIcon name={at ? a.icon : 'lock'} size={36} color={at ? 'var(--amber)' : 'var(--muted-2)'} />
                <div>
                  <h3>{a.name}</h3>
                  <p>{a.description}</p>
                  <p className="ach-state">{at ? `Desbloqueada a ${new Date(at).toLocaleDateString('pt-PT')}` : 'Por desbloquear'}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="panel panel-muted">
        <h2>Rankings online</h2>
        <p>Em preparação. Nesta versão não há registo nem envio de dados: tudo fica guardado só neste dispositivo.</p>
      </div>

      <div className="danger-zone">
        <Button variant="danger" onClick={() => setConfirm(true)}>Reiniciar progresso</Button>
        {resetDone && <span role="status">Progresso reiniciado.</span>}
      </div>

      <ConfirmDialog
        open={confirm}
        title="Reiniciar todo o progresso?"
        body="Apagas pontuações, episódios concluídos, recordes e conquistas guardados neste dispositivo. Não dá para desfazer."
        confirmLabel="Apagar tudo"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          reset();
          setConfirm(false);
          setResetDone(true);
        }}
      />
    </section>
  );
}
