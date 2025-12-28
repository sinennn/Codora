import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import Sidebar from '../DashBoard/Sidebar';
import Header from '../DashBoard/Header';
import IndividualQuizCard from '../DashBoard/IndividualQuizCard';
import GroupQuizCard from '../DashBoard/GroupQuizCard';
import FooterNav from './Footer';
import { auth } from '../../../firebase';
import { useNavigate } from 'react-router-dom'
import useSendBack from '../../Services/sendBack';

export default function Dashboard() {
  useSendBack();
  const [user, setUser] = useState<User | null>(null);
  const Navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        Navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [Navigate]);

  return (
    <div className="overflow-x-hidden bg-gradient-to-br from-black via-gray-900 to-black w-full min-h-screen min-h-[100dvh] flex flex-col md:flex-row safe-top">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col">
        <Header user={user || undefined} />
        <main className="flex flex-col md:flex-row justify-center items-center gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto flex-grow pb-28 md:pb-8">
          <div className="w-full max-w-sm">
            <IndividualQuizCard />
          </div>
          <div className="w-full max-w-sm">
            <GroupQuizCard />
          </div>
        </main>
        <FooterNav />
      </div>
    </div>
  );
}
