import { realtimeDatabase } from '../../firebase';
import { ref, set, get, onValue, update} from 'firebase/database';
import { auth } from '../../firebase';


interface RoomData {
  roomCode: string;
  roomName: string;
  hostId: string;
  hostName: string;
  createdAt: number;
  questions;
  quizTime: number;
  status: 'waiting' | 'active' | 'completed';
}


interface ParticipantData {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

const roomService = {
 createRoom: async (roomData: Omit<RoomData, 'hostId' | 'hostName' | 'createdAt' | 'status'>) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const roomRef = ref(realtimeDatabase, `rooms/${roomData.roomCode}`);
   
      const snapshot = await get(roomRef);
      if (snapshot.exists()) {
        throw new Error('Room with this code already exists');
      }
      
      const newRoomData: RoomData = {
        ...roomData,
        hostId: user.uid,
        hostName: `${user.displayName || 'Host'} (Host)`,
        createdAt: Date.now(),
        status: 'waiting'
      };
   
      await set(roomRef, newRoomData);

      const participantData: ParticipantData = {
        id: user.uid,
        name: `${user.displayName || 'Host'} (Host)`,
        isHost: true,
        joinedAt: Date.now()
      };
      
      await set(ref(realtimeDatabase, `rooms/${roomData.roomCode}/participants/${user.uid}`), participantData);
      
      return roomData.roomCode;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  },

  joinRoom: async (roomCode: string, username: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
 
      const roomRef = ref(realtimeDatabase, `rooms/${roomCode}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        throw new Error('Room not found');
      }
      
      const roomData = snapshot.val();

      if (roomData.status !== 'waiting') {
        throw new Error('This quiz has already started or ended');
      }
      
      // Add participant to room
      const participantData: ParticipantData = {
        id: user.uid,
        name: username,
        isHost: false,
        joinedAt: Date.now()
      };
      
      await set(ref(realtimeDatabase, `rooms/${roomCode}/participants/${user.uid}`), participantData);
      
      return roomData;
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  },
  
  
  listenForParticipants: (roomCode: string, callback: (participants: ParticipantData[]) => void) => {
    const participantsRef = ref(realtimeDatabase, `rooms/${roomCode}/participants`);
    
    const unsubscribe = onValue(participantsRef, (snapshot) => {
      if (snapshot.exists()) {
        const participantsData = snapshot.val();
        const participantsArray = Object.values(participantsData) as ParticipantData[];
        callback(participantsArray);
      } else {
        callback([]);
      }
    });
    
    return unsubscribe;
  },
  
  
  startQuiz: async (roomCode: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
  
      const hostRef = ref(realtimeDatabase, `rooms/${roomCode}/hostId`);
      const hostSnapshot = await get(hostRef);
      
      if (!hostSnapshot.exists() || hostSnapshot.val() !== user.uid) {
        throw new Error('Only the host can start the quiz');
      }
      
     
      await update(ref(realtimeDatabase, `rooms/${roomCode}`), {
        status: 'active',
        startedAt: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error starting quiz:', error);
      throw error;
    }
  },
  
  
  listenForQuizStatus: (roomCode: string, callback: (status: string) => void) => {
    const statusRef = ref(realtimeDatabase, `rooms/${roomCode}/status`);
    
    const unsubscribe = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });
    
    return unsubscribe;
  },
  

  submitAnswers: async (roomCode: string, answers: Record<number, number>) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      await set(ref(realtimeDatabase, `rooms/${roomCode}/answers/${user.uid}`), {
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        answers,
        submittedAt: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error submitting answers:', error);
      throw error;
    }
  },
  
  getAnswers: async (roomCode: string) => {
    try {
      const answersRef = ref(realtimeDatabase, `rooms/${roomCode}/answers`);
      const snapshot = await get(answersRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      
      return {};
    } catch (error) {
      console.error('Error getting answers:', error);
      throw error;
    }
  },
  
 
  listenForAnswers: (roomCode: string, callback: (answers) => void) => {
    const answersRef = ref(realtimeDatabase, `rooms/${roomCode}/answers`);
    
    const unsubscribe = onValue(answersRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback({});
      }
    });
    
    return unsubscribe;
  }
};

export default roomService;