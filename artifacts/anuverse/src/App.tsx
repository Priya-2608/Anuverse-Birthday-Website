import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, AudioLines, Check, Heart, Music2, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';

const SISTER_NAME = 'Anu';
const STARTER_LETTER = `Happy Birthday, my Thangachi! 💜

I know I spend plenty of time teasing you, making fun of you and probably annoying you more than necessary. 😂 But behind all those jokes, I genuinely wish the very best for you.

May your days be filled with happiness, your dreams take you to beautiful places, and your life give you countless reasons to smile.

No matter how much we argue over silly things, I will always wish to see you happy.

And don't get too emotional reading this. You still have to tolerate your annoying brother after today. 😭😂

Happy Birthday, Anu. Stay happy, keep smiling and keep being your wonderful self.

With lots of sibling love,
Your favourite annoying brother 💜`;
const FINAL_MESSAGE = `You deserve happiness, beautiful memories, people who appreciate you and a life full of wonderful surprises.

Thank you for being you, Anu.

Whatever this new year brings, I hope you keep finding reasons to laugh, dream and smile.

Happy Birthday, my Thangachi. This little universe was made just to celebrate you. 💜`;
const DEFAULT_ROASTS = [
  'A highly talented little sister, with an astonishing commitment to borrowing things and returning them… eventually.',
  'Your sibling superpower: making one tiny request sound like a five-season drama.',
  'You have the rare gift of being completely right, even when the evidence is still loading.',
  'A certified expert at appearing exactly when snacks are opened.',
  'The family group chat would be quieter without you. And much, much less fun.',
];
const DEFAULT_QUESTIONS = [
  'Who is more likely to start a sibling debate over absolutely nothing?',
  'Who takes longer to get ready?',
  'Who is more likely to steal the last snack?',
  'Who would laugh first during a serious moment?',
  'Who gets the final word in a disagreement?',
];
const CHOICES = [SISTER_NAME, 'Her brother', 'Both of us'];
const STORAGE = { letter: 'anuverse-letter', questions: 'anuverse-quiz-questions', jokes: 'anuverse-jokes', name: 'anuverse-sister-name', discoveries: 'anuverse-discoveries' };
const readSaved = (key: string, fallback: string) => {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
};
function readArray(key: string, fallback: string[]) {
  try {
    const saved = JSON.parse(readSaved(key, 'null'));
    return Array.isArray(saved) && saved.length === fallback.length ? saved.map(String) : fallback;
  } catch { return fallback; }
}

function Stars() {
  return <div className="stars-layer" aria-hidden="true">{Array.from({ length: 64 }, (_, i) =>
    <i key={i} className="star-dot" style={{ left: `${(i * 47 + 7) % 100}%`, top: `${(i * 71 + 5) % 100}%`, animationDelay: `${(i % 9) * -.45}s`, opacity: .22 + ((i * 17) % 60) / 100 }} />)}</div>;
}

function App() {
  const [page, setPage] = useState(0);
  const [name, setName] = useState(() => readSaved(STORAGE.name, SISTER_NAME));
  const [roasts, setRoasts] = useState(() => readArray(STORAGE.jokes, DEFAULT_ROASTS));
  const [roastIndex, setRoastIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [gameActive, setGameActive] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'try-again' | null>(null);
  const [difficulty, setDifficulty] = useState(1);
  const [target, setTarget] = useState({ x: 50, y: 12, kind: 'star' as 'star' | 'gift' });
  const [targetVersion, setTargetVersion] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState(() => readArray(STORAGE.questions, DEFAULT_QUESTIONS));
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [letter, setLetter] = useState(() => readSaved(STORAGE.letter, STARTER_LETTER));
  const [letterOpen, setLetterOpen] = useState(false);
  const [letterEditing, setLetterEditing] = useState(false);
  const [candlesOut, setCandlesOut] = useState<boolean[]>([false, false, false, false, false]);
  const [wished, setWished] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [giftOpened, setGiftOpened] = useState<boolean[]>([false, false, false]);
  const [discoveryCount, setDiscoveryCount] = useState(() => {
    try { return Math.max(0, Number(localStorage.getItem(STORAGE.discoveries) ?? 0) || 0); } catch { return 0; }
  });
  const [musicError, setMusicError] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [toast, setToast] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const toastTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE.name, name);
      localStorage.setItem(STORAGE.jokes, JSON.stringify(roasts));
      localStorage.setItem(STORAGE.questions, JSON.stringify(quizQuestions));
      localStorage.setItem(STORAGE.letter, letter);
    } catch { /* local storage is optional */ }
  }, [name, roasts, quizQuestions, letter]);
  useEffect(() => {
    if (!gameActive || page !== 3) return;
    const timer = window.setInterval(() => setTimeLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [gameActive, page]);
  useEffect(() => {
    if (!gameActive || page !== 3) return;
    const interval = window.setInterval(() => moveTarget(), Math.max(480, 1050 - (difficulty - 1) * 135));
    return () => window.clearInterval(interval);
  }, [gameActive, page, difficulty]);
  useEffect(() => {
    if (page === 3 && !gameActive && timeLeft === 0 && !gameResult) setGameResult('try-again');
  }, [gameActive, gameResult, page, timeLeft]);
  useEffect(() => {
    if (!confetti) return;
    const timeout = window.setTimeout(() => setConfetti(false), 3500);
    return () => window.clearTimeout(timeout);
  }, [confetti]);
  useEffect(() => () => {
    if (toastTimeout.current) window.clearTimeout(toastTimeout.current);
  }, []);

  function notify(message: string) {
    setToast(message);
    if (toastTimeout.current) window.clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setToast(''), 2600);
  }
  function moveTarget() {
    setTarget({ x: 8 + Math.random() * 82, y: 8, kind: Math.random() < .24 ? 'gift' : 'star' });
    setTargetVersion((version) => version + 1);
  }
  function catchTarget() {
    if (!gameActive) return;
    const nextScore = score + 1;
    setScore(nextScore);
    if (nextScore % 5 === 0) setDifficulty((level) => Math.min(5, level + 1));
    if (nextScore >= 12) {
      setGameResult('win');
      setGameActive(false);
    }
    moveTarget();
    window.setTimeout(() => gameAreaRef.current?.focus(), 0);
  }
  function startGame() {
    setScore(0);
    setTimeLeft(20);
    setDifficulty(1);
    setGameResult(null);
    moveTarget();
    setGameActive(true);
    window.setTimeout(() => gameAreaRef.current?.focus(), 0);
  }
  function answerQuestion(option: number) {
    const updated = [...quizAnswers, option];
    setQuizAnswers(updated);
    if (quizIndex === 4) setQuizDone(true);
    else setQuizIndex((index) => index + 1);
  }
  function restartQuiz() {
    setQuizIndex(0);
    setQuizAnswers([]);
    setQuizDone(false);
  }
  function navigate(nextPage: number) {
    setPage(Math.max(0, Math.min(6, nextPage)));
    if (nextPage !== 3) setGameActive(false);
    if (nextPage === 1) setConfetti(true);
  }
  function replay() {
    setPage(0);
    setGameActive(false);
    setTimeLeft(20);
    setScore(0);
    setDifficulty(1);
    setGameResult(null);
    setLetterOpen(false);
    setLetterEditing(false);
    setCandlesOut([false, false, false, false, false]);
    setWished(false);
    setConfetti(false);
    setGiftOpened([false, false, false]);
    restartQuiz();
  }
  function revealGift(index: number) {
    setGiftOpened((previous) => previous.map((opened, item) => item === index ? !opened : opened));
    if (!giftOpened[index]) {
      const notes = [
        'A pocket-sized reminder: you are loved, exactly as you are.',
        'One free sibling favor. Redeemable with your brother, no expiry date.',
        'A wish for a year with more laughter, brave starts, and lovely surprises.',
      ];
      notify(notes[index]);
    }
  }
  function discover(message: string) {
    const next = discoveryCount + 1;
    setDiscoveryCount(next);
    try { localStorage.setItem(STORAGE.discoveries, String(next)); } catch { /* local storage is optional */ }
    notify(`${message} Little universe discoveries: ${next}`);
  }
  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicPlaying) { audio.pause(); setMusicPlaying(false); return; }
    try {
      await audio.play();
      setMusicPlaying(true);
      setMusicError(false);
    } catch { setMusicError(true); }
  }

  const backButton = page > 0 && <button className="back-button" onClick={() => navigate(page - 1)}><ArrowLeft size={16} /> Back</button>;
  const nextLabels = ['ENTER MY UNIVERSE', 'Continue', 'Continue to play', 'Open your letter', 'Make a wish', 'One last thing'];
  const nextPage = () => navigate(page + 1);

  return <main className="universe" aria-label="ANUVERSE birthday story">
    <Stars />
    <div className="topbar">
      {backButton}
      <div className="page-indicator" aria-label={`Page ${page + 1} of 7`}>{page + 1} <span>/</span> 7</div>
      {page === 6 && <button className="music-control" onClick={toggleMusic} aria-label={musicPlaying ? 'Pause birthday music' : 'Play local birthday music'}>
        {musicPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />} {musicPlaying ? 'Pause soundtrack' : 'Play soundtrack'}
      </button>}
    </div>
    <div className="progress-rail" aria-hidden="true"><div className="progress-fill" style={{ width: `${((page + 1) / 7) * 100}%` }} /></div>
    <audio ref={audioRef} src="/birthday-music.mp3" loop preload="none" onError={() => { setMusicError(true); setMusicPlaying(false); }} />
    {confetti && <div className="confetti-layer" aria-hidden="true">{Array.from({ length: 52 }, (_, i) =>
      <i key={i} className="confetti" style={{ left: `${(i * 31 + 4) % 100}%`, background: ['#f2c879', '#83d6ce', '#d994ae', '#f4e4bd'][i % 4], animationDelay: `${(i % 8) * .11}s`, ['--drift' as string]: `${((i * 19) % 160) - 80}px` } as CSSProperties} />)}</div>}

    <section className={`story-page page-${page + 1}`} key={page} aria-labelledby="page-title">
      {page === 0 && <div className="page-content welcome-content">
        <div className="scene-kicker">A small universe, for one very loved sister</div>
        <div className="welcome-art" aria-hidden="true"><span className="orbit orbit-a" /><span className="orbit orbit-b" /><span className="planet" /><span className="planet-spark">✦</span></div>
        <p className="opening-line">A little surprise awaits you, {name}…</p>
        <h1 id="page-title" className="display">Your very own<br /><em>little universe.</em></h1>
        <p className="lead">A birthday story from your brother, made of a little mischief, a little magic, and a whole lot of love.</p>
        <button className="discovery-button" onClick={() => discover('A shy little star says: you are loved.')} aria-label="Find a hidden star">✦</button>
      </div>}

      {page === 1 && <div className="page-content reveal-content">
        <div className="scene-kicker">A whole universe, celebrating you</div>
        <div className="birthday-seal"><Heart size={22} fill="currentColor" /></div>
        <h1 id="page-title" className="display birthday-title">HAPPY<br /><em>BIRTHDAY, {name.toUpperCase()}!</em></h1>
        <p className="lead">May your days be filled with happiness, your dreams take you to beautiful places, and your life give you countless reasons to smile.</p>
        <p className="wish-note">Today is yours. Every little star is cheering you on.</p>
        <label className="name-edit">A name for this little universe
          <input value={name} onChange={(event) => setName(event.target.value)} aria-label="Edit sister's name" maxLength={24} />
        </label>
        <div className="reveal-gifts" aria-label="Three little birthday gifts">
          {['A pocket reminder', 'One sibling favor', 'A birthday wish'].map((title, index) =>
            <button key={title} className={`mini-gift ${giftOpened[index] ? 'opened' : ''}`} onClick={() => revealGift(index)} aria-expanded={giftOpened[index]}>
              <span aria-hidden="true">{giftOpened[index] ? '✦' : '🎁'}</span>
              <strong>{giftOpened[index] ? ['You are loved, just as you are.', 'Redeemable with your brother.', 'More laughter and lovely surprises.'][index] : title}</strong>
            </button>)}
        </div>
      </div>}

      {page === 2 && <div className="page-content chaos-content">
        <div className="scene-kicker">01 / sibling constellation</div>
        <div className="chaos-card">
          <div className="eyebrow">A formal sibling report</div>
          <h1 id="page-title" className="section-title">The sibling<br />chaos zone.</h1>
          <p className="lead">Birthday update installed successfully.<br />Drama levels: still questionable.<br />Annoying everyone: lifetime subscription activated.<br /><strong>Official title: Queen of Chaos.</strong></p>
          <div className="roast" aria-live="polite">{roasts[roastIndex]}</div>
          <div className="joke-controls">
            <button className="btn btn-ghost" onClick={() => setRoastIndex((index) => (index + 1) % roasts.length)}><RotateCcw size={15} /> Another loving roast</button>
            <label className="edit-label">Edit the joke list
              <textarea value={roasts.join('\n')} onChange={(event) => setRoasts(event.target.value.split('\n').slice(0, 5).concat(Array(Math.max(0, 5 - event.target.value.split('\n').length)).fill('')))} aria-label="Edit sibling jokes, one per line" rows={4} />
            </label>
          </div>
        </div>
        <p className="hidden-note">Psst… the tiny star is shy. Tap it for a secret.</p>
        <p className="hidden-note discovery-count">Hidden universe finds: {discoveryCount}</p>
        <button className="discovery-button chaos-star" onClick={() => discover('A tiny sibling favor is yours.')} aria-label="Reveal a hidden sibling favor">✧</button>
      </div>}

      {page === 3 && <div className="page-content play-content">
        <div className="scene-kicker">02 / play time</div>
        <h1 id="page-title" className="section-title">Catch the<br /><em>falling stars.</em></h1>
        <p className="lead">Catch stars and little gifts before the twenty seconds are up. Tap a treasure, or focus the playfield and press Enter or Space.</p>
        <div className="game-stats" aria-live="polite"><div><span>CAUGHT</span><strong>{score}</strong></div><div><span>TIME LEFT</span><strong>{timeLeft}<small>s</small></strong></div><div><span>LEVEL</span><strong>{difficulty}</strong></div><div><span>ROUND</span><strong>{gameActive ? 'LIVE' : gameResult === 'win' ? 'WIN' : gameResult === 'try-again' ? 'TRY AGAIN' : 'READY'}</strong></div></div>
        <div ref={gameAreaRef} className={`game-board ${gameActive ? 'is-playing' : ''}`} role="group" aria-label="Catch falling stars game" tabIndex={0}
          onKeyDown={(event) => { if (event.target === event.currentTarget && gameActive && ['Enter', ' '].includes(event.key)) { event.preventDefault(); catchTarget(); } }}>
          <span className="board-caption" aria-live="polite">{gameActive ? 'Catch it!' : gameResult === 'win' ? `You win! ${score} treasures caught.` : gameResult === 'try-again' ? `Time! You caught ${score}. Try again?` : 'Ready when you are.'}</span>
          {gameActive && <button key={targetVersion} className={`game-target ${target.kind}`} onClick={catchTarget} style={{ left: `${target.x}%`, top: `${target.y}%` }} aria-label={`Catch falling ${target.kind}`}><span aria-hidden="true">{target.kind === 'gift' ? '🎁' : '✦'}</span></button>}
          {!gameActive && <span className="board-orbit" aria-hidden="true">✦</span>}
        </div>
        <div className="actions"><button className="btn" onClick={startGame}>{gameActive ? 'Restart round' : gameResult ? 'Play again' : 'Start 20-second game'}<ArrowRight size={16} /></button></div>
        <div className="quiz-panel">
          <div className="eyebrow">03 / sibling science · five questions</div>
          <h2 className="quiz-title">How well do you know us?</h2>
          {!quizDone ? <div className="quiz-card">
            <div className="question-count">QUESTION {quizIndex + 1} OF 5</div>
            <label className="edit-label" htmlFor="quiz-question">Edit this question</label>
            <textarea id="quiz-question" className="quiz-edit" value={quizQuestions[quizIndex]} onChange={(event) => setQuizQuestions((old) => old.map((question, index) => index === quizIndex ? event.target.value : question))} rows={2} />
            <div className="quiz-options">{CHOICES.map((choice, index) => <button key={choice} className="quiz-option" onClick={() => answerQuestion(index)}>{index === 0 ? name : choice}</button>)}</div>
          </div> : <div className="quiz-result" aria-live="polite">
            <h3>A perfect team of two.</h3>
            <p>The sibling court confirms: {quizAnswers.filter((answer) => answer === 2).length} mutual accusations, {quizAnswers.filter((answer) => answer === 0).length} lovingly assigned to {name}, and {quizAnswers.filter((answer) => answer === 1).length} to her brother.</p>
            <button className="btn btn-ghost" onClick={restartQuiz}><RotateCcw size={15} /> Take the quiz again</button>
          </div>}
          <p className="quiz-footnote"><Sparkles size={15} /> Pick answers for fun; the only official result is that your brother is lucky to have you.</p>
        </div>
      </div>}

      {page === 4 && <div className="page-content letter-content">
        <div className="scene-kicker">04 / a note from your brother</div>
        <div className={`letter-paper ${letterOpen ? 'letter-open' : ''}`}>
          <div className="eyebrow">For {name}, always</div>
          {!letterOpen ? <>
            <h1 id="page-title" className="letter-heading">Not every feeling fits inside a joke…</h1>
            <p className="letter-subtitle">A little note, waiting beneath the moon.</p>
            <button className="envelope" aria-label="Open your birthday letter" onClick={() => setLetterOpen(true)}>
              <span className="envelope-flap" aria-hidden="true" /><span className="envelope-heart" aria-hidden="true">♥</span>
            </button>
            <p className="letter-hint">Tap the envelope to open your letter</p>
          </> : <div className="letter-reveal">
            <h1 id="page-title" className="sr-only">A letter for {name}</h1>
            <p className="letter-subtitle">Make it yours. Your edits save on this device.</p>
            {!letterEditing ? <div className="letter-lines">{letter.split('\n\n').map((paragraph, index) => <p key={`${index}-${paragraph}`}>{paragraph}</p>)}</div> :
              <label className="sr-only" htmlFor="birthday-letter">Edit birthday letter</label>}
            {letterEditing && <textarea id="birthday-letter" className="letter-input" value={letter} onChange={(event) => setLetter(event.target.value)} />}
            <div className="letter-actions">
              <button className="btn btn-ghost" onClick={() => setLetterEditing((editing) => !editing)}>{letterEditing ? <><Check size={15} /> Read the letter</> : 'Personalize this letter'}</button>
              <button className="text-button" onClick={() => { setLetterOpen(false); setLetterEditing(false); }}>Close letter</button>
            </div>
            <div className="save-note"><Check size={13} /> Saved automatically on this device</div>
          </div>}
        </div>
      </div>}

      {page === 5 && <div className="page-content wish-content">
        <div className="scene-kicker">05 / make a wish</div>
        <div className="eyebrow">The brightest little moment</div>
        <h1 id="page-title" className="section-title">One breath.<br /><em>One big wish.</em></h1>
        <p className="lead">Tap each candle to blow it out, then send your wish on its way.</p>
        <div className={`cake ${wished ? 'cake-celebrating' : ''}`} role="group" aria-label="Birthday cake with five candles">
          <div className="candle-row">{candlesOut.map((out, index) => <button key={index} className={`candle ${out ? 'out' : ''}`} aria-label={`${out ? 'Relight' : 'Blow out'} candle ${index + 1}`} aria-pressed={out}
            onClick={() => setCandlesOut((old) => old.map((value, item) => item === index ? !value : value))}><span className="flame" /></button>)}</div>
          <div className="cake-top"><span>{name.toUpperCase()}</span></div><div className="cake-base" />
        </div>
        <div className="actions centered">
          <button className="btn" onClick={() => { setCandlesOut([true, true, true, true, true]); setWished(true); setConfetti(true); }}>{wished ? 'Make another wish' : 'Make a wish'}<Sparkles size={16} /></button>
          <button className="btn btn-ghost" onClick={() => { setCandlesOut([false, false, false, false, false]); setWished(false); }}>Relight the candles</button>
        </div>
        {wished && <p className="wish-message" aria-live="polite">THE UNIVERSE IS CELEBRATING YOU, {name.toUpperCase()}! <Heart size={16} fill="currentColor" /></p>}
      </div>}

      {page === 6 && <div className="page-content finale-content">
        <div className="scene-kicker">06 / one last thing</div>
        <div className="eyebrow"><Heart size={14} fill="currentColor" /> &nbsp;Before you leave this little universe…</div>
        <h1 id="page-title" className="section-title final-intro">One last thing you should always remember.</h1>
        <p className="final-message">{FINAL_MESSAGE.replaceAll('Anu', name)}</p>
        <div className="finale-mark">ANUVERSE <span>✦</span><small>A LITTLE WORLD MADE JUST FOR YOU.</small></div>
        <div className="sound-card">
          <div className="sound-icon"><Music2 size={20} /></div>
          <div className="sound-copy"><strong>A little birthday soundtrack</strong><span>{musicError ? 'Local audio unavailable. Add birthday-music.mp3 to the public folder.' : 'Playback is local and starts only when you press play.'}</span></div>
          <button className="sound-play" onClick={toggleMusic} aria-label={musicPlaying ? 'Pause local birthday soundtrack' : 'Play local birthday soundtrack'}>{musicPlaying ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
        </div>
        <div className="actions centered">
          <button className="btn" onClick={replay}><RotateCcw size={15} /> Replay everything</button>
          <a className="btn btn-ghost" href="https://suno.com/s/9oCUGhJjn6tLO3BO" target="_blank" rel="noreferrer"><AudioLines size={16} /> Listen on Suno</a>
        </div>
        <p className="save-note made-with-love">Made with love, by your brother.</p>
      </div>}
    </section>
    {page < 6 && <button className="btn page-next" onClick={nextPage} aria-label={`Continue to page ${page + 2}`}>
      {nextLabels[page]} <ArrowRight size={16} />
    </button>}
    {toast && <div className="toast-message" role="status" aria-live="polite">{toast}</div>}
  </main>;
}

export default App;
