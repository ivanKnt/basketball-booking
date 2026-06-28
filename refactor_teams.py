import re

path = 'src/components/GameSession.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { useEffect, useState } from 'react';",
    "import { useEffect, useState } from 'react';\nimport { useParams, useNavigate } from 'react-router-dom';\nimport { toast } from 'sonner';"
)

# 2. Component signature
content = content.replace(
    "export default function GameSession({ user, gameId, onBack }) {",
    "export default function GameSession({ user }) {\n  const { gameId } = useParams();\n  const navigate = useNavigate();\n  const onBack = () => navigate('/games');\n  const [numTeams, setNumTeams] = useState(2);"
)

# 3. Alerts -> Toasts
content = content.replace("alert(\"Pas assez de joueurs", "toast.error(\"Pas assez de joueurs")
content = content.replace("alert(\"Erreur Firestore", "toast.error(\"Erreur Firestore")

# 4. handleGenerateTeams
old_generate = """  const handleGenerateTeams = async () => {
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
  };"""

new_generate = """  const handleGenerateTeams = async () => {
    if (rsvps.length < numTeams) return toast.error(`Il faut au moins ${numTeams} joueurs pour faire ${numTeams} équipes !`);
    setIsSubmitting(true);
    let shuffled = [...rsvps].sort(() => 0.5 - Math.random());
    
    // Create N teams
    const teams = Array.from({ length: numTeams }, () => []);
    shuffled.forEach((rsvp, index) => {
      teams[index % numTeams].push(rsvp.userId);
    });
    
    try {
      await updateDoc(doc(db, 'games', gameId), { teams, teamA: null, teamB: null });
      toast.success(`${numTeams} équipes générées avec succès !`);
    } catch (e) {
      console.error("Error updating teams", e);
      toast.error("Erreur lors de la création des équipes");
    }
    setIsSubmitting(false);
  };"""

content = content.replace(old_generate, new_generate)

# 5. Team Rendering block
old_team_render = """             {game.teamA && game.teamA.length > 0 ? (
               <div className="space-y-4 p-3">
                 <div className="bg-red-950/20 rounded-2xl p-5 border border-red-500/10">
                   <h3 className="text-[11px] font-bold text-red-500 mb-3 uppercase tracking-widest text-center">Équipe Rouge</h3>
                   <div className="flex flex-wrap justify-center gap-2">
                     {game.teamA.map(userId => {
                       const rsvp = rsvps.find(r => r.userId === userId);
                       if (!rsvp) return null;
                       return <span key={userId} className="text-[13px] font-medium text-text bg-red-500/20 px-4 py-1.5 rounded-full border border-red-500/20">{rsvp.userName}</span>;
                     })}
                   </div>
                 </div>
                 <div className="text-center text-[10px] font-bold text-text-muted uppercase tracking-widest">VS</div>
                 <div className="bg-sky-950/20 rounded-2xl p-5 border border-sky-500/10">
                   <h3 className="text-[11px] font-bold text-sky-500 mb-3 uppercase tracking-widest text-center">Équipe Bleue</h3>
                   <div className="flex flex-wrap justify-center gap-2">
                     {game.teamB.map(userId => {
                       const rsvp = rsvps.find(r => r.userId === userId);
                       if (!rsvp) return null;
                       return <span key={userId} className="text-[13px] font-medium text-text bg-sky-500/20 px-4 py-1.5 rounded-full border border-sky-500/20">{rsvp.userName}</span>;
                     })}
                   </div>
                 </div>
               </div>
             ) : ("""

new_team_render = """             {game.teams || (game.teamA && game.teamA.length > 0) ? (
               <div className="space-y-4 p-3">
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
                         <div className={`${color.bg} rounded-2xl p-5 border ${color.border}`}>
                           <h3 className={`text-[11px] font-bold ${color.text} mb-3 uppercase tracking-widest text-center`}>Équipe {color.name}</h3>
                           <div className="flex flex-wrap justify-center gap-2">
                             {team.map(userId => {
                               const rsvp = rsvps.find(r => r.userId === userId);
                               if (!rsvp) return null;
                               return <span key={userId} className={`text-[13px] font-medium text-text ${color.pillBg} px-4 py-1.5 rounded-full border ${color.pillBorder}`}>{rsvp.userName}</span>;
                             })}
                           </div>
                         </div>
                         {idx < currentTeams.length - 1 && (
                           <div className="text-center text-[10px] font-bold text-text-muted uppercase tracking-widest mt-4">VS</div>
                         )}
                       </div>
                     );
                   });
                 })()}
               </div>
             ) : ("""

content = content.replace(old_team_render, new_team_render)

# 6. Button generation UI
old_button_ui = """             {user.uid === game.organizerId && rsvps.length > 1 && (
               <button 
                 onClick={handleGenerateTeams}
                 disabled={isSubmitting}
                 className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest bg-white/5 hover:bg-white/10 text-text-muted px-4 py-2.5 rounded-full font-bold transition-colors disabled:opacity-50 border border-border"
               >
                 <Shuffle size={14} /> Générer Équipes
               </button>
             )}"""

new_button_ui = """             {user.uid === game.organizerId && rsvps.length > 1 && (
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

content = content.replace(old_button_ui, new_button_ui)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("GameSession refactored successfully.")
