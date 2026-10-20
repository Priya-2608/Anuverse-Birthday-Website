import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, AudioLines, Check, Heart, Play, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';

const ROASTS = [
  'A highly talented little sister, with an astonishing commitment to borrowing things and returning them… eventually.',
  'Your sibling superpower: making one tiny request sound like a five-season drama.',
  'You have the rare gift of being completely right, even when the evidence is still loading.',
  'A certified expert at appearing exactly when snacks are opened.',
  'The family group chat would be quieter without you. And much, much less fun.',
];
const STARTER_LETTER = `Happy Birthday, my Thangachi! 💜

I know I spend plenty of time teasing you, making fun of you and probably annoying you more than necessary. 😂 But behind all those jokes, I genuinely wish the very best for you.

May your days be filled with happiness, your dreams take you to beautiful places, and your life give you countless reasons to smile.

No matter how much we argue over silly things, I will always wish to see you happy.

And don't get too emotional reading this. You still have to tolerate your annoying brother after today. 😭😂

Happy Birthday, Anu. Stay happy, keep smiling and keep being your wonderful self.

With lots of sibling love,
Your favourite annoying brother 💜`;
const DEFAULT_QUESTIONS = [
  'Who is more likely to start a sibling debate over absolutely nothing?',
  'Who takes longer to get ready?',
  'Who is more likely to steal the last snack?',
  'Who would laugh first during a serious moment?',
  'Who gets the final word in a disagreement?',
];
const CHOICES = ['Anu', 'Her brother', 'Both of us'];
const LS = { letter: 'anuverse-letter', count: 'anuverse-discoveries', music: 'anuverse-music-muted', questions: 'anuverse-quiz-questions' };

function readSaved(key: string, fallback: string) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function readNumber(key: string) {
  try { return Math.max(0, Number(localStorage.getItem(key) ?? 0) || 0); } catch { return 0; }
}
function Stars({ progress }: { progress: number }) {
  return <div className="stars-layer" aria-hidden="true" style={{ transform: `translateY(${progress * -0.28}px)` }}>{Array.from({ length: 72 }, (_, i) => <i key={i} className="star-dot" style={{ left: `${(i * 47 + 7) % 100}%`, top: `${(i * 71 + 5) % 100}%`, animationDelay: `${(i % 9) * -.45}s`, opacity: .22 + ((i * 17) % 60) / 100 }} />)}</div>;
}
function App() {
  const [progress, setProgress] = useState(0);
  const [roastIndex, setRoastIndex] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [starPos, setStarPos] = useState({ x: 50, y: 50 });
  const [targetKind, setTargetKind] = useState<'star' | 'gift'>('star');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizDone, setQuizDone] = useState(false);
  const [questions, setQuestions] = useState<string[]>(() => {
    try { const val = JSON.parse(readSaved(LS.questions, 'null')); return Array.isArray(val) ? val : DEFAULT_QUESTIONS; } catch { return DEFAULT_QUESTIONS; }
  });
  const [gifts, setGifts] = useState<boolean[]>([false, false, false]);
  const [letter, setLetter] = useState(() => readSaved(LS.letter, STARTER_LETTER));
  const [letterOpened, setLetterOpened] = useState(false);
  const [letterEditing, setLetterEditing] = useState(false);
  const [discoveryCount, setDiscoveryCount] = useState(() => readNumber(LS.count));
  const [muted, setMuted] = useState(() => readSaved(LS.music, 'true') !== 'false');
  const [toast, setToast] = useState('');
  const [candlesOut, setCandlesOut] = useState<boolean[]>([false, false, false, false, false]);
  const [wished, setWished] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [musicError, setMusicError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const toastRef = useRef<number | undefined>(undefined);
  const gameRef = useRef<HTMLDivElement>(null);
  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastRef.current) window.clearTimeout(toastRef.current);
    toastRef.current = window.setTimeout(() => setToast(''), 3000);
  }, []);
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max * 100 : 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => {
    const scenes = document.querySelectorAll<HTMLElement>('.scene');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    scenes.forEach((scene) => observer.observe(scene));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!gameActive) return;
    timerRef.current = window.setInterval(() => setTimeLeft((time) => {
      if (time <= 1) {
        window.clearInterval(timerRef.current);
        window.setTimeout(() => setGameActive(false), 0);
        return 0;
      }
      return time - 1;
    }), 1000);
    return () => window.clearInterval(timerRef.current);
  }, [gameActive]);
  useEffect(() => {
    if (!gameActive) return;
    const interval = window.setInterval(moveStar, Math.max(550, 1500 - difficulty * 220));
    return () => window.clearInterval(interval);
  }, [gameActive, difficulty]);
  useEffect(() => {
    if (!gameActive) return;
    const handle = (event: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'].includes(event.key) && gameRef.current?.contains(document.activeElement)) {
        event.preventDefault(); catchStar();
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  });
  useEffect(() => { try { localStorage.setItem(LS.letter, letter); } catch { /* storage may be unavailable */ } }, [letter]);
  useEffect(() => { try { localStorage.setItem(LS.questions, JSON.stringify(questions)); } catch { /* storage may be unavailable */ } }, [questions]);
  useEffect(() => { try { localStorage.setItem(LS.music, String(muted)); } catch { /* storage may be unavailable */ } }, [muted]);

  function moveStar() {
    setStarPos({ x: 7 + Math.random() * 86, y: 8 });
    setTargetKind(Math.random() < 0.25 ? 'gift' : 'star');
  }
  function catchStar() {
    if (!gameActive) return;
    setScore((value) => {
      const next = value + 1;
      if (next % 5 === 0) setDifficulty((level) => Math.min(4, level + 1));
      return next;
    });
    moveStar();
  }
  function startGame() {
    window.clearInterval(timerRef.current);
    setScore(0); setDifficulty(1); setTimeLeft(20); moveStar(); setGameActive(true);
  }
  function pickAnswer(option: number) {
    const answers = [...quizAnswers, option];
    setQuizAnswers(answers);
    if (quizIndex >= 4) setQuizDone(true);
    else setQuizIndex((index) => index + 1);
  }
  function restartQuiz() { setQuizIndex(0); setQuizAnswers([]); setQuizDone(false); }
  function revealGift(index: number) {
    setGifts((old) => old.map((v, i) => i === index ? !v : v));
    if (!gifts[index]) notify(['A pocket-sized reminder: you are loved, exactly as you are.', 'One free sibling favor. Redeemable with your brother, no expiry date.', 'A wish for a year with more laughter, brave starts, and lovely surprises.'][index]);
  }
  function discover(label: string) {
    const next = discoveryCount + 1;
    setDiscoveryCount(next);
    try { localStorage.setItem(LS.count, String(next)); } catch { /* storage may be unavailable */ }
    notify(`${label} found. Little universe discoveries: ${next}`);
  }
  function makeWish() {
    setCandlesOut([true, true, true, true, true]); setWished(true); setConfetti(true);
    window.setTimeout(() => setConfetti(false), 3500);
    notify('Wish sent into the universe. Keep it safe, Anu.');
  }
  function replay() {
    setCandlesOut([false, false, false, false, false]); setWished(false); setGifts([false, false, false]); restartQuiz();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function toggleMusic() {
    if (!audioRef.current) return;
    if (muted) {
      try { await audioRef.current.play(); setMuted(false); setMusicError(false); }
      catch { setMusicError(true); notify('Add birthday-music.mp3 to the public folder to hear your soundtrack.'); }
    } else { audioRef.current.pause(); setMuted(true); }
  }
  const skip = (id: string) => <a className="jump-link" href={`#${id}`}>Skip ahead <ArrowRight size={14} aria-hidden="true" /></a>;

  return <main className="universe" aria-label="ANUVERSE birthday story">
    <Stars progress={progress} />
    <div className="progress-rail" aria-label={`Story progress ${Math.round(progress)} percent`}><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
    <audio ref={audioRef} src="/birthday-music.mp3" loop muted={muted} onError={() => setMusicError(true)} />
    <button className="music-control" onClick={toggleMusic} aria-label={muted ? 'Play birthday music' : 'Pause birthday music'} data-testid="button-music">
      {muted ? <VolumeX size={15} /> : <Volume2 size={15} />} <span>{muted ? 'Sound off' : 'Sound on'}</span>
    </button>
    <section className="scene intro" id="welcome">
      <div className="scene-inner">
        <div className="scene-kicker">A small universe, for one very loved sister</div>
        <p className="opening-line">Some people make ordinary days feel special…</p>
        <p className="opening-line opening-line-later">Today, this little universe belongs to one special person.</p>
        <h1 className="display">HAPPY BIRTHDAY,<br /><em>ANU 💜</em></h1>
        <p className="lead">A birthday story from your brother, made of a little mischief, a little magic, and a whole lot of love.</p>
        <div className="orbit-art" aria-label="A glowing planet surrounded by orbiting rings" role="img"><div className="planet" /></div>
        <div className="actions"><a className="btn" href="#chaos">ENTER YOUR UNIVERSE <ArrowDown size={17} /></a></div>
        <a className="scroll-cue" href="#chaos"><span>Scroll to explore</span><ArrowDown size={13} /></a>
      </div>
      <button className="discovery one" aria-label="Discover a hidden star" onClick={() => discover('A shy little star')}>✦</button>
    </section>

    <section className="scene scene-sibling" id="chaos">
      <div className="scene-inner">
        <div className="scene-index">01 / SIBLING CONSTELLATION</div>
        <div className="chaos-card">
          <div className="eyebrow">A formal sibling report</div>
          <h2 className="section-title">The sibling<br />chaos zone.</h2>
          <p className="lead">Birthday update installed successfully.<br />Drama levels: still questionable.<br />Annoying everyone: lifetime subscription activated.<br /><strong>Official title: Queen of Chaos 👑</strong></p>
          <div className="roast" aria-live="polite" data-testid="text-roast">{ROASTS[roastIndex]}</div>
          <button className="btn btn-ghost" onClick={() => setRoastIndex((index) => (index + 1) % ROASTS.length)} data-testid="button-roast">Reveal Another Roast <RotateCcw size={15} /></button>
        </div>
        <div className="actions">{skip('stars')}</div>
      </div>
      <button className="discovery two" aria-label="Find a tiny comet" onClick={() => discover('A tiny comet')}>✧</button>
    </section>

    <section className="scene" id="stars">
      <div className="scene-inner">
        <div className="scene-index">02 / COSMIC ARCADE</div>
        <div className="eyebrow">A twenty-second sibling challenge</div>
        <h2 className="section-title">Catch the<br /><em style={{ color: 'var(--teal)' }}>good stars.</em></h2>
        <p className="lead">Catch as many as you can before they drift away. The universe gets a little quicker as your score grows.</p>
        <div className="game-hud"><span>STARS CAUGHT <strong>{score}</strong></span><span>TIME <strong>{timeLeft}s</strong></span><span>LEVEL <strong>{difficulty}</strong></span></div>
        <div ref={gameRef} className="game-board" role="application" aria-label="Catch the star game. Focus the star and press Enter or Space to catch it." tabIndex={0} data-testid="game-board">
          {gameActive ? <button className="game-star" style={{ left: `${starPos.x}%`, top: `${starPos.y}%` }} onClick={catchStar} aria-label={`Catch the falling ${targetKind}`} data-testid="button-catch-star">{targetKind === 'gift' ? '🎁' : '✦'}</button> :
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 20 }}>
              <div>{timeLeft === 0 ? <><p className="section-title" style={{ fontSize: 38, marginBottom: 8 }}>You caught {score} stars.</p><p className="lead" style={{ margin: '0 auto 18px' }}>Your sibling-space score is safely on the record.</p></> : <><p className="section-title" style={{ fontSize: 38, marginBottom: 8 }}>Ready, stargazer?</p><p className="lead" style={{ margin: '0 auto 18px' }}>Tap the star, or focus it and press Enter / Space.</p></>}</div>
            </div>}
        </div>
        <div className="actions"><button className="btn" onClick={startGame} data-testid="button-start-game">{timeLeft === 0 ? 'Play again' : gameActive ? 'Restart round' : 'Start 20-second round'} <Play size={15} /></button>{skip('quiz')}</div>
      </div>
      <button className="discovery three" aria-label="Discover a hidden moon" onClick={() => discover('A moon with a secret')}>·</button>
    </section>

    <section className="scene" id="quiz">
      <div className="scene-inner">
        <div className="scene-index">03 / SIBLING SCIENCE</div>
        <div className="quiz-layout">
          <div>
            <div className="eyebrow">Five highly scientific questions</div>
            <h2 className="section-title">How well do<br />you know us?</h2>
            <p className="lead">Pick the sibling most likely to take the blame. There are no wrong answers. The sibling court is still reviewing that.</p>
            <div className="quiz-card">
              {!quizDone ? <>
                <div className="eyebrow">Question {quizIndex + 1} of 5</div>
                <label className="sr-only" htmlFor={`question-${quizIndex}`}>Edit question {quizIndex + 1}</label>
                <textarea id={`question-${quizIndex}`} className="quiz-edit" value={questions[quizIndex]} onChange={(event) => setQuestions((prev) => prev.map((q, i) => i === quizIndex ? event.target.value : q))} aria-label={`Edit question ${quizIndex + 1}`} data-testid={`input-quiz-question-${quizIndex + 1}`} />
                {CHOICES.map((choice, index) => <button key={choice} className="quiz-option" onClick={() => pickAnswer(index)} data-testid={`button-answer-${index}`}>{choice}</button>)}
              </> : <div aria-live="polite">
                <div className="eyebrow">Official sibling findings</div>
                <h3 className="section-title" style={{ fontSize: 42, marginTop: 12 }}>A perfect<br /><em style={{ color: 'var(--gold)' }}>team of two.</em></h3>
                <p className="lead">The sibling court confirms: {quizAnswers.filter((a) => a === 2).length} mutual accusations, {quizAnswers.filter((a) => a === 0).length} lovingly assigned to Anu, and {quizAnswers.filter((a) => a === 1).length} to her brother.</p>
                <button className="btn btn-ghost" onClick={restartQuiz}>Take the quiz again <RotateCcw size={15} /></button>
              </div>}
            </div>
          </div>
          <aside className="quiz-side"><Sparkles size={18} color="var(--gold)" /><p>All five questions are yours to edit. Your changes stay on this device.</p><p>Pick answers for fun; the only official result is that your brother is lucky to have you.</p></aside>
        </div>
        <div className="actions">{skip('gifts')}</div>
      </div>
    </section>

    <section className="scene" id="gifts">
      <div className="scene-inner">
        <div className="scene-index">04 / THREE LITTLE GIFTS</div>
        <div className="eyebrow">No wrapping paper required</div>
        <h2 className="section-title">Open what<br />the stars left.</h2>
        <p className="lead">Three tiny gifts from your brother. Tap each one to unwrap it.</p>
        <div className="gift-grid">
          {['A pocket reminder', 'One sibling favor', 'A birthday wish'].map((title, index) => <button key={title} className={`gift ${gifts[index] ? 'opened' : ''}`} onClick={() => revealGift(index)} aria-expanded={gifts[index]} data-testid={`button-gift-${index + 1}`}>
            <span className="gift-icon" aria-hidden="true">{gifts[index] ? <Check size={38} color="var(--teal)" /> : <span style={{ color: ['var(--gold)', 'var(--rose)', 'var(--teal)'][index] }}>✧</span>}</span>
            <span><h3>{gifts[index] ? 'Unwrapped' : title}</h3><p>{gifts[index] ? ['You are loved, exactly as you are.', 'Redeemable with your brother. No expiry date.', 'More laughter and lovely surprises ahead.'][index] : 'A small parcel, just for you. Open me.'}</p></span>
          </button>)}
        </div>
        <div className="actions">{skip('letter')}</div>
      </div>
    </section>

    <section className="scene" id="letter">
      <div className="scene-inner">
        <div className="scene-index">05 / A NOTE FROM YOUR BROTHER</div>
        <div className={`letter-paper ${letterOpened ? 'letter-open' : ''}`}>
          <div className="eyebrow">For Anu, always</div>
          <h2 className="section-title" style={{ fontSize: 'clamp(42px,7vw,72px)', color: '#292539', marginTop: 16 }}>Not every feeling fits inside a joke…</h2>
          {!letterOpened ? <>
            <p style={{ color: '#665b59', margin: '10px 0 0' }}>A little note, waiting beneath the moon.</p>
            <button className="envelope" aria-label="Open your birthday letter" onClick={() => setLetterOpened(true)} data-testid="button-open-letter">
              <span className="envelope-flap" aria-hidden="true" />
              <span className="envelope-heart" aria-hidden="true">♥</span>
              <span className="sr-only">Tap to open your letter</span>
            </button>
            <p style={{ color: '#665b59', textAlign: 'center' }}>Tap the envelope to open your letter</p>
          </> : <div className="letter-reveal">
            <p style={{ color: '#665b59', margin: '10px 0 0' }}>Make it yours. Your edits save on this device.</p>
            {!letterEditing ? <>
              <div className="letter-lines" aria-label="A letter from your brother">
                {letter.split('\n\n').map((paragraph, index) => <p key={`${index}-${paragraph}`} style={{ ['--line-index' as string]: index }}>{paragraph}</p>)}
              </div>
              <button className="btn btn-ghost letter-edit-button" onClick={() => setLetterEditing(true)}>Personalize this letter</button>
            </> : <>
              <label className="sr-only" htmlFor="birthday-letter">Birthday letter from your brother</label>
              <textarea id="birthday-letter" className="letter-input" value={letter} onChange={(event) => setLetter(event.target.value)} data-testid="input-letter" />
              <button className="btn btn-ghost letter-edit-button" onClick={() => setLetterEditing(false)}>Read the letter</button>
            </>}
            <div className="save-note" role="status"><Check size={13} style={{ verticalAlign: 'middle' }} /> Saved automatically</div>
          </div>}
        </div>
        <div className="actions">{skip('candles')}</div>
      </div>
    </section>

    <section className="scene" id="candles">
      <div className="scene-inner" style={{ textAlign: 'center' }}>
        <div className="scene-index">06 / MAKE A WISH</div>
        <div className="eyebrow">The brightest little moment</div>
        <h2 className="section-title">One breath.<br /><em style={{ color: 'var(--rose)' }}>One big wish.</em></h2>
        <p className="lead" style={{ margin: '22px auto' }}>Tap each candle to blow it out, then send your wish on its way.</p>
        <div className={`cake ${wished ? 'cake-celebrating' : ''}`} role="group" aria-label="A lavender birthday cake with five interactive candles">
          <div className="candle-row" aria-label="Birthday candles">
            {[0, 1, 2, 3, 4].map((num) => <button key={num} className={`candle ${candlesOut[num] ? 'out' : ''}`} aria-label={`${candlesOut[num] ? 'Relight' : 'Blow out'} candle ${num + 1}`} onClick={() => setCandlesOut((prev) => prev.map((value, index) => index === num ? !value : value))} data-testid={`button-candle-${num + 1}`}><span className="flame" /></button>)}
          </div>
          <div className="cake-top"><span>ANU</span></div><div className="cake-base" />
        </div>
        <div className="actions" style={{ justifyContent: 'center' }}>
          <button className="btn" onClick={makeWish} data-testid="button-make-wish">{wished ? 'Make another wish' : 'Make a wish'} <Sparkles size={16} /></button>
          <button className="btn btn-ghost" onClick={() => { setCandlesOut([false, false, false, false, false]); setWished(false); }}>Relight the candles</button>
        </div>
        {wished && <p className="lead wish-message" aria-live="polite" style={{ margin: '24px auto 0', color: 'var(--gold)' }}>THE UNIVERSE IS CELEBRATING YOU, ANU! 💜</p>}
      </div>
    </section>

    <section className="scene finale" id="goodnight">
      {confetti && Array.from({ length: 46 }, (_, i) => <i key={i} className="confetti" style={{ left: `${(i * 31 + 4) % 100}%`, background: ['#f2c879', '#83d6ce', '#d994ae', '#f4e4bd'][i % 4], animationDelay: `${(i % 8) * .11}s`, ['--drift']: `${((i * 19) % 160) - 80}px` } as CSSProperties} />)}
      <div className="scene-inner">
        <div className="scene-index">07 / ONE LAST THING</div>
        <div className="eyebrow"><Heart size={14} style={{ verticalAlign: 'middle' }} /> &nbsp;Before you leave this little universe…</div>
        <h2 className="section-title final-intro">One last thing you should always remember.</h2>
        <p className="lead final-message">You deserve happiness, beautiful memories, people who appreciate you and a life full of wonderful surprises.<br /><br />Thank you for being you, Anu.<br /><br />Whatever this new year brings, I hope you keep finding reasons to laugh, dream and smile.<br /><br />Happy Birthday, my Thangachi. This little universe was made just to celebrate you. 💜</p>
        <div className="eyebrow finale-mark">ANUVERSE ✨<br /><span>A LITTLE WORLD MADE JUST FOR YOU.</span></div>
        <p className="save-note" aria-live="polite">Hidden universe finds: {discoveryCount}</p>
        <div className="actions" style={{ justifyContent: 'center' }}>
          <button className="btn" onClick={replay} data-testid="button-replay">REPLAY YOUR UNIVERSE <RotateCcw size={15} /></button>
          <a className="btn btn-ghost" href="https://suno.com/s/9oCUGhJjn6tLO3BO" target="_blank" rel="noreferrer" aria-label="Listen to the birthday song on Suno">Listen to the birthday song <AudioLines size={16} /></a>
        </div>
        <p className="save-note" style={{ marginTop: 18 }}>{musicError ? 'Local audio is not available yet. Add birthday-music.mp3 to the public folder, or listen to the birthday song on Suno.' : 'Sound is always opt-in. Add birthday-music.mp3 to the public folder for direct playback.'}</p>
        <p className="save-note">Made with love, by your brother.</p>
      </div>
      <button className="discovery one" aria-label="Find a hidden sparkle" onClick={() => discover('A hidden sparkle')}>✧</button>
    </section>
    {toast && <div className="toast-message" role="status" aria-live="polite">{toast}</div>}
  </main>;
}

export default App;
