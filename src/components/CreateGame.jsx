import { useState, useMemo } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PlusCircle, MapPin, X, Lightbulb, DollarSign, Users, Clock, Info, Navigation2, User, Timer, FileText, Check, CircleDot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import LocationAutocomplete from './LocationAutocomplete';
import PageHeader from './ui/PageHeader';
import CourtMap from './CourtMap';
import { DEFAULT_CENTER } from '../lib/mapStyles';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Pricing model options
const PRICING_MODELS = [
  { id: 'per_person', label: 'Par Joueur', desc: 'Chaque joueur paie un montant fixe', icon: User },
  { id: 'per_hour', label: 'Par Heure', desc: 'Location du terrain à l\'heure', icon: Timer },
  { id: 'flat', label: 'Forfait', desc: 'Prix fixe pour toute la session', icon: FileText },
];

export default function CreateGame({ user, onGameCreated, onCancel, initialCourt }) {
  const [formData, setFormData] = useState({
    locationName: initialCourt?.name || '',
    courtId: initialCourt?.id || null,
    mapPosition: initialCourt?.coordinates || null,
    date: '',
    time: '',
    duration: '2',
    customDuration: '',
    maxPlayers: '10',
    customPlayers: '',
    pricingModel: 'per_person',
    currency: 'XOF',
    courtCost: '',
    lightIncluded: true,
    lightCostPerHour: '',
    notes: initialCourt?.notes || '',
  });
  
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(!!initialCourt);

  const finalDuration = formData.duration === 'custom' ? Number(formData.customDuration) : Number(formData.duration);
  const finalPlayers = formData.maxPlayers === 'custom' ? Number(formData.customPlayers) : Number(formData.maxPlayers);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        location: formData.locationName,
        courtId: formData.courtId,
        courtImageUrl: initialCourt?.imageUrl || null,
        courtImages: initialCourt?.images || [],
        coordinates: formData.mapPosition ? { lat: formData.mapPosition.lat, lng: formData.mapPosition.lng } : null,
        date: formData.date,
        time: formData.time,
        duration: finalDuration,
        maxPlayers: finalPlayers,
        pricingModel: formData.pricingModel,
        currency: formData.currency,
        courtCost: Number(formData.courtCost),
        lightIncluded: formData.lightIncluded,
        lightCostPerHour: formData.lightIncluded ? 0 : Number(formData.lightCostPerHour || 0),
        notes: formData.notes,
        organizerId: user.uid,
        organizerName: user.profileName,
        createdAt: serverTimestamp(),
        status: 'open',
      };

      // Calculate perHeadCost for backward compat + display
      if (formData.pricingModel === 'per_person') {
        payload.perHeadCost = Number(formData.courtCost);
      } else if (formData.pricingModel === 'per_hour') {
        const totalCourt = Number(formData.courtCost) * finalDuration;
        payload.perHeadCost = Math.ceil(totalCourt / finalPlayers);
        payload.totalCourtCost = totalCourt;
      } else {
        // flat
        payload.perHeadCost = Math.ceil(Number(formData.courtCost) / finalPlayers);
        payload.totalCourtCost = Number(formData.courtCost);
      }

      const gameRef = await addDoc(collection(db, 'games'), payload);
      onGameCreated(gameRef.id);
    } catch (error) {
      console.error("Error creating game", error);
    }
    setLoading(false);
  };

  const formattedDate = useMemo(() => {
    if (!formData.date) return '';
    try {
      return format(parseISO(formData.date), 'EEEE d MMMM yyyy', { locale: fr });
    } catch(e) {
      return '';
    }
  }, [formData.date]);

  // Cost breakdown
  const costBreakdown = useMemo(() => {
    const cost = Number(formData.courtCost) || 0;
    const players = finalPlayers || 1;
    const hours = finalDuration || 1;
    const lightHr = formData.lightIncluded ? 0 : (Number(formData.lightCostPerHour) || 0);
    
    let courtPerPerson = 0;
    let totalCourt = 0;

    if (formData.pricingModel === 'per_person') {
      courtPerPerson = cost;
      totalCourt = cost * players;
    } else if (formData.pricingModel === 'per_hour') {
      totalCourt = cost * hours;
      courtPerPerson = Math.ceil(totalCourt / players);
    } else {
      totalCourt = cost;
      courtPerPerson = Math.ceil(cost / players);
    }

    const totalLight = lightHr * hours;
    const lightPerPerson = players > 0 ? Math.ceil(totalLight / players) : 0;
    const totalPerPerson = courtPerPerson + lightPerPerson;
    const grandTotal = totalCourt + totalLight;

    return { courtPerPerson, totalCourt, lightPerPerson, totalLight, totalPerPerson, grandTotal };
  }, [formData, finalDuration, finalPlayers]);

  const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  // Default to Lomé, Togo
  const defaultCenter = DEFAULT_CENTER;

  return (
    <div className="pb-10 space-y-6">
      <PageHeader
        title="Créer un match"
        subtitle="Configure le terrain, les joueurs et les frais"
        action={onCancel && (
          <button onClick={onCancel} className="p-2 bg-white/5 border border-border rounded-xl text-text-muted hover:text-text transition-colors">
            <X size={20} />
          </button>
        )}
      />
      
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-6 lg:space-y-0">
        
        {/* Section 1: Lieu — full width on desktop */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="apple-card p-6 space-y-5 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <MapPin className="text-primary" size={18} />
            <h3 className="font-display font-medium text-lg text-text tracking-wide">Lieu de l'Événement</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <LocationAutocomplete 
                value={formData.locationName}
                onChange={(placeData) => {
                  if (placeData) {
                    setFormData(prev => ({
                      ...prev,
                      locationName: placeData.name,
                      mapPosition: placeData.lat != null && placeData.lng != null
                        ? { lat: placeData.lat, lng: placeData.lng }
                        : prev.mapPosition,
                    }));
                    if (placeData.lat != null && placeData.lng != null) {
                      setShowMap(true);
                    }
                  } else {
                    update('locationName', '');
                    update('mapPosition', null);
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-surface border border-dashed border-border text-sm font-medium text-text-muted hover:bg-surface hover:border-primary/40 transition-all"
              >
                <Navigation2 size={16} className="text-primary" />
                {formData.mapPosition ? 'Changer la position sur la carte' : 'Ajouter une position exacte (Optionnel)'}
              </button>

              <AnimatePresence>
                {showMap && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-2"
                  >
                    <CourtMap
                      className="court-map-wrapper court-map-wrapper--picker"
                      coordinates={formData.mapPosition ? { lat: formData.mapPosition.lat, lng: formData.mapPosition.lng } : null}
                      center={formData.mapPosition ? [formData.mapPosition.lat, formData.mapPosition.lng] : defaultCenter}
                      zoom={formData.mapPosition ? 16 : 12}
                      interactive
                      onPositionChange={(pos) => update('mapPosition', pos)}
                      hint="Appuie sur la carte pour placer le repère"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Section 2: Quand ? */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="apple-card p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Clock className="text-sky-400" size={18} />
            <h3 className="font-display font-medium text-lg text-text tracking-wide">Date & Heure</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Date</label>
              <input 
                required type="date"
                className="w-full p-4 bg-surface border border-border text-text rounded-xl focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none [color-scheme:dark] font-sans shadow-inner"
                value={formData.date}
                onChange={e => update('date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Heure</label>
              <input 
                required type="time"
                className="w-full p-4 bg-surface border border-border text-text rounded-xl focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none [color-scheme:dark] font-sans shadow-inner"
                value={formData.time}
                onChange={e => update('time', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Durée (heures)</label>
            <div className="flex flex-wrap gap-2">
              {['1', '1.5', '2', '3', 'custom'].map(h => (
                <button 
                  key={h} type="button"
                  onClick={() => update('duration', h)}
                  className={`flex-1 min-w-[60px] py-3 rounded-xl text-sm font-medium transition-all border ${
                    formData.duration === h 
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/50 shadow-[0_0_15px_rgba(56,189,248,0.15)]' 
                      : 'bg-surface text-text-muted border-border hover:border-border'
                  }`}
                >
                  {h === 'custom' ? 'Autre' : `${h}h`}
                </button>
              ))}
            </div>
            <AnimatePresence mode="popLayout">
              {formData.duration === 'custom' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <input 
                    type="number" step="0.5" min="0.5" required
                    placeholder="Nombre d'heures (ex: 4)"
                    className="w-full mt-3 p-4 bg-surface border border-sky-500/30 text-text rounded-xl focus:ring-1 focus:ring-sky-500 outline-none font-sans"
                    value={formData.customDuration}
                    onChange={e => update('customDuration', e.target.value)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <AnimatePresence>
            {formattedDate && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="text-center text-sm font-medium text-sky-400 capitalize bg-sky-950/20 p-3 rounded-lg border border-sky-900/30"
              >
                {formattedDate} à {formData.time} · {finalDuration || '?'}h
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Section 3: Joueurs */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="apple-card p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Users className="text-emerald-400" size={18} />
            <h3 className="font-display font-medium text-lg text-text tracking-wide">Participants</h3>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Nombre maximum</label>
            <div className="flex flex-wrap gap-2">
              {['6', '8', '10', '12', '16', 'custom'].map(n => (
                <button 
                  key={n} type="button"
                  onClick={() => update('maxPlayers', n)}
                  className={`flex-1 min-w-[50px] py-3 rounded-xl text-sm font-medium transition-all border ${
                    formData.maxPlayers === n 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.15)]' 
                      : 'bg-surface text-text-muted border-border hover:border-border'
                  }`}
                >
                  {n === 'custom' ? 'Autre' : n}
                </button>
              ))}
            </div>
            <AnimatePresence mode="popLayout">
              {formData.maxPlayers === 'custom' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <input 
                    type="number" min="2" required
                    placeholder="Nombre exact de joueurs"
                    className="w-full mt-3 p-4 bg-surface border border-emerald-500/30 text-text rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none font-sans"
                    value={formData.customPlayers}
                    onChange={e => update('customPlayers', e.target.value)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Section 4: Tarification du Terrain */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="apple-card p-6 space-y-5">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="text-yellow-400" size={18} />
              <h3 className="font-display font-medium text-lg text-text tracking-wide">Tarification</h3>
            </div>
            <select 
              value={formData.currency}
              onChange={e => update('currency', e.target.value)}
              className="bg-surface border border-border text-text text-sm rounded-lg px-2 py-1 outline-none focus:border-yellow-500 transition-colors font-bold"
            >
              <option value="XOF">XOF (CFA)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Mode de facturation</label>
            <div className="grid grid-cols-3 gap-3">
              {PRICING_MODELS.map(model => (
                <button 
                  key={model.id} type="button"
                  onClick={() => update('pricingModel', model.id)}
                  className={`p-3 rounded-xl text-center transition-all border ${
                    formData.pricingModel === model.id 
                      ? 'bg-yellow-500/15 border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.1)]' 
                      : 'bg-surface border-border hover:border-border'
                  }`}
                >
                  <div className="flex justify-center mb-1.5">
                    <model.icon size={22} className={formData.pricingModel === model.id ? 'text-yellow-400' : 'text-text-muted'} />
                  </div>
                  <div className={`text-[11px] font-medium tracking-wide ${formData.pricingModel === model.id ? 'text-yellow-400' : 'text-text-muted'}`}>{model.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">
              {formData.pricingModel === 'per_person' && 'Coût terrain par joueur'}
              {formData.pricingModel === 'per_hour' && 'Coût terrain par heure'}
              {formData.pricingModel === 'flat' && 'Coût total du terrain (forfait)'}
            </label>
            <div className="relative">
              <input 
                required type="number" min="0" step="50"
                className="w-full p-4 bg-surface border border-border text-text rounded-xl focus:ring-1 focus:ring-yellow-500 outline-none pr-16 font-display font-medium text-2xl"
                placeholder={formData.pricingModel === 'per_person' ? '1000' : formData.pricingModel === 'per_hour' ? '5000' : '15000'}
                value={formData.courtCost}
                onChange={e => update('courtCost', e.target.value)}
              />
              <span className="absolute right-5 top-5 text-text-muted font-bold text-sm uppercase">{formData.currency}</span>
            </div>
            <p className="text-[11px] text-text-muted pl-1">
              {formData.pricingModel === 'per_person' && 'Le montant que chaque joueur paie au propriétaire du terrain.'}
              {formData.pricingModel === 'per_hour' && `Le prix horaire du terrain. Sera divisé entre les ${finalPlayers || '?'} joueurs.`}
              {formData.pricingModel === 'flat' && `Le coût total fixe pour la session. Sera divisé entre les ${finalPlayers || '?'} joueurs.`}
            </p>
          </div>
        </motion.div>

        {/* Section 5: Éclairage */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="apple-card p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Lightbulb className="text-amber-400" size={18} />
            <h3 className="font-display font-medium text-lg text-text tracking-wide">Éclairage</h3>
          </div>

          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => update('lightIncluded', true)}
              className={`flex-1 p-3.5 rounded-xl text-[13px] font-medium transition-all border text-center ${
                formData.lightIncluded 
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.1)]' 
                  : 'bg-surface text-text-muted border-border'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5"><Check size={14} /> Inclus</span>
            </button>
            <button 
              type="button"
              onClick={() => update('lightIncluded', false)}
              className={`flex-1 p-3.5 rounded-xl text-[13px] font-medium transition-all border text-center ${
                !formData.lightIncluded 
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.1)]' 
                  : 'bg-surface text-text-muted border-border'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5"><Lightbulb size={14} /> Cotisation séparée</span>
            </button>
          </div>

          <AnimatePresence>
            {!formData.lightIncluded && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden pt-2"
              >
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Coût lumière par heure</label>
                <div className="relative">
                  <input 
                    type="number" min="0" step="50"
                    className="w-full p-4 bg-surface border border-border text-text rounded-xl focus:ring-1 focus:ring-amber-500 outline-none pr-16 font-display font-medium text-2xl"
                    placeholder="2500"
                    value={formData.lightCostPerHour}
                    onChange={e => update('lightCostPerHour', e.target.value)}
                  />
                  <span className="absolute right-5 top-5 text-text-muted font-bold text-sm uppercase">{formData.currency}</span>
                </div>
                <p className="text-[11px] text-text-muted pl-1">
                  Coût additionnel pour l'éclairage, partagé entre tous les joueurs.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Section 6: Notes */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="apple-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Info className="text-text-muted" size={18} />
            <h3 className="font-display font-medium text-lg text-text tracking-wide">Notes Additionnelles</h3>
          </div>
          <textarea 
            rows={3}
            className="w-full p-4 bg-surface border border-border text-text rounded-xl focus:ring-1 focus:ring-primary outline-none resize-none placeholder:text-text-muted font-sans text-sm shadow-inner"
            placeholder="Ex: Apporter des chasubles, terrain en béton, on joue à 5 contre 5 sur demi-terrain..."
            value={formData.notes}
            onChange={e => update('notes', e.target.value)}
          />
        </motion.div>

        </div>

        {/* Cost Breakdown Preview — full width */}
        <AnimatePresence>
          {Number(formData.courtCost) > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative p-8 rounded-2xl border border-primary/30 overflow-hidden bg-gradient-to-br from-[#1a0f05] to-[#0a0a0c] shadow-[0_15px_40px_rgba(255,77,0,0.15)]"
            >
              {/* Background Glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-[40px]"></div>
              
              <h3 className="font-display text-xl text-text tracking-tight mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span> 
                Résumé des Coûts
              </h3>
              
              <div className="space-y-4 font-sans relative z-10">
                <div className="flex justify-between items-center text-text-muted">
                  <span className="flex items-center gap-2 text-sm font-medium"><CircleDot size={14} className="text-primary" /> Terrain / joueur</span>
                  <span className="font-semibold text-text">{costBreakdown.courtPerPerson.toLocaleString('fr-FR')} {formData.currency}</span>
                </div>
                {!formData.lightIncluded && Number(formData.lightCostPerHour) > 0 && (
                  <div className="flex justify-between items-center text-text-muted">
                    <span className="flex items-center gap-2 text-sm font-medium"><Lightbulb size={14} className="text-amber-400" /> Lumière / joueur</span>
                    <span className="font-semibold text-text">{costBreakdown.lightPerPerson.toLocaleString('fr-FR')} {formData.currency}</span>
                  </div>
                )}
                
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent my-4"></div>
                
                <div className="flex justify-between items-end">
                  <span className="text-text-muted font-medium text-xs uppercase tracking-widest pb-1">Total Individuel</span>
                  <div className="text-right">
                    <span className="text-4xl font-display font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#ff8c00] tracking-tight">
                      {costBreakdown.totalPerPerson.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-text-muted font-bold ml-2 text-sm">{formData.currency}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-[11px] text-text-muted pt-3 border-t border-border mt-2 font-medium">
                  <span>Cagnotte totale estimée ({finalPlayers} j. × {finalDuration}h)</span>
                  <span className="text-text-muted">{costBreakdown.grandTotal.toLocaleString('fr-FR')} {formData.currency}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button 
          whileTap={{ scale: 0.96 }}
          type="submit" 
          disabled={loading}
          className="relative w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-zinc-200 font-display font-semibold text-xl py-5 px-6 rounded-2xl transition-all shadow-xl disabled:opacity-50 mt-4 overflow-hidden group"
        >
          {loading ? (
            <span className="animate-pulse">Création en cours...</span>
          ) : (
            <>
              Lancer le Match 
              <PlusCircle size={22} className="group-hover:rotate-90 transition-transform duration-300" />
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}
