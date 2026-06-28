import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './lib/firebase';
import { signInWithPopup, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { LogOut } from 'lucide-react';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUserDoc;
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              email: currentUser.email || '',
              matchesPlayed: 0,
              totalContributed: 0
            });
          }
          
          // Listen to changes in real-time
          unsubUserDoc = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUser({ 
                ...currentUser, 
                profileName: data.name || currentUser.displayName || '',
                matchesPlayed: data.matchesPlayed || 0,
                totalContributed: data.totalContributed || 0
              });
            }
          });
          
        } catch (error) {
          console.error("Erreur Firestore:", error);
          setUser({ ...currentUser, profileName: currentUser.displayName || '' });
        }
      } else {
        if (unsubUserDoc) unsubUserDoc();
        setUser(null);
      }
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Erreur de connexion', error);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Erreur connexion invité', error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cta font-bebas text-4xl animate-pulse tracking-widest uppercase">Chargement du terrain...</div>
      </div>
    );
  }

  return (
    <>
      <header className="bg-slate-900/80 backdrop-blur-md text-white p-4 sticky top-0 z-50 border-b border-white/10 pt-[max(env(safe-area-inset-top),1rem)]">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.5)]">
              <span className="text-white font-bold text-lg font-bebas">H</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bebas tracking-wider text-white">HOOPSHARE</h1>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-200 hidden sm:inline">{user.profileName}</span>
              {user.photoURL && (
                <img src={user.photoURL} alt="Profil" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-primary glow-orange" />
              )}
              <button 
                onClick={handleLogout} 
                className="p-2 bg-white/5 hover:bg-red-500/80 rounded-full transition-colors text-gray-300 hover:text-white"
                title="Déconnexion"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-md md:max-w-4xl mx-auto w-full relative z-10 min-h-[calc(100vh-80px)]">
        {!user ? (
          <AuthScreen onLogin={handleLogin} onGuestLogin={handleGuestLogin} />
        ) : (
          <Dashboard user={user} setUser={setUser} />
        )}
      </main>
    </>
  );
}

export default App;
