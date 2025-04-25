
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth'; 
import Sidebar from '../DashBoard/Sidebar';
import Header from '../DashBoard/Header';
import IndividualQuizCard from '../DashBoard/IndividualQuizCard';
import GroupQuizCard from '../DashBoard/GroupQuizCard';
import FooterNav from './Footer';
import { auth } from '../../../firebase';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
    });

    return () => unsubscribe();
    
  }, []);

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-black w-screen min-h-screen flex flex-col md:flex-row">
 <div  className="hidden md:block" >
  <Sidebar/> 
  </div>
    <div className="flex-1 flex flex-col pb-16 md:pb-0">
    <Header user={user || undefined} />
    <main className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 p-4 md:p-8">
      <IndividualQuizCard />
      <div className="hidden md:block p-4 md:p-8">
        {/* Additional content can go here */}
      </div>
      <GroupQuizCard />
    </main>
    <div className="fixed bottom-0 left-0 w-full md:hidden" >
    <FooterNav /> 
  </div>
  </div>
</div>
  );
}
