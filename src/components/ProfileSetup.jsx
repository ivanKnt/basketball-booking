import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Save, User, Edit3 } from 'lucide-react';
import { motion } from 'motion/react';

export default function ProfileSetup({ user, setUser }) {
  const [name, setName] = useState(user.profileName || '');
  const [loading, setLoading] = useState(false);
  const isNewUser = !user.profileName;
  const [isEditing, setIsEditing] = useState(isNewUser);

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
    <div className="max-w-md mx-auto space-y-6 pb-20 px-4">
      
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
          
          {isNewUser && isEditing && (
            <div className="mb-4">
              <h2 className="text-xl font-display font-bold text-white tracking-tight mb-1">Bienvenue sur HoopShare 🏀</h2>
              <p className="text-zinc-400 text-sm font-sans">Choisis un pseudo pour que les autres joueurs te reconnaissent.</p>
            </div>
          )}

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
              
              {/* REAL Stats */}
              <div className="grid grid-cols-2 gap-4 mt-8 w-full">
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-center">
                  <div className="text-3xl font-display font-bold text-white mb-1">{user.matchesPlayed || 0}</div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Matchs Joués</div>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-center">
                  <div className="text-3xl font-display font-bold text-primary mb-1">{user.totalContributed || 0}</div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Contribué (XOF)</div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="w-full space-y-4">
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full p-4 bg-black/40 border border-primary/30 text-white text-center rounded-2xl focus:ring-1 focus:ring-primary outline-none transition-colors text-2xl font-display tracking-tight shadow-inner"
                placeholder="Ton pseudo (ex: King LeBron)"
                autoFocus
                required
                minLength={2}
                maxLength={20}
              />
              <p className="text-xs text-zinc-500 font-sans">2 à 20 caractères · visible par tous les joueurs</p>
              <button 
                type="submit" 
                disabled={loading || !name.trim() || name.trim().length < 2}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black font-display font-bold text-lg tracking-tight py-4 px-4 rounded-2xl transition-all disabled:opacity-50 shadow-xl"
              >
                <Save size={20} />
                {loading ? 'Enregistrement...' : isNewUser ? "C'est parti !" : 'Sauvegarder'}
              </button>
            </form>
          )}
        </div>
      </motion.div>

      {/* Tip for new users */}
      {isNewUser && isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center text-zinc-500 text-xs font-sans"
        >
          💡 Tu pourras toujours changer ton pseudo plus tard.
        </motion.div>
      )}

    </div>
  );
}
