import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { AtSign, Lock } from 'lucide-react';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { isPlatform } from '@ionic/react';
import { signInWithEmailAndPassword, signInWithPopup, auth, googleProvider } from "../../../firebase";
import { ClipLoader } from 'react-spinners';
import Start from '/assets/Start.png';
import GoogleLogo from '/assets/google.png';

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
  const navigate = useNavigate();

  useEffect(() => {
    GoogleAuth.initialize(); // Only on mobile
  }, []);

  const handleEmailLogin = async () => {
    setLoading1(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in with email:", userCredential.user.email);
      navigate("/DashBoard");
    } catch (error) {
      console.error("Email Login Error:", error.message);
      alert(error.message);
    } finally {
      setLoading1(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const isMobile = isPlatform("capacitor");

      if (isMobile) {
        const result = await GoogleAuth.signIn();
        const credential = googleProvider.credential(result.authentication.idToken);
        const firebaseResult = await auth.signInWithCredential(credential);
        console.log("Google mobile login:", firebaseResult.user.email);
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        console.log("Google web login:", result.user.email);
      }

      navigate("/DashBoard");
    } catch (error) {
      console.error("Google Sign-In Error:", error.message || error);
      alert(error.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black flex justify-center items-center">
      <motion.div
        className="w-full max-w-md flex flex-col items-center gap-10 px-6 py-10 backdrop-blur-2xl"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div
          className="relative"
          initial={{ opacity: 0, rotate: -10, scale: 1.1 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute w-full h-full rounded-full blur-3xl bg-orange-500 opacity-30 animate-pulse -z-10 scale-125"></div>
          <img src={Start} alt="Codora Owl" className="w-28 h-52 object-contain" />
        </motion.div>

        <motion.h1
          className="text-white text-4xl font-extrabold text-center"
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
              className="w-full pl-10 p-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              variants={inputVariants(0.3)}
            />
          </motion.div>

          <motion.div className="relative w-full">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <motion.input
              type="password"
              placeholder="Password, please"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 p-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
            onClick={handleGoogleLogin}
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
