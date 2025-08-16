import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Splash from './Pages/SplashScreen/Splash';
import SignUp from './Pages/UserAuth/Signup';
import Login from './Pages/UserAuth/Login';
import DashBoard from './Pages/DashBoard/Dashboard';
import SoloQuizSettings from './Pages/QuizSettings/Solo';
import SoloQuiz from './Pages/SoloQuiz/Quiz';
import GroupQuiz from './Pages/GroupQuiz/Quiz';
import GroupQuizSettings from './Pages/QuizSettings/Group';
import SoloComplete from './Pages/SoloQuiz/SoloComplete';
import WaitingRoom from './Pages/GroupQuiz/WaitingRoom';
import Profile from './Pages/Profile/Profile';
import JoinRoom from './Pages/GroupQuiz/JoinRoom';
import Report from './Pages/Report/Report';
import LeaderBoard from './Pages/LeaderBoard/Leaderboard';
import { checkForInteractiveUpdate } from './Services/otaUpdater';

import { ToastProvider } from './components/ui/toast';

function App() {
  useEffect(() => {
    checkForInteractiveUpdate(); 
     }, []);

  return (
    <ToastProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<DashBoard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/JoinRoom" element={<JoinRoom />} />
        <Route path="/WaitingRoom" element={<WaitingRoom />} />
        <Route path="/Group-Quiz" element={<GroupQuiz />} />
        <Route path="/SoloSetting" element={<SoloQuizSettings />} />
        <Route path="/GroupQuiz" element={<GroupQuizSettings />} />
        <Route path="/SoloQuiz" element={<SoloQuiz />} />
        <Route path="/ReportBug" element={<Report />} />
        <Route path="/SoloComplete" element={<SoloComplete />} />
        <Route path="/leaderboard" element={<LeaderBoard />}/>
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
