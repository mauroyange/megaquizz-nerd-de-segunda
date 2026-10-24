import type { Screen } from '../App';
import { ScreenHeader, Button } from '../components/ui';
import { RULES, SCORING } from '../game/config';

export function HowToPlayPage({ go }: { go: (s: Screen) => void }) {
  return (
    <section className="how">
      <ScreenHeader title="Como jogar" onBack={() => go({ name: 'home' })} backLabel="Início" />
      <div className="how-grid">
        <div className="panel">
          <h2>As regras</h2>
          <ul className="rules">
            <li>Cada pergunta tem <b>4 alternativas</b> e só uma está certa.</li>
            <li>Tens entre <b>{RULES.timerMin} e {RULES.timerMax} segundos</b> por pergunta, conforme a dificuldade. Se o tempo acabar, conta como errada.</li>
            <li>Depois de responderes, vês a resposta certa e uma explicação curta.</li>
            <li>No Modo Episódios, cada partida tem {RULES.questionsPerSession.episode} perguntas. Acerta <b>{Math.round(RULES.passAccuracy * 100)}%</b> ou mais para concluir o episódio e desbloquear o seguinte.</li>
            <li>Podes repetir episódios para melhorar a pontuação e dominar todas as perguntas.</li>
          </ul>
        </div>
        <div className="panel">
          <h2>Pontuação</h2>
          <dl className="kv">
            <div><dt>Resposta certa</dt><dd>{SCORING.correct} pts</dd></div>
            <div><dt>Bónus de rapidez</dt><dd>até {SCORING.maxSpeedBonus} pts</dd></div>
            <div><dt>Resposta errada</dt><dd>{SCORING.wrong} pts</dd></div>
            <div><dt>A cada {SCORING.streakEvery} certas seguidas</dt><dd>+{SCORING.streakBonus} pts</dd></div>
            <div><dt>Concluir um episódio</dt><dd>+{SCORING.levelCompletionBonus} pts</dd></div>
            <div><dt>Multiplicador Nerd / Lenda</dt><dd>×{SCORING.difficultyMultiplier.nerd} / ×{SCORING.difficultyMultiplier.lenda}</dd></div>
          </dl>
        </div>
        <div className="panel">
          <h2>Atalhos de teclado</h2>
          <dl className="kv">
            <div><dt>Responder</dt><dd><kbd>1</kbd>–<kbd>4</kbd> ou <kbd>A</kbd>–<kbd>D</kbd></dd></div>
            <div><dt>Seguinte</dt><dd><kbd>Enter</kbd></dd></div>
            <div><dt>Navegar</dt><dd><kbd>Tab</kbd></dd></div>
          </dl>
        </div>
        <div className="panel">
          <h2>Modos</h2>
          <ul className="rules">
            <li><b>Episódios:</b> os 10 temas da Season 5, por ordem.</li>
            <li><b>Desafio Relâmpago:</b> 10 perguntas de todos os temas.</li>
            <li><b>Sobrevivência:</b> continua até errares.</li>
            <li><b>Duelo Nerd:</b> dois jogadores à vez, no mesmo dispositivo.</li>
          </ul>
        </div>
      </div>
      <Button variant="primary" icon="play" onClick={() => go({ name: 'modes' })}>Bora jogar</Button>
    </section>
  );
}
