import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const Error = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    const isMobileDevice = /android|iphone|mobile|windows phone|mobile/i.test(userAgent);

    setIsMobile(isMobileDevice);

    if (isMobileDevice) {
      window.history.pushState(null, '', window.location.href);
      window.onpopstate = () => {
        window.history.pushState(null, '', window.location.href);
      };
    }
  }, []);

  if (!isMobile) {
    return (
      <div className="min-h-screen min-h-[100dvh] w-full flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 sm:p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full p-6 sm:p-8 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700"
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-orange-500">Mobile App Only</h1>
          <div className="mb-6">
            <svg
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-300 mb-6 text-sm sm:text-base">
            This application is optimized for mobile devices only. Please open it on your smartphone for the best experience.
          </p>
          <p className="text-xs sm:text-sm text-gray-400">
            Please use a mobile device to access this application.
          </p>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default Error;
