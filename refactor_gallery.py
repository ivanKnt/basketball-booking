import re

# ------------- ExploreCourts.jsx -------------
explore_path = 'src/components/ExploreCourts.jsx'
with open(explore_path, 'r', encoding='utf-8') as f:
    explore_content = f.read()

explore_content = explore_content.replace(
    "const [imageFile, setImageFile] = useState(null);",
    "const [imageFiles, setImageFiles] = useState([]);"
)
explore_content = explore_content.replace(
    "const [imagePreview, setImagePreview] = useState(null);",
    "const [imagePreviews, setImagePreviews] = useState([]);"
)

old_handle_image = """  const handleImageChange = (e) => {
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
  };"""

new_handle_image = """  const handleImageChange = (e) => {
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
  };"""

explore_content = explore_content.replace(old_handle_image, new_handle_image)

old_add_court = """      let imageUrl = null;
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
      setImagePreview(null);"""

new_add_court = """      let imageUrls = [];
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
      setImagePreviews([]);"""

explore_content = explore_content.replace(old_add_court, new_add_court)

# Modify input type="file" to multiple
explore_content = explore_content.replace(
    """<input type="file" accept="image/*" onChange={handleImageChange} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-[13px] font-medium text-text file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[11px] file:font-bold file:uppercase file:tracking-widest file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all outline-none focus:border-primary/50" />""",
    """<input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-[13px] font-medium text-text file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[11px] file:font-bold file:uppercase file:tracking-widest file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all outline-none focus:border-primary/50" />"""
)

# Modify preview display
old_preview = """                {imagePreview && (
                  <div className="mt-4 relative rounded-xl overflow-hidden aspect-video border border-border">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white hover:bg-black/80 transition-colors backdrop-blur-sm">
                      <X size={16} />
                    </button>
                  </div>
                )}"""

new_preview = """                {imagePreviews && imagePreviews.length > 0 && (
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
                )}"""

explore_content = explore_content.replace(old_preview, new_preview)

# Modify Court Card display
old_card_image = """                {court.imageUrl ? (
                  <img src={court.imageUrl} alt={court.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : ("""

new_card_image = """                {court.images && court.images.length > 0 ? (
                  <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar group-hover:scale-105 transition-transform duration-500">
                    {court.images.map((img, idx) => (
                      <img key={idx} src={img} alt={`${court.name} ${idx+1}`} className="w-full h-full shrink-0 object-cover snap-start" />
                    ))}
                  </div>
                ) : court.imageUrl ? (
                  <img src={court.imageUrl} alt={court.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : ("""

explore_content = explore_content.replace(old_card_image, new_card_image)

# Inject hide-scrollbar CSS class if not present in index.css (I'll do that separately, but for inline it's fine)
# Better to use inline styles for hiding scrollbar or assume it exists. Actually we can define it.

with open(explore_path, 'w', encoding='utf-8') as f:
    f.write(explore_content)

# ------------- CreateGame.jsx -------------
create_path = 'src/components/CreateGame.jsx'
with open(create_path, 'r', encoding='utf-8') as f:
    create_content = f.read()

create_content = create_content.replace(
    """courtImageUrl: initialCourt?.imageUrl || null,""",
    """courtImageUrl: initialCourt?.imageUrl || null,\n        courtImages: initialCourt?.images || [],"""
)

with open(create_path, 'w', encoding='utf-8') as f:
    f.write(create_content)


# ------------- GameSession.jsx -------------
game_path = 'src/components/GameSession.jsx'
with open(game_path, 'r', encoding='utf-8') as f:
    game_content = f.read()

old_game_hero = """          {game.courtImageUrl && (
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
              <img src={game.courtImageUrl} alt="Terrain" className="w-full h-full object-cover opacity-20 mix-blend-luminosity" />
            </div>
          )}"""

new_game_hero = """          {(game.courtImages && game.courtImages.length > 0) ? (
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
              <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                {game.courtImages.map((img, idx) => (
                  <img key={idx} src={img} alt={`Terrain ${idx+1}`} className="w-full h-full shrink-0 object-cover opacity-20 mix-blend-luminosity snap-start" />
                ))}
              </div>
            </div>
          ) : game.courtImageUrl && (
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
              <img src={game.courtImageUrl} alt="Terrain" className="w-full h-full object-cover opacity-20 mix-blend-luminosity" />
            </div>
          )}"""

game_content = game_content.replace(old_game_hero, new_game_hero)

with open(game_path, 'w', encoding='utf-8') as f:
    f.write(game_content)

print("Gallery refactoring completed.")
