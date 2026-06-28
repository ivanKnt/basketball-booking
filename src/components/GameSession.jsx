import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DndContext, useDraggable, useDroppable, TouchSensor, MouseSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { doc, collection, onSnapshot, addDoc, setDoc, serverTimestamp, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, Zap, Trash2, Share2, Shuffle, QrCode, X, Info, Navigation, CircleDot, Lightbulb, Crown, Check, Ban, MessageCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { shareGameInvite, shareGameSummary, shareViaWhatsApp } from '../lib/share';
import LiveReactions from './LiveReactions';
import ShareMenu from './ui/ShareMenu';
import CourtMap from './CourtMap';
import { getDirectionsUrl } from '../lib/mapStyles';
import { searchPlaces } from '../lib/geocoding';


function DraggablePlayer({ userId, userName, color }) {
  const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({ id: userId });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 } : undefined;
  return (
    <span ref={setNodeRef} style={style} {...listeners} {...attributes} className={`touch-none cursor-grab active:cursor-grabbing text-[13px] font-medium text-text ${color.pillBg} px-4 py-1.5 rounded-full border ${color.pillBorder} ${isDragging ? 'opacity-50 shadow-xl scale-105' : ''} transition-shadow`}>
      {userName}
    </span>
  );
}

function DroppableTeam({ teamIndex, team, color, rsvps }) {
  const {isOver, setNodeRef} = useDroppable({ id: `team-${teamIndex}` });
  return (
    <div ref={setNodeRef} className={`${color.bg} rounded-2xl p-5 border ${isOver ? 'border-primary ring-2 ring-primary/50' : color.border} transition-all`}>
      <h3 className={`text-[11px] font-bold ${color.text} mb-3 uppercase tracking-widest text-center`}>Équipe {color.name}</h3>
      <div className="flex flex-wrap justify-center gap-2 min-h-[44px] items-center">
        {team.map(userId => {
          const rsvp = rsvps.find(r => r.userId === userId);
          if (!rsvp) return null;
          return <DraggablePlayer key={userId} userId={userId} userName={rsvp.userName} color={color} />;
        })}
      </div>
    </div>
  );
}

export default function GameSession({ user }) {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const onBack = () => navigate('/games');
  const [numTeams, setNumTeams] = useState(2);
  const [game, setGame] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [resolvedCoords, setResolvedCoords] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeUserId = active.id;
    const overId = String(over.id);
    
    if (overId.startsWith('team-')) {
      const targetTeamIndex = parseInt(overId.split('-')[1]);
      const currentTeams = game.teams || [game.teamA, game.teamB].filter(Boolean);
      
      let currentTeamIndex = -1;
      currentTeams.forEach((team, idx) => {
        if (team.includes(activeUserId)) currentTeamIndex = idx;
      });
      
      if (currentTeamIndex !== -1 && currentTeamIndex !== targetTeamIndex) {
        const newTeams = JSON.parse(JSON.stringify(currentTeams));
        newTeams[currentTeamIndex] = newTeams[currentTeamIndex].filter(id => id !== activeUserId);
        newTeams[targetTeamIndex].push(activeUserId);
        
        try {
          // Optimistic local update not strictly needed as Firestore is fast, but we update remote
          await updateDoc(doc(db, 'games', gameId), { teams: newTeams, teamA: null, teamB: null });
        } catch (e) {
          toast.error('Erreur lors du déplacement');
        }
      }
    }
  };

  useEffect(() => {
    if (game?.coordinates) {
      setResolvedCoords(game.coordinates);
      return;
    }
    if (!game?.location) return;

    const controller = new AbortController();
    searchPlaces(game.location, { signal: controller.signal })
      .then((places) => {
        if (places[0]?.lat != null) {
          setResolvedCoords({ lat: places[0].lat, lng: places[0].lng });
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [game?.coordinates, game?.location]);

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
      <div className="text-primary font-display font-semibold tracking-tight text-2xl uppercase animate-pulse">Chargement...</div>
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
        if (game.teams || game.teamA || game.teamB) {
          const updates = {};
          if (game.teams) {
            updates.teams = game.teams.map(team => team.filter(id => id !== user.uid));
          }
          if (game.teamA) updates.teamA = game.teamA.filter(id => id !== user.uid);
          if (game.teamB) updates.teamB = game.teamB.filter(id => id !== user.uid);
          await updateDoc(doc(db, 'games', gameId), updates);
        }
        await setDoc(doc(db, 'users', user.uid), {
          matchesPlayed: increment(-1)
        }, { merge: true });
        await updateDoc(doc(db, 'games', gameId), {
          currentPlayers: increment(-1)
        });
      } else {
        await setDoc(rsvpRef, {
          userId: user.uid,
          userName: user.profileName,
          photoURL: user.photoURL || null,
          joinedAt: serverTimestamp()
        });
        await setDoc(doc(db, 'users', user.uid), {
          matchesPlayed: increment(1)
        }, { merge: true });
        await updateDoc(doc(db, 'games', gameId), {
          currentPlayers: increment(1)
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
      // Clean up any existing pledges by this user to avoid duplicates if they had old random-ID pledges
      const userPledges = pledges.filter(p => p.userId === user.uid);
      for (const p of userPledges) {
        if (p.id !== user.uid) {
          await deleteDoc(doc(db, 'games', gameId, 'pledges', p.id));
        }
      }

      if (newAmount === 0) {
        await deleteDoc(pledgeRef);
      } else {
        await setDoc(pledgeRef, {
          userId: user.uid,
          userName: user.profileName || 'Utilisateur',
          amount: newAmount,
          updatedAt: serverTimestamp()
        });
      }
      
      if (diff !== 0) {
        await setDoc(doc(db, 'users', user.uid), {
          totalContributed: increment(diff)
        }, { merge: true });
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
      toast.error("Erreur Firestore (Pledge): " + e.message);
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

  const handleShare = () => shareGameInvite(game, window.location.href);

  const handleShareWhatsApp = () => {
    const text = [
      `Match à ${game.location}`,
      `${game.date} à ${game.time}`,
      `${game.perHeadCost} ${game.currency || 'XOF'} par joueur`,
      '',
      `Rejoins sur HoopShare : ${window.location.href}`,
    ].join('\n');
    shareViaWhatsApp(text);
  };

  const handleShareSummary = () => shareGameSummary(game, rsvps, pledges, window.location.href);

  const handleGenerateTeams = async () => {
    if (rsvps.length < 2) return toast.error("Pas assez de joueurs pour générer des équipes !");
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

  // Find top contributor for gamification
  let topContributorId = null;
  if (!lightIncluded && pledges.length > 0) {
    let maxAmount = 0;
    pledges.forEach(p => {
      if (p.amount > maxAmount) {
        maxAmount = p.amount;
        topContributorId = p.userId;
      }
    });
  }


  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-6 pb-24 lg:pb-8">
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-surface p-2 sm:p-2.5 rounded-2xl border border-border sticky top-[max(env(safe-area-inset-top),4.5rem)] z-40 gap-2">
        <button onClick={onBack} className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-white/5 text-text-muted hover:bg-white/10 hover:text-text transition-colors touch-target">
          <ArrowLeft size={20} />
        </button>
        <div className="font-display font-semibold text-base sm:text-lg text-text tracking-tight px-1 truncate flex-1 text-center min-w-0">
          {game.location}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <a href={getDirectionsUrl(game.coordinates, game.location)} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 touch-target">
            <Navigation size={18} />
          </a>
          <button onClick={() => setShowQR(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20">
            <QrCode size={18} />
          </button>
          <ShareMenu onShare={handleShare} onWhatsApp={handleShareWhatsApp} />
        </div>
      </div>

      {/* Hero Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="apple-card p-6 md:p-8 rounded-3xl overflow-hidden relative">
        {game.courtImageUrl && (
          <div className="absolute inset-0 z-0">
            <img src={game.courtImageUrl} alt="Terrain" className="w-full h-full object-cover opacity-20 mix-blend-luminosity" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-black/50 to-transparent"></div>
          </div>
        )}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0"></div>
        
        <div className="flex justify-between items-start mb-5 relative z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-semibold text-text tracking-tight drop-shadow-md leading-tight">{game.location}</h1>
            <div className="text-primary font-medium text-sm mt-2">{game.date} • {game.time} • {duration}h</div>
          </div>
          {game.maxPlayers && (
            <div className={`px-4 py-1.5 font-bold rounded-full text-[10px] uppercase tracking-widest border ${isFull ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-text-muted border-border'}`}>
              {rsvps.length} / {game.maxPlayers} Joueurs
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        <div className="bg-surface rounded-2xl border border-border p-5 mt-4 relative z-10 space-y-3 text-sm shadow-inner">
          <div className="flex justify-between text-text-muted">
            <span className="font-medium flex items-center gap-2"><CircleDot size={14} className="text-primary" /> {courtCostLabel}</span>
            <span className="font-bold text-text">{game.perHeadCost || 0} {game.currency || 'XOF'}</span>
          </div>
          {!lightIncluded && lightCostPerHour > 0 && (
            <div className="flex justify-between text-text-muted">
              <span className="font-medium flex items-center gap-2"><Lightbulb size={14} className="text-amber-400" /> Lumière ({lightCostPerHour} × {duration}h ÷ {game.maxPlayers || '?'} j.)</span>
              <span className="font-bold text-amber-400">Cotisation séparée</span>
            </div>
          )}
          {lightIncluded && (
            <div className="flex justify-between text-emerald-400/80">
              <span className="font-medium flex items-center gap-2"><Lightbulb size={14} className="text-emerald-400" /> Éclairage</span>
              <span className="font-bold flex items-center gap-1"><Check size={14} /> Inclus</span>
            </div>
          )}
          {game.notes && (
            <div className="flex items-start gap-2 text-text-muted pt-3 border-t border-border">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span className="text-[13px] leading-relaxed">{game.notes}</span>
            </div>
          )}
        </div>

        {/* Map View */}
        <div className="mt-5 relative z-10">
          <CourtMap
            className="court-map-wrapper court-map-wrapper--session"
            coordinates={resolvedCoords}
            zoom={16}
            interactive={false}
            showStylePicker
          />
          <a href={getDirectionsUrl(resolvedCoords || game.coordinates, game.location)} target="_blank" rel="noopener noreferrer" className="absolute bottom-3 right-3 z-[1001] bg-emerald-500 hover:bg-emerald-600 text-text text-[11px] font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-colors touch-target">
            <Navigation size={14} /> Y aller
          </a>
        </div>

        <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-surface p-6 rounded-2xl border border-border mt-5 relative z-10">
          <div className="text-center md:text-left">
            <h3 className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-1">Tu dois payer</h3>
            <p className="text-3xl sm:text-4xl font-display font-semibold text-text tracking-tight">
              {myCourtCost} <span className="text-sm text-text-muted font-normal">{game.currency || 'XOF'}</span>
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
            className={`w-full sm:w-auto px-6 sm:px-8 py-4 rounded-2xl font-display font-semibold tracking-tight text-base sm:text-lg transition-all flex justify-center items-center gap-2 shadow-xl
              ${isAttending ? 'bg-surface text-text hover:bg-black border border-border' : 
                (!isAttending && isFull) ? 'bg-red-950/30 text-red-500 cursor-not-allowed border border-red-900/30 shadow-none' :
                'bg-white text-black hover:bg-zinc-200'}`}
          >
            {isAttending ? (
              <><X size={18} /> Annuler</>
            ) : isFull ? (
              <><Ban size={18} /> Complet</>
            ) : (
              <><Check size={18} /> Je participe · {game.perHeadCost} {game.currency || 'XOF'}</>
            )}
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Lights Pool - Only shown when light is NOT included */}
        {!lightIncluded && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="apple-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Zap className="text-amber-500" size={20} />
            </div>
            <h2 className="text-xl font-display font-semibold text-text tracking-tight">Cagnotte Lumière</h2>
          </div>
          <p className="text-sm text-text-muted mb-4 font-medium">L'éclairage n'est pas inclus. Contribuez ici pour financer les lumières.</p>
          
          {/* Recommended per-person contribution */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium flex items-center gap-1.5"><Lightbulb size={12} className="text-amber-400" /> Recommandé / joueur</span>
            <span className="text-base font-display font-semibold text-amber-400 tracking-tight">
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
                  className={`transition-all duration-1000 ease-out ${lightProgress >= 70 && lightProgress < 100 ? 'animate-pulse' : ''}`} 
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={lightProgress >= 100 ? "#10b981" : "#f59e0b"} />
                    <stop offset="100%" stopColor={lightProgress >= 100 ? "#34d399" : "#fbbf24"} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-display font-semibold text-text">{Math.round(lightProgress)}%</span>
              </div>
            </div>
            
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Objectif</div>
              <div className="text-3xl font-display font-semibold text-text tracking-tight">{totalPledged.toLocaleString('fr-FR')} <span className="text-sm font-medium text-amber-500">/ {totalLightNeeded.toLocaleString('fr-FR')}</span></div>
              <div className="text-[11px] font-medium text-text-muted mt-1">
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
            <div className="flex flex-col gap-3">
              <input 
                type="number" min="0" step="1" required
                value={pledgeAmount}
                onChange={e => setPledgeAmount(e.target.value)}
                placeholder={`Montant ${game.currency || 'XOF'}`}
                className="w-full p-4 bg-surface border border-border rounded-2xl text-text outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors font-display text-lg text-center"
              />
              <button type="submit" disabled={isSubmitting || pledgeAmount === ''} className="w-full py-4 bg-amber-500 text-black font-display font-semibold tracking-tight text-lg rounded-2xl hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-lg shadow-amber-500/20">
                {myPledges > 0 ? 'Modifier ma cotisation' : 'Cotiser'}
              </button>
            </div>
          </form>
        </motion.div>
        )}

        {/* Players List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="apple-card flex flex-col min-h-[300px]">
           <div className="p-6 border-b border-border flex justify-between items-center">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-lg font-display">
                 {rsvps.length}
               </div>
               <h2 className="text-xl font-display font-semibold text-text tracking-tight">Joueurs</h2>
             </div>
             
             {(game.teams || (game.teamA && game.teamA.length > 0)) ? (
               <button 
                 onClick={() => setShowTeamsModal(true)}
                 className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-4 py-2.5 rounded-full font-bold transition-colors border border-emerald-500/20"
               >
                 Voir les Équipes
               </button>
             ) : (user.uid === game.organizerId && rsvps.length > 1) ? (
               <div className="flex items-center gap-2">
                 <select 
                   value={numTeams} 
                   onChange={(e) => setNumTeams(Number(e.target.value))}
                   className="bg-surface border border-border text-text-muted text-[11px] font-bold uppercase tracking-widest px-3 py-2.5 rounded-full outline-none"
                 >
                   <option value={2}>2 Équipes</option>
                   <option value={3}>3 Équipes</option>
                   <option value={4}>4 Équipes</option>
                 </select>
                 <button 
                   onClick={() => {
                     handleGenerateTeams().then(() => setShowTeamsModal(true));
                   }}
                   disabled={isSubmitting}
                   className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-text-muted px-4 py-2.5 rounded-full font-bold transition-colors disabled:opacity-50 border border-border"
                 >
                   <Shuffle size={14} /> Générer
                 </button>
               </div>
             ) : null}
           </div>
           
           <div className="p-3 flex-1 overflow-y-auto font-sans">

              
              <div className="px-1">

                <ul className="space-y-1.5">
                  {rsvps.length === 0 ? (
                   <div className="text-center text-text-muted text-sm py-10 font-medium">Aucun joueur pour le moment.</div>
                 ) : (
                   [...rsvps].sort((a, b) => {
                     const pledgeA = pledges.filter(p => p.userId === a.userId).reduce((acc, p) => acc + p.amount, 0);
                     const pledgeB = pledges.filter(p => p.userId === b.userId).reduce((acc, p) => acc + p.amount, 0);
                     return pledgeB - pledgeA;
                   }).map((rsvp, idx) => {
                     const playerPledge = pledges.filter(p => p.userId === rsvp.userId).reduce((acc, p) => acc + p.amount, 0);
                     return (
                       <li key={rsvp.id} className="flex justify-between items-center p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                         <div className="flex items-center gap-4">
                           <div className="text-[11px] text-text-muted font-bold w-4 text-right">{idx + 1}.</div>
                           <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden">
                              {rsvp.photoURL ? <img src={rsvp.photoURL} alt="" className="w-full h-full object-cover"/> : <span className="text-sm font-bold text-text-muted">{rsvp.userName.charAt(0)}</span>}
                           </div>
                           <span className="font-semibold text-[15px] text-text tracking-tight">{rsvp.userName}</span>
                           {!lightIncluded && topContributorId === rsvp.userId && playerPledge > 0 && (
                              <Crown size={16} className="text-amber-400" title="Top contributeur lumière" />
                            )}
                         </div>
                         <div className="text-right">
                           <div className="font-bold text-text text-[15px]">{game.perHeadCost + playerPledge} <span className="text-[10px] font-normal text-text-muted">{game.currency || 'XOF'}</span></div>
                           {playerPledge > 0 && (
                             <div className="text-[11px] text-amber-500 font-medium flex items-center justify-end gap-1">
                               +{playerPledge} <Lightbulb size={10} />
                             </div>
                           )}
                         </div>
                       </li>
                     );
                   })
                 )}
               </ul>
              </div>
           </div>
           
        </motion.div>
      </div>

      <div className="mt-8">
        <LiveReactions gameId={gameId} user={user} />
      </div>

      {user.uid === game.organizerId && (
        <div className="flex justify-center mt-8 gap-4 flex-wrap">
          <button onClick={handleShareSummary} className="text-[13px] font-bold flex items-center gap-2 text-text bg-[#25D366] hover:bg-[#20bd5a] transition-colors px-6 py-3 rounded-full shadow-lg shadow-green-500/20">
            <MessageCircle size={16} /> Récap WhatsApp
          </button>
          <button onClick={handleDeleteGame} className="text-[13px] font-medium flex items-center gap-2 text-text-muted hover:text-red-400 transition-colors px-4 py-3 rounded-full hover:bg-red-500/10">
            <Trash2 size={16} /> Supprimer ce match
          </button>
        </div>
      )}

      {/* Teams Modal */}
      <AnimatePresence>
        {showTeamsModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-surface border-t sm:border border-border rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <div className="sticky top-0 bg-surface z-10 pb-4 mb-4 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-display font-semibold text-text tracking-tight">Gestion des Équipes</h2>
                <button onClick={() => setShowTeamsModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-text-muted hover:text-text hover:bg-white/10 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              {(game.teams || (game.teamA && game.teamA.length > 0)) && (
                <div className="space-y-4 p-3 mb-6">
                 {user.uid === game.organizerId && (
                   <div className="text-center text-xs text-amber-500 font-medium mb-4 flex items-center justify-center gap-2 bg-amber-500/10 py-2 rounded-xl border border-amber-500/20">
                     <Info size={14} /> Maintenez enfoncé un joueur pour le déplacer d'une équipe à l'autre
                   </div>
                 )}
                 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={user.uid === game.organizerId ? handleDragEnd : undefined}>
                   {(() => {
                     const teamColors = [
                       { name: 'Rouge', bg: 'bg-red-950/20', border: 'border-red-500/10', text: 'text-red-500', pillBg: 'bg-red-500/20', pillBorder: 'border-red-500/20' },
                       { name: 'Bleue', bg: 'bg-sky-950/20', border: 'border-sky-500/10', text: 'text-sky-500', pillBg: 'bg-sky-500/20', pillBorder: 'border-sky-500/20' },
                       { name: 'Verte', bg: 'bg-emerald-950/20', border: 'border-emerald-500/10', text: 'text-emerald-500', pillBg: 'bg-emerald-500/20', pillBorder: 'border-emerald-500/20' },
                       { name: 'Violette', bg: 'bg-purple-950/20', border: 'border-purple-500/10', text: 'text-purple-500', pillBg: 'bg-purple-500/20', pillBorder: 'border-purple-500/20' }
                     ];
                     
                     const currentTeams = game.teams || [game.teamA, game.teamB].filter(Boolean);
                     
                     return currentTeams.map((team, idx) => {
                       const color = teamColors[idx % teamColors.length];
                       return (
                         <div key={idx}>
                           {user.uid === game.organizerId ? (
                             <DroppableTeam teamIndex={idx} team={team} color={color} rsvps={rsvps} />
                           ) : (
                             <div className={`${color.bg} rounded-2xl p-5 border ${color.border}`}>
                               <h3 className={`text-[11px] font-bold ${color.text} mb-3 uppercase tracking-widest text-center`}>Équipe {color.name}</h3>
                               <div className="flex flex-wrap justify-center gap-2 min-h-[44px] items-center">
                                 {team.map(userId => {
                                   const rsvp = rsvps.find(r => r.userId === userId);
                                   if (!rsvp) return null;
                                   return <span key={userId} className={`text-[13px] font-medium text-text ${color.pillBg} px-4 py-1.5 rounded-full border ${color.pillBorder}`}>{rsvp.userName}</span>;
                                 })}
                               </div>
                             </div>
                           )}
                           {idx < currentTeams.length - 1 && (
                             <div className="text-center text-[10px] font-bold text-text-muted uppercase tracking-widest mt-4">VS</div>
                           )}
                         </div>
                       );
                     });
                   })()}
                 </DndContext>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-surface p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-surface border border-border rounded-3xl p-8 max-w-sm w-full relative flex flex-col items-center shadow-2xl"
            >
              <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-text-muted hover:text-text p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
              <h3 className="text-2xl font-display font-semibold text-text tracking-tight mb-6 text-center">Scanner pour Rejoindre</h3>
              <div className="bg-white p-5 rounded-2xl mb-6 shadow-inner">
                <QRCodeSVG value={window.location.href} size={200} fgColor="#000000" bgColor="#ffffff" />
              </div>
              <p className="text-text-muted text-sm text-center font-medium">Partagez ce code avec les joueurs sur place.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
