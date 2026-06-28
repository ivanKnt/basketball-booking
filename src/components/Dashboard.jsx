import { useState } from 'react';
import ProfileSetup from './ProfileSetup';
import GameList from './GameList';
import CreateGame from './CreateGame';
import GameSession from './GameSession';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarDays, Plus, User } from 'lucide-react';

export default function Dashboard({ user, setUser }) {
  const [activeTab, setActiveTab] = useState('games'); // 'games', 'create', 'profile', or 'session'
  const [activeGameId, setActiveGameId] = useState(null);

  const handleOpenGame = (id) => {
    setActiveGameId(id);
    setActiveTab('session');
  };

  return (
    <div className="flex flex-col min-h-[100dvh] pb-32 relative bg-background">
      {/* Content area */}
      <div className="flex-1 w-full max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }} transition={{ duration: 0.3, type: 'spring', bounce: 0 }}>
              <ProfileSetup user={user} setUser={setUser} />
            </motion.div>
          )}
          {activeTab === 'games' && (
            <motion.div key="games" initial={{ opacity: 0, x: -20, filter: 'blur(4px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: 20, filter: 'blur(4px)' }} transition={{ duration: 0.3, type: 'spring', bounce: 0 }}>
              <GameList onOpenGame={handleOpenGame} />
            </motion.div>
          )}
          {activeTab === 'create' && (
            <motion.div key="create" initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }} transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}>
              <div className="px-4 pt-4">
                <CreateGame user={user} onGameCreated={handleOpenGame} onCancel={() => setActiveTab('games')} />
              </div>
            </motion.div>
          )}
          {activeTab === 'session' && (
            <motion.div key="session" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.3, type: 'spring', bounce: 0 }}>
              <GameSession 
                user={user} 
                gameId={activeGameId} 
                onBack={() => {
                  setActiveGameId(null);
                  setActiveTab('games');
                }} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Dynamic Island Navigation */}
      {activeTab !== 'session' && (
        <div className="fixed bottom-6 left-0 right-0 z-50 px-6 pointer-events-none flex justify-center">
          <div className="pointer-events-auto premium-glass px-6 py-3 flex justify-between items-center gap-8 rounded-full shadow-[0_10px_40px_rgba(255,77,0,0.15)]">
            
            {/* Matchs Tab */}
            <button 
              onClick={() => setActiveTab('games')}
              className="relative flex flex-col items-center justify-center w-12 h-12 text-zinc-500 hover:text-white transition-colors group"
            >
              {activeTab === 'games' && (
                <motion.div layoutId="nav-pill" className="absolute inset-0 bg-white/10 rounded-full" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
              )}
              <CalendarDays className={`w-6 h-6 relative z-10 transition-colors ${activeTab === 'games' ? 'text-white' : 'group-hover:text-zinc-300'}`} />
            </button>

            {/* Create FAB */}
            <motion.button 
              whileTap={{ scale: 0.85 }}
              onClick={() => setActiveTab(activeTab === 'create' ? 'games' : 'create')}
              className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
                activeTab === 'create' ? 'bg-white rotate-45' : 'bg-gradient-to-tr from-primary to-[#ff8c00]'
              }`}
            >
              <Plus className={`w-8 h-8 transition-colors ${activeTab === 'create' ? 'text-black' : 'text-white'}`} />
            </motion.button>

            {/* Profile Tab */}
            <button 
              onClick={() => setActiveTab('profile')}
              className="relative flex flex-col items-center justify-center w-12 h-12 text-zinc-500 hover:text-white transition-colors group"
            >
              {activeTab === 'profile' && (
                <motion.div layoutId="nav-pill" className="absolute inset-0 bg-white/10 rounded-full" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
              )}
              <User className={`w-6 h-6 relative z-10 transition-colors ${activeTab === 'profile' ? 'text-white' : 'group-hover:text-zinc-300'}`} />
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

