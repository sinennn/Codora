import Splash from './Pages/SplashScreen/Splash';
import SignUp from './Pages/UserAuth/Signup';
import Login from './Pages/UserAuth/Login';
import DashBoard from './Pages/DashBoard/Dashboard'
import { BrowserRouter, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/LogIn" element={<Login />} />
        <Route path="/DashBoard" element={<DashBoard/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;