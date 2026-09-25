import React from 'react';
import { useRecipes, ActiveTimer } from '../context/RecipeContext';
import { Play, Pause, X, Clock, BellRing } from 'lucide-react';

export const CookingTimerWidget: React.FC = () => {
  const { activeTimers, toggleTimerPause, cancelTimer } = useRecipes();

  if (activeTimers.length === 0) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <aside
      aria-label="المؤقتات النشطة"
      className="fixed bottom-20 left-4 right-4 z-40 max-w-lg mx-auto flex flex-col gap-2 pointer-events-none"
    >
      {activeTimers.map((timer: ActiveTimer) => {
        const percent = Math.round(
          ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100
        );
        const isDone = timer.remainingSeconds === 0;

        return (
          <div
            key={timer.id}
            className={`pointer-events-auto rounded-2xl p-3 border shadow-lg backdrop-blur-md transition-all duration-300 ${
              isDone
                ? 'bg-amber-500 text-white border-amber-400 animate-bounce shadow-amber-500/30'
                : 'bg-[#242A26]/95 text-white border-white/10 shadow-black/30'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isDone ? 'bg-white/20 text-white' : 'bg-[#E26D46] text-white'
                  }`}
                >
                  {isDone ? <BellRing className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate text-orange-200">
                    {timer.recipeTitle ? `طبخة: ${timer.recipeTitle}` : 'مؤقت طبخ'}
                  </p>
                  <p className="text-sm font-bold truncate">{timer.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold tracking-wider">
                  {formatTime(timer.remainingSeconds)}
                </span>

                {!isDone && (
                  <button
                    onClick={() => toggleTimerPause(timer.id)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title={timer.isRunning ? 'إيقاف مؤقت' : 'استئناف'}
                  >
                    {timer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                )}

                <button
                  onClick={() => cancelTimer(timer.id)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/80 text-white transition-colors"
                  title="إلغاء المؤقت"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {!isDone && (
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#E26D46] h-full rounded-full transition-all duration-1000"
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
};
