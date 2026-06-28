import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, NavLink } from 'react-router-dom';
import ProfileSetup from './ProfileSetup';
import GameList from './GameList';
import { motion } from 'motion/react';
import { CalendarDays, Plus, User, Map, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';

const CreateGame = React.lazy(() => import('./CreateGame'));
const GameSession = React.lazy(() => import('./GameSession'));
const ExploreCourts = React.lazy(() => import('./ExploreCourts'));
const NAV_ITEMS = [
  { id: 'games', path: '/games', label: 'Matchs', icon: CalendarDays },
  { id: 'explore', path: '/explore', label: 'Terrains', icon: Map },
  { id: 'profile', path: '/profile', label: 'Profil', icon: User },
];

function NavButton({ item, layoutId = 'nav-pill' }) {
  const Icon = item.icon;
  const location = useLocation();
  const isActive = location.pathname.startsWith(item.path);

  return (
    <NavLink
      to={item.path}
      className={cn(
        'relative flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors',
        isActive ? 'text-text' : 'text-text-muted hover:text-text-muted hover:bg-white/5'
      )}
    >
      {isActive && (
        <motion.div
          layoutId={layoutId}
          className="absolute inset-0 bg-white/8 rounded-xl border border-border"
          transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
        />
      )}
      <Icon size={20} className="relative z-10 shrink-0" />
      <span className="relative z-10 font-medium text-sm">{item.label}</span>
    </NavLink>
  );
}

export default function Dashboard({ user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedCourt, setSelectedCourt] = useState(null);

  // Profile completion guard
  useEffect(() => {
    if (!user.profileName && location.pathname !== '/profile') {
      navigate('/profile', { replace: true });
    }
  }, [user.profileName, location.pathname, navigate]);

  // Determine if we should show navigation (hide it inside a game session)
  const isSessionView = location.pathname.startsWith('/game/');
  const showNav = !isSessionView && !!user.profileName;
  const isCreateView = location.pathname === '/create';

  return (
    <div className="flex min-h-[calc(100dvh-72px)]">
      {/* Desktop sidebar */}
      {showNav && (
        <aside className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 border-r border-border bg-surface p-4 sticky top-[72px] h-[calc(100dvh-72px)] z-30">
          <div className="flex items-center gap-2 px-3 mb-6 text-text-muted">
            <LayoutGrid size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Navigation</span>
          </div>
          <nav className="space-y-1 flex-1">
            {NAV_ITEMS.map(item => (
              <NavButton key={item.id} item={item} layoutId="desktop-nav-pill" />
            ))}
          </nav>
          <button
            onClick={() => navigate(isCreateView ? '/games' : '/create')}
            className={cn(
              'flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-display font-semibold text-sm tracking-wide transition-all',
              isCreateView
                ? 'bg-white text-black'
                : 'bg-gradient-to-r from-primary to-[#ff8c00] text-white hover:opacity-90'
            )}
          >
            <Plus size={18} className={isCreateView ? 'rotate-45 transition-transform text-black' : ''} />
            {isCreateView ? 'Annuler' : 'Nouveau match'}
          </button>
        </aside>
      )}

      {/* Main content */}
      <div className={cn('flex-1 w-full min-w-0', showNav && 'pb-28 lg:pb-8')}>
        <div className="w-full pt-4 lg:pt-6 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <Suspense fallback={<div className="flex justify-center p-8"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/games" replace />} />
              <Route path="/games" element={<GameList user={user} onOpenGame={(id) => navigate(`/game/${id}`)} />} />
              <Route path="/explore" element={
                <ExploreCourts
                  user={user}
                  onSelectCourt={(court) => {
                    setSelectedCourt(court);
                    navigate('/create');
                  }}
                />
              } />
              <Route path="/profile" element={<ProfileSetup user={user} setUser={setUser} />} />
              <Route path="/create" element={
                <CreateGame
                  user={user}
                  initialCourt={selectedCourt}
                  onGameCreated={(id) => navigate(`/game/${id}`)}
                  onCancel={() => navigate('/games')}
                />
              } />
              <Route path="/game/:gameId" element={
                <GameSession
                  user={user}
                />
              } />
            </Routes>
          </Suspense>
        </div>
      </div>

      {/* Mobile bottom nav */}
      {showNav && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 sm:px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 pointer-events-none">
          <div className="pointer-events-auto apple-card px-3 sm:px-4 py-2 flex justify-between items-center gap-1 rounded-2xl max-w-lg mx-auto border border-border shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className="relative flex flex-col items-center justify-center flex-1 min-w-0 h-12 py-1 text-text-muted transition-colors touch-target"
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className="absolute inset-0 bg-white/10 rounded-xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <Icon size={20} className={cn('relative z-10', isActive && 'text-text')} />
                  <span className={cn('relative z-10 text-[9px] font-medium mt-0.5', isActive ? 'text-text' : 'text-text-muted')}>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(isCreateView ? '/games' : '/create')}
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-xl shadow-lg transition-all',
                isCreateView ? 'bg-white text-black' : 'bg-gradient-to-tr from-primary to-[#ff8c00] text-white'
              )}
            >
              <Plus size={22} className={isCreateView ? 'rotate-45 transition-transform text-black' : ''} />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
