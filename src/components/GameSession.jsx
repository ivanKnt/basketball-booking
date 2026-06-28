import { useState, useEffect } from 'react';
import { doc, collection, onSnapshot, addDoc, setDoc, serverTimestamp, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, CheckCircle, Zap, Trash2, Share2, Shuffle, QrCode, X, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import EmojiReactions from './EmojiReactions';

export default function GameSession({ user, gameId, onBack }) {
  const [game, setGame] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const unsubGame = onSnapshot(doc(db, 'games', gameId), (doc) => {
      setGame({ id: doc.id, ...doc.data() });
    });

    const unsubRsvps = onSnapshot(collection(db, 'games', gameId, 'rsvps'), (snapshot) => {
      setRsvps(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubPledges = onSnapshot(collection(db, 'games', gameId, 'pledges'), (snapshot) => {
      setPledges(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    setLoading(false);
    return () => { unsubGame(); unsubRsvps(); unsubPledges(); };
  }, [gameId]);

  if (loading || !game) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <div className="text-primary font-display font-bold tracking-tight text-2xl uppercase animate-pulse">Chargement...</div>
    </div>
  );

  const isAttending = rsvps.some(r => r.userId === user.uid);
  const totalPledged = pledges.reduce((acc, p) => acc + p.amount, 0);
  
  // Light cost logic — only relevant when light is NOT included in court price
  const lightIncluded = game.lightIncluded !== false; // default true for backward compat
  const lightCostPerHour = game.lightCostPerHour || 0;
  const duration = game.duration || 2;
  const totalLightNeeded = lightCostPerHour * duration;
  const lightProgress = totalLightNeeded > 0 ? Math.min((totalPledged / totalLightNeeded) * 100, 100) : 0;

  const isFull = game.maxPlayers && rsvps.length >= game.maxPlayers;
  const courtCostLabel = game.pricingModel === 'per_person' ? 'Terrain / joueur' : game.pricingModel === 'per_hour' ? 'Terrain / heure' : 'Forfait terrain';

  // Calculate recommended contribution per person for light (use maxPlayers to avoid huge numbers for the first few people)
  const lightPerPerson = (!lightIncluded && totalLightNeeded > 0)
    ? Math.ceil(totalLightNeeded / (game.maxPlayers || Math.max(10, rsvps.length)))
    : 0;

  const handleToggleRSVP = async () => {
    if (!isAttending && isFull) return; // Prevent joining if full
    setIsSubmitting(true);
    const rsvpRef = doc(db, 'games', gameId, 'rsvps', user.uid);
    try {
      if (isAttending) {
        await deleteDoc(rsvpRef);
        if (game.teamA || game.teamB) {
          const teamA = (game.teamA || []).filter(id => id !== user.uid);
          const teamB = (game.teamB || []).filter(id => id !== user.uid);
          await updateDoc(doc(db, 'games', gameId), { teamA, teamB });
        }
        await updateDoc(doc(db, 'users', user.uid), {
          matchesPlayed: increment(-1)
        });
      } else {
        await setDoc(rsvpRef, {
          userId: user.uid,
          userName: user.profileName,
          photoURL: user.photoURL || null,
          joinedAt: serverTimestamp()
        });
        await updateDoc(doc(db, 'users', user.uid), {
          matchesPlayed: increment(1)
        });
        // Confetti explosion
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.8 },
          colors: ['#f97316', '#eab308', '#ef4444']
        });
      }
    } catch (e) {
      console.error(e);
    }
    setIsSubmitting(false);
  };

  const myPledges = pledges.filter(p => p.userId === user.uid).reduce((acc, p) => acc + p.amount, 0);

  const handlePledge = async (e) => {
    e.preventDefault();
    const newAmount = Number(pledgeAmount);
    if (isNaN(newAmount) || newAmount < 0) return;
    
    setIsSubmitting(true);
    const pledgeRef = doc(db, 'games', gameId, 'pledges', user.uid);
    const diff = newAmount - myPledges; // How much it changed

    try {
      if (newAmount === 0) {
        await deleteDoc(pledgeRef);
      } else {
        await setDoc(pledgeRef, {
          userId: user.uid,
          userName: user.profileName,
          amount: newAmount,
          updatedAt: serverTimestamp()
        });
      }
      
      if (diff !== 0) {
        await updateDoc(doc(db, 'users', user.uid), {
          totalContributed: increment(diff)
        });
      }
      
      setPledgeAmount('');
      if (newAmount > myPledges) {
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b']
        });
      }
    } catch (e) {
      console.error(e);
    }
    setIsSubmitting(false);
  };

  const handleDeleteGame = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce match ?")) {
      try {
        await deleteDoc(doc(db, 'games', gameId));
        onBack();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const handleShare = async () => {
    const text = `🔥 Match prévu à ${game.location} le ${game.date} à ${game.time} !\nFrais: ${game.perHeadCost} ${game.currency || 'XOF'}.\nRejoins-nous sur HoopShare !`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HoopShare Match',
          text: text,
          url: window.location.href,
        });
      } catch (e) {
        console.error("Error sharing", e);
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + window.location.href)}`, '_blank');
    }
  };

  const handleGenerateTeams = async () => {
    if (rsvps.length < 2) return alert("Pas assez de joueurs pour générer des équipes !");
    setIsSubmitting(true);
    let shuffled = [...rsvps].sort(() => 0.5 - Math.random());
    const mid = Math.ceil(shuffled.length / 2);
    const teamA = shuffled.slice(0, mid).map(r => r.userId);
    const teamB = shuffled.slice(mid).map(r => r.userId);
    
    try {
      await updateDoc(doc(db, 'games', gameId), { teamA, teamB });
    } catch (e) {
      console.error("Error updating teams", e);
    }
    setIsSubmitting(false);
  };

  const myCourtCost = isAttending ? (game.perHeadCost || 0) : 0;
  const myTotalDue = myCourtCost + myPledges;

  // Circular progress SVG logic
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (lightProgress / 100) * circumference;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6 pb-24 px-2">
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-black/60 p-3 rounded-full border border-white/5 backdrop-blur-md sticky top-4 z-40 shadow-lg">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="font-display font-bold text-lg text-white tracking-tight px-4 truncate flex-1 text-center">
          {game.location}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowQR(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20">
            <QrCode size={18} />
          </button>
          <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/20">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="premium-glass p-6 md:p-8 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="flex justify-between items-start mb-5 relative z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight drop-shadow-md">{game.location}</h1>
            <div className="text-primary font-medium text-sm mt-2">{game.date} • {game.time} • {duration}h</div>
          </div>
          {game.maxPlayers && (
            <div className={`px-4 py-1.5 font-bold rounded-full text-[10px] uppercase tracking-widest border ${isFull ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-zinc-400 border-white/10'}`}>
              {rsvps.length} / {game.maxPlayers} Joueurs
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        <div className="bg-[#0a0a0c]/80 rounded-2xl border border-white/5 p-5 mt-4 relative z-10 space-y-3 text-sm shadow-inner">
          <div className="flex justify-between text-zinc-300">
            <span className="font-medium flex items-center gap-2">🏀 {courtCostLabel}</span>
            <span className="font-bold text-white">{game.perHeadCost || 0} {game.currency || 'XOF'}</span>
          </div>
          {!lightIncluded && lightCostPerHour > 0 && (
            <div className="flex justify-between text-zinc-300">
              <span className="font-medium flex items-center gap-2">💡 Lumière ({lightCostPerHour} × {duration}h ÷ {game.maxPlayers || '?'} j.)</span>
              <span className="font-bold text-amber-400">Cotisation séparée</span>
            </div>
          )}
          {lightIncluded && (
            <div className="flex justify-between text-emerald-400/80">
              <span className="font-medium flex items-center gap-2">💡 Éclairage</span>
              <span className="font-bold">Inclus ✓</span>
            </div>
          )}
          {game.notes && (
            <div className="flex items-start gap-2 text-zinc-400 pt-3 border-t border-white/5">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span className="text-[13px] leading-relaxed">{game.notes}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-black/40 p-6 rounded-2xl border border-white/5 mt-5 relative z-10">
          <div className="text-center md:text-left">
            <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Tu dois payer</h3>
            <p className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
              {myCourtCost} <span className="text-sm text-zinc-500 font-normal">{game.currency || 'XOF'}</span>
            </p>
            {myPledges > 0 && (
              <p className="text-xs text-amber-500 mt-1 font-medium">
                + {myPledges} {game.currency || 'XOF'} pour la lumière
              </p>
            )}
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.96 }}
            onClick={handleToggleRSVP}
            disabled={isSubmitting || (!isAttending && isFull)}
            className={`w-full md:w-auto px-8 py-4 rounded-2xl font-display font-bold tracking-tight text-lg sm:text-xl transition-all flex justify-center items-center gap-2 shadow-xl
              ${isAttending ? 'bg-[#0a0a0c] text-white hover:bg-black border border-white/10' : 
                (!isAttending && isFull) ? 'bg-red-950/30 text-red-500 cursor-not-allowed border border-red-900/30 shadow-none' :
                'bg-white text-black hover:bg-zinc-200'}`}
          >
            {isAttending ? '❌ Annuler' : (isFull ? '🚫 Complet' : `✅ Je participe · ${game.perHeadCost} ${game.currency || 'XOF'}`)}
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Lights Pool - Only shown when light is NOT included */}
        {!lightIncluded && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="premium-glass p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Zap className="text-amber-500" size={20} />
            </div>
            <h2 className="text-xl font-display font-bold text-white tracking-tight">Cagnotte Lumière</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-4 font-medium">L'éclairage n'est pas inclus. Contribuez ici pour financer les lumières.</p>
          
          {/* Recommended per-person contribution */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">💡 Recommandé / joueur</span>
            <span className="text-base font-display font-bold text-amber-400 tracking-tight">
              ~{lightPerPerson} {game.currency || 'XOF'}
            </span>
          </div>
          
          <div className="flex items-center gap-6 mb-8">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-md">
                <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-black/40" />
                <circle 
                  cx="48" cy="48" r={radius} 
                  stroke="url(#gradient)" 
                  strokeWidth="6" fill="transparent" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={strokeDashoffset} 
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out" 
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-display font-bold text-white">{Math.round(lightProgress)}%</span>
              </div>
            </div>
            
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Objectif</div>
              <div className="text-3xl font-display font-bold text-white tracking-tight">{totalPledged.toLocaleString('fr-FR')} <span className="text-sm font-medium text-amber-500">/ {totalLightNeeded.toLocaleString('fr-FR')}</span></div>
              <div className="text-[11px] font-medium text-zinc-500 mt-1">
                {lightCostPerHour.toLocaleString('fr-FR')} {game.currency || 'XOF'}/h × {duration}h
              </div>
            </div>
          </div>

          <form onSubmit={handlePledge} className="flex flex-col gap-3">
            {myPledges > 0 && (
              <div className="text-xs text-amber-500 font-medium text-center">
                Tu as déjà cotisé {myPledges} {game.currency || 'XOF'}. 
                Entre un nouveau montant pour modifier, ou 0 pour annuler.
              </div>
            )}
            <div className="flex gap-2">
              <input 
                type="number" min="0" step="100" required
                value={pledgeAmount}
                onChange={e => setPledgeAmount(e.target.value)}
                placeholder={`Montant ${game.currency || 'XOF'}`}
                className="flex-1 p-4 bg-black/40 border border-white/5 rounded-2xl text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors font-display text-lg"
              />
              <button type="submit" disabled={isSubmitting || pledgeAmount === ''} className="bg-amber-500 text-black font-display font-bold tracking-tight px-6 rounded-2xl hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-lg shadow-amber-500/20">
                {myPledges > 0 ? 'Modifier' : 'Donner'}
              </button>
            </div>
          </form>
        </motion.div>
        )}

        {/* Players List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="premium-glass flex flex-col min-h-[300px]">
           <div className="p-6 border-b border-white/5 flex justify-between items-center">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-lg font-display">
                 {rsvps.length}
               </div>
               <h2 className="text-xl font-display font-bold text-white tracking-tight">Joueurs</h2>
             </div>
             
             {user.uid === game.organizerId && rsvps.length > 1 && (
               <button 
                 onClick={handleGenerateTeams}
                 disabled={isSubmitting}
                 className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-zinc-300 px-4 py-2.5 rounded-full font-bold transition-colors disabled:opacity-50 border border-white/5"
               >
                 <Shuffle size={14} /> Générer Équipes
               </button>
             )}
           </div>
           
           <div className="p-3 flex-1 overflow-y-auto font-sans">
             {game.teamA && game.teamA.length > 0 ? (
               <div className="space-y-4 p-3">
                 <div className="bg-red-950/20 rounded-2xl p-5 border border-red-500/10">
                   <h3 className="text-[11px] font-bold text-red-500 mb-3 uppercase tracking-widest text-center">Équipe Rouge</h3>
                   <div className="flex flex-wrap justify-center gap-2">
                     {game.teamA.map(userId => {
                       const rsvp = rsvps.find(r => r.userId === userId);
                       if (!rsvp) return null;
                       return <span key={userId} className="text-[13px] font-medium text-white bg-red-500/20 px-4 py-1.5 rounded-full border border-red-500/20">{rsvp.userName}</span>;
                     })}
                   </div>
                 </div>
                 <div className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest">VS</div>
                 <div className="bg-sky-950/20 rounded-2xl p-5 border border-sky-500/10">
                   <h3 className="text-[11px] font-bold text-sky-500 mb-3 uppercase tracking-widest text-center">Équipe Bleue</h3>
                   <div className="flex flex-wrap justify-center gap-2">
                     {game.teamB.map(userId => {
                       const rsvp = rsvps.find(r => r.userId === userId);
                       if (!rsvp) return null;
                       return <span key={userId} className="text-[13px] font-medium text-white bg-sky-500/20 px-4 py-1.5 rounded-full border border-sky-500/20">{rsvp.userName}</span>;
                     })}
                   </div>
                 </div>
               </div>
             ) : (
               <ul className="space-y-1.5">
                 {rsvps.length === 0 ? (
                   <div className="text-center text-zinc-500 text-sm py-10 font-medium">Aucun joueur pour le moment.</div>
                 ) : (
                   rsvps.map((rsvp, idx) => {
                     const playerPledge = pledges.filter(p => p.userId === rsvp.userId).reduce((acc, p) => acc + p.amount, 0);
                     return (
                       <li key={rsvp.id} className="flex justify-between items-center p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                         <div className="flex items-center gap-4">
                           <div className="text-[11px] text-zinc-600 font-bold w-4 text-right">{idx + 1}.</div>
                           <div className="w-10 h-10 rounded-full bg-[#0a0a0c] border border-white/10 flex items-center justify-center overflow-hidden">
                              {rsvp.photoURL ? <img src={rsvp.photoURL} alt="" className="w-full h-full object-cover"/> : <span className="text-sm font-bold text-zinc-400">{rsvp.userName.charAt(0)}</span>}
                           </div>
                           <span className="font-semibold text-[15px] text-white tracking-tight">{rsvp.userName}</span>
                         </div>
                         <div className="text-right">
                           <div className="font-bold text-white text-[15px]">{game.perHeadCost + playerPledge} <span className="text-[10px] font-normal text-zinc-500">{game.currency || 'XOF'}</span></div>
                           {playerPledge > 0 && <div className="text-[11px] text-amber-500 font-medium">+{playerPledge} 💡</div>}
                         </div>
                       </li>
                     );
                   })
                 )}
               </ul>
             )}
           </div>
           
        </motion.div>
      </div>

      <div className="mt-8">
        <EmojiReactions gameId={gameId} user={user} />
      </div>

      {user.uid === game.organizerId && (
        <div className="flex justify-center mt-8">
          <button onClick={handleDeleteGame} className="text-[13px] font-medium flex items-center gap-2 text-zinc-500 hover:text-red-400 transition-colors px-4 py-2 rounded-full hover:bg-red-500/10">
            <Trash2 size={16} /> Supprimer ce match
          </button>
        </div>
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 max-w-sm w-full relative flex flex-col items-center shadow-2xl"
            >
              <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
              <h3 className="text-2xl font-display font-bold text-white tracking-tight mb-6 text-center">Scanner pour Rejoindre</h3>
              <div className="bg-white p-5 rounded-2xl mb-6 shadow-inner">
                <QRCodeSVG value={window.location.href} size={200} fgColor="#000000" bgColor="#ffffff" />
              </div>
              <p className="text-zinc-400 text-sm text-center font-medium">Partagez ce code avec les joueurs sur place.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
