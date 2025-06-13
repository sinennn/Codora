import  { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Start from '/assets/Start.png';
import { auth } from '../../../firebase'
import { ClipLoader } from 'react-spinners';

const Splash = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false)
  const cast = import.meta.env.VITE_CAST;
console.log(cast);

useEffect(() => {
 setLoading(true)
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
}, [navigate]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
    <div className="absolute inset-0 flex justify-center items-center p-4">
      <motion.div
        className="flex flex-col md:flex-row items-center gap-6"
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
            className="w-[160px] h-[320px] object-contain"
          />
        </motion.div>
  
        <motion.h1
          className="text-orange-500 text-6xl md:text-7xl font-extrabold tracking-tight"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
          style={{
            textShadow: '0 2px 10px rgba(255,255,255,0.3)',
          }}
        >
          Codora
          <div className="pt-30 flex items-center justify-center ">
          {loading ? (
          <ClipLoader color="#F97316" size={22} cssOverride={{ borderWidth: '4px' }} />
        ) : (
          <ClipLoader color="#F97316" size={22} cssOverride={{ borderWidth: '4px' }} />
        )}
          </div>
        </motion.h1>
      </motion.div>
         </div>
  </div>
       
  )
};

export default Splash;