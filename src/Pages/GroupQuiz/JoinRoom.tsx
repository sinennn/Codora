import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { toast } from '../../components/ui/toast'
import { auth } from "../../../firebase";
import roomService from '../../Services/Rooms';
import { ClipLoader } from 'react-spinners'; 
import useSendBack from "../../Services/sendBack";

export default function JoinRoom() {
  useSendBack();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  //const [username, setUsername] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  
  useEffect(() => {
    
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user && user.displayName) {
      
       // setUsername(user.displayName.split(' ')[0]); 
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      toast.error("Please enter a room code");
      return;
    }
    
    setIsJoining(true);
    
    try {
      // Get the current user's display name from Firebase Auth
      const user = auth.currentUser;
      const displayName = user?.displayName?.split(' ')[0] || 'Guest';
      
      // Verify and join the room in Firebase
      const roomData = await roomService.joinRoom(roomCode, displayName);
      
      // Navigate to waiting room
      navigate('/WaitingRoom', {
        state: {
          roomCode,
          roomName: roomData.roomName,
          questions: roomData.questions,
          quizTime: roomData.quizTime,
          username: displayName,
          isHost: false
        }
      });
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error(`Failed to join room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsJoining(false);
    }
  };
  
  return (
    <div className="relative w-full min-h-screen flex justify-center items-center bg-gradient-to-br from-black via-gray-900 to-black px-4 sm:px-8 py-12 overflow-hidden animate-fade-in">

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-700/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="w-full border border-gray-700 bg-[#131924]/90 backdrop-blur-xl shadow-xl rounded-2xl animate-scale-in">
          <CardContent className="space-y-6 pt-6 px-6">
            <motion.h2
              className="text-3xl font-bold text-center text-orange-400"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Join Quiz Room
            </motion.h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomCode" className="text-white">Room Code</Label>  
                <Input
                  id="roomCode"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit room code"
                  className="bg-gray-800 border-gray-700 text-white uppercase"
                  maxLength={6}
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center pt-4 pb-6">
            <Button 
              onClick={handleJoinRoom}
              disabled={isJoining}
              className="bg-orange-600 hover:bg-orange-600 text-white px-6 py-2 rounded-md w-full"
            >
              {isJoining ?
               <ClipLoader color="#FFFFFF" size={22} cssOverride={{ borderWidth: '4px' }} />
               : "Join Room"}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}