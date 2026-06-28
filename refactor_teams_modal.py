import re

path = 'src/components/GameSession.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add showTeamsModal state
content = content.replace("  const [showQR, setShowQR] = useState(false);", "  const [showQR, setShowQR] = useState(false);\n  const [showTeamsModal, setShowTeamsModal] = useState(false);")

# Find the entire teams render block
start_marker = """              {(game.teams || (game.teamA && game.teamA.length > 0)) && ("""
end_marker = """              )}
              
              <div className="px-1">"""

idx_start = content.find(start_marker)
idx_end = content.find(end_marker) + len("""              )}""")

teams_block = content[idx_start:idx_end]

# Remove the teams block from its original location
new_content = content[:idx_start] + content[idx_end:]

# Create the Modal version of the teams block
modal_block = """      {/* Teams Modal */}
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
              
""" + teams_block + """
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>"""

# Inject the modal block at the end of the file, just before the QR Code Modal
qr_modal_marker = """      {/* QR Code Modal */}"""
new_content = new_content.replace(qr_modal_marker, modal_block + "\n\n" + qr_modal_marker)


# Replace the Shuffle Generate Button to handle opening the modal
old_generate_button = """             {user.uid === game.organizerId && rsvps.length > 1 && (
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
                   onClick={handleGenerateTeams}
                   disabled={isSubmitting}
                   className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-text-muted px-4 py-2.5 rounded-full font-bold transition-colors disabled:opacity-50 border border-border"
                 >
                   <Shuffle size={14} /> Générer
                 </button>
               </div>
             )}"""

new_action_button = """             {(game.teams || (game.teamA && game.teamA.length > 0)) ? (
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
             ) : null}"""

new_content = new_content.replace(old_generate_button, new_action_button)

# Also remove the "Tous les participants" header since teams are no longer taking up space
new_content = new_content.replace("""                {(game.teams || (game.teamA && game.teamA.length > 0)) && (
                  <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3 px-2">Tous les participants</h3>
                )}""", "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("GameSession teams moved to modal successfully.")
