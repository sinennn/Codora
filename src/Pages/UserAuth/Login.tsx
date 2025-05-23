import  { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {AtSign} from 'lucide-react'
import {Lock} from 'lucide-react'
import Start from '/assets/Start.png';
import GoogleLogo from '/assets/google.png'; 
import { ClipLoader } from 'react-spinners'; 
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, googleProvider, auth, signInWithEmailAndPassword } from "../../../firebase";

const containerVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const fadeUp = (delay = 0.3) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay } },
});

const inputVariants = (delay = 0.4) => ({
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, delay } },
});


const buttonVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: 0.6 },
  },
  hover: {
    scale: 1.05,
    boxShadow: '0 0 20px rgba(255, 115, 0, 0.6)',
    transition: { duration: 0.3 },
  },
};

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [loading1, setLoading1] = useState(false);
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const Navigate= useNavigate() 


  const handleEmailLogin = async () => {
    setLoading1(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log(`User signed in: ${user.email}`);
      Navigate("/DashBoard")
      setLoading1(false)
    } catch (error) {
      if (error instanceof Error) {
        console.error("Email Login Error:", error.message);
        window.alert(error.message);
        setLoading1(false);
      } else {
        console.error("Email Login Error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-black w-screen min-h-screen flex justify-center items-center p-4">
      <motion.div
        className="w-full max-w-md flex flex-col items-center gap-10 px-8 py-12 rounded-3xl bg-gray-900/60 backdrop-blur-2xl border border-gray-700 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div
          className="relative"
          initial={{ opacity: 0, rotate: -10, scale: 1.1 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="absolute w-full h-full rounded-full blur-3xl bg-orange-500 opacity-30 animate-pulse -z-10 scale-125"></div>
          <img src={Start} alt="Codora Owl" className="w-28 h-52 object-contain" />
        </motion.div>

        <motion.h1
          className="text-white text-4xl md:text-5xl font-extrabold tracking-tight text-center leading-tight"
          style={{ textShadow: '0 4px 20px rgba(255,255,255,0.2)' }}
          {...fadeUp(0.2)}
        >
          Welcome Back to <span className="text-orange-500">Codora</span>
        </motion.h1>

        <div className="flex flex-col gap-5 w-full">
         
        <motion.div className="relative w-full">
        <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <motion.input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-10 p-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
          variants={inputVariants(0.3)}
        />
      </motion.div>
          
      <motion.div className="relative w-full">
        
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <motion.input
          type="Password"
          placeholder="Password, please"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full pl-10 p-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
          variants={inputVariants(0.3)}
        />
      </motion.div>

          
          <motion.button
            className="p-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-all"
            variants={buttonVariants}
            whileHover="hover"
            onClick={handleEmailLogin} 
          >
            {loading1 ? (
              <ClipLoader color="#FFFFFF" size={22} cssOverride={{ borderWidth: '4px' }} />
            ) : (
              "Log In with Email"
            )}
          </motion.button>

          <motion.button
            className="flex items-center justify-center gap-3 p-3 rounded-xl bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 transition"
            variants={inputVariants(0.45)}
            whileHover={{ scale: 1.03 }}
            onClick={async () => {
              setLoading(true);
              try {
                const result = await signInWithPopup(auth, googleProvider);
                const user = result.user;
                console.log(`Google user signed in: ${user.displayName || user.email}`);
                Navigate("/DashBoard")
              } catch (error) {
                if (error instanceof Error) {
                  console.error("Google Sign-In Error:", error.message);
                } else {
                  console.error("Google Sign-In Error:", error);
                }
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? (
              <ClipLoader color="#F97316" size={22} cssOverride={{ borderWidth: '4px' }} />
            ) : (
              <>
                <img src={GoogleLogo} alt="Google" className="w-5 h-5" />
                <span>Continue with Google</span>
              </>
            )}
          </motion.button>
        </div>

        <motion.p
          className="text-gray-400 text-sm text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-orange-500 hover:underline font-medium">
            Sign Up
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}