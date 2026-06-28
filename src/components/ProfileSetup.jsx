import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Save, User, Trophy, Zap, Activity, Edit3 } from 'lucide-react';
import { motion } from 'motion/react';

// Animated counter component
function AnimatedCounter({ value, duration = 2 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / (duration * 1000), 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(ease * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{count.toLocaleString('fr-FR')}</>;
}

export default function ProfileSetup({ user, setUser }) {
  const [name, setName] = useState(user.profileName || '');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!user.profileName);

  // Mock stats for the MVP presentation
  const stats = {
    matches: 12,
    mvp: 3,
    contributions: 45000
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: name.trim()
      });
      setUser({ ...user, profileName: name.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile", error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20 px-2">
      
      {/* Header Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="premium-glass rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="p-8 relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-[#0a0a0c] border border-white/10 shadow-2xl mb-5 relative overflow-hidden flex items-center justify-center">
             {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
                <User size={40} className="text-zinc-600" />
             )}
          </div>
          
          {!isEditing ? (
            <div className="space-y-3">
              <h1 className="text-4xl font-display font-bold text-white tracking-tight flex items-center justify-center gap-3">
                {user.profileName}
                <button onClick={() => setIsEditing(true)} className="text-zinc-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full border border-white/5">
                  <Edit3 size={16} />
                </button>
              </h1>
              <div className="px-4 py-1.5 bg-primary/10 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest inline-block border border-primary/20">
                Membre Actif
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="w-full space-y-4">
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full p-4 bg-black/40 border border-primary/30 text-white text-center rounded-2xl focus:ring-1 focus:ring-primary outline-none transition-colors text-2xl font-display tracking-tight shadow-inner"
                placeholder="Votre Pseudo"
                autoFocus
                required
              />
              <button 
                type="submit" 
                disabled={loading || !name.trim()}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black font-display font-bold text-lg tracking-tight py-4 px-4 rounded-2xl transition-all disabled:opacity-50 shadow-xl"
              >
                <Save size={20} />
                {loading ? 'Enregistrement...' : 'Sauvegarder'}
              </button>
            </form>
          )}
        </div>
      </motion.div>

      {/* Stats Dashboard */}
      {!isEditing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4">
          
          <div className="premium-glass p-6 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-1">
              <Activity size={24} />
            </div>
            <div className="text-4xl font-display font-bold text-white tracking-tight">
              <AnimatedCounter value={stats.matches} />
            </div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Matchs Joués</div>
          </div>

          <div className="premium-glass p-6 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mb-1">
              <Trophy size={24} />
            </div>
            <div className="text-4xl font-display font-bold text-white tracking-tight">
              <AnimatedCounter value={stats.mvp} />
            </div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Titres MVP</div>
          </div>

          <div className="premium-glass p-6 text-center col-span-2 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none"></div>
            
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1 relative z-10">
              <Zap size={24} />
            </div>
            <div className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight drop-shadow-sm relative z-10">
              <AnimatedCounter value={stats.contributions} /> <span className="text-xl text-zinc-500 tracking-normal">XOF</span>
            </div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold relative z-10">Total Cotisé</div>
          </div>

        </motion.div>
      )}

      {/* Game History List (Mock UI) */}
      {!isEditing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="premium-glass p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <h3 className="font-display font-medium text-lg text-white tracking-wide">Historique Récent</h3>
          </div>
          
          <div className="space-y-3 font-sans">
            {[1, 2, 3].map((item, i) => (
              <div key={item} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <div>
                  <div className="font-bold text-white text-sm mb-0.5">Harmonie Signature</div>
                  <div className="text-xs text-zinc-500">Il y a {i + 1} semaine{i > 0 ? 's' : ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-400">+1500 XOF</div>
                  <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mt-0.5">Présent</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

    </div>
  );
}
