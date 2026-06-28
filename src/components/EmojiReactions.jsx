import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

const EMOJIS = ['🔥', '🏀', '💪', '🥶', '👑'];

export default function EmojiReactions({ gameId, user }) {
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
          // Filter out old reactions on initial load (10s window)
          if (data.createdAt && data.createdAt.toMillis() > Date.now() - 10000) {
            newReactions.push({ id: change.doc.id, ...data, randomX: Math.random() * 100 - 50 });
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

  const sendReaction = async (emoji) => {
    try {
      await addDoc(collection(db, 'games', gameId, 'reactions'), {
        emoji,
        userId: user.uid,
        userName: user.profileName,
        createdAt: serverTimestamp()
      });
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-center gap-2 mb-4 bg-black/60 p-2.5 rounded-[2rem] border border-white/5 w-max mx-auto shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
        {EMOJIS.map(emoji => (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.25, y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => sendReaction(emoji)}
            className="text-2xl w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors drop-shadow-md"
          >
            {emoji}
          </motion.button>
        ))}
      </div>

      <div className="absolute bottom-full left-0 right-0 h-48 pointer-events-none overflow-visible z-50 flex justify-center">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ y: 20, opacity: 0, x: r.randomX, scale: 0.5 }}
              animate={{ y: -150, opacity: [0, 1, 1, 0], x: r.randomX * 1.5, scale: [0.5, 1.2, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute bottom-0 text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
