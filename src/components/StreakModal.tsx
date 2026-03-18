"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flame, Trophy, Calendar, Zap, X, ChevronLeft, ChevronRight, BarChart3, Clock, Loader2, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateStreak } from '@/lib/utils/streak'

interface StreakHistory {
  post_date: string
  post_count: number
}

interface StreakModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export default function StreakModal({ isOpen, onClose, userId }: StreakModalProps) {
  const supabase = createClient()
  const [history, setHistory] = useState<StreakHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [showFullYear, setShowFullYear] = useState(false)
  const [streakData, setStreakData] = useState({
    current: 0,
    longest: 0,
    postsThisMonth: 0,
    mostActiveDay: '—'
  })

  useEffect(() => {
    if (isOpen) fetchHistory()
  }, [isOpen, userId])

  const fetchHistory = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('streak_history')
      .select('post_date, post_count')
      .eq('user_id', userId)
      .order('post_date', { ascending: false })

    if (data) {
      setHistory(data)
      const stats = calculateStreak(data)
      setStreakData({
        current: stats.current,
        longest: stats.longest,
        postsThisMonth: data.filter((h: StreakHistory) => {
          const d = new Date(h.post_date)
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear
        }).length,
        mostActiveDay: calculateMostActiveDay(data)
      })
    }
    setLoading(false)
  }

  const calculateMostActiveDay = (data: StreakHistory[]) => {
    if (!data.length) return '—'
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const counts: Record<string, number> = {}
    data.forEach(h => {
      const day = days[new Date(h.post_date).getDay()]
      counts[day] = (counts[day] || 0) + h.post_count
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay()

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] // Updated to start with Mon as per request

  const navigateMonth = (direction: number) => {
    let newMonth = currentMonth + direction
    let newYear = currentYear
    if (newMonth > 11) {
      newMonth = 0
      newYear++
    } else if (newMonth < 0) {
      newMonth = 11
      newYear--
    }
    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
  }

  const getActivityColor = (count: number) => {
    if (count === 0) return 'bg-foreground/5'
    if (count === 1) return 'bg-green-500/30'
    if (count === 2) return 'bg-green-500/60'
    return 'bg-[#22c55e]'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card border border-border rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-3xl relative flex flex-col"
      >
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 hover:bg-foreground/5 rounded-full transition-all text-foreground/40 hover:text-foreground z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8 md:p-10 overflow-y-auto">
          <header className="flex flex-col items-center gap-2 mb-10">
            <div className="flex items-center gap-3 text-orange-500">
               <Flame size={40} className="drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
               <span className="text-5xl font-black">{streakData.current}</span>
            </div>
            <h2 className="text-xl font-bold text-foreground uppercase tracking-widest">Your Streak</h2>
            <p className="text-foreground/40 font-mono text-[10px] uppercase tracking-[0.3em]">Building in the shadows</p>
          </header>

          {/* Calendar View */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-foreground">{months[currentMonth]} {currentYear}</h3>
              <div className="flex gap-2 text-foreground/40">
                <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-foreground/5 rounded-lg border border-border"><ChevronLeft size={16} /></button>
                <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-foreground/5 rounded-lg border border-border"><ChevronRight size={16} /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(d => (
                <div key={d} className="text-[10px] font-bold text-foreground/20 text-center uppercase mb-2">{d}</div>
              ))}
              {Array.from({ length: (firstDayOfMonth(currentMonth, currentYear) + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth(currentMonth, currentYear) }).map((_, i) => {
                const day = i + 1
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const activity = history.find(h => h.post_date === dateStr)
                const isToday = new Date().toISOString().split('T')[0] === dateStr
                
                return (
                  <div key={day} className="aspect-square flex flex-col items-center justify-center relative group/day">
                    {activity ? (
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)] animate-pulse-slow">
                        <span className="text-[10px] font-black text-black">{day}</span>
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-full border border-border flex items-center justify-center ${isToday ? 'border-foreground ring-1 ring-foreground/20' : 'bg-foreground/5 opacity-20'}`}>
                        <span className="text-[10px] font-bold text-foreground/20">{day}</span>
                      </div>
                    )}
                    {activity && (
                      <div className="absolute bottom-full mb-2 hidden group-hover/day:block bg-card border border-border px-2 py-1 rounded text-[8px] text-foreground whitespace-nowrap z-50 shadow-xl">
                        {activity.post_count} builds on {dateStr}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
             <StatBox label="Current Streak" value={streakData.current} icon="🔥" />
             <StatBox label="Longest Streak" value={streakData.longest} icon="🏆" />
             <StatBox label="Posts Month" value={streakData.postsThisMonth} icon="📝" />
             <StatBox label="Most Active" value={streakData.mostActiveDay} icon="📅" />
          </div>

          {/* All Years Expansion */}
          <div className="border-t border-border pt-8">
            <button 
              onClick={() => setShowFullYear(!showFullYear)}
              className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground transition-all bg-foreground/5 rounded-xl border border-border hover:border-foreground/10"
            >
              {showFullYear ? 'Collapse History' : 'View all years'}
              <ChevronDown size={14} className={`transition-transform duration-300 ${showFullYear ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showFullYear && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-6"
                >
                  <div className="bg-background/40 border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-2 text-[8px] font-bold text-foreground/20">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <span key={m}>{m}</span>)}
                      </div>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-4 custom-scrollbar">
                       <div className="flex flex-col justify-between text-[7px] font-bold text-foreground/10 pr-2">
                          <span>M</span>
                          <span>W</span>
                          <span>F</span>
                       </div>
                       <div className="grid grid-flow-col grid-rows-7 gap-1">
                          {Array.from({ length: 364 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-2.5 h-2.5 rounded-sm transition-all duration-300 ${getActivityColor(Math.random() > 0.8 ? (Math.random() > 0.5 ? 2 : 1) : 0)}`}
                              title={`Day ${i}`}
                            />
                          ))}
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function StatBox({ label, value, icon }: { label: string, value: any, icon: string }) {
  return (
    <div className="p-4 rounded-xl bg-foreground/5 border border-border flex flex-col gap-1 items-center hover:bg-foreground/10 transition-all">
      <span className="text-xl mb-1">{icon}</span>
      <span className="text-sm font-black text-foreground">{value}</span>
      <span className="text-[8px] font-black uppercase tracking-widest text-foreground/40">{label}</span>
    </div>
  )
}
