import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

interface ScoreData {
    totalScore: number;
    username: string;
    email: string;
}

export const updateUserScore = async (
    userId: string,
    scoreToAdd: number,
    username: string,
    email: string
): Promise<number> => {
    try {
        const userScoreRef = doc(db, 'userScores', userId);
        const docSnap = await getDoc(userScoreRef);

        if (docSnap.exists()) {
            // Update existing score
            await updateDoc(userScoreRef, {
                totalScore: increment(scoreToAdd),
                username: username,
                email: email
            });

            const updatedDoc = await getDoc(userScoreRef);
            return updatedDoc.data()?.totalScore || 0;
        } else {
            // Create new score document
            const newScore: ScoreData = {
                totalScore: scoreToAdd,
                username: username,
                email: email
            };
            await setDoc(userScoreRef, newScore);
            return scoreToAdd;
        }
    } catch (error) {
        console.error('Error updating score:', error);
        throw error;
    }
};

export const getUserScore = async (
    userId: string
): Promise<{ totalScore: number, username: string, email: string } | null> => {
    try {
        const userScoreRef = doc(db, 'userScores', userId);
        const docSnap = await getDoc(userScoreRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                totalScore: data.totalScore || 0,
                username: data.username || 'Anonymous',
                email: data.email || ''
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting user score:', error);
        throw error;
    }
};