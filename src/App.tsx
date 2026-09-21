import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';

import Splash from './Pages/SplashScreen/Splash';
import SignUp from './Pages/UserAuth/Signup';
import Login from './Pages/UserAuth/Login';

import Home from './Pages/Home/Home';
import Profile from './Pages/Profile/ProfileNew';
import Leaderboard from './Pages/LeaderBoard/Leaderboard';

import TutorSelect from './Pages/Tutor/TutorSelect';
import TutorLesson from './Pages/Tutor/TutorLesson';
import TutorComplete from './Pages/Tutor/TutorComplete';

import SoloQuizSettings from './Pages/QuizSettings/Solo';
import SoloQuiz from './Pages/SoloQuiz/Quiz';
import SoloComplete from './Pages/SoloQuiz/SoloComplete';

import GroupQuizSettings from './Pages/QuizSettings/Group';
import GroupQuizWaiting from './Pages/GroupQuiz/WaitingRoom';
import GroupQuiz from './Pages/GroupQuiz/Quiz';

import Error from './Pages/Error/Error';
import { checkForInteractiveUpdate } from './Services/otaUpdater';

import { ToastProvider } from './components/ui/toast';
import { AuthProvider } from './Context/AuthContext';
import { UserProgressProvider } from './Context/UserProgressContext';
import { CurriculumProvider } from './Context/CurriculumContext';

function App() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    checkForInteractiveUpdate();
    
    const userAgent = navigator.userAgent || navigator.vendor;
    const isMobileDevice = /android|iphone|mobile|windows phone/i.test(userAgent);
    setIsMobile(isMobileDevice);

    if (!isMobileDevice) {
      window.history.pushState(null, '', window.location.href);
      window.onpopstate = () => {
        window.history.pushState(null, '', window.location.href);
      };
    }
  }, []);

  if (!isMobile) {
    return (
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<Error />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <AuthProvider>
        <UserProgressProvider>
          <CurriculumProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/splash" replace />} />
                <Route path="/splash" element={<Splash />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                
                <Route path="/dashboard" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                
                <Route path="/tutor" element={<TutorSelect />} />
                <Route path="/tutor/lesson" element={<TutorLesson />} />
                <Route path="/tutor/complete" element={<TutorComplete />} />
                
                <Route path="/quiz/settings" element={<SoloQuizSettings />} />
                <Route path="/quiz" element={<SoloQuiz />} />
                <Route path="/quiz/complete" element={<SoloComplete />} />
                
                <Route path="/quiz/group" element={<GroupQuizSettings />} />
                <Route path="/quiz/group/waiting" element={<GroupQuizWaiting />} />
                <Route path="/quiz/group/play" element={<GroupQuiz />} />
                
                <Route path="*" element={<Navigate to="/splash" replace />} />
              </Routes>
            </BrowserRouter>
          </CurriculumProvider>
        </UserProgressProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;