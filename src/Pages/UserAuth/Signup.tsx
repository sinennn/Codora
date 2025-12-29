import { useState } from 'react';
import {User} from 'lucide-react'
import {AtSign} from 'lucide-react'
import {Lock} from 'lucide-react'
import {LockKeyhole} from 'lucide-react'
import { motion } from 'framer-motion';
import Start from '/assets/Start.png';
import { createUserWithEmailAndPassword, updateProfile  } from 'firebase/auth';
//import { ClipLoader } from 'react-spinners'; 
import { setDoc, doc } from 'firebase/firestore';
import { auth } from '../../../firebase';
import { db } from '../../../firebase'; 
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  initial: { opacity: 0, y: 50 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: 'easeOut' as const, when: 'beforeChildren' as const, staggerChildren: 0.15 },
  },
};

const childVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const inputField =
  'w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-400/50 transition-all duration-300';

  const SignUp = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const handleSignUp = async () => {
      if (password !== confirmPassword) {
        window.alert('Passwords do not match!');
        return;
      }
    
      setLoading(true);
      try {
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
    
       
        await updateProfile(user, {
          displayName: username,
        });
    
        await setDoc(doc(db, 'users', user.uid), {
          username: username,
          email: email,
        });
    
            navigate("/login");
      } catch (error) {
        if (error instanceof Error) {
          console.error('Sign-Up Error:', error.message);
          window.alert(error.message);
        } else {
          console.error('Sign-Up Error:', error);
        }
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="w-screen h-screen overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black flex justify-center items-center">
  <motion.div
    className="w-full max-w-md flex flex-col items-center gap-10 px-6 py-10 rounded-none bg-none backdrop-blur-2xl border border-none "
    variants={containerVariants}
    initial="initial"
    animate="animate"
  >
          <motion.div className="relative" variants={childVariants}>
            <div className="absolute w-full h-1/2 rounded-full blur-2xl bg-orange-500 opacity-30 animate-pulse -z-10 scale-125"></div>
            <motion.img
              src={Start}
              alt="Codora Owl"
              className="w-[120px] h-[200px] object-contain"
              initial={{ opacity: 0, rotate: -10, scale: 1.1 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </motion.div>

          <motion.h1
            className="text-white text-4xl font-extrabold tracking-tight text-center"
            style={{ textShadow: '0 2px 10px rgba(255,255,255,0.3)' }}
            variants={childVariants}
          >
            Time to Cook, Brainiac
          </motion.h1>
  
          <motion.div
            className="flex flex-col gap-4 w-full max-w-lg"
            variants={childVariants}
          >
          <motion.div className="relative w-full">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /> 
            <motion.input
              type="text"
              placeholder="So, what are we calling you?"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`pl-10 ${inputField}`}
            />
          </motion.div> 

          <motion.div className="relative w-full">
            <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /> {/* User icon */}
            <motion.input
              type="text"
              placeholder="Your Email?"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`pl-10 ${inputField}`} 
            />
          </motion.div>

          <motion.div className="relative w-full">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /> 
            <motion.input
              type="password"
              placeholder="Yeah, we need a password too"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`pl-10 ${inputField}`} 
            />
          </motion.div>

          <motion.div className="relative w-full">
            <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /> {/* User icon */}
            <motion.input
              type="password"
              placeholder="You need to confirm it🥲"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`pl-10 ${inputField}`} 
            />
          </motion.div>
  
            <motion.button
              className="w-full p-3 rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600 hover:shadow-lg shadow-orange-500/30 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              variants={childVariants}
              onClick={handleSignUp}
              disabled={!email || !password || !confirmPassword || loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </motion.button>

            <motion.p
            className="text-gray-400 text-sm text-center "
            variants={childVariants}
          >
            Already have an account?{' '}
            <a href="/login" className="text-orange-500 hover:underline">
              Log In
            </a>
          </motion.p>

          </motion.div>
  
      
        </motion.div>
      </div>
    );
  };
  
  export default SignUp;