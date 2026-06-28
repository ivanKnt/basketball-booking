import { useRef } from 'react';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows } from '@react-three/drei';

function Basketball() {
  const meshRef = useRef();
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef}>
        {/* Optimized geometry for mobile */}
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial 
          color="#ff4d00" 
          roughness={0.8} 
          metalness={0.2}
          envMapIntensity={1}
        />
        {/* Simple lines to mimic basketball seams - thin and subtle */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.51, 0.02, 16, 64]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[1.51, 0.02, 16, 64]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh rotation={[Math.PI / 4, Math.PI / 2, 0]}>
           <torusGeometry args={[1.06, 0.02, 16, 64, Math.PI]} />
           <meshBasicMaterial color="#000000" />
        </mesh>
      </mesh>
    </Float>
  );
}

export default function AuthScreen({ onLogin, onGuestLogin }) {
  const words = "Organisez. Jouez. Dominez.".split(" ");

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] w-full items-center justify-center relative">
      
      {/* 3D Background - Performance Optimized */}
      <div className="absolute inset-0 z-0 h-[60vh] -top-10 pointer-events-none">
        {/* dpr caps pixel ratio to 1.5 for performance on high-density retina screens */}
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />
          {/* Using a preset environment for gorgeous PBR reflections without lighting cost */}
          <Environment preset="city" />
          <Basketball />
          {/* Low res contact shadow for performance */}
          <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={10} blur={2} far={4} resolution={256} color="#000000" />
        </Canvas>
      </div>

      {/* Floating UI overlay */}
      <div className="z-10 w-full max-w-sm mt-auto mb-10 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.2, type: 'spring', bounce: 0.3 }}
          className="premium-glass p-8 text-center relative overflow-hidden"
        >
          {/* Animated subtle glow behind text */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-[50px] pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/20 rounded-full blur-[50px] pointer-events-none"></div>
          
          <div className="mb-10 relative z-10">
            <h2 className="text-4xl font-display font-bold text-gradient mb-3 tracking-tighter">
              HOOPSHARE
            </h2>
            <div className="flex justify-center gap-2 text-primary font-sans font-medium text-sm tracking-wide">
              {words.map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.15, type: 'spring' }}
                >
                  {word}
                </motion.span>
              ))}
            </div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onLogin}
            className="relative z-10 w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-zinc-200 font-semibold py-4 px-6 rounded-xl text-lg transition-colors mb-3"
          >
            <LogIn size={20} />
            Connecter avec Google
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onGuestLogin}
            className="relative z-10 w-full flex items-center justify-center gap-3 bg-transparent text-zinc-400 hover:text-white border border-white/10 hover:bg-white/5 font-semibold py-3 px-6 rounded-xl text-sm transition-colors"
          >
            Jouer en tant qu'invité
          </motion.button>
          
          <p className="mt-5 text-xs text-text-muted font-sans relative z-10 font-medium leading-relaxed border-t border-white/5 pt-4">
            Fini les relances et les avances de frais.<br/>
            <span className="text-primary font-bold">Ton seul souci : le terrain.</span>
          </p>
        </motion.div>
      </div>
      
      {/* Optimized Floating particles (Only 6 for performance) */}
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full glow-orange"
            initial={{ 
              left: `${Math.random() * 100}%`, 
              top: '110%',
              opacity: Math.random() * 0.3 + 0.1
            }}
            animate={{ 
              top: '-10%',
            }}
            transition={{ 
              duration: Math.random() * 15 + 15,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>
    </div>
  );
}
