import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './lib/firebase';
import { signInWithPopup, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { LogOut, Moon, Sun } from 'lucide-react';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

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
                profileName: data.displayName || currentUser.displayName || '',
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary font-display text-2xl animate-pulse font-semibold">Chargement...</div>
      </div>
    );
  }

  return (
    <>
      <header className="bg-background/80 backdrop-blur-xl text-text sticky top-0 z-50 border-b border-border pt-[max(env(safe-area-inset-top),1rem)]">
        <div className="page-container flex justify-between items-center py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg font-display">H</span>
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-text">HOOPSHARE</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 bg-surface border border-border rounded-full text-text-muted hover:text-text transition-colors"
              title="Changer de thème"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user && (
              <>
                <span className="font-semibold text-text hidden sm:inline">{user.profileName}</span>
                {user.photoURL && (
                  <img src={user.photoURL} alt="Profil" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-border" />
                )}
                <button 
                  onClick={handleLogout} 
                  className="p-2 bg-surface border border-border rounded-full transition-colors text-text-muted hover:text-red-500"
                  title="Déconnexion"
                >
                  <LogOut size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="page-container relative z-10 min-h-[calc(100vh-72px)]">
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
