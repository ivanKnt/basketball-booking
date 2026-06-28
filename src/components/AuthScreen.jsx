import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthScreen({ onLogin, onGuestLogin }) {
  const [guestLoading, setGuestLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await onLogin();
    } catch (e) {
      setError('Connexion Google échouée. Réessayez ou utilisez le mode invité.');
    }
    setGoogleLoading(false);
  };

  const handleGuest = async () => {
    setError('');
    setGuestLoading(true);
    try {
      await onGuestLogin();
    } catch (e) {
      setError('Connexion invité échouée. Réessayez.');
    }
    setGuestLoading(false);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] min-h-[calc(100dvh-100px)] w-full items-center justify-center relative px-4">
      
      {/* CSS-only animated basketball — replaces Three.js for performance */}
      <motion.div
        className="relative mb-8 select-none"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="text-[120px] sm:text-[140px] drop-shadow-[0_30px_60px_rgba(255,77,0,0.4)] filter">
          🏀
        </div>
        {/* Shadow that scales with bounce */}
        <motion.div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-primary/20 rounded-full blur-lg"
          animate={{ scale: [1, 0.6, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Floating UI card */}
      <motion.div 
        initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, delay: 0.2, type: 'spring', bounce: 0.3 }}
        className="premium-glass p-8 text-center relative overflow-hidden w-full max-w-sm"
      >
        {/* Animated glows */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-[50px] pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/20 rounded-full blur-[50px] pointer-events-none"></div>
        
        <div className="mb-8 relative z-10">
          <h2 className="text-4xl font-display font-bold text-gradient mb-3 tracking-tighter">
            HOOPSHARE
          </h2>
          <p className="text-zinc-400 font-sans text-sm leading-relaxed max-w-[260px] mx-auto">
            Organise ton match. Partage les frais.<br/>
            <span className="text-primary font-semibold">Tout le monde paie, personne ne galère.</span>
          </p>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3 relative z-10"
          >
            {error}
          </motion.div>
        )}
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleGoogle}
          disabled={googleLoading}
          className="relative z-10 w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-zinc-200 font-semibold py-4 px-6 rounded-xl text-base transition-colors mb-3 disabled:opacity-60"
        >
          <LogIn size={20} />
          {googleLoading ? 'Connexion...' : 'Continuer avec Google'}
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleGuest}
          disabled={guestLoading}
          className="relative z-10 w-full flex items-center justify-center gap-3 bg-transparent text-zinc-400 hover:text-white border border-white/10 hover:bg-white/5 font-semibold py-3.5 px-6 rounded-xl text-sm transition-colors disabled:opacity-60"
        >
          <UserPlus size={18} />
          {guestLoading ? 'Connexion...' : 'Continuer sans compte'}
        </motion.button>
        
        <p className="mt-5 text-[11px] text-zinc-600 font-sans relative z-10 leading-relaxed border-t border-white/5 pt-4">
          En continuant, vous pourrez choisir votre pseudo.
        </p>
      </motion.div>

      {/* Floating particles — fewer, simpler */}
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full"
            initial={{ 
              left: `${20 + i * 20}%`, 
              top: '110%',
            }}
            animate={{ top: '-10%' }}
            transition={{ 
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 3
            }}
          />
        ))}
      </div>
    </div>
  );
}
