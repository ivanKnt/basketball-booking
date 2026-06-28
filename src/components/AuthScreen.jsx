import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import BasketballIcon from './BasketballIcon';

export default function AuthScreen({ onLogin, onGuestLogin }) {
  const [guestLoading, setGuestLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await onLogin();
    } catch {
      setError('Connexion Google échouée. Réessayez ou utilisez le mode invité.');
    }
    setGoogleLoading(false);
  };

  const handleGuest = async () => {
    setError('');
    setGuestLoading(true);
    try {
      await onGuestLogin();
    } catch {
      setError('Connexion invité échouée. Réessayez.');
    }
    setGuestLoading(false);
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-100px)] w-full items-center justify-center relative px-4 py-8">
      <motion.div
        className="relative mb-10 select-none"
        animate={{ y: [0, -16, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="drop-shadow-[0_24px_48px_rgba(255,77,0,0.35)]">
          <BasketballIcon size={120} />
        </div>
        <motion.div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-3 bg-primary/25 rounded-full blur-md"
          animate={{ scale: [1, 0.65, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, type: 'spring', bounce: 0.25 }}
        className="apple-card p-8 text-center relative overflow-hidden w-full max-w-sm"
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/15 rounded-full blur-[50px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/10 rounded-full blur-[50px] pointer-events-none" />

        <div className="mb-8 relative z-10">
          <h2 className="text-4xl font-display font-semibold text-gradient mb-3 tracking-tighter">
            HOOPSHARE
          </h2>
          <p className="text-text-muted font-sans text-sm leading-relaxed max-w-[260px] mx-auto">
            Organise ton match. Partage les frais.
            <span className="block text-primary font-semibold mt-1">Tout le monde paie, personne ne galère.</span>
          </p>
        </div>

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
          className="relative z-10 w-full flex items-center justify-center gap-3 bg-transparent text-text-muted hover:text-text border border-border hover:bg-white/5 font-semibold py-3.5 px-6 rounded-xl text-sm transition-colors disabled:opacity-60"
        >
          <UserPlus size={18} />
          {guestLoading ? 'Connexion...' : 'Continuer sans compte'}
        </motion.button>

        <p className="mt-5 text-[11px] text-text-muted font-sans relative z-10 leading-relaxed border-t border-border pt-4">
          En continuant, vous pourrez choisir votre pseudo.
        </p>
      </motion.div>
    </div>
  );
}
