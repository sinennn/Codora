import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useNavigate, useLocation } from 'react-router-dom';

// Custom hook for Android back button handling
function useSendBack() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
   
    let listener;

    const setupBackButton = async () => {
      listener = await App.addListener('backButton', () => {
        const path = location.pathname;
       
        if (path === '/dashboard') {
          App.exitApp();
          return;
        }
        
        if (path === '/quiz/complete') {
          navigate('/dashboard');
          return;
        }
        
        if (path === '/quiz/group/results') {
          navigate('/dashboard');
          return;
        }
        
        if (path === '/tutor/complete') {
          navigate('/dashboard');
          return;
        }

        if (path === '/quiz/group/waiting' || path === '/quiz/group/play') {
          navigate('/quiz/group');
          return;
        }
        
        // Default
        navigate(-1);
      });
    };

    setupBackButton();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [navigate, location.pathname]);
}

export default useSendBack;
