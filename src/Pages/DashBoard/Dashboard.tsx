import { useState, useEffect } from 'react';
import { User } from 'firebase/auth'; 
import Sidebar from '../DashBoard/Sidebar';
import Header from '../DashBoard/Header';
import IndividualQuizCard from '../DashBoard/IndividualQuizCard';
import GroupQuizCard from '../DashBoard/GroupQuizCard';
import FooterNav from './Footer';
import { auth } from '../../../firebase';
import { useNavigate } from 'react-router-dom'


export default function Dashboard() {
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
    <div className="overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black w-screen h-screen flex flex-col md:flex-row">
 <div  className="hidden md:block" >
  <Sidebar/> 
  </div>
    <div className="flex-1 flex flex-col  md:pb-0">
    <Header user={user || undefined} />
    <main className="flex flex-col overflow-hidden md:flex-row justify-center items-center gap-6 md:gap-16 p-4 md:p-8 w-full max-w-7xl mx-auto ">
   
    <div className="pt-35 lg:pt-[0px]">
  <IndividualQuizCard />
</div>

<div className="sm:hidden"> </div>

<div className="pt-15 lg:pt-[0px] pb-30 lg:pb-[0px]  ">
           <GroupQuizCard  />
   </div>
      
    </main>
    <div className="fixed bottom-0 left-0 w-full md:hidden" >
    <FooterNav /> 
  </div>
  </div>
</div>
  );
}
