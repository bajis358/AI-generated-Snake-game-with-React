import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants & DB ---
const TRACKS = [
  {
    id: 1,
    title: "ERR://PULSE.FATAL",
    artist: "UNIT_734",
    cover: "https://picsum.photos/seed/cyber1/400/400?grayscale",
  },
  {
    id: 2,
    title: "VLOCTY_OVRFLW",
    artist: "SYSTEM_FAILURE",
    cover: "https://picsum.photos/seed/cyber2/400/400?grayscale",
  },
  {
    id: 3,
    title: "NULL_PTR_EXC",
    artist: "0x000000",
    cover: "https://picsum.photos/seed/cyber3/400/400?grayscale",
  }
];

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 120;

// --- Snake Module ---
const SnakeGame: React.FC<{ onGameOver: (s: number) => void }> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [sessionTime, setSessionTime] = useState(0);

  const generateFood = useCallback((currentSnake: typeof INITIAL_SNAKE) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const isOnSnake = currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetTarget = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setFood(generateFood(INITIAL_SNAKE));
    setIsGameOver(false);
    setIsPaused(false);
    setStartTime(Date.now());
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    if (isPaused || isGameOver) return;
    const move = () => {
      setSnake(prev => {
        const head = { x: prev[0].x + direction.x, y: prev[0].y + direction.y };
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setSessionTime(Math.floor((Date.now() - startTime) / 1000));
          setIsGameOver(true);
          setHighScore(prev => Math.max(prev, score));
          onGameOver(score);
          return prev;
        }
        if (prev.some(seg => seg.x === head.x && seg.y === head.y)) {
          setSessionTime(Math.floor((Date.now() - startTime) / 1000));
          setIsGameOver(true);
          setHighScore(prev => Math.max(prev, score));
          onGameOver(score);
          return prev;
        }
        const newSnake = [head, ...prev];
        if (head.x === food.x && head.y === food.y) {
          setScore(s => s + 1);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    };
    const interval = setInterval(move, INITIAL_SPEED - Math.min(score * 2, 80));
    return () => clearInterval(interval);
  }, [direction, food, isPaused, isGameOver, score, generateFood, onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width / GRID_SIZE;

    // Clear background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Glitch Grid lines
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();ctx.moveTo(i * size, 0);ctx.lineTo(i * size, canvas.height);ctx.stroke();
        ctx.beginPath();ctx.moveTo(0, i * size);ctx.lineTo(canvas.width, i * size);ctx.stroke();
    }
    ctx.setLineDash([]);

    // Food (Magenta)
    ctx.fillStyle = '#FF00FF';
    ctx.fillRect(food.x * size + 2, food.y * size + 2, size - 4, size - 4);

    // Snake (Cyan)
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#FFFFFF' : '#00FFFF'; // Head is white
      ctx.fillRect(seg.x * size + 1, seg.y * size + 1, size - 2, size - 2);
    });
  }, [snake, food]);

  return (
    <div className="w-full flex justify-center">
      <div className="box-glitch bg-black p-4 w-fit screen-tear">
        <div className="flex justify-between items-end mb-2 border-b-2 border-[#00FFFF] pb-2 font-mono">
          <div className="text-[#00FFFF] text-sm md:text-base">
            SEQ_REC: <span className="text-[#FF00FF]">{score.toString().padStart(4, '0')}</span>
          </div>
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="px-2 py-0.5 bg-[#FF00FF] text-black text-xs md:text-sm hover:bg-[#00FFFF] transition-colors"
          >
            {isPaused ? '[ RESUME ]' : '[ HALT ]'}
          </button>
        </div>
        <div className="relative">
          <canvas 
            ref={canvasRef} 
            width={360} 
            height={360} 
            className="border-2 border-[#FF00FF] bg-black"
            style={{ imageRendering: 'pixelated' }}
          />
          <AnimatePresence>
            {isGameOver && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.3, type: "spring" }}
                className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center border-2 border-red-600 p-4 shadow-[inset_0_0_50px_rgba(255,0,0,0.5)] z-20"
              >
                <motion.h2 
                  animate={{ x: [-2, 2, -2, 0], y: [2, -2, 2, 0] }}
                  transition={{ repeat: Infinity, duration: 0.2 }}
                  className="text-4xl md:text-5xl font-display text-red-600 glitch-text mb-2 drop-shadow-[0_0_10px_rgba(255,0,0,1)] text-center" 
                  data-text="FATAL_ERR"
                >
                  FATAL_ERR
                </motion.h2>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="w-full max-w-[250px] bg-red-900/20 border border-red-600/50 p-3 mb-4 rounded flex flex-col gap-2"
                >
                  <div className="flex justify-between text-xs md:text-sm font-mono text-red-400">
                    <span>SESSION_TIME:</span>
                    <span>{sessionTime}s</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm font-mono text-red-400">
                    <span>BLOCKS_CAPTURED:</span>
                    <span className="text-white">{score}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm font-mono text-red-400 border-t border-red-600/50 pt-2 mt-1">
                    <span>HIGH_SCORE:</span>
                    <span className={score >= highScore && score > 0 ? "text-[#00FFFF] animate-pulse" : "text-white"}>
                      {Math.max(score, highScore)}
                    </span>
                  </div>
                </motion.div>

                <motion.button 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(0,255,255,0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetTarget}
                  className="px-6 py-2 border-2 md:text-lg border-[#00FFFF] text-[#00FFFF] bg-black hover:bg-[#00FFFF] hover:text-black font-sans uppercase transition-all duration-200"
                >
                  REBOOT_SYS
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
          {isPaused && !isGameOver && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-[#FF00FF] text-black px-4 py-1 text-xl md:text-3xl font-display">SUSPENDED</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Core Terminal Layer ---
export default function App() {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const current = TRACKS[idx];

  const next = () => setIdx((p) => (p + 1) % TRACKS.length);
  const prev = () => setIdx((p) => (p - 1 + TRACKS.length) % TRACKS.length);

  return (
    <div className="min-h-screen relative p-4 flex flex-col md:p-8 font-sans">
      <div className="scanlines" />
      <div className="bg-noise" />
      
      {/* HUD HEADER */}
      <header className="relative z-10 w-full border-b-4 border-[#00FFFF] border-dashed pb-4 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-display text-[#FF00FF] glitch-text tracking-widest" data-text="SYS.TERMINAL">
            SYS.TERMINAL
          </h1>
          <div className="font-mono text-xs md:text-sm text-[#00FFFF] mt-2">STATUS: OPERATIONAL // KERNEL: V9.9.9.1</div>
        </div>
        <div className="flex gap-4 font-mono text-[10px] md:text-xs text-white/70 mt-4 md:mt-0">
          <div className="border border-white/30 p-2 text-center md:text-left">
            <div>MEM_ALLOC</div>
            <div className="text-[#FF00FF] mt-1">0x00FF/0xFFFF</div>
          </div>
          <div className="border border-white/30 p-2 text-center md:text-left">
            <div>NET_UPLINK</div>
            <div className="text-[#00FFFF] mt-1">ESTABLISHED</div>
          </div>
        </div>
      </header>

      {/* DASHBOARD GRID */}
      <main className="relative z-10 flex-1 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* AUDIO MODULE (Left) */}
        <section className="xl:col-span-4 flex flex-col gap-6">
          <div className="box-glitch bg-black p-4">
            <div className="text-[#00FFFF] font-mono text-xs md:text-sm mb-4 border-b-2 border-[#00FFFF] pb-2">&gt; AUDIO_DECODER_M0D</div>
            
            <div className="relative aspect-square border-4 border-white overflow-hidden mb-6 screen-tear">
              <img 
                src={current.cover} 
                alt="visual-data" 
                className={`w-full h-full object-cover grayscale contrast-200 ${playing ? 'animate-pulse' : ''}`}
                style={{ imageRendering: 'pixelated' }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 mix-blend-overlay bg-[#00FFFF] opacity-40 pointer-events-none" />
            </div>

            <div className="mb-6">
              <div className="text-[#FF00FF] text-[10px] md:text-xs font-mono mb-1">DATA_STREAM:</div>
              <h2 className="text-2xl md:text-4xl lg:text-3xl xl:text-4xl font-display text-white glitch-text truncate" data-text={current.title}>
                {current.title}
              </h2>
              <div className="text-[#00FFFF] font-mono text-sm mt-3">
                SRC: {current.artist}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 border-t-2 border-b-2 border-white py-3 mb-6 font-mono text-xs md:text-base">
               <button onClick={prev} className="col-span-1 border-2 border-[#00FFFF] hover:bg-[#00FFFF] hover:text-black transition-colors py-2 text-center">[&lt;&lt;]</button>
               <button onClick={() => setPlaying(!playing)} className="col-span-2 border-2 border-[#FF00FF] text-[#FF00FF] hover:bg-[#FF00FF] hover:text-black transition-colors py-2 text-center font-bold">
                 {playing ? 'EXEC HALT' : 'EXEC RUN'}
               </button>
               <button onClick={next} className="col-span-1 border-2 border-[#00FFFF] hover:bg-[#00FFFF] hover:text-black transition-colors py-2 text-center">[&gt;&gt;]</button>
            </div>
            
            <div className="h-6 border-2 border-white flex relative overflow-hidden">
              <div 
                 className="h-full bg-[#FF00FF] transition-all duration-[200ms]"
                 style={{ width: playing ? '90%' : '10%' }}
              />
              <div className="absolute inset-0 flex items-center px-2 text-[10px] font-mono mix-blend-difference text-white">
                BUFFERING_STATUS...
              </div>
            </div>
          </div>

          <div className="border-2 border-white p-4 font-mono text-[10px] md:text-sm text-white/60 bg-black/80">
            <div className="text-[#00FFFF] mb-3">++ SYSTEM LOG ++</div>
            <div>[OK] LOAD_MODULE: AUDIO_DECODER</div>
            <div>[OK] INITIALIZED: SNAKE_ROUTINE</div>
            <div className="text-[#FF00FF] animate-pulse mt-1">&gt; WAITING FOR INPUT_</div>
          </div>
        </section>

        {/* LOGIC ENGINE (Center) */}
        <section className="xl:col-span-8 flex flex-col items-center">
            <div className="w-full max-w-lg mb-6 p-4 border-2 border-[#00FFFF] bg-black/50">
              <div className="flex justify-between font-mono text-[#00FFFF] text-xs border-b border-[#00FFFF]/30 pb-2 mb-2">
                <span>&gt; INTERACTIVE_ROUTINE</span>
                <span className="text-[#FF00FF]">STATUS: ACTIVE</span>
              </div>
              <div className="font-mono text-[10px] md:text-xs text-white/70">
                OVERRIDE_ENABLED. USE [ARROW_KEYS] TO NAVIGATE THE SECTOR. AVOID SELF/BOUNDARIES.
              </div>
            </div>
            <SnakeGame onGameOver={(s) => console.log('CYCLES COMPLETED:', s)} />
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full mt-12 border-t-2 border-white border-dashed pt-4 flex flex-col md:flex-row justify-between font-mono text-[10px] text-white/50">
        <div className="mb-2 md:mb-0">CONNECTION: SECURE // ENCRYPTION: NONE // LOC: [LOCAL]</div>
        <div className="text-[#00FFFF]">SYSTEM_TIME: {new Date().toISOString()}</div>
      </footer>
    </div>
  );
}
