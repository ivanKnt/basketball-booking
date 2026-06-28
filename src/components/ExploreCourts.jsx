import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { MapPin, Plus, ImagePlus, Loader2, X, Search, Wallet } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import LocationAutocomplete from './LocationAutocomplete';
import { motion, AnimatePresence } from 'motion/react';

export default function ExploreCourts({ user, onSelectCourt }) {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Court State
  const [newCourt, setNewCourt] = useState({ 
    name: '', 
    notes: '', 
    mapPosition: null,
    type: 'outdoor', // outdoor, indoor
    city: '',
    price: 'free', // free, paid
    priceDetails: '',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'courts'), 
      (snapshot) => {
        setCourts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching courts:", error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (files.some(f => f.size > 5 * 1024 * 1024)) {
      alert("Une image est trop grande (max 5 Mo)");
      return;
    }
    
    if (files.length > 5) {
      alert("Maximum 5 images autorisées");
      return;
    }

    setImageFiles(files);
    
    const previews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result);
        if (previews.length === files.length) {
          setImagePreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddCourt = async (e) => {
    e.preventDefault();
    if (!newCourt.name) return alert("Veuillez donner un nom au terrain");
    
    setIsSubmitting(true);
    try {
      let imageUrls = [];
      let imageUrl = null; // keep for backward compatibility
      
      if (imageFiles && imageFiles.length > 0) {
        for (const file of imageFiles) {
          const storageRef = ref(storage, `courts/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          imageUrls.push(url);
        }
        imageUrl = imageUrls[0];
      }

      await addDoc(collection(db, 'courts'), {
        name: newCourt.name,
        notes: newCourt.notes,
        type: newCourt.type,
        city: newCourt.city,
        price: newCourt.price,
        priceDetails: newCourt.priceDetails,
        coordinates: newCourt.mapPosition ? { lat: newCourt.mapPosition.lat, lng: newCourt.mapPosition.lng } : null,
        imageUrl,
        images: imageUrls,
        addedBy: user.uid,
        createdAt: serverTimestamp()
      });

      setShowAddModal(false);
      setNewCourt({ name: '', notes: '', mapPosition: null, type: 'outdoor', city: '', price: 'free', priceDetails: '' });
      setImageFiles([]);
      setImagePreviews([]);
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      alert("Erreur: " + error.message);
    }
    setIsSubmitting(false);
  };

  const filteredCourts = courts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Terrains"
        subtitle={`${courts.length} terrain${courts.length > 1 ? 's' : ''} référencé${courts.length > 1 ? 's' : ''}`}
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus size={16} /> Ajouter
          </button>
        }
      />

      <div className="flex items-center bg-surface p-2 rounded-2xl border border-border sticky top-4 z-30 lg:max-w-md">
        <Search className="ml-3 text-text-muted shrink-0" size={16} />
        <input
          type="text"
          placeholder="Rechercher un terrain..."
          className="flex-1 bg-transparent py-2.5 px-3 text-text text-sm outline-none placeholder:text-text-muted"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
        {filteredCourts.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white/5 rounded-3xl border border-border">
            <MapPin className="mx-auto text-text-muted mb-4" size={48} />
            <h3 className="text-xl font-display font-semibold text-text mb-2">Aucun terrain trouvé</h3>
            <p className="text-text-muted text-sm">Soyez le premier à ajouter votre terrain de jeu favori !</p>
          </div>
        ) : (
          filteredCourts.map(court => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              key={court.id} 
              className="apple-card rounded-3xl overflow-hidden group border border-border hover:border-border transition-all cursor-pointer"
              onClick={() => onSelectCourt && onSelectCourt(court)}
            >
              <div className="h-48 bg-surface relative overflow-hidden flex items-center justify-center">
                {court.images && court.images.length > 0 ? (
                  <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar group-hover:scale-105 transition-transform duration-500">
                    {court.images.map((img, idx) => (
                      <img key={idx} src={img} alt={`${court.name} ${idx+1}`} className="w-full h-full shrink-0 object-cover snap-start" />
                    ))}
                  </div>
                ) : court.imageUrl ? (
                  <img src={court.imageUrl} alt={court.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <MapPin size={48} className="text-zinc-800" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <div className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold  ${court.type === 'indoor' ? 'bg-indigo-500/80 text-text' : 'bg-emerald-500/80 text-text'}`}>
                    {court.type === 'indoor' ? 'Intérieur' : 'Extérieur'}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold  ${court.price === 'free' ? 'bg-green-500/80 text-text' : 'bg-amber-500/80 text-text'}`}>
                    {court.price === 'free' ? 'Gratuit' : 'Payant'}
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-display font-semibold text-text tracking-tight drop-shadow-md">{court.name}</h3>
                  {court.city && <div className="text-xs font-medium text-text-muted drop-shadow-md mt-1 flex items-center gap-1"><MapPin size={10} /> {court.city}</div>}
                </div>
              </div>
              <div className="p-5">
                {court.notes && (
                  <p className="text-sm text-text-muted mb-4 line-clamp-2">{court.notes}</p>
                )}
                {court.price === 'paid' && court.priceDetails && (
                  <p className="text-[11px] text-amber-500/80 mb-4 font-medium flex items-center gap-1.5">
                    <Wallet size={12} /> {court.priceDetails}
                  </p>
                )}
                <div className="flex gap-2">
                  {court.coordinates && (
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${court.coordinates.lat},${court.coordinates.lng}`} 
                      target="_blank" rel="noopener noreferrer"
                      className="text-[10px] uppercase tracking-widest font-bold bg-white/10 hover:bg-white/20 text-text px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                      onClick={e => e.stopPropagation()}
                    >
                      <MapPin size={12} /> Y aller
                    </a>
                  )}
                  {onSelectCourt && (
                    <button className="text-[10px] uppercase tracking-widest font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full ml-auto">
                      Sélectionner
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-surface p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="bg-surface sm:border border-border sm:rounded-3xl w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg flex flex-col"
            >
              <div className="flex justify-between items-center p-4 sm:p-6 border-b border-border sticky top-0 bg-surface z-10 sm:rounded-t-3xl">
                <h2 className="text-xl sm:text-2xl font-display font-semibold text-text tracking-tight">Nouveau Terrain</h2>
                <button type="button" onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-text-muted hover:text-text transition-colors">
                  <X size={16} />
                </button>
              </div>

              <form id="add-court-form" onSubmit={handleAddCourt} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 pb-24 sm:pb-6">
                
                {/* Image Upload */}
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest pl-1">Photo du terrain</label>
                  {imagePreviews && imagePreviews.length > 0 ? (
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory hide-scrollbar">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative rounded-xl overflow-hidden w-32 shrink-0 aspect-square border border-border snap-start">
                          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => {
                            const newFiles = [...imageFiles]; newFiles.splice(idx, 1);
                            const newPreviews = [...imagePreviews]; newPreviews.splice(idx, 1);
                            setImageFiles(newFiles); setImagePreviews(newPreviews);
                          }} className="absolute top-1 right-1 bg-black/50 p-1.5 rounded-full text-white hover:bg-black/80 transition-colors backdrop-blur-sm">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <label className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-colors overflow-hidden border-border hover:border-primary/50 bg-surface">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImagePlus className="w-8 h-8 text-text-muted mb-3" />
                        <p className="text-sm text-text-muted font-medium">Appuyez pour ajouter des photos</p>
                        <p className="text-xs text-text-muted mt-1">Jusqu'à 5 images (PNG, JPG, max 5MB)</p>
                      </div>
                      <input type="file" multiple className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  )}
                </div>

                <LocationAutocomplete 
                  value={newCourt.name}
                  onChange={(place) => {
                    if (place) {
                      setNewCourt(prev => ({ ...prev, name: place.name, mapPosition: { lat: place.lat, lng: place.lng } }));
                    } else {
                      setNewCourt(prev => ({ ...prev, name: '', mapPosition: null }));
                    }
                  }}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Type de Terrain</label>
                    <select 
                      className="w-full p-4 bg-surface border border-border text-text rounded-2xl outline-none focus:border-primary appearance-none"
                      value={newCourt.type}
                      onChange={e => setNewCourt(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="outdoor">Extérieur</option>
                      <option value="indoor">Intérieur (Gymnase)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Tarif</label>
                    <select 
                      className="w-full p-4 bg-surface border border-border text-text rounded-2xl outline-none focus:border-primary appearance-none"
                      value={newCourt.price}
                      onChange={e => setNewCourt(prev => ({ ...prev, price: e.target.value }))}
                    >
                      <option value="free">Gratuit</option>
                      <option value="paid">Payant</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Ville / Quartier</label>
                  <input 
                    type="text"
                    required
                    className="w-full p-4 bg-surface border border-border text-text rounded-2xl outline-none focus:border-primary placeholder:text-text-muted"
                    placeholder="ex. Dakar, Mermoz"
                    value={newCourt.city}
                    onChange={e => setNewCourt(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>

                {newCourt.price === 'paid' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Détails du prix</label>
                    <input 
                      type="text"
                      className="w-full p-4 bg-surface border border-border text-text rounded-2xl outline-none focus:border-amber-500 placeholder:text-text-muted"
                      placeholder="ex. 10000 XOF/heure, ou Abonnement"
                      value={newCourt.priceDetails}
                      onChange={e => setNewCourt(prev => ({ ...prev, priceDetails: e.target.value }))}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Détails & Avis personnels</label>
                  <textarea 
                    className="w-full p-4 bg-surface border border-border text-text rounded-2xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-text-muted font-sans shadow-inner min-h-[100px]"
                    placeholder="Comment sont les filets ? Y a-t-il du monde le soir ? Code d'entrée ?"
                    value={newCourt.notes}
                    onChange={e => setNewCourt(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || !newCourt.name}
                  className="w-full bg-primary text-black font-display font-semibold py-4 rounded-2xl tracking-tight text-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Ajouter le terrain'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
