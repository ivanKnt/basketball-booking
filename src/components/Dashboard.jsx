import { useState, useEffect } from 'react';
import ProfileSetup from './ProfileSetup';
import GameList from './GameList';
import CreateGame from './CreateGame';
import GameSession from './GameSession';
import ExploreCourts from './ExploreCourts';
import { motion } from 'motion/react';
import { CalendarDays, Plus, User, Map, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { id: 'games', label: 'Matchs', icon: CalendarDays },
  { id: 'explore', label: 'Terrains', icon: Map },
  { id: 'profile', label: 'Profil', icon: User },
];

function NavButton({ item, activeTab, onSelect, layoutId = 'nav-pill' }) {
  const Icon = item.icon;
  const isActive = activeTab === item.id;
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={cn(
        'relative flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors',
        isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
      )}
    >
      {isActive && (
        <motion.div
          layoutId={layoutId}
          className="absolute inset-0 bg-white/8 rounded-xl border border-white/10"
          transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
        />
      )}
      <Icon size={20} className="relative z-10 shrink-0" />
      <span className="relative z-10 font-medium text-sm">{item.label}</span>
    </button>
  );
}

export default function Dashboard({ user, setUser }) {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('gameId') ? 'session' : 'games';
  });
  const [activeGameId, setActiveGameId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('gameId') || null;
  });
  const [pendingTab, setPendingTab] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);

  useEffect(() => {
    if (!user.profileName && activeTab !== 'profile') {
      setPendingTab(activeTab);
      setActiveTab('profile');
    } else if (user.profileName && pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  }, [user.profileName, activeTab, pendingTab]);

  const handleOpenGame = (id) => {
    setActiveGameId(id);
    setActiveTab('session');
    window.history.pushState({}, '', `${window.location.pathname}?gameId=${id}`);
  };

  const showNav = activeTab !== 'session' && !!user.profileName;

  return (
    <div className="flex min-h-[calc(100dvh-72px)]">
      {/* Desktop sidebar */}
      {showNav && (
        <aside className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 border-r border-white/5 bg-black/20 backdrop-blur-sm p-4 sticky top-[72px] h-[calc(100dvh-72px)]">
          <div className="flex items-center gap-2 px-3 mb-6 text-zinc-500">
            <LayoutGrid size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Navigation</span>
          </div>
          <nav className="space-y-1 flex-1">
            {NAV_ITEMS.map(item => (
              <NavButton
                key={item.id}
                item={item}
                activeTab={activeTab}
                onSelect={setActiveTab}
                layoutId="desktop-nav-pill"
              />
            ))}
          </nav>
          <button
            onClick={() => setActiveTab(activeTab === 'create' ? 'games' : 'create')}
            className={cn(
              'flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-wide transition-all',
              activeTab === 'create'
                ? 'bg-white text-black'
                : 'bg-gradient-to-r from-primary to-[#ff8c00] text-black hover:opacity-90'
            )}
          >
            <Plus size={18} className={activeTab === 'create' ? 'rotate-45 transition-transform' : ''} />
            {activeTab === 'create' ? 'Annuler' : 'Nouveau match'}
          </button>
        </aside>
      )}

      {/* Main content */}
      <div className={cn('flex-1 w-full min-w-0', showNav && 'pb-28 lg:pb-8')}>
        <div className="w-full pt-4 lg:pt-6">
          {activeTab === 'profile' && <ProfileSetup user={user} setUser={setUser} />}
          {activeTab === 'games' && <GameList user={user} onOpenGame={handleOpenGame} />}
          {activeTab === 'explore' && (
            <ExploreCourts
              user={user}
              onSelectCourt={(court) => {
                setSelectedCourt(court);
                setActiveTab('create');
              }}
            />
          )}
          {activeTab === 'create' && (
            <CreateGame
              user={user}
              initialCourt={selectedCourt}
              onGameCreated={handleOpenGame}
              onCancel={() => setActiveTab('games')}
            />
          )}
          {activeTab === 'session' && (
            <GameSession
              user={user}
              gameId={activeGameId}
              onBack={() => {
                setActiveGameId(null);
                setActiveTab('games');
                window.history.pushState({}, '', window.location.pathname);
              }}
            />
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      {showNav && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 sm:px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 pointer-events-none">
          <div className="pointer-events-auto premium-glass px-3 sm:px-4 py-2 flex justify-between items-center gap-1 rounded-2xl max-w-lg mx-auto border border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="relative flex flex-col items-center justify-center flex-1 min-w-0 h-12 py-1 text-zinc-500 transition-colors touch-target"
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className="absolute inset-0 bg-white/10 rounded-xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <Icon size={20} className={cn('relative z-10', isActive && 'text-white')} />
                  <span className={cn('relative z-10 text-[9px] font-medium mt-0.5', isActive ? 'text-white' : 'text-zinc-600')}>
                    {item.label}
                  </span>
                </button>
              );
            })}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab(activeTab === 'create' ? 'games' : 'create')}
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-xl shadow-lg transition-all',
                activeTab === 'create' ? 'bg-white' : 'bg-gradient-to-tr from-primary to-[#ff8c00]'
              )}
            >
              <Plus size={22} className={activeTab === 'create' ? 'text-black rotate-45' : 'text-white'} />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
