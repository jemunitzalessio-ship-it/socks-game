import React, { useState, useEffect, useCallback, useRef } from 'react';

const CELL_SIZE = 24;
const MAZE_WIDTH = 21;
const MAZE_HEIGHT = 17;

// Maze generation using recursive backtracking
const generateMaze = () => {
  const maze = Array(MAZE_HEIGHT).fill(null).map(() => Array(MAZE_WIDTH).fill(1));
  
  const carve = (x, y) => {
    maze[y][x] = 0;
    const directions = [
      [0, -2], [0, 2], [-2, 0], [2, 0]
    ].sort(() => Math.random() - 0.5);
    
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx > 0 && nx < MAZE_WIDTH - 1 && ny > 0 && ny < MAZE_HEIGHT - 1 && maze[ny][nx] === 1) {
        maze[y + dy/2][x + dx/2] = 0;
        carve(nx, ny);
      }
    }
  };
  
  carve(1, 1);
  
  // Add some extra passages for more open gameplay
  for (let i = 0; i < 30; i++) {
    const x = Math.floor(Math.random() * (MAZE_WIDTH - 2)) + 1;
    const y = Math.floor(Math.random() * (MAZE_HEIGHT - 2)) + 1;
    if (maze[y][x] === 1) {
      const neighbors = [
        [0, -1], [0, 1], [-1, 0], [1, 0]
      ].filter(([dx, dy]) => maze[y + dy]?.[x + dx] === 0);
      if (neighbors.length >= 2) {
        maze[y][x] = 0;
      }
    }
  }
  
  // Remove all dead ends - ensure every path cell has at least 2 exits
  let hasDeadEnds = true;
  while (hasDeadEnds) {
    hasDeadEnds = false;
    for (let y = 1; y < MAZE_HEIGHT - 1; y++) {
      for (let x = 1; x < MAZE_WIDTH - 1; x++) {
        if (maze[y][x] === 0) {
          // Count open neighbors
          const openNeighbors = [
            [0, -1], [0, 1], [-1, 0], [1, 0]
          ].filter(([dx, dy]) => maze[y + dy]?.[x + dx] === 0);
          
          // If only 1 exit (dead end), open a wall to create another exit
          if (openNeighbors.length === 1) {
            hasDeadEnds = true;
            // Find wall neighbors that could be opened
            const wallNeighbors = [
              [0, -1], [0, 1], [-1, 0], [1, 0]
            ].filter(([dx, dy]) => {
              const nx = x + dx;
              const ny = y + dy;
              return ny > 0 && ny < MAZE_HEIGHT - 1 && nx > 0 && nx < MAZE_WIDTH - 1 && maze[ny][nx] === 1;
            });
            
            if (wallNeighbors.length > 0) {
              // Pick a random wall to open
              const [dx, dy] = wallNeighbors[Math.floor(Math.random() * wallNeighbors.length)];
              maze[y + dy][x + dx] = 0;
            }
          }
        }
      }
    }
  }
  
  return maze;
};

const placeBones = (maze) => {
  const bones = [];
  for (let y = 0; y < MAZE_HEIGHT; y++) {
    for (let x = 0; x < MAZE_WIDTH; x++) {
      if (maze[y][x] === 0 && !(x === 1 && y === 1)) {
        if (Math.random() < 0.4) {
          bones.push({ x, y });
        }
      }
    }
  }
  return bones;
};

const Dog = ({ x, y, direction, inSafeZone }) => (
  <div
    style={{
      position: 'absolute',
      left: x * CELL_SIZE,
      top: y * CELL_SIZE,
      width: CELL_SIZE,
      height: CELL_SIZE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
      transition: 'left 0.1s, top 0.1s',
      zIndex: inSafeZone ? 10 : 6,
    }}
  >
    <svg viewBox="0 0 32 32" width={CELL_SIZE - 4} height={CELL_SIZE - 4}>
      {/* Body */}
      <ellipse cx="16" cy="18" rx="10" ry="8" fill="#8B4513" />
      {/* Head */}
      <circle cx="16" cy="10" r="7" fill="#8B4513" />
      {/* Snout */}
      <ellipse cx="20" cy="11" rx="4" ry="3" fill="#A0522D" />
      {/* Nose */}
      <circle cx="23" cy="10" r="1.5" fill="#2d1810" />
      {/* Eye */}
      <circle cx="17" cy="8" r="2" fill="white" />
      <circle cx="17.5" cy="8" r="1" fill="#2d1810" />
      {/* Ears */}
      <ellipse cx="10" cy="6" rx="3" ry="4" fill="#6B3510" />
      {/* Tail */}
      <path d="M6 16 Q2 12 4 8" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* White feet */}
      <ellipse cx="10" cy="25" rx="3" ry="2" fill="white" />
      <ellipse cx="22" cy="25" rx="3" ry="2" fill="white" />
      <ellipse cx="8" cy="20" rx="2" ry="1.5" fill="white" />
      <ellipse cx="24" cy="20" rx="2" ry="1.5" fill="white" />
    </svg>
  </div>
);

const DogCatcher = ({ x, y }) => (
  <div
    style={{
      position: 'absolute',
      left: x * CELL_SIZE,
      top: y * CELL_SIZE,
      width: CELL_SIZE,
      height: CELL_SIZE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'left 0.15s, top 0.15s',
      zIndex: 4,
    }}
  >
    <svg viewBox="0 0 32 32" width={CELL_SIZE - 2} height={CELL_SIZE - 2}>
      {/* Body */}
      <rect x="10" y="14" width="12" height="14" rx="2" fill="#4169E1" />
      {/* Head */}
      <circle cx="16" cy="9" r="6" fill="#FDBF6F" />
      {/* Hat */}
      <rect x="9" y="2" width="14" height="4" rx="1" fill="#2F4F4F" />
      <rect x="12" y="0" width="8" height="4" rx="1" fill="#2F4F4F" />
      {/* Eyes */}
      <circle cx="14" cy="8" r="1.5" fill="#2d1810" />
      <circle cx="18" cy="8" r="1.5" fill="#2d1810" />
      {/* Net */}
      <line x1="24" y1="8" x2="30" y2="4" stroke="#8B4513" strokeWidth="2" />
      <circle cx="30" cy="4" r="4" fill="none" stroke="#696969" strokeWidth="1" />
      <path d="M27 2 Q30 4 27 6" stroke="#696969" strokeWidth="0.5" fill="none" />
    </svg>
  </div>
);

const Bone = ({ x, y }) => (
  <div
    style={{
      position: 'absolute',
      left: x * CELL_SIZE + CELL_SIZE / 4,
      top: y * CELL_SIZE + CELL_SIZE / 4,
      width: CELL_SIZE / 2,
      height: CELL_SIZE / 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <svg viewBox="0 0 24 12" width={CELL_SIZE / 2} height={CELL_SIZE / 4}>
      <ellipse cx="3" cy="3" rx="3" ry="3" fill="#F5F5DC" />
      <ellipse cx="3" cy="9" rx="3" ry="3" fill="#F5F5DC" />
      <ellipse cx="21" cy="3" rx="3" ry="3" fill="#F5F5DC" />
      <ellipse cx="21" cy="9" rx="3" ry="3" fill="#F5F5DC" />
      <rect x="3" y="4" width="18" height="4" fill="#F5F5DC" />
    </svg>
  </div>
);

const Drumstick = ({ x, y }) => (
  <div
    style={{
      position: 'absolute',
      left: x * CELL_SIZE,
      top: y * CELL_SIZE,
      width: CELL_SIZE,
      height: CELL_SIZE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'left 0.2s, top 0.2s',
      animation: 'pulse 0.5s ease-in-out infinite',
    }}
  >
    <svg viewBox="0 0 32 32" width={CELL_SIZE} height={CELL_SIZE}>
      {/* Meat part */}
      <ellipse cx="12" cy="14" rx="10" ry="8" fill="#D2691E" />
      <ellipse cx="12" cy="14" rx="8" ry="6" fill="#F4A460" />
      {/* Highlight */}
      <ellipse cx="9" cy="11" rx="3" ry="2" fill="#FFDAB9" />
      {/* Bone handle */}
      <rect x="20" y="12" width="10" height="4" rx="2" fill="#F5F5DC" />
      <circle cx="29" cy="11" r="2" fill="#F5F5DC" />
      <circle cx="29" cy="17" r="2" fill="#F5F5DC" />
      {/* Sparkles */}
      <circle cx="5" cy="6" r="1.5" fill="#FFD700" />
      <circle cx="18" cy="5" r="1" fill="#FFD700" />
      <circle cx="3" cy="20" r="1" fill="#FFD700" />
    </svg>
  </div>
);

const Pizza = ({ x, y }) => (
  <div
    style={{
      position: 'absolute',
      left: x * CELL_SIZE,
      top: y * CELL_SIZE,
      width: CELL_SIZE,
      height: CELL_SIZE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'left 0.2s, top 0.2s',
      animation: 'pulse 0.5s ease-in-out infinite',
    }}
  >
    <svg viewBox="0 0 32 32" width={CELL_SIZE} height={CELL_SIZE}>
      {/* Pizza slice */}
      <path d="M16 4 L28 28 L4 28 Z" fill="#F4A460" />
      {/* Cheese */}
      <path d="M16 8 L25 26 L7 26 Z" fill="#FFD700" />
      {/* Pepperoni */}
      <circle cx="14" cy="18" r="3" fill="#DC143C" />
      <circle cx="18" cy="22" r="2.5" fill="#DC143C" />
      <circle cx="12" cy="24" r="2" fill="#DC143C" />
      {/* Crust edge */}
      <path d="M4 28 Q16 30 28 28" stroke="#D2691E" strokeWidth="3" fill="none" />
      {/* Sparkles */}
      <circle cx="6" cy="8" r="1.5" fill="#FFD700" />
      <circle cx="26" cy="10" r="1" fill="#FFD700" />
    </svg>
  </div>
);

const Cookie = ({ x, y }) => (
  <div
    style={{
      position: 'absolute',
      left: x * CELL_SIZE,
      top: y * CELL_SIZE,
      width: CELL_SIZE,
      height: CELL_SIZE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'left 0.2s, top 0.2s',
      animation: 'pulse 0.5s ease-in-out infinite',
    }}
  >
    <svg viewBox="0 0 32 32" width={CELL_SIZE} height={CELL_SIZE}>
      {/* Cookie base */}
      <circle cx="16" cy="16" r="12" fill="#D2691E" />
      <circle cx="16" cy="16" r="10" fill="#DEB887" />
      {/* Chocolate chips */}
      <circle cx="12" cy="12" r="2" fill="#4A3728" />
      <circle cx="19" cy="10" r="1.5" fill="#4A3728" />
      <circle cx="10" cy="18" r="1.5" fill="#4A3728" />
      <circle cx="18" cy="17" r="2" fill="#4A3728" />
      <circle cx="14" cy="21" r="1.5" fill="#4A3728" />
      <circle cx="21" cy="20" r="1.5" fill="#4A3728" />
      {/* Sparkles */}
      <circle cx="5" cy="6" r="1.5" fill="#FFD700" />
      <circle cx="27" cy="8" r="1" fill="#FFD700" />
      <circle cx="26" cy="24" r="1" fill="#FFD700" />
    </svg>
  </div>
);

const TennisBall = ({ x, y }) => (
  <div
    style={{
      position: 'absolute',
      left: x * CELL_SIZE,
      top: y * CELL_SIZE,
      width: CELL_SIZE,
      height: CELL_SIZE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'left 0.2s, top 0.2s',
      animation: 'pulse 0.5s ease-in-out infinite',
    }}
  >
    <svg viewBox="0 0 32 32" width={CELL_SIZE} height={CELL_SIZE}>
      {/* Ball base */}
      <circle cx="16" cy="16" r="12" fill="#ADFF2F" />
      <circle cx="16" cy="16" r="11" fill="#9ACD32" />
      {/* Tennis ball curved lines */}
      <path d="M8 8 Q4 16 8 24" stroke="white" strokeWidth="2" fill="none" />
      <path d="M24 8 Q28 16 24 24" stroke="white" strokeWidth="2" fill="none" />
      {/* Fuzzy texture dots */}
      <circle cx="12" cy="12" r="0.8" fill="#7CFC00" />
      <circle cx="20" cy="10" r="0.8" fill="#7CFC00" />
      <circle cx="14" cy="20" r="0.8" fill="#7CFC00" />
      <circle cx="18" cy="16" r="0.8" fill="#7CFC00" />
      {/* Sparkles */}
      <circle cx="5" cy="6" r="1.5" fill="#FFD700" />
      <circle cx="27" cy="8" r="1" fill="#FFD700" />
    </svg>
  </div>
);

const Cheese = ({ x, y }) => (
  <div
    style={{
      position: 'absolute',
      left: x * CELL_SIZE,
      top: y * CELL_SIZE,
      width: CELL_SIZE,
      height: CELL_SIZE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'left 0.2s, top 0.2s',
      animation: 'pulse 0.5s ease-in-out infinite',
    }}
  >
    <svg viewBox="0 0 32 32" width={CELL_SIZE} height={CELL_SIZE}>
      {/* Cheese wedge */}
      <path d="M4 24 L16 4 L28 24 Z" fill="#FFD700" />
      <path d="M4 24 L16 4 L28 24 Z" fill="#FFA500" fillOpacity="0.3" />
      {/* Cheese holes */}
      <circle cx="12" cy="18" r="3" fill="#DAA520" />
      <circle cx="20" cy="16" r="2" fill="#DAA520" />
      <circle cx="16" cy="22" r="2.5" fill="#DAA520" />
      <circle cx="14" cy="12" r="1.5" fill="#DAA520" />
      {/* Rind edge */}
      <path d="M4 24 L28 24" stroke="#FF8C00" strokeWidth="2" />
      {/* Sparkles */}
      <circle cx="6" cy="8" r="1.5" fill="#FFD700" />
      <circle cx="26" cy="10" r="1" fill="#FFD700" />
    </svg>
  </div>
);

const DogTreat = ({ x, y }) => (
  <div
    style={{
      position: 'absolute',
      left: x * CELL_SIZE,
      top: y * CELL_SIZE,
      width: CELL_SIZE,
      height: CELL_SIZE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'left 0.15s, top 0.15s',
      animation: 'pulse 0.3s ease-in-out infinite',
      zIndex: 8,
    }}
  >
    <svg viewBox="0 0 32 20" width={CELL_SIZE} height={CELL_SIZE * 0.625}>
      {/* Dog bone treat */}
      <ellipse cx="5" cy="5" rx="5" ry="5" fill="#8B4513" />
      <ellipse cx="5" cy="15" rx="5" ry="5" fill="#8B4513" />
      <ellipse cx="27" cy="5" rx="5" ry="5" fill="#8B4513" />
      <ellipse cx="27" cy="15" rx="5" ry="5" fill="#8B4513" />
      <rect x="5" y="6" width="22" height="8" fill="#8B4513" />
      {/* Highlight */}
      <ellipse cx="16" cy="8" rx="8" ry="2" fill="#A0522D" />
      {/* Sparkles - more prominent */}
      <circle cx="2" cy="2" r="2" fill="#FFD700" />
      <circle cx="30" cy="2" r="2" fill="#FFD700" />
      <circle cx="16" cy="0" r="1.5" fill="#FFD700" />
      <circle cx="2" cy="18" r="1.5" fill="#FFD700" />
      <circle cx="30" cy="18" r="1.5" fill="#FFD700" />
    </svg>
  </div>
);

const SpecialItem = ({ type, x, y }) => {
  switch (type) {
    case 'drumstick': return <Drumstick x={x} y={y} />;
    case 'pizza': return <Pizza x={x} y={y} />;
    case 'cookie': return <Cookie x={x} y={y} />;
    case 'tennis': return <TennisBall x={x} y={y} />;
    case 'cheese': return <Cheese x={x} y={y} />;
    default: return null;
  }
};

const Couch = ({ x, y, cellSize }) => {
  const width = 5 * cellSize;
  const height = 3 * cellSize;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: x * cellSize,
        top: y * cellSize,
        width: width,
        height: height,
        zIndex: 5,
      }}
    >
      {/* Couch base */}
      <div style={{
        position: 'absolute',
        left: 4,
        top: height * 0.3,
        width: width - 8,
        height: height * 0.65,
        backgroundColor: '#8B4513',
        borderRadius: 8,
        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.3)',
      }} />
      
      {/* Couch cushions */}
      <div style={{
        position: 'absolute',
        left: 8,
        top: height * 0.35,
        width: width - 16,
        height: height * 0.4,
        backgroundColor: '#A0522D',
        borderRadius: 6,
        display: 'flex',
        gap: 4,
        padding: 4,
      }}>
        <div style={{ flex: 1, backgroundColor: '#CD853F', borderRadius: 4 }} />
        <div style={{ flex: 1, backgroundColor: '#CD853F', borderRadius: 4 }} />
        <div style={{ flex: 1, backgroundColor: '#CD853F', borderRadius: 4 }} />
      </div>
      
      {/* Couch back */}
      <div style={{
        position: 'absolute',
        left: 4,
        top: 4,
        width: width - 8,
        height: height * 0.4,
        backgroundColor: '#8B4513',
        borderRadius: '8px 8px 0 0',
      }} />
      
      {/* Armrests */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: height * 0.2,
        width: 12,
        height: height * 0.6,
        backgroundColor: '#6B3510',
        borderRadius: '8px 0 0 8px',
      }} />
      <div style={{
        position: 'absolute',
        right: 0,
        top: height * 0.2,
        width: 12,
        height: height * 0.6,
        backgroundColor: '#6B3510',
        borderRadius: '0 8px 8px 0',
      }} />
      
      {/* Small sleeping white fluffy dog on upper edge - about cellSize */}
      <div style={{
        position: 'absolute',
        left: width * 0.5 - cellSize * 0.4,
        top: 2,
        width: cellSize,
        height: cellSize * 0.8,
      }}>
        <svg viewBox="0 0 32 26" width={cellSize} height={cellSize * 0.8}>
          {/* Body - curled up sleeping */}
          <ellipse cx="18" cy="16" rx="12" ry="8" fill="#FAFAFA" />
          {/* Head resting */}
          <circle cx="8" cy="14" r="7" fill="#FAFAFA" />
          {/* Fluffy ear */}
          <ellipse cx="4" cy="9" rx="4" ry="5" fill="#E8E8E8" />
          {/* Closed eye - sleeping */}
          <path d="M5 13 Q7 15 9 13" stroke="#333" strokeWidth="1.5" fill="none" />
          {/* Nose */}
          <circle cx="3" cy="16" r="2" fill="#333" />
          {/* Fluffy tail curled */}
          <ellipse cx="28" cy="12" rx="4" ry="6" fill="#FAFAFA" />
          {/* Little paws tucked */}
          <ellipse cx="12" cy="22" rx="3" ry="2" fill="#FAFAFA" />
          <ellipse cx="20" cy="22" rx="3" ry="2" fill="#FAFAFA" />
        </svg>
        
        {/* Animated ZZZ */}
        <div style={{
          position: 'absolute',
          left: cellSize * 0.3,
          top: -6,
          fontSize: 8,
          fontWeight: 'bold',
          color: '#6B7280',
          animation: 'zzz-float 2s ease-in-out infinite',
        }}>
          z
        </div>
        <div style={{
          position: 'absolute',
          left: cellSize * 0.5,
          top: -12,
          fontSize: 10,
          fontWeight: 'bold',
          color: '#9CA3AF',
          animation: 'zzz-float 2s ease-in-out infinite 0.3s',
        }}>
          z
        </div>
        <div style={{
          position: 'absolute',
          left: cellSize * 0.7,
          top: -18,
          fontSize: 12,
          fontWeight: 'bold',
          color: '#D1D5DB',
          animation: 'zzz-float 2s ease-in-out infinite 0.6s',
        }}>
          Z
        </div>
      </div>
      
      {/* "Place" label */}
      <div style={{
        position: 'absolute',
        bottom: -16,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#4A5568',
        color: '#E2E8F0',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'monospace',
      }}>
        Place
      </div>
    </div>
  );
};

const Firework = ({ x, y, color }) => {
  const particles = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45) * (Math.PI / 180);
    particles.push({
      key: i,
      dx: Math.cos(angle) * 35,
      dy: Math.sin(angle) * 35,
    });
  }
  
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
      }}
    >
      {particles.map(p => (
        <div
          key={p.key}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            backgroundColor: color,
            borderRadius: '50%',
            boxShadow: `0 0 6px ${color}`,
            animation: `firework-burst 0.8s ease-out forwards`,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
          }}
        />
      ))}
    </div>
  );
};

export default function SocksGame() {
  const [maze, setMaze] = useState(() => generateMaze());
  const [socks, setSocks] = useState({ x: 1, y: 1, direction: 'right' });
  const [bones, setBones] = useState(() => placeBones(generateMaze()));
  const [catchers, setCatchers] = useState([]);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('start'); // start, playing, paused, caught, levelComplete, won, lost
  const [heldDirection, setHeldDirection] = useState(null);
  const socksRef = useRef({ x: 1, y: 1 });
  const heldDirectionRef = useRef(null);
  const gameStateRef = useRef('start');
  const mazeRef = useRef(maze);
  const bonesRef = useRef(bones);
  const containerRef = useRef(null);
  const [fireworks, setFireworks] = useState([]);
  
  // Level system
  const [level, setLevel] = useState(1);
  const MAX_LEVEL = 3;
  
  // Final level dog treat challenge
  const [dogTreat, setDogTreat] = useState(null); // { x, y }
  const [hasDogTreat, setHasDogTreat] = useState(false); // Socks is carrying the treat
  const [showTreatMessage, setShowTreatMessage] = useState(false);
  
  // Secret level selector
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  
  // Special items system
  const [specialItem, setSpecialItem] = useState(null); // { type: 'drumstick'|'pizza'|'cookie'|'tennis'|'cheese', x, y }
  const [collectedSpecials, setCollectedSpecials] = useState([]);
  const [spawnedSpecials, setSpawnedSpecials] = useState([]); // Track which types have already spawned
  const specialItemRef = useRef(null);
  
  // Safe zone - couch position (will be set during maze init)
  const [couchPosition, setCouchPosition] = useState({ x: 10, y: 7 });
  const COUCH_WIDTH = 5;
  const COUCH_HEIGHT = 3;
  
  // Level-based settings
  const getLevelSettings = (lvl) => ({
    catcherSpeed: Math.round(450 * Math.pow(0.85, lvl - 1)), // 15% faster each level
    catcherCount: 2 + lvl, // 3, 4, 5 catchers
    wallColor: ['#1e3a5f', '#3d1e5f', '#5f1e3a'][lvl - 1], // Blue, Purple, Red
    floorColor: ['#0a1628', '#1a0a28', '#280a1a'][lvl - 1],
  });

  // Load Tailwind CSS dynamically for standalone usage
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  // Auto-focus container for keyboard input
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // Keep refs in sync
  useEffect(() => {
    socksRef.current = { x: socks.x, y: socks.y };
  }, [socks.x, socks.y]);

  useEffect(() => {
    heldDirectionRef.current = heldDirection;
  }, [heldDirection]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    mazeRef.current = maze;
  }, [maze]);

  useEffect(() => {
    bonesRef.current = bones;
  }, [bones]);

  // Keep special item ref in sync
  useEffect(() => {
    specialItemRef.current = specialItem;
  }, [specialItem]);

  // Initialize catchers based on level
  const createCatchers = useCallback((lvl) => {
    const settings = getLevelSettings(lvl);
    const catcherPositions = [
      { x: MAZE_WIDTH - 2, y: 1 },
      { x: 1, y: MAZE_HEIGHT - 2 },
      { x: MAZE_WIDTH - 2, y: MAZE_HEIGHT - 2 },
      { x: Math.floor(MAZE_WIDTH / 2), y: 1 },
      { x: Math.floor(MAZE_WIDTH / 2), y: MAZE_HEIGHT - 2 },
    ];
    return catcherPositions.slice(0, settings.catcherCount).map((pos, i) => ({
      ...pos,
      id: i + 1,
    }));
  }, []);

  const startLevel = useCallback((lvl) => {
    const newMaze = generateMaze();
    
    // Carve out couch area in the center
    const couchX = Math.floor(MAZE_WIDTH / 2) - 2;
    const couchY = Math.floor(MAZE_HEIGHT / 2) - 1;
    setCouchPosition({ x: couchX, y: couchY });
    
    // Clear the couch area (make it walkable)
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 5; dx++) {
        if (couchY + dy < MAZE_HEIGHT && couchX + dx < MAZE_WIDTH) {
          newMaze[couchY + dy][couchX + dx] = 0;
        }
      }
    }
    // Also ensure paths leading to the couch
    if (couchY > 0) newMaze[couchY - 1][couchX + 2] = 0;
    if (couchY + 3 < MAZE_HEIGHT) newMaze[couchY + 3][couchX + 2] = 0;
    if (couchX > 0) newMaze[couchY + 1][couchX - 1] = 0;
    if (couchX + 5 < MAZE_WIDTH) newMaze[couchY + 1][couchX + 5] = 0;
    
    setMaze(newMaze);
    setSocks({ x: 1, y: 1, direction: 'right' });
    
    // Place bones but avoid the couch area
    const newBones = placeBones(newMaze).filter(bone => {
      const inCouch = bone.x >= couchX && bone.x < couchX + 5 &&
                      bone.y >= couchY && bone.y < couchY + 3;
      return !inCouch;
    });
    setBones(newBones);
    
    setCatchers(createCatchers(lvl));
    setGameState('playing');
    setHeldDirection(null);
    setFireworks([]);
    setSpecialItem(null);
    setSpawnedSpecials([]);
    setDogTreat(null);
    setHasDogTreat(false);
    setShowTreatMessage(false);
  }, [createCatchers]);

  const initGame = useCallback(() => {
    setLevel(1);
    setLives(3);
    setScore(0);
    setCollectedSpecials([]);
    startLevel(1);
  }, [startLevel]);

  const nextLevel = useCallback(() => {
    const newLevel = level + 1;
    setLevel(newLevel);
    startLevel(newLevel);
  }, [level, startLevel]);

  // For testing - start directly at a specific level
  const startAtLevel = useCallback((lvl) => {
    setLevel(lvl);
    setLives(3);
    setScore(0);
    setCollectedSpecials([]);
    setShowLevelSelect(false);
    startLevel(lvl);
  }, [startLevel]);

  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused');
      setHeldDirection(null);
    } else if (gameState === 'paused') {
      setGameState('playing');
    }
  }, [gameState]);

  const resetGame = useCallback(() => {
    setGameState('start');
    setLevel(1);
    setLives(3);
    setScore(0);
    setCollectedSpecials([]);
    setHeldDirection(null);
    setFireworks([]);
    setSpecialItem(null);
    setSpawnedSpecials([]);
    setDogTreat(null);
    setHasDogTreat(false);
    setShowTreatMessage(false);
  }, []);

    // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        
        let dir = null;
        switch (e.key) {
          case 'ArrowUp': dir = { dx: 0, dy: -1 }; break;
          case 'ArrowDown': dir = { dx: 0, dy: 1 }; break;
          case 'ArrowLeft': dir = { dx: -1, dy: 0 }; break;
          case 'ArrowRight': dir = { dx: 1, dy: 0 }; break;
          default: break;
        }
        
        if (dir) {
          setHeldDirection(dir);
        }
      }
    };
    
    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      const keyToDir = {
        'ArrowUp': { dx: 0, dy: -1 },
        'ArrowDown': { dx: 0, dy: 1 },
        'ArrowLeft': { dx: -1, dy: 0 },
        'ArrowRight': { dx: 1, dy: 0 },
      };
      
      const releasedDir = keyToDir[e.key];
      if (releasedDir && heldDirectionRef.current &&
          releasedDir.dx === heldDirectionRef.current.dx && 
          releasedDir.dy === heldDirectionRef.current.dy) {
        setHeldDirection(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Close level selector when clicking outside or pressing Escape
  useEffect(() => {
    if (!showLevelSelect) return;
    
    const handleClickOutside = () => setShowLevelSelect(false);
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowLevelSelect(false);
    };
    
    // Delay to prevent immediate close from the click that opened it
    const timer = setTimeout(() => {
      window.addEventListener('click', handleClickOutside);
      window.addEventListener('keydown', handleEscape);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showLevelSelect]);

  // Handle pause key (Escape or P)
  useEffect(() => {
    const handlePauseKey = (e) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing' || gameState === 'paused') {
          togglePause();
        }
      }
    };
    
    window.addEventListener('keydown', handlePauseKey);
    return () => window.removeEventListener('keydown', handlePauseKey);
  }, [gameState, togglePause]);

  // Continuous movement game loop - runs constantly, checks refs
  useEffect(() => {
    let lastMoveTime = 0;
    const moveInterval = 80; // ms between moves
    
    const gameLoop = (timestamp) => {
      if (gameStateRef.current === 'playing' && heldDirectionRef.current) {
        if (timestamp - lastMoveTime >= moveInterval) {
          const dir = heldDirectionRef.current;
          const currentSocks = socksRef.current;
          const currentMaze = mazeRef.current;
          
          const newX = currentSocks.x + dir.dx;
          const newY = currentSocks.y + dir.dy;
          
          // Check if can move
          if (newX >= 0 && newX < MAZE_WIDTH && newY >= 0 && newY < MAZE_HEIGHT && currentMaze[newY][newX] === 0) {
            const direction = dir.dx > 0 ? 'right' : dir.dx < 0 ? 'left' : undefined;
            
            setSocks(prev => {
              const nextX = prev.x + dir.dx;
              const nextY = prev.y + dir.dy;
              if (nextX >= 0 && nextX < MAZE_WIDTH && nextY >= 0 && nextY < MAZE_HEIGHT && currentMaze[nextY][nextX] === 0) {
                return { x: nextX, y: nextY, direction: direction || prev.direction };
              }
              return prev;
            });
          }
          
          lastMoveTime = timestamp;
        }
      }
      
      requestAnimationFrame(gameLoop);
    };
    
    const frameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Check for bone collection separately
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const boneIndex = bones.findIndex(b => b.x === socks.x && b.y === socks.y);
    if (boneIndex !== -1) {
      const newBones = [...bones];
      newBones.splice(boneIndex, 1);
      setBones(newBones);
      setScore(s => s + 10);
      
      if (newBones.length === 0) {
        setHeldDirection(null);
        
        if (level < MAX_LEVEL) {
          // Levels 1 and 2: Show level complete
          setGameState('levelComplete');
          const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#FF69B4', '#00FF00', '#FF4500', '#9B59B6', '#3498DB'];
          const winFireworks = [];
          for (let i = 0; i < 20; i++) {
            winFireworks.push({
              id: Date.now() + i,
              x: Math.random() * (MAZE_WIDTH * CELL_SIZE - 40) + 20,
              y: Math.random() * (MAZE_HEIGHT * CELL_SIZE - 40) + 20,
              color: colors[Math.floor(Math.random() * colors.length)],
            });
          }
          setFireworks(winFireworks);
        } else {
          // Level 3: Spawn dog treat for final challenge
          // Find valid position for dog treat
          const validPositions = [];
          for (let y = 1; y < MAZE_HEIGHT - 1; y++) {
            for (let x = 1; x < MAZE_WIDTH - 1; x++) {
              if (maze[y][x] === 0) {
                const distFromSocks = Math.abs(x - socks.x) + Math.abs(y - socks.y);
                const onCouch = x >= couchPosition.x && x < couchPosition.x + COUCH_WIDTH &&
                               y >= couchPosition.y && y < couchPosition.y + COUCH_HEIGHT;
                if (distFromSocks > 5 && !onCouch) {
                  validPositions.push({ x, y });
                }
              }
            }
          }
          if (validPositions.length > 0) {
            const pos = validPositions[Math.floor(Math.random() * validPositions.length)];
            setDogTreat({ x: pos.x, y: pos.y });
            setShowTreatMessage(true);
            setTimeout(() => setShowTreatMessage(false), 4000);
          }
        }
      }
    }
  }, [socks.x, socks.y, bones, gameState, level, maze, couchPosition]);

  // Check for dog treat pickup (Level 3)
  useEffect(() => {
    if (gameState !== 'playing' || !dogTreat || hasDogTreat) return;
    
    if (socks.x === dogTreat.x && socks.y === dogTreat.y) {
      setHasDogTreat(true);
      setDogTreat(null);
      setScore(s => s + 500);
    }
  }, [socks.x, socks.y, dogTreat, hasDogTreat, gameState]);

  // Check for treat delivery to couch (Level 3 win condition)
  useEffect(() => {
    if (gameState !== 'playing' || !hasDogTreat) return;
    
    const onCouch = socks.x >= couchPosition.x && socks.x < couchPosition.x + COUCH_WIDTH &&
                   socks.y >= couchPosition.y && socks.y < couchPosition.y + COUCH_HEIGHT;
    
    if (onCouch) {
      setHeldDirection(null);
      setGameState('won');
      setHasDogTreat(false);
      // Spawn lots of fireworks for final win!
      const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#FF69B4', '#00FF00', '#FF4500', '#9B59B6', '#3498DB'];
      const winFireworks = [];
      for (let i = 0; i < 30; i++) {
        winFireworks.push({
          id: Date.now() + i,
          x: Math.random() * (MAZE_WIDTH * CELL_SIZE - 40) + 20,
          y: Math.random() * (MAZE_HEIGHT * CELL_SIZE - 40) + 20,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      setFireworks(winFireworks);
    }
  }, [socks.x, socks.y, hasDogTreat, gameState, couchPosition]);

  // Move catchers independently on their own timer (speed based on level)
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const settings = getLevelSettings(level);
    
    const interval = setInterval(() => {
      setCatchers(prevCatchers => {
        return prevCatchers.map(catcher => {
          const targetX = socksRef.current.x;
          const targetY = socksRef.current.y;
          
          // Possible moves
          const moves = [];
          if (catcher.x + 1 >= 0 && catcher.x + 1 < MAZE_WIDTH && maze[catcher.y]?.[catcher.x + 1] === 0) {
            moves.push({ x: catcher.x + 1, y: catcher.y });
          }
          if (catcher.x - 1 >= 0 && catcher.x - 1 < MAZE_WIDTH && maze[catcher.y]?.[catcher.x - 1] === 0) {
            moves.push({ x: catcher.x - 1, y: catcher.y });
          }
          if (catcher.y + 1 >= 0 && catcher.y + 1 < MAZE_HEIGHT && maze[catcher.y + 1]?.[catcher.x] === 0) {
            moves.push({ x: catcher.x, y: catcher.y + 1 });
          }
          if (catcher.y - 1 >= 0 && catcher.y - 1 < MAZE_HEIGHT && maze[catcher.y - 1]?.[catcher.x] === 0) {
            moves.push({ x: catcher.x, y: catcher.y - 1 });
          }
          
          if (moves.length === 0) return catcher;
          
          // 40% chance to move toward Socks, 60% random
          if (Math.random() < 0.4) {
            moves.sort((a, b) => {
              const distA = Math.abs(a.x - targetX) + Math.abs(a.y - targetY);
              const distB = Math.abs(b.x - targetX) + Math.abs(b.y - targetY);
              return distA - distB;
            });
            return { ...catcher, x: moves[0].x, y: moves[0].y };
          } else {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            return { ...catcher, x: randomMove.x, y: randomMove.y };
          }
        });
      });
    }, settings.catcherSpeed);
    
    return () => clearInterval(interval);
  }, [gameState, maze, level]);

  // Check collision with catchers (but not in safe zone)
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    // Check if Socks is in the safe zone (couch area)
    const inSafeZone = socks.x >= couchPosition.x && socks.x < couchPosition.x + COUCH_WIDTH &&
                       socks.y >= couchPosition.y && socks.y < couchPosition.y + COUCH_HEIGHT;
    
    if (inSafeZone) return; // Socks is safe on the couch!
    
    const caught = catchers.some(c => c.x === socks.x && c.y === socks.y);
    if (caught) {
      setHeldDirection(null); // Stop movement
      const newLives = lives - 1;
      setLives(newLives);
      
      if (newLives <= 0) {
        setGameState('lost');
      } else {
        setGameState('caught');
      }
    }
  }, [socks, catchers, lives, gameState, couchPosition]);

  const resumeAfterCatch = useCallback(() => {
    setSocks({ x: 1, y: 1, direction: 'right' });
    setCatchers(createCatchers(level));
    setGameState('playing');
  }, [level, createCatchers]);

  // Spawn fireworks
  const spawnFireworks = useCallback(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#FF69B4', '#00FF00', '#FF4500'];
    const newFireworks = [];
    for (let i = 0; i < 12; i++) {
      newFireworks.push({
        id: Date.now() + i,
        x: Math.random() * (MAZE_WIDTH * CELL_SIZE - 40) + 20,
        y: Math.random() * (MAZE_HEIGHT * CELL_SIZE - 40) + 20,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setFireworks(newFireworks);
    setTimeout(() => setFireworks([]), 1000);
  }, []);

  // Special item spawn timer (one at a time, 10s spacing, each type only once per round)
  useEffect(() => {
    if (gameState !== 'playing' || specialItem) return;
    
    // Get available types (not yet spawned this round)
    const allTypes = ['drumstick', 'pizza', 'cookie', 'tennis', 'cheese'];
    const availableTypes = allTypes.filter(t => !spawnedSpecials.includes(t));
    
    // If all types have been spawned, don't spawn more
    if (availableTypes.length === 0) return;
    
    const spawnTimer = setTimeout(() => {
      // Find a valid spawn location away from Socks and not on couch
      const validPositions = [];
      for (let y = 1; y < MAZE_HEIGHT - 1; y++) {
        for (let x = 1; x < MAZE_WIDTH - 1; x++) {
          if (maze[y][x] === 0) {
            const distFromSocks = Math.abs(x - socksRef.current.x) + Math.abs(y - socksRef.current.y);
            const onCouch = x >= couchPosition.x && x < couchPosition.x + COUCH_WIDTH &&
                           y >= couchPosition.y && y < couchPosition.y + COUCH_HEIGHT;
            if (distFromSocks > 5 && !onCouch) {
              validPositions.push({ x, y });
            }
          }
        }
      }
      if (validPositions.length > 0 && availableTypes.length > 0) {
        const pos = validPositions[Math.floor(Math.random() * validPositions.length)];
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        setSpecialItem({ type, x: pos.x, y: pos.y });
        setSpawnedSpecials(prev => [...prev, type]);
      }
    }, 10000);
    
    return () => clearTimeout(spawnTimer);
  }, [gameState, maze, specialItem, couchPosition, spawnedSpecials]);

  // Special item despawn timer (disappears after 20 seconds)
  useEffect(() => {
    if (!specialItem || gameState !== 'playing') return;
    
    const despawnTimer = setTimeout(() => {
      setSpecialItem(null);
    }, 20000);
    
    return () => clearTimeout(despawnTimer);
  }, [specialItem, gameState]);

  // Continuous fireworks during win state
  useEffect(() => {
    if (gameState !== 'won') return;
    
    const interval = setInterval(() => {
      const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#FF69B4', '#00FF00', '#FF4500', '#9B59B6', '#3498DB'];
      const newFireworks = [];
      for (let i = 0; i < 8; i++) {
        newFireworks.push({
          id: Date.now() + Math.random(),
          x: Math.random() * (MAZE_WIDTH * CELL_SIZE - 40) + 20,
          y: Math.random() * (MAZE_HEIGHT * CELL_SIZE - 40) + 20,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      setFireworks(newFireworks);
    }, 600);
    
    return () => clearInterval(interval);
  }, [gameState]);

  // Special item movement (half speed of catchers = 900ms)
  useEffect(() => {
    if (!specialItem || gameState !== 'playing') return;
    
    const interval = setInterval(() => {
      setSpecialItem(prev => {
        if (!prev) return null;
        
        // Random movement
        const moves = [];
        if (prev.x + 1 < MAZE_WIDTH && maze[prev.y]?.[prev.x + 1] === 0) {
          moves.push({ x: prev.x + 1, y: prev.y });
        }
        if (prev.x - 1 >= 0 && maze[prev.y]?.[prev.x - 1] === 0) {
          moves.push({ x: prev.x - 1, y: prev.y });
        }
        if (prev.y + 1 < MAZE_HEIGHT && maze[prev.y + 1]?.[prev.x] === 0) {
          moves.push({ x: prev.x, y: prev.y + 1 });
        }
        if (prev.y - 1 >= 0 && maze[prev.y - 1]?.[prev.x] === 0) {
          moves.push({ x: prev.x, y: prev.y - 1 });
        }
        
        if (moves.length === 0) return prev;
        const newPos = moves[Math.floor(Math.random() * moves.length)];
        return { ...prev, x: newPos.x, y: newPos.y };
      });
    }, 900);
    
    return () => clearInterval(interval);
  }, [specialItem, gameState, maze]);

  // Check collision with special item
  useEffect(() => {
    if (gameState !== 'playing' || !specialItem) return;
    
    if (socks.x === specialItem.x && socks.y === specialItem.y) {
      setScore(s => s + 1000);
      setCollectedSpecials(prev => [...prev, specialItem.type]);
      setSpecialItem(null);
      spawnFireworks();
    }
  }, [socks, specialItem, gameState, spawnFireworks]);

  // Dog treat movement (30% faster than regular special items = 630ms)
  useEffect(() => {
    if (!dogTreat || gameState !== 'playing') return;
    
    const interval = setInterval(() => {
      setDogTreat(prev => {
        if (!prev) return null;
        
        // Random movement
        const moves = [];
        if (prev.x + 1 < MAZE_WIDTH && maze[prev.y]?.[prev.x + 1] === 0) {
          moves.push({ x: prev.x + 1, y: prev.y });
        }
        if (prev.x - 1 >= 0 && maze[prev.y]?.[prev.x - 1] === 0) {
          moves.push({ x: prev.x - 1, y: prev.y });
        }
        if (prev.y + 1 < MAZE_HEIGHT && maze[prev.y + 1]?.[prev.x] === 0) {
          moves.push({ x: prev.x, y: prev.y + 1 });
        }
        if (prev.y - 1 >= 0 && maze[prev.y - 1]?.[prev.x] === 0) {
          moves.push({ x: prev.x, y: prev.y - 1 });
        }
        
        if (moves.length === 0) return prev;
        const newPos = moves[Math.floor(Math.random() * moves.length)];
        return { x: newPos.x, y: newPos.y };
      });
    }, 630);
    
    return () => clearInterval(interval);
  }, [dogTreat, gameState, maze]);

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #166534, #14532d)',
        padding: '16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
        width: '100%',
        position: 'relative',
        outline: 'none',
      }}
      onKeyDown={(e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
        }
      }}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          width: 100%;
          height: 100%;
        }
        #root {
          width: 100%;
          height: 100%;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes firework-burst {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--dx), var(--dy)) scale(0.2);
          }
        }
        @keyframes van-drive {
          0% { transform: translateX(-150px); }
          100% { transform: translateX(150px); }
        }
        @keyframes van-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes socks-dance {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          25% { transform: translateY(-8px) rotate(5deg); }
          50% { transform: translateY(0) rotate(5deg); }
          75% { transform: translateY(-8px) rotate(-5deg); }
        }
        @keyframes bone-throw {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          50% { transform: translateY(-30px) rotate(180deg); opacity: 1; }
          100% { transform: translateY(0) rotate(360deg); opacity: 1; }
        }
        @keyframes bone-throw-delayed {
          0%, 15% { transform: translateY(0) rotate(0deg); opacity: 1; }
          50% { transform: translateY(-25px) rotate(-180deg); opacity: 1; }
          85%, 100% { transform: translateY(0) rotate(-360deg); opacity: 1; }
        }
        @keyframes win-firework {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.5); }
        }
        @keyframes zzz-float {
          0%, 100% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
      <h1 style={{
        fontSize: '1.875rem',
        fontWeight: 'bold',
        color: '#fbbf24',
        marginBottom: '8px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        position: 'relative',
        zIndex: 100,
      }}>
        🐕 Socks' Bone Hunt{' '}
        <span 
          style={{ cursor: 'pointer', display: 'inline-block', transition: 'transform 0.2s' }}
          onClick={() => setShowLevelSelect(!showLevelSelect)}
          title="Secret level select"
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          🦴
        </span>
        {/* Secret level selector dropdown */}
        {showLevelSelect && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            backgroundColor: '#1f2937',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            padding: '8px',
            zIndex: 100,
          }}>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Skip to level:</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3].map(lvl => (
                <button
                  key={lvl}
                  onClick={(e) => {
                    e.stopPropagation();
                    startAtLevel(lvl);
                    setShowLevelSelect(false);
                  }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: lvl === 1 ? '#2563eb' : lvl === 2 ? '#7c3aed' : '#dc2626',
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        )}
      </h1>
      
      <div style={{
        display: 'flex',
        gap: '24px',
        marginBottom: '12px',
        color: 'white',
        fontSize: '18px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Level:</span>
          <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{level}/{MAX_LEVEL}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Lives:</span>
          {[...Array(lives)].map((_, i) => (
            <span key={i}>❤️</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Specials:</span>
          {collectedSpecials.length === 0 ? (
            <span style={{ color: '#6b7280' }}>-</span>
          ) : (
            collectedSpecials.map((type, i) => (
              <span key={i}>
                {type === 'drumstick' && '🍗'}
                {type === 'pizza' && '🍕'}
                {type === 'cookie' && '🍪'}
                {type === 'tennis' && '🎾'}
                {type === 'cheese' && '🧀'}
              </span>
            ))
          )}
        </div>
        <div>Score: <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{score}</span></div>
        <div>Bones left: <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{bones.length}</span></div>
        {hasDogTreat && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#d97706', padding: '0 8px', borderRadius: '4px' }}>
            <span>🦴 Carrying treat!</span>
          </div>
        )}
        
        {/* Pause and Reset buttons - only show during gameplay */}
        {(gameState === 'playing' || gameState === 'paused') && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={togglePause}
              style={{
                padding: '4px 12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {gameState === 'paused' ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button
              onClick={resetGame}
              style={{
                padding: '4px 12px',
                backgroundColor: '#ef4444',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              🔄 Reset
            </button>
          </div>
        )}
      </div>

      {/* Paused overlay */}
      {gameState === 'paused' && (
        <div style={{
          position: 'absolute',
          zIndex: 20,
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#60a5fa', marginBottom: '16px' }}>⏸ Paused</h2>
          <p style={{ color: '#d1d5db', marginBottom: '16px' }}>Press ESC or P to resume</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              onClick={togglePause}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              ▶ Resume
            </button>
            <button
              onClick={resetGame}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ef4444',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              🔄 Reset Game
            </button>
          </div>
        </div>
      )}

      {gameState === 'start' && (
        <div style={{
          position: 'absolute',
          zIndex: 20,
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '16px' }}>🐕 Welcome to Socks' Bone Hunt! 🦴</h2>
          <p style={{ color: 'white', marginBottom: '8px' }}>Help Socks collect all the bones across 3 levels!</p>
          <p style={{ color: '#d1d5db', marginBottom: '8px' }}>Use arrow keys to move. Avoid the dog catchers!</p>
          <p style={{ color: '#d1d5db', marginBottom: '8px' }}>🛋️ Hide on the couch (Place) to stay safe!</p>
          <p style={{ color: '#d1d5db', marginBottom: '8px' }}>🍗🍕🍪🎾🧀 Catch special treats for 1000 points!</p>
          <p style={{ color: '#fde047', marginBottom: '8px', fontSize: '14px' }}>⚠️ Each level gets harder with more catchers!</p>
          <p style={{ color: '#f9a8d4', marginBottom: '16px', fontSize: '14px' }}>💝 Final challenge: Bring Daisy a treat!</p>
          <p style={{ color: '#9ca3af', marginBottom: '16px', fontSize: '12px' }}>Press ESC or P to pause</p>
          <button
            onClick={initGame}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f59e0b',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === 'levelComplete' && (
        <div className="absolute z-20 bg-black/90 rounded-xl p-8 text-center border-4 border-green-500 overflow-hidden" style={{ imageRendering: 'pixelated', minWidth: '320px' }}>
          {/* Fireworks background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${10 + (i * 17) % 80}%`,
                  top: `${10 + (i * 23) % 60}%`,
                  width: 8,
                  height: 8,
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FF69B4', '#00FF00', '#FF4500'][i % 6],
                  animation: `win-firework 1.5s ease-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
          
          <h2 className="text-2xl font-bold text-green-400 mb-4 relative z-10" style={{ fontFamily: 'monospace' }}>🎉 Level {level} Complete! 🎉</h2>
          
          {/* Dancing Socks */}
          <div className="relative mx-auto mb-4" style={{ width: 80, height: 80 }}>
            <svg viewBox="0 0 32 40" width="64" height="80" className="mx-auto" style={{ animation: 'socks-dance 0.5s ease-in-out infinite' }}>
              <rect x="4" y="0" width="4" height="6" fill="#6B3510" />
              <rect x="24" y="0" width="4" height="6" fill="#6B3510" />
              <rect x="6" y="2" width="20" height="4" fill="#8B4513" />
              <rect x="4" y="6" width="24" height="12" fill="#8B4513" />
              <rect x="8" y="8" width="4" height="2" fill="#2d1810" />
              <rect x="20" y="8" width="4" height="2" fill="#2d1810" />
              <rect x="12" y="12" width="8" height="4" fill="#D2691E" />
              <rect x="14" y="12" width="4" height="2" fill="#2d1810" />
              <rect x="8" y="20" width="16" height="12" fill="#8B4513" />
              <rect x="2" y="18" width="4" height="2" fill="#8B4513" />
              <rect x="0" y="16" width="4" height="4" fill="#8B4513" />
              <rect x="26" y="18" width="4" height="2" fill="#8B4513" />
              <rect x="28" y="16" width="4" height="4" fill="#8B4513" />
              <rect x="0" y="14" width="4" height="4" fill="white" />
              <rect x="28" y="14" width="4" height="4" fill="white" />
              <rect x="10" y="32" width="4" height="6" fill="#8B4513" />
              <rect x="18" y="32" width="4" height="6" fill="#8B4513" />
              <rect x="10" y="36" width="4" height="4" fill="white" />
              <rect x="18" y="36" width="4" height="4" fill="white" />
            </svg>
          </div>
          
          <p className="text-white mb-2 relative z-10" style={{ fontFamily: 'monospace' }}>Get ready for Level {level + 1}!</p>
          <p className="text-gray-300 mb-2 relative z-10 text-sm">More dog catchers and they're faster!</p>
          <p className="text-amber-400 mb-4 text-xl font-bold relative z-10">Score: {score}</p>
          <button
            onClick={nextLevel}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors relative z-10"
            style={{ fontFamily: 'monospace' }}
          >
            Next Level →
          </button>
        </div>
      )}

      {gameState === 'won' && (
        <div className="absolute z-20 bg-black/90 rounded-xl p-8 text-center border-4 border-yellow-500 overflow-hidden" style={{ imageRendering: 'pixelated', minWidth: '380px' }}>
          {/* Fireworks background - more of them for final win */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${5 + (i * 13) % 90}%`,
                  top: `${5 + (i * 17) % 70}%`,
                  width: 10,
                  height: 10,
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FF69B4', '#00FF00', '#FF4500', '#9B59B6', '#3498DB'][i % 8],
                  animation: `win-firework 1.2s ease-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          
          <h2 className="text-3xl font-bold text-yellow-400 mb-4 relative z-10" style={{ fontFamily: 'monospace' }}>🏆 YOU WIN! 🏆</h2>
          <p className="text-white mb-4 relative z-10" style={{ fontFamily: 'monospace' }}>Socks brought Daisy the treat!</p>
          
          {/* Both dogs dancing together with flying items */}
          <div className="relative mx-auto mb-4" style={{ width: 200, height: 120 }}>
            {/* Flying bones */}
            <svg viewBox="0 0 24 12" width="20" height="10" className="absolute" style={{ left: 5, top: 0, animation: 'bone-throw 0.7s ease-in-out infinite' }}>
              <ellipse cx="3" cy="3" rx="3" ry="3" fill="#F5F5DC" />
              <ellipse cx="3" cy="9" rx="3" ry="3" fill="#F5F5DC" />
              <ellipse cx="21" cy="3" rx="3" ry="3" fill="#F5F5DC" />
              <ellipse cx="21" cy="9" rx="3" ry="3" fill="#F5F5DC" />
              <rect x="3" y="4" width="18" height="4" fill="#F5F5DC" />
            </svg>
            <svg viewBox="0 0 24 12" width="20" height="10" className="absolute" style={{ right: 5, top: 5, animation: 'bone-throw-delayed 0.9s ease-in-out infinite' }}>
              <ellipse cx="3" cy="3" rx="3" ry="3" fill="#F5F5DC" />
              <ellipse cx="3" cy="9" rx="3" ry="3" fill="#F5F5DC" />
              <ellipse cx="21" cy="3" rx="3" ry="3" fill="#F5F5DC" />
              <ellipse cx="21" cy="9" rx="3" ry="3" fill="#F5F5DC" />
              <rect x="3" y="4" width="18" height="4" fill="#F5F5DC" />
            </svg>
            
            {/* Flying special items */}
            <div className="absolute text-lg" style={{ left: 30, top: 10, animation: 'bone-throw 1s ease-in-out infinite 0.2s' }}>🍗</div>
            <div className="absolute text-lg" style={{ right: 30, top: 15, animation: 'bone-throw-delayed 1.1s ease-in-out infinite 0.3s' }}>🍕</div>
            <div className="absolute text-lg" style={{ left: 80, top: 5, animation: 'bone-throw 0.8s ease-in-out infinite 0.5s' }}>🎾</div>
            <div className="absolute text-lg" style={{ right: 80, top: 8, animation: 'bone-throw-delayed 0.9s ease-in-out infinite 0.1s' }}>🧀</div>
            <div className="absolute text-lg" style={{ left: 95, top: 0, animation: 'bone-throw 1.2s ease-in-out infinite 0.4s' }}>🍪</div>
            
            {/* Dancing Socks (brown dog) */}
            <svg viewBox="0 0 32 40" width="56" height="70" className="absolute" style={{ left: 30, bottom: 0, animation: 'socks-dance 0.4s ease-in-out infinite' }}>
              <rect x="4" y="0" width="4" height="6" fill="#6B3510" />
              <rect x="24" y="0" width="4" height="6" fill="#6B3510" />
              <rect x="6" y="2" width="20" height="4" fill="#8B4513" />
              <rect x="4" y="6" width="24" height="12" fill="#8B4513" />
              <rect x="8" y="8" width="4" height="2" fill="#2d1810" />
              <rect x="8" y="10" width="2" height="2" fill="#2d1810" />
              <rect x="12" y="10" width="2" height="2" fill="#2d1810" />
              <rect x="20" y="8" width="4" height="2" fill="#2d1810" />
              <rect x="20" y="10" width="2" height="2" fill="#2d1810" />
              <rect x="24" y="10" width="2" height="2" fill="#2d1810" />
              <rect x="12" y="12" width="8" height="4" fill="#D2691E" />
              <rect x="14" y="12" width="4" height="2" fill="#2d1810" />
              <rect x="10" y="16" width="2" height="2" fill="#2d1810" />
              <rect x="12" y="18" width="8" height="2" fill="#2d1810" />
              <rect x="20" y="16" width="2" height="2" fill="#2d1810" />
              <rect x="8" y="20" width="16" height="12" fill="#8B4513" />
              <rect x="2" y="18" width="4" height="2" fill="#8B4513" />
              <rect x="0" y="16" width="4" height="4" fill="#8B4513" />
              <rect x="26" y="18" width="4" height="2" fill="#8B4513" />
              <rect x="28" y="16" width="4" height="4" fill="#8B4513" />
              <rect x="0" y="14" width="4" height="4" fill="white" />
              <rect x="28" y="14" width="4" height="4" fill="white" />
              <rect x="10" y="32" width="4" height="6" fill="#8B4513" />
              <rect x="18" y="32" width="4" height="6" fill="#8B4513" />
              <rect x="10" y="36" width="4" height="4" fill="white" />
              <rect x="18" y="36" width="4" height="4" fill="white" />
            </svg>
            
            {/* Dancing Daisy (white dog) */}
            <svg viewBox="0 0 32 40" width="56" height="70" className="absolute" style={{ right: 30, bottom: 0, animation: 'socks-dance 0.4s ease-in-out infinite 0.2s' }}>
              <rect x="4" y="0" width="4" height="6" fill="#E8E8E8" />
              <rect x="24" y="0" width="4" height="6" fill="#E8E8E8" />
              <rect x="6" y="2" width="20" height="4" fill="#FAFAFA" />
              <rect x="4" y="6" width="24" height="12" fill="#FAFAFA" />
              <rect x="8" y="8" width="4" height="2" fill="#333" />
              <rect x="8" y="10" width="2" height="2" fill="#333" />
              <rect x="12" y="10" width="2" height="2" fill="#333" />
              <rect x="20" y="8" width="4" height="2" fill="#333" />
              <rect x="20" y="10" width="2" height="2" fill="#333" />
              <rect x="24" y="10" width="2" height="2" fill="#333" />
              <rect x="12" y="12" width="8" height="4" fill="#FFE4E1" />
              <rect x="14" y="12" width="4" height="2" fill="#333" />
              <rect x="10" y="16" width="2" height="2" fill="#333" />
              <rect x="12" y="18" width="8" height="2" fill="#333" />
              <rect x="20" y="16" width="2" height="2" fill="#333" />
              <rect x="8" y="20" width="16" height="12" fill="#FAFAFA" />
              <rect x="2" y="18" width="4" height="2" fill="#FAFAFA" />
              <rect x="0" y="16" width="4" height="4" fill="#FAFAFA" />
              <rect x="26" y="18" width="4" height="2" fill="#FAFAFA" />
              <rect x="28" y="16" width="4" height="4" fill="#FAFAFA" />
              <rect x="0" y="14" width="4" height="4" fill="#FFE4E1" />
              <rect x="28" y="14" width="4" height="4" fill="#FFE4E1" />
              <rect x="10" y="32" width="4" height="6" fill="#FAFAFA" />
              <rect x="18" y="32" width="4" height="6" fill="#FAFAFA" />
              <rect x="10" y="36" width="4" height="4" fill="#FFE4E1" />
              <rect x="18" y="36" width="4" height="4" fill="#FFE4E1" />
            </svg>
            
            {/* Heart between them */}
            <div className="absolute text-2xl" style={{ left: '50%', top: 25, transform: 'translateX(-50%)', animation: 'pulse 0.5s ease-in-out infinite' }}>❤️</div>
          </div>
          
          <p className="text-amber-400 mb-4 text-2xl font-bold relative z-10">Final Score: {score}</p>
          <button
            onClick={initGame}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors relative z-10"
            style={{ fontFamily: 'monospace' }}
          >
            🎮 Play Again
          </button>
        </div>
      )}

      {gameState === 'lost' && (
        <div className="absolute z-20 bg-black/90 rounded-xl p-8 text-center border-4 border-red-600 overflow-hidden" style={{ imageRendering: 'pixelated', minWidth: '320px' }}>
          <h2 className="text-2xl font-bold text-red-400 mb-4" style={{ fontFamily: 'monospace' }}>Game Over!</h2>
          
          {/* Van animation scene */}
          <div className="relative mx-auto mb-4 overflow-hidden" style={{ width: 280, height: 90, backgroundColor: '#2a4a3a', borderRadius: 8 }}>
            {/* Sky/background */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #1a3a2a 0%, #2a4a3a 100%)' }} />
            
            {/* Road */}
            <div className="absolute bottom-0 left-0 right-0 h-8" style={{ backgroundColor: '#333' }}>
              {/* Road lines */}
              <div className="absolute top-3 left-0 right-0 flex gap-4 overflow-hidden" style={{ animation: 'van-drive 1s linear infinite reverse' }}>
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 h-1 w-6" style={{ backgroundColor: '#FFD700' }} />
                ))}
              </div>
            </div>
            
            {/* Van driving across */}
            <div className="absolute bottom-8" style={{ animation: 'van-drive 4s linear infinite' }}>
              {/* Van body - using divs for 8-bit look */}
              <div style={{ position: 'relative', width: 90, height: 50 }}>
                {/* Main van body */}
                <div style={{ position: 'absolute', left: 0, top: 12, width: 70, height: 30, backgroundColor: '#4169E1', borderRadius: 3 }} />
                
                {/* Cabin */}
                <div style={{ position: 'absolute', left: 55, top: 4, width: 25, height: 28, backgroundColor: '#4169E1', borderRadius: '3px 3px 0 0' }} />
                
                {/* Cabin window */}
                <div style={{ position: 'absolute', left: 60, top: 8, width: 16, height: 12, backgroundColor: '#87CEEB', borderRadius: 2 }} />
                
                {/* Cage area background */}
                <div style={{ position: 'absolute', left: 4, top: 16, width: 35, height: 22, backgroundColor: '#1a1a2e', borderRadius: 2 }} />
                
                {/* Cage bars */}
                <div style={{ position: 'absolute', left: 8, top: 14, width: 3, height: 22, backgroundColor: '#666' }} />
                <div style={{ position: 'absolute', left: 16, top: 14, width: 3, height: 22, backgroundColor: '#666' }} />
                <div style={{ position: 'absolute', left: 24, top: 14, width: 3, height: 22, backgroundColor: '#666' }} />
                <div style={{ position: 'absolute', left: 32, top: 14, width: 3, height: 22, backgroundColor: '#666' }} />
                
                {/* Sad Socks in cage */}
                <div style={{ position: 'absolute', left: 12, top: 20, width: 16, height: 14 }}>
                  {/* Head */}
                  <div style={{ position: 'absolute', left: 3, top: 0, width: 10, height: 10, backgroundColor: '#8B4513', borderRadius: '50%' }} />
                  {/* Ears */}
                  <div style={{ position: 'absolute', left: 1, top: 0, width: 4, height: 5, backgroundColor: '#6B3510', borderRadius: 1 }} />
                  <div style={{ position: 'absolute', left: 11, top: 0, width: 4, height: 5, backgroundColor: '#6B3510', borderRadius: 1 }} />
                  {/* Eyes - sad */}
                  <div style={{ position: 'absolute', left: 4, top: 4, width: 2, height: 2, backgroundColor: '#2d1810', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', left: 10, top: 4, width: 2, height: 2, backgroundColor: '#2d1810', borderRadius: '50%' }} />
                  {/* Tear */}
                  <div style={{ position: 'absolute', left: 4, top: 6, width: 2, height: 3, backgroundColor: '#5dade2', borderRadius: 1 }} />
                  {/* Snout */}
                  <div style={{ position: 'absolute', left: 6, top: 6, width: 4, height: 3, backgroundColor: '#D2691E', borderRadius: 1 }} />
                </div>
                
                {/* Sign on van */}
                <div style={{ position: 'absolute', left: 42, top: 18, width: 12, height: 16, backgroundColor: 'white', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 6, color: '#4169E1', fontWeight: 'bold' }}>🐕</span>
                </div>
                
                {/* Wheels */}
                <div style={{ position: 'absolute', left: 8, top: 38, width: 14, height: 14, backgroundColor: '#222', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', left: 11, top: 41, width: 8, height: 8, backgroundColor: '#444', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', left: 58, top: 38, width: 14, height: 14, backgroundColor: '#222', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', left: 61, top: 41, width: 8, height: 8, backgroundColor: '#444', borderRadius: '50%' }} />
                
                {/* Flashing light */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: 62, 
                    top: 0, 
                    width: 10, 
                    height: 6, 
                    backgroundColor: '#FF4500', 
                    borderRadius: 2,
                    animation: 'pulse 0.3s ease-in-out infinite'
                  }} 
                />
              </div>
            </div>
          </div>
          
          <p className="text-white mb-2" style={{ fontFamily: 'monospace' }}>The dog catchers got Socks!</p>
          <p className="text-amber-400 mb-4">Final Score: {score}</p>
          <button
            onClick={initGame}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
            style={{ fontFamily: 'monospace' }}
          >
            Try Again
          </button>
        </div>
      )}

      {gameState === 'caught' && (
        <div className="absolute z-20 bg-black/90 rounded-xl p-6 text-center border-4 border-amber-600" style={{ imageRendering: 'pixelated' }}>
          {/* 8-bit crying Socks face */}
          <svg viewBox="0 0 32 32" width="96" height="96" className="mx-auto mb-3" style={{ imageRendering: 'pixelated' }}>
            {/* Background */}
            <rect x="0" y="0" width="32" height="32" fill="#1a1a2e" />
            
            {/* Ears */}
            <rect x="4" y="2" width="4" height="6" fill="#6B3510" />
            <rect x="24" y="2" width="4" height="6" fill="#6B3510" />
            
            {/* Head outline */}
            <rect x="6" y="4" width="20" height="4" fill="#8B4513" />
            <rect x="4" y="8" width="24" height="16" fill="#8B4513" />
            <rect x="6" y="24" width="20" height="4" fill="#8B4513" />
            
            {/* Inner face */}
            <rect x="6" y="8" width="20" height="14" fill="#A0522D" />
            
            {/* Eyes - sad, closed */}
            <rect x="8" y="12" width="2" height="2" fill="#2d1810" />
            <rect x="10" y="14" width="2" height="2" fill="#2d1810" />
            <rect x="12" y="12" width="2" height="2" fill="#2d1810" />
            
            <rect x="18" y="12" width="2" height="2" fill="#2d1810" />
            <rect x="20" y="14" width="2" height="2" fill="#2d1810" />
            <rect x="22" y="12" width="2" height="2" fill="#2d1810" />
            
            {/* Tears */}
            <rect x="10" y="16" width="2" height="2" fill="#5dade2" />
            <rect x="10" y="18" width="2" height="2" fill="#5dade2" />
            <rect x="10" y="20" width="2" height="2" fill="#85c1e9" />
            
            <rect x="20" y="16" width="2" height="2" fill="#5dade2" />
            <rect x="20" y="18" width="2" height="2" fill="#5dade2" />
            <rect x="20" y="20" width="2" height="2" fill="#85c1e9" />
            
            {/* Snout */}
            <rect x="13" y="16" width="6" height="4" fill="#D2691E" />
            
            {/* Nose */}
            <rect x="14" y="16" width="4" height="2" fill="#2d1810" />
            
            {/* Sad mouth */}
            <rect x="12" y="22" width="2" height="2" fill="#2d1810" />
            <rect x="14" y="24" width="4" height="2" fill="#2d1810" />
            <rect x="18" y="22" width="2" height="2" fill="#2d1810" />
          </svg>
          
          <h2 className="text-xl font-bold text-red-400 mb-3" style={{ fontFamily: 'monospace' }}>Socks got caught!</h2>
          <p className="text-gray-300 mb-4 text-sm">Lives remaining: {lives}</p>
          <button
            onClick={resumeAfterCatch}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded transition-colors"
            style={{ fontFamily: 'monospace' }}
          >
            Try Again
          </button>
        </div>
      )}

      <div
        className="relative rounded-lg shadow-2xl border-4 border-amber-700"
        style={{
          width: MAZE_WIDTH * CELL_SIZE,
          height: MAZE_HEIGHT * CELL_SIZE,
          backgroundColor: getLevelSettings(level).floorColor,
        }}
      >
        {/* Treat message popup */}
        {showTreatMessage && (
          <div className="absolute z-30 top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-center animate-bounce shadow-lg">
            🦴 Bring Daisy the treat to win the game! 🦴
          </div>
        )}

        {/* Render maze walls */}
        {maze.map((row, y) =>
          row.map((cell, x) =>
            cell === 1 ? (
              <div
                key={`${x}-${y}`}
                style={{
                  position: 'absolute',
                  left: x * CELL_SIZE,
                  top: y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: getLevelSettings(level).wallColor,
                  borderRadius: 2,
                  boxShadow: 'inset 0 0 4px rgba(0,0,0,0.5)',
                }}
              />
            ) : null
          )
        )}

        {/* Render bones */}
        {bones.map((bone, i) => (
          <Bone key={i} x={bone.x} y={bone.y} />
        ))}

        {/* Render couch (safe zone) */}
        <Couch x={couchPosition.x} y={couchPosition.y} cellSize={CELL_SIZE} />

        {/* Render special item */}
        {specialItem && <SpecialItem type={specialItem.type} x={specialItem.x} y={specialItem.y} />}

        {/* Render dog treat (Level 3 final challenge) */}
        {dogTreat && <DogTreat x={dogTreat.x} y={dogTreat.y} />}

        {/* Render fireworks */}
        {fireworks.map(fw => (
          <Firework key={fw.id} x={fw.x} y={fw.y} color={fw.color} />
        ))}

        {/* Render catchers */}
        {catchers.map(catcher => (
          <DogCatcher key={catcher.id} x={catcher.x} y={catcher.y} />
        ))}

        {/* Render Socks */}
        <Dog 
          x={socks.x} 
          y={socks.y} 
          direction={socks.direction} 
          inSafeZone={
            socks.x >= couchPosition.x && socks.x < couchPosition.x + COUCH_WIDTH &&
            socks.y >= couchPosition.y && socks.y < couchPosition.y + COUCH_HEIGHT
          }
        />
      </div>


      <p style={{ color: '#9ca3af', marginTop: '16px', fontSize: '14px' }}>Use arrow keys to move Socks • Hide on the couch to stay safe! • Press ESC or P to pause</p>
    </div>
  );
}
