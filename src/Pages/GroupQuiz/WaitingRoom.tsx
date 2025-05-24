import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { toast } from "../../components/ui/toast";
import { Users, Copy, Play } from "lucide-react";

import roomService from '../../Services/Rooms';

export default function WaitingRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  
  if (!state || !state.roomCode) {
    return (
      <div className="text-white text-center py-8">
        <h2 className="text-2xl font-bold mb-4">No room information</h2>
        <p className="text-gray-400">Please join or create a room first.</p>
      </div>
    );
  }

  const { roomCode, roomName, isHost, username, questions, quizTime } = state;
  
const [participants, setParticipants] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
    
  useEffect(() => {
      const unsubscribeParticipants = roomService.listenForParticipants(
      roomCode,
      (participantsData) => {
        setParticipants(participantsData as unknown as boolean);
      }
    );
    
    // Listen for quiz status changes
    const unsubscribeStatus = roomService.listenForQuizStatus(
      roomCode,
      (status) => {
        if (status === 'active') {
        
          navigate('/Group-Quiz', {
            state: {
              roomCode,
              isHost,
              username: username || "Host",
              participants,
              questions,
              quizTime
            }
          });
        }
      }
    );
    
    return () => {
      unsubscribeParticipants();
      unsubscribeStatus();
    };
  }, [roomCode, isHost, username, navigate, participants, questions, quizTime]);
  
  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success("Room code copied to clipboard!");
  };
  
  const handleStartQuiz = async () => {
    if (!isHost) return;
    
    setIsStarting(true);
    try {
      await roomService.startQuiz(roomCode);
      // The navigation will happen automatically through the status listener
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Failed to start quiz');
      setIsStarting(false);
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
        className="w-full max-w-xl"
      >
        <Card className="w-full border border-gray-700 bg-[#131924]/90 backdrop-blur-xl shadow-xl rounded-2xl animate-scale-in">
          <CardContent className="space-y-6 pt-6 px-6">
            <motion.h2
              className="text-3xl font-bold text-center text-orange-400"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {roomName || "Quiz Room"}
            </motion.h2>
            
            <div className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Room Code</p>
                <p className="text-white text-xl font-mono font-bold tracking-wider">{roomCode}</p>
              </div>
              <Button 
                onClick={handleCopyRoomCode}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold">Participants ({Array.isArray(participants) ? participants.length : 0})</h3>
              </div>
              
              <div className="bg-gray-800/50 rounded-xl p-4 max-h-60 overflow-y-auto">
                {Array.isArray(participants) && participants.length === 0 ? (
                  <p className="text-gray-400 text-center">Waiting for participants to join...</p>
                ) : (
                  <ul className="space-y-2">
                    {Array.isArray(participants) && participants.map((participant: { id: string; name: string; isHost: boolean }) => (
                      <li 
                        key={participant.id} 
                        className="bg-gray-700/50 rounded-lg px-3 py-2 text-white flex items-center"
                      >
                        <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center mr-3">
                          {participant.name.charAt(0).toUpperCase()}
                        </div>
                        {participant.name.split(' ')[0]} {participant.isHost && <span>&nbsp;(Host)</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            {isHost && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-white">
                <p className="text-sm">Share the room code with others to let them join your quiz!</p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center pt-4 pb-6">
            {isHost ? (
              <Button 
                onClick={handleStartQuiz}
                disabled={isStarting || !Array.isArray(participants) || participants.length < 2}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl w-full flex items-center justify-center gap-2"
              >
                {isStarting ? "Starting..." : (
                  <>
                    Start Quiz <Play className="h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <p className="text-gray-400 text-center">Waiting for host to start the quiz...</p>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}