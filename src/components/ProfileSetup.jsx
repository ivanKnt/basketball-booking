import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Save, User, Edit3, Trophy, Star, Sparkles, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';

function PlayerBadge({ matchesPlayed }) {
  if (matchesPlayed >= 15) {
    return (
      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-primary to-[#ff8c00] rounded-full text-[10px] font-bold text-black uppercase tracking-widest border border-primary/20">
        <Trophy size={12} /> MVP
      </span>
    );
  }
  if (matchesPlayed >= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-bold text-text uppercase tracking-widest border border-border">
        <Star size={12} className="text-amber-400" /> All-Star
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-bold text-text-muted uppercase tracking-widest border border-border">
      <Sparkles size={12} /> Rookie
    </span>
  );
}

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
        displayName: name.trim(),
      });
      setUser({ ...user, profileName: name.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile', error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md lg:max-w-2xl mx-auto space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="apple-card rounded-3xl overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="p-8 relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-surface border border-border shadow-2xl mb-5 relative overflow-hidden flex items-center justify-center">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-text-muted" />
            )}
          </div>

          {isNewUser && isEditing && (
            <div className="mb-4">
              <h2 className="text-xl font-display font-semibold text-text tracking-tight mb-1">
                Bienvenue sur HoopShare
              </h2>
              <p className="text-text-muted text-sm font-sans">
                Choisis un pseudo pour que les autres joueurs te reconnaissent.
              </p>
            </div>
          )}

          {!isEditing ? (
            <div className="space-y-3 w-full">
              <h1 className="text-4xl font-display font-semibold text-text tracking-tight flex items-center justify-center gap-3">
                {user.profileName}
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-text-muted hover:text-text transition-colors bg-white/5 p-2 rounded-full border border-border"
                  aria-label="Modifier le pseudo"
                >
                  <Edit3 size={16} />
                </button>
              </h1>
              <PlayerBadge matchesPlayed={user.matchesPlayed || 0} />

              <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-sm mx-auto">
                <div className="bg-surface border border-border rounded-2xl p-4 text-center">
                  <div className="text-3xl font-display font-semibold text-text mb-1">{user.matchesPlayed || 0}</div>
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Matchs joués</div>
                </div>
                <div className="bg-surface border border-border rounded-2xl p-4 text-center">
                  <div className="text-3xl font-display font-semibold text-primary mb-1">{user.totalContributed || 0}</div>
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Contribué (XOF)</div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="w-full max-w-sm space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 bg-surface border border-primary/30 text-text text-center rounded-2xl focus:ring-1 focus:ring-primary outline-none transition-colors text-2xl font-display tracking-tight"
                placeholder="Ton pseudo"
                autoFocus
                required
                minLength={2}
                maxLength={20}
              />
              <p className="text-xs text-text-muted font-sans">2 à 20 caractères · visible par tous les joueurs</p>
              <button
                type="submit"
                disabled={loading || !name.trim() || name.trim().length < 2}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black font-display font-semibold text-lg tracking-tight py-4 px-4 rounded-2xl transition-all disabled:opacity-50"
              >
                <Save size={20} />
                {loading ? 'Enregistrement...' : isNewUser ? "C'est parti !" : 'Sauvegarder'}
              </button>
            </form>
          )}
        </div>
      </motion.div>

      {isNewUser && isEditing && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 text-center text-text-muted text-xs font-sans"
        >
          <Lightbulb size={14} className="text-amber-500/70 shrink-0" />
          Tu pourras toujours changer ton pseudo plus tard.
        </motion.p>
      )}
    </div>
  );
}
