import re

path = 'src/components/GameSession.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Dnd-kit imports
imports = """import { DndContext, useDraggable, useDroppable, TouchSensor, MouseSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';"""
content = content.replace("import { toast } from 'sonner';", f"import {{ toast }} from 'sonner';\n{imports}")

# 2. Add DraggablePlayer and DroppableTeam components at the top, just below imports
components_code = """
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
"""
content = content.replace("export default function GameSession", components_code + "\nexport default function GameSession")


# 3. Add sensors and handleDragEnd inside GameSession
hook_code = """  const [resolvedCoords, setResolvedCoords] = useState(null);

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
  };"""
content = content.replace("  const [resolvedCoords, setResolvedCoords] = useState(null);", hook_code)

# 4. Replace the old Team rendering with DndContext
old_teams_render = """                <div className="space-y-4 p-3 mb-6">
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
                </div>"""

new_teams_render = """                <div className="space-y-4 p-3 mb-6">
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
                </div>"""

content = content.replace(old_teams_render, new_teams_render)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Drag and drop refactored successfully.")
