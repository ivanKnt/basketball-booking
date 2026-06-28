import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Zap, Snowflake, Crown } from 'lucide-react';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import BasketballIcon from './BasketballIcon';
import { cn } from '../lib/utils';

const REACTIONS = [
  { id: 'fire', Icon: Flame, color: 'text-orange-400', bg: 'hover:bg-orange-500/15' },
  { id: 'hoop', Icon: null, color: 'text-primary', bg: 'hover:bg-primary/15', custom: true },
  { id: 'strong', Icon: Zap, color: 'text-amber-400', bg: 'hover:bg-amber-500/15' },
  { id: 'cold', Icon: Snowflake, color: 'text-sky-400', bg: 'hover:bg-sky-500/15' },
  { id: 'mvp', Icon: Crown, color: 'text-yellow-400', bg: 'hover:bg-yellow-500/15' },
];

function ReactionBubble({ type, randomX }) {
  const reaction = REACTIONS.find(r => r.id === type);
  if (!reaction) return null;
  const { Icon, color, custom } = reaction;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0, x: randomX, scale: 0.5 }}
      animate={{ y: -150, opacity: [0, 1, 1, 0], x: randomX * 1.5, scale: [0.5, 1.2, 1] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2, ease: 'easeOut' }}
      className={cn('absolute bottom-0 drop-shadow-lg', color)}
    >
      {custom ? (
        <BasketballIcon size={36} />
      ) : (
        <Icon size={36} strokeWidth={2} />
      )}
    </motion.div>
  );
}

export default function LiveReactions({ gameId, user }) {
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'games', gameId, 'reactions'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const newReactions = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.createdAt && data.createdAt.toMillis() > Date.now() - 10000) {
            newReactions.push({
              id: change.doc.id,
              type: data.type || data.emoji,
              randomX: Math.random() * 100 - 50,
            });
          }
        }
      });
      if (newReactions.length > 0) {
        setReactions(prev => [...prev, ...newReactions]);
        setTimeout(() => {
          setReactions(prev => prev.filter(r => !newReactions.find(n => n.id === r.id)));
        }, 2500);
      }
    });
    return () => unsub();
  }, [gameId]);

  const sendReaction = async (type) => {
    try {
      await addDoc(collection(db, 'games', gameId, 'reactions'), {
        type,
        userId: user.uid,
        userName: user.profileName || 'Utilisateur',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-center gap-1.5 mb-4 bg-surface p-2 rounded-2xl border border-border w-max mx-auto lg:gap-2">
        {REACTIONS.map(({ id, Icon, color, bg, custom }) => (
          <motion.button
            key={id}
            type="button"
            whileHover={{ scale: 1.15, y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => sendReaction(id)}
            className={cn('w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center rounded-xl transition-colors', bg, color)}
            aria-label={id}
          >
            {custom ? <BasketballIcon size={22} /> : <Icon size={20} strokeWidth={2} />}
          </motion.button>
        ))}
      </div>

      <div className="absolute bottom-full left-0 right-0 h-48 pointer-events-none overflow-visible z-50 flex justify-center">
        <AnimatePresence>
          {reactions.map((r) => (
            <ReactionBubble key={r.id} type={r.type} randomX={r.randomX} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
