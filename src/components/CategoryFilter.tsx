"use client"

const categories = ['All', 'Speak', 'Web3', 'AI', 'Mobile', 'DevTools', 'Game', 'Other']

export default function CategoryFilter({ 
  selected, 
  onSelect 
}: { 
  selected: string, 
  onSelect: (cat: string) => void 
}) {
  return (
    <div className="flex items-center gap-4 overflow-x-visible pb-14 pt-4 px-2 no-scrollbar perspective-container">
      {categories.map((cat) => (
        <div key={cat} className="flex-shrink-0 group">
          <div className="relative transform-style-3d">
            {/* The "Well" or Base (Always visible, providing depth) */}
            <div className="absolute inset-0 translate-y-2 rounded-xl bg-background border border-border opacity-40 shadow-inner" />
            
            <button
              onClick={() => onSelect(cat)}
              className={`
                relative px-7 py-3 rounded-xl text-[11px] font-black tracking-[0.15em] uppercase transition-all duration-500 transform-style-3d border box-border
                ${selected === cat 
                  ? 'bg-gradient-to-b from-white via-silver to-gray-400 text-black border-white/50 -translate-y-2 shadow-silver-lux' 
                  : 'bg-card text-foreground/40 border-border hover:border-border/50 hover:text-foreground translate-y-0 hover:-translate-y-1 shadow-flat'
                }
                active:translate-y-[-2px] active:scale-[0.98]
              `}
            >
              <span className="relative z-10">{cat}</span>
              
              {/* 3D Side panels (to avoid "cut in half" look) */}
              {selected === cat && (
                <div className="absolute inset-0 rounded-xl pointer-events-none">
                  <div className="absolute bottom-[-10px] left-0 right-0 h-[10px] bg-foreground/20 rounded-b-xl origin-top transform-rotate-x-90" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}
            </button>
          </div>
        </div>
      ))}

      <style jsx>{`
        .perspective-container {
          perspective: 1500px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .transform-rotate-x-90 {
            transform: rotateX(-90deg);
        }
        .shadow-silver-lux {
          box-shadow: 
            0 10px 30px -5px rgba(192, 192, 192, 0.3),
            0 0 15px rgba(255, 255, 255, 0.2);
        }
        .shadow-flat {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        }
        button {
          backface-visibility: hidden;
          /* Sub-pixel stability */
          transform: translate3d(0, 0, 0);
          will-change: transform;
        }
      `}</style>
    </div>
  )
}
