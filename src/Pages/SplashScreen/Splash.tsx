import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Start from '/assets/Start.png';
import { auth } from '../../../firebase'
import { ClipLoader } from 'react-spinners';

const Splash = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false)
  const [network, noNetwork] = useState(false)
  const cast = import.meta.env.VITE_CAST;
  console.log(cast);

  useEffect(() => {
    const handleNetworkChange = () => {
      noNetwork(!navigator.onLine);
    };

    noNetwork(!navigator.onLine);

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    if (navigator.onLine) {
      setLoading(true);
      const timer = setTimeout(() => {
        auth.onAuthStateChanged((currentUser) => {
          if (currentUser) {
            navigate('/dashboard');
          } else {
            navigate('/login');
          }
        });
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, [navigate]);

  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black safe-all">
      <div className="absolute inset-0 flex justify-center items-center p-4">
        <motion.div
          className="flex flex-col items-center gap-4 sm:gap-6"
          initial={{ opacity: 0, scale: 1.2, y: -30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <motion.div
            className="relative"
            initial={{ opacity: 0, rotate: -10, scale: 1.1 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          >
            <div className="absolute w-full h-full rounded-full blur-2xl bg-orange-500 opacity-20 animate-pulse -z-10"></div>
            <img
              src={Start}
              alt="Codora Owl"
              className="w-32 h-64 sm:w-[160px] sm:h-[320px] object-contain"
            />
          </motion.div>

          <motion.h1
            className="text-orange-500 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-center"
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
            style={{
              textShadow: '0 2px 10px rgba(255,255,255,0.3)',
            }}
          >
            Codora
          </motion.h1>

          <motion.div
            className="flex items-center justify-center mt-4 sm:mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            {network ? (
              <p className="text-base sm:text-lg text-orange-400 font-medium text-center">Looks like you're offline 🥲</p>
            ) : (
              <ClipLoader color="#F97316" size={22} cssOverride={{ borderWidth: '4px' }} />
            )}

            {loading ? (
              <p></p>
            ) : (
              <p></p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Splash;
