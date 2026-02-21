export function NeuralBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="bg-glow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
          <filter id="glow-filter">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="line-glow">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#bg-glow)" />

        {/* CONNECTION LINES */}
        <g filter="url(#line-glow)" opacity="0.25">
          <line x1="120" y1="80" x2="320" y2="160" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="320" y1="160" x2="560" y2="90" stroke="#6366f1" strokeWidth="0.6" />
          <line x1="560" y1="90" x2="780" y2="200" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="780" y1="200" x2="1050" y2="110" stroke="#6366f1" strokeWidth="0.6" />
          <line x1="1050" y1="110" x2="1280" y2="180" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="1280" y1="180" x2="1500" y2="100" stroke="#6366f1" strokeWidth="0.6" />
          <line x1="80" y1="240" x2="320" y2="160" stroke="#6366f1" strokeWidth="0.6" />
          <line x1="320" y1="160" x2="460" y2="290" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="460" y1="290" x2="700" y2="320" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="700" y1="320" x2="780" y2="200" stroke="#6366f1" strokeWidth="0.6" />
          <line x1="700" y1="320" x2="920" y2="280" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="920" y1="280" x2="1160" y2="340" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="1160" y1="340" x2="1280" y2="180" stroke="#6366f1" strokeWidth="0.6" />
          <line x1="1160" y1="340" x2="1400" y2="310" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="80" y1="240" x2="200" y2="420" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="200" y1="420" x2="360" y2="480" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="360" y1="480" x2="460" y2="290" stroke="#6366f1" strokeWidth="0.6" />
          <line x1="360" y1="480" x2="580" y2="500" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="580" y1="500" x2="800" y2="460" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="800" y1="460" x2="1000" y2="500" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="1000" y1="500" x2="1160" y2="340" stroke="#6366f1" strokeWidth="0.6" />
          <line x1="1000" y1="500" x2="1220" y2="520" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="1220" y1="520" x2="1400" y2="310" stroke="#6366f1" strokeWidth="0.6" />
          <line x1="1220" y1="520" x2="1480" y2="480" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="150" y1="620" x2="360" y2="480" stroke="#6366f1" strokeWidth="0.6" />
          <line x1="150" y1="620" x2="320" y2="680" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="320" y1="680" x2="540" y2="700" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="540" y1="700" x2="760" y2="720" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="760" y1="720" x2="980" y2="740" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="980" y1="740" x2="1380" y2="700" stroke="#8b5cf6" strokeWidth="0.6" />
          <line x1="1380" y1="700" x2="1480" y2="480" stroke="#6366f1" strokeWidth="0.6" />
          <line x1="580" y1="500" x2="700" y2="320" stroke="#6366f1" strokeWidth="0.5" opacity="0.5" />
          <line x1="800" y1="460" x2="920" y2="280" stroke="#6366f1" strokeWidth="0.5" opacity="0.5" />
          <line x1="460" y1="290" x2="560" y2="90" stroke="#6366f1" strokeWidth="0.5" opacity="0.5" />
          <line x1="1050" y1="110" x2="920" y2="280" stroke="#6366f1" strokeWidth="0.5" opacity="0.5" />
        </g>

        {/* NODES */}
        <g filter="url(#glow-filter)">
          {/* Large bright nodes */}
          {[
            [120, 80], [560, 90], [1050, 110], [1500, 100],
            [80, 240], [700, 320], [1400, 310],
            [200, 420], [800, 460], [1480, 480],
            [320, 680], [760, 720], [1380, 700],
          ].map(([cx, cy], i) => (
            <g key={`large-${i}`}>
              <circle cx={cx} cy={cy} r="4" fill="#6366f1" opacity="0.4" />
              <circle cx={cx} cy={cy} r="1.8" fill="#ffffff" opacity="0.85" />
            </g>
          ))}

          {/* Medium nodes */}
          {[
            [320, 160], [780, 200], [1280, 180],
            [460, 290], [920, 280], [1160, 340],
            [360, 480], [580, 500], [1000, 500], [1220, 520],
            [150, 620], [540, 700], [980, 740],
          ].map(([cx, cy], i) => (
            <g key={`med-${i}`}>
              <circle cx={cx} cy={cy} r="3" fill="#8b5cf6" opacity="0.35" />
              <circle cx={cx} cy={cy} r="1.2" fill="#ffffff" opacity="0.75" />
            </g>
          ))}

          {/* Small accent nodes */}
          {[
            [220, 140], [640, 200], [1180, 150],
            [400, 380], [860, 390], [1320, 420],
            [260, 560], [680, 600], [1100, 620],
          ].map(([cx, cy], i) => (
            <circle key={`small-${i}`} cx={cx} cy={cy} r="1" fill="#a5b4fc" opacity="0.45" />
          ))}
        </g>

        {/* Animated pulse rings on key nodes */}
        <g>
          <circle cx="560" cy="90" r="4" fill="none" stroke="#6366f1" strokeWidth="0.8" opacity="0">
            <animate attributeName="r" values="4;14;4" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="800" cy="460" r="4" fill="none" stroke="#8b5cf6" strokeWidth="0.8" opacity="0">
            <animate attributeName="r" values="4;14;4" dur="4s" begin="1.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="4s" begin="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="1220" cy="520" r="4" fill="none" stroke="#6366f1" strokeWidth="0.8" opacity="0">
            <animate attributeName="r" values="4;14;4" dur="3.5s" begin="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="3.5s" begin="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="320" cy="680" r="4" fill="none" stroke="#8b5cf6" strokeWidth="0.8" opacity="0">
            <animate attributeName="r" values="4;14;4" dur="3s" begin="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" begin="0.8s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </div>
  );
}