import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useNavigate, useLocation } from 'react-router-dom';
//Explanation: It's a capacitor app so hitting the back button closes it. This is a custom hook built using
//the capacitor app plugin to make sure that doesn't happen
function useSendBack() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let listener;

    const setupBackButton = async () => {
      listener = await App.addListener('backButton', () => {
        if (location.pathname === '/Group-Quiz') {
            navigate('/GroupQuiz')
        } else  if (location.pathname === '/SoloComplete') {
            navigate('/SoloSetting')
        } else  if (location.pathname === '/dashboard') {
            App.exitApp(); 
        } {
          navigate(-1);
        }
        //The entire block above customizes which screens users will be navigated to for specific screens.
        //for every other one, it just goes to the last screen.
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
