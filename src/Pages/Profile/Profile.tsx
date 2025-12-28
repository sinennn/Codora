import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { User, Mail, LogOut, Trash2, Bug } from "lucide-react";
import { toast } from '../../components/ui/toast';
import { ClipLoader } from 'react-spinners';
import Footer from '../DashBoard/Footer';
import { auth, onAuthStateChanged, signOut } from '../../../firebase'
import { deleteUser } from 'firebase/auth';
import useSendBack from "../../Services/sendBack";
import { Link } from 'react-router-dom';

export default function Index() {
  useSendBack();
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUsername(currentUser.displayName || "---");
        setEmail(currentUser.email || "");
        setProfilePic(currentUser.photoURL || "");
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut(auth);
      toast.success('Signed out successfully!');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setIsDeletingAccount(true);
      try {
        if (user) {
          await deleteUser(user);
          toast.success('Account deleted successfully!');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.error('Failed to delete account. You may need to re-authenticate.');
      } finally {
        setIsDeletingAccount(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen min-h-[100dvh] flex justify-center items-center bg-gradient-to-br from-black via-gray-900 to-black">
        <ClipLoader color="#f97316" size={50} cssOverride={{ borderWidth: '4px' }} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen min-h-[100dvh] flex flex-col bg-gradient-to-br from-black via-gray-900 to-black relative overflow-x-hidden safe-top">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-2 left-1/4 w-64 sm:w-80 h-64 sm:h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-orange-700/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 pt-6 sm:pt-8 pb-28 sm:pb-32">
        <Card className="w-full max-w-sm sm:max-w-md border-gray-700 bg-gray-900/80 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] border animate-scale-in">
          <CardHeader className="pb-1 pt-6 sm:pt-8">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-center bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
              Profile
            </CardTitle>
            <CardDescription className="text-gray-400 text-center pt-2 text-sm">
              So, this is you🙂
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="flex flex-col items-center space-y-1">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-700 border-2 border-gray-600 overflow-hidden flex items-center justify-center">
                  {profilePic ? (
                    <img
                      src={profilePic}
                      alt="Profile"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/assets/navuser.png";
                      }}
                      className="w-full h-full object-cover"
                    />
                  ) : username ? (
                    <span className="text-3xl sm:text-4xl font-bold text-orange-400 select-none">
                      {username.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-400 flex items-center gap-2">
                  <User className="h-4 w-4 text-orange-500" />
                  Username
                </label>
                <div className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 sm:py-2 h-auto min-h-[44px] flex items-center text-sm sm:text-base truncate">
                  {username}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-orange-500" />
                  Email
                </label>
                <div className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 sm:py-2 h-auto min-h-[44px] flex items-center text-sm sm:text-base truncate">
                  {email}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                onClick={handleSignOut}
                className="w-full py-3 min-h-[44px] bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <ClipLoader color="#ffffff" size={20} cssOverride={{ borderWidth: '3px' }} />
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </>
                )}
              </Button>

              <Link to="/ReportBug" className="block">
                <Button className="w-full py-3 min-h-[44px] bg-gray-700 hover:bg-gray-600 text-orange-500 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base">
                  <Bug className="w-4 h-4 text-orange-500" />
                  Report a Bug
                </Button>
              </Link>

              <a href="https://x.com/_codora_xyz" className="block">
                <Button className="w-full py-3 min-h-[44px] bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                  Follow us on Twitter
                </Button>
              </a>

              <Button
                onClick={handleDeleteAccount}
                className="w-full py-3 min-h-[44px] bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <ClipLoader color="#ffffff" size={20} cssOverride={{ borderWidth: '3px' }} />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
