import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Calendar, MapPin, Users, Trophy, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDistanceToNow, parseISO, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function GameList({ onOpenGame }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'games'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesData = [];
      snapshot.forEach(doc => {
        gamesData.push({ id: doc.id, ...doc.data() });
      });
      setGames(gamesData);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const getStatusInfo = (game) => {
    const playersCount = game.playersCount || Object.keys(game.players || {}).length || 0;
    const max = game.maxPlayers || 10;
    const isFull = playersCount >= max;
    
    let isGamePast = false;
    try {
      if (game.date && game.time) {
        isGamePast = isPast(parseISO(`${game.date}T${game.time}`));
      }
    } catch(e) {}

    if (isGamePast) return { text: 'Terminé', color: 'text-zinc-500', bg: 'bg-zinc-900/50', border: 'border-zinc-800' };
    if (isFull) return { text: 'Complet', color: 'text-red-400', bg: 'bg-red-950/30', border: 'border-red-900/50' };
    return { text: 'Ouvert', color: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-900/50', active: true };
  };

  const getTimeLeft = (date, time) => {
    try {
      if (!date || !time) return null;
      const gameDate = parseISO(`${date}T${time}`);
      if (isPast(gameDate)) return null;
      return formatDistanceToNow(gameDate, { locale: fr, addSuffix: true });
    } catch(e) {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 px-4 pt-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 premium-glass skeleton-loader border-none"></div>
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <motion.div 
          animate={{ y: [0, -15, 0] }} 
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-7xl mb-6 drop-shadow-[0_20px_30px_rgba(255,77,0,0.3)] filter grayscale hover:grayscale-0 transition-all duration-500"
        >
          🏀
        </motion.div>
        <h3 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Aucun match</h3>
        <p className="text-zinc-400 font-sans">Soyez le premier à créer l'événement !</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pt-4 pb-6">
      {/* Mini Leaderboard Widget */}
      <motion.div 
        initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="premium-glass p-4 flex items-center gap-4 bg-gradient-to-r from-[#140a05] to-[#0a0a0c]"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center border border-primary/30 glow-orange">
          <Trophy className="text-primary" size={24} />
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-primary font-bold uppercase tracking-widest mb-0.5">Top Cotiseur</div>
          <div className="text-white font-display font-medium tracking-tight text-lg">Rejoignez pour voir</div>
        </div>
        <ChevronRight size={20} className="text-zinc-600" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {games.map((game, index) => {
          const status = getStatusInfo(game);
          const timeLeft = getTimeLeft(game.date, game.time);
          const raised = game.totalRaised || 0;
          const cost = game.totalCost || 15000;
          const progress = Math.min((raised / cost) * 100, 100);
          
          // Get player avatars if available, otherwise mock empty slots
          const playersArray = game.players ? Object.values(game.players) : [];
          const displayAvatars = playersArray.slice(0, 3);
          const remainingPlayers = Math.max(0, playersArray.length - 3);

          return (
            <motion.div 
              key={game.id} 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.08, type: 'spring', bounce: 0.2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onOpenGame(game.id)}
              className="premium-glass cursor-pointer overflow-hidden group relative"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  {/* Status Badge */}
                  <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 border ${status.bg} ${status.color} ${status.border}`}>
                    {status.active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
                    {status.text}
                  </div>
                  
                  {/* Countdown */}
                  {timeLeft && (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                      <Clock size={12} />
                      <span>{timeLeft}</span>
                    </div>
                  )}
                </div>

                <h3 className="text-2xl font-display font-bold text-white mb-3 truncate tracking-tight group-hover:text-primary transition-colors">
                  {game.location}
                </h3>
                
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-zinc-400 font-medium mb-5">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-zinc-500" />
                    <span>{game.date} • {game.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-zinc-500" />
                    <span>{game.perHeadCost} {game.currency || 'XOF'}</span>
                  </div>
                </div>

                {/* Avatar Stack */}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {displayAvatars.map((p, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-[#0a0a0c] overflow-hidden relative z-10 shadow-sm">
                        {p.photoURL ? (
                          <img src={p.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-white font-medium bg-gradient-to-br from-zinc-700 to-zinc-900">
                            {p.name ? p.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                      </div>
                    ))}
                    {remainingPlayers > 0 && (
                      <div className="w-8 h-8 rounded-full bg-zinc-900 border-2 border-[#0a0a0c] flex items-center justify-center text-[10px] text-zinc-400 font-medium relative z-20">
                        +{remainingPlayers}
                      </div>
                    )}
                    {playersArray.length === 0 && (
                      <div className="text-xs text-zinc-500 italic ml-1 mt-1.5">Soyez le premier...</div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-display font-bold text-white tracking-tight">{raised}<span className="text-[10px] text-zinc-500 ml-1 font-sans font-normal uppercase">{game.currency || 'XOF'}</span></div>
                  </div>
                </div>
              </div>
              
              {/* Compact Funding Bar */}
              <div className="h-1 w-full bg-zinc-900/80 absolute bottom-0 left-0">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-primary to-[#ff8c00] relative"
                >
                  <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/50 blur-[2px]"></div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
