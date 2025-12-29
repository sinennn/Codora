// ============================================
// APP - Main Application Router
// Includes UserProgressProvider and CurriculumProvider for Firebase integration
// ============================================

import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';

import Splash from './Pages/SplashScreen/Splash';
import SignUp from './Pages/UserAuth/Signup';
import Login from './Pages/UserAuth/Login';
import DashBoard from './Pages/DashBoard/Dashboard';
import Home from './Pages/Home/Home';
import SoloQuizSettings from './Pages/QuizSettings/Solo';
import SoloQuiz from './Pages/SoloQuiz/Quiz';
import GroupQuiz from './Pages/GroupQuiz/Quiz';
import GroupQuizSettings from './Pages/QuizSettings/Group';
import SoloComplete from './Pages/SoloQuiz/SoloComplete';
import WaitingRoom from './Pages/GroupQuiz/WaitingRoom';
import Profile from './Pages/Profile/Profile';
import ProfileNew from './Pages/Profile/ProfileNew';
import JoinRoom from './Pages/GroupQuiz/JoinRoom';
import Report from './Pages/Report/Report';
import LeaderBoard from './Pages/LeaderBoard/Leaderboard';
import { checkForInteractiveUpdate } from './Services/otaUpdater';
import Error from './Pages/Error/Error';
import { ToastProvider } from './components/ui/toast';
import { AuthProvider } from './Context/AuthContext';
import { UserProgressProvider } from './Context/UserProgressContext';
import { CurriculumProvider } from './Context/CurriculumContext';

// AI Tutor Pages
import TutorSelect from './Pages/Tutor/TutorSelect';
import TutorLesson from './Pages/Tutor/TutorLesson';
import TutorComplete from './Pages/Tutor/TutorComplete';

function App() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    checkForInteractiveUpdate();
    
    // Check if user is on a mobile device
    const userAgent = navigator.userAgent || navigator.vendor;
    const isMobileDevice = /android|iphone|mobile|windows phone|mobile/i.test(userAgent);
    setIsMobile(isMobileDevice);

    // Prevent navigation if not on mobile
    if (!isMobileDevice) {
      window.history.pushState(null, '', window.location.href);
      window.onpopstate = () => {
        window.history.pushState(null, '', window.location.href);
      };
    }
  }, []);

  // If not on mobile, show Error component for all routes
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

  // Normal routing for mobile devices
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
                <Route path="/dashboard-old" element={<DashBoard />} />
                <Route path="/profile" element={<ProfileNew />} />
                <Route path="/profile-old" element={<Profile />} />
                <Route path="/JoinRoom" element={<JoinRoom />} />
                <Route path="/WaitingRoom" element={<WaitingRoom />} />
                <Route path="/Group-Quiz" element={<GroupQuiz />} />
                <Route path="/SoloSetting" element={<SoloQuizSettings />} />
                <Route path="/GroupQuiz" element={<GroupQuizSettings />} />
                <Route path="/SoloQuiz" element={<SoloQuiz />} />
                <Route path="/ReportBug" element={<Report />} />
                <Route path="/SoloComplete" element={<SoloComplete />} />
                <Route path="/leaderboard" element={<LeaderBoard />} />
                
                {/* AI Tutor Routes */}
                <Route path="/tutor" element={<TutorSelect />} />
                <Route path="/tutor/lesson" element={<TutorLesson />} />
                <Route path="/tutor/complete" element={<TutorComplete />} />
                
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
