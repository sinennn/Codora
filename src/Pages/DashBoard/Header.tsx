import { motion } from 'framer-motion';
import logo from '/assets/Start.png';


interface User {
  displayName?: string;
  photoURL?: string;
}

export default function Header({ user }: { user: User }) {
  const firstName = user?.displayName?.split(' ')[0] || 'User';
  console.log(firstName);

  return (
    <motion.header
    className="w-full px-6 py-4 bg-none top-0 z-30 backdrop-blur-md relative"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
  >
    
    <div className="absolute top-4 right-6 flex items-center gap-4 sm:p-4">

            <div className="flex items-center ml-[40px] gap-4 md:hidden lg:hidden">
          <motion.img
            src={logo}
            alt="Codora Logo"
            className="h-30 w-auto ml-[-30px]"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          />
          <h2 className="text-3xl font-bold text-orange-400 tracking-tight whitespace-nowrap">
          <span className="text-orange-400 text-lg font-semibold ">
          Hi, {firstName}
      </span>
          </h2>
        </div>

        <div className="px-15 md:hidden lg:hidden">

        </div>

    
      {user?.photoURL ? (
        <motion.img
          src={user.photoURL || "/assets/navuser.png"} 
          className="w-15 h-15 rounded-full border-2 border-orange-500 object-cover shadow-md hover:shadow-lg transition-shadow"
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        />
      ) : (
        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-orange-400 font-bold">
          {firstName[0]}
        </div>
      )}
    </div>
  </motion.header>
  );
}
