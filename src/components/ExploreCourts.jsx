import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { MapPin, Plus, ImagePlus, Loader2, X, Search } from 'lucide-react';
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'courts'), (snapshot) => {
      setCourts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("L'image est trop grande (max 5 Mo)");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddCourt = async (e) => {
    e.preventDefault();
    if (!newCourt.name) return alert("Veuillez donner un nom au terrain");
    
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const storageRef = ref(storage, `courts/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
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
        addedBy: user.uid,
        createdAt: serverTimestamp()
      });

      setShowAddModal(false);
      setNewCourt({ name: '', notes: '', mapPosition: null, type: 'outdoor', city: '', price: 'free', priceDetails: '' });
      setImageFile(null);
      setImagePreview(null);
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
      <div className="flex justify-between items-center bg-black/60 p-3 rounded-full border border-white/5 backdrop-blur-md sticky top-4 z-30">
        <div className="relative flex-1 mr-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher un terrain..." 
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-white text-sm outline-none focus:border-primary transition-colors"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 whitespace-nowrap text-sm"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCourts.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white/5 rounded-3xl border border-white/5">
            <MapPin className="mx-auto text-zinc-600 mb-4" size={48} />
            <h3 className="text-xl font-display font-bold text-white mb-2">Aucun terrain trouvé</h3>
            <p className="text-zinc-400 text-sm">Soyez le premier à ajouter votre terrain de jeu favori !</p>
          </div>
        ) : (
          filteredCourts.map(court => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              key={court.id} 
              className="premium-glass rounded-3xl overflow-hidden group border border-white/5 hover:border-white/20 transition-all cursor-pointer"
              onClick={() => onSelectCourt && onSelectCourt(court)}
            >
              <div className="h-48 bg-black/40 relative overflow-hidden flex items-center justify-center">
                {court.imageUrl ? (
                  <img src={court.imageUrl} alt={court.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <MapPin size={48} className="text-zinc-800" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <div className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold backdrop-blur-md ${court.type === 'indoor' ? 'bg-indigo-500/80 text-white' : 'bg-emerald-500/80 text-white'}`}>
                    {court.type === 'indoor' ? 'Intérieur' : 'Extérieur'}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold backdrop-blur-md ${court.price === 'free' ? 'bg-green-500/80 text-white' : 'bg-amber-500/80 text-white'}`}>
                    {court.price === 'free' ? 'Gratuit' : 'Payant'}
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-display font-bold text-white tracking-tight drop-shadow-md">{court.name}</h3>
                  {court.city && <div className="text-xs font-medium text-zinc-300 drop-shadow-md mt-1 flex items-center gap-1"><MapPin size={10} /> {court.city}</div>}
                </div>
              </div>
              <div className="p-5">
                {court.notes && (
                  <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{court.notes}</p>
                )}
                {court.price === 'paid' && court.priceDetails && (
                  <p className="text-[11px] text-amber-500/80 mb-4 font-medium">💰 {court.priceDetails}</p>
                )}
                <div className="flex gap-2">
                  {court.coordinates && (
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${court.coordinates.lat},${court.coordinates.lng}`} 
                      target="_blank" rel="noopener noreferrer"
                      className="text-[10px] uppercase tracking-widest font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
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
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="bg-[#0a0a0c] border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">Nouveau Terrain</h2>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-zinc-400 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddCourt} className="space-y-5">
                
                {/* Image Upload */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest pl-1">Photo du terrain</label>
                  <label className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-colors overflow-hidden ${imagePreview ? 'border-primary/50' : 'border-white/10 hover:border-white/30 bg-black/40'}`}>
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white font-bold text-sm bg-black/60 px-4 py-2 rounded-full">Changer la photo</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImagePlus className="w-8 h-8 text-zinc-500 mb-3" />
                        <p className="text-sm text-zinc-400 font-medium">Appuyez pour ajouter une photo</p>
                        <p className="text-xs text-zinc-600 mt-1">PNG, JPG jusqu'à 5MB</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
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
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Type de Terrain</label>
                    <select 
                      className="w-full p-4 bg-black/40 border border-white/5 text-white rounded-2xl outline-none focus:border-primary appearance-none"
                      value={newCourt.type}
                      onChange={e => setNewCourt(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="outdoor">Extérieur</option>
                      <option value="indoor">Intérieur (Gymnase)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Tarif</label>
                    <select 
                      className="w-full p-4 bg-black/40 border border-white/5 text-white rounded-2xl outline-none focus:border-primary appearance-none"
                      value={newCourt.price}
                      onChange={e => setNewCourt(prev => ({ ...prev, price: e.target.value }))}
                    >
                      <option value="free">Gratuit</option>
                      <option value="paid">Payant</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Ville / Quartier</label>
                  <input 
                    type="text"
                    required
                    className="w-full p-4 bg-black/40 border border-white/5 text-white rounded-2xl outline-none focus:border-primary placeholder:text-zinc-600"
                    placeholder="ex. Dakar, Mermoz"
                    value={newCourt.city}
                    onChange={e => setNewCourt(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>

                {newCourt.price === 'paid' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Détails du prix</label>
                    <input 
                      type="text"
                      className="w-full p-4 bg-black/40 border border-white/5 text-white rounded-2xl outline-none focus:border-amber-500 placeholder:text-zinc-600"
                      placeholder="ex. 10000 XOF/heure, ou Abonnement"
                      value={newCourt.priceDetails}
                      onChange={e => setNewCourt(prev => ({ ...prev, priceDetails: e.target.value }))}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Détails & Avis personnels</label>
                  <textarea 
                    className="w-full p-4 bg-black/40 border border-white/5 text-white rounded-2xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-zinc-600 font-sans shadow-inner min-h-[100px]"
                    placeholder="Comment sont les filets ? Y a-t-il du monde le soir ? Code d'entrée ?"
                    value={newCourt.notes}
                    onChange={e => setNewCourt(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || !newCourt.name}
                  className="w-full bg-primary text-black font-display font-bold py-4 rounded-2xl tracking-tight text-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
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
