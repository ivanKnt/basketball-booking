import { useState } from 'react';
import { Share2, MessageCircle, Link2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { shareViaWhatsApp } from '../../lib/share';
import { cn } from '../../lib/utils';

export default function ShareMenu({ onShare, onWhatsApp, className }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/20"
        aria-label="Partager"
      >
        <Share2 size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              className="absolute right-0 top-12 z-50 min-w-[200px] apple-card p-2 rounded-xl shadow-2xl"
            >
              <button
                type="button"
                onClick={() => { onShare?.(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:bg-white/5 hover:text-text transition-colors"
              >
                <Share2 size={16} className="text-text-muted" />
                Partager le lien
              </button>
              <button
                type="button"
                onClick={() => { onWhatsApp?.(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:bg-white/5 hover:text-text transition-colors"
              >
                <MessageCircle size={16} className="text-green-400" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:bg-white/5 hover:text-text transition-colors"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Link2 size={16} className="text-text-muted" />}
                {copied ? 'Copié' : 'Copier le lien'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
