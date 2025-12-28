import { motion } from 'framer-motion';
import type { TutorFeedback } from '../../Types/tutor';
import TutorFeedbackCard from './TutorFeedbackCard';

interface DualTutorFeedbackProps {
  feedback: TutorFeedback | null;
  showNime?: boolean;
  showNesto?: boolean;
  onDismiss?: () => void;
}

export function DualTutorFeedback({
  feedback,
  showNime = true,
  showNesto = true,
  onDismiss,
}: DualTutorFeedbackProps) {
  if (!feedback) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {/* Nime feedback first (explains the concept) */}
      {showNime && feedback.nime && (
        <TutorFeedbackCard
          tutor="nime"
          feedback={feedback.nime}
          isVisible={true}
        />
      )}

      {/* Nesto feedback second (motivates/challenges) */}
      {showNesto && feedback.nesto && (
        <TutorFeedbackCard
          tutor="nesto"
          feedback={feedback.nesto}
          isVisible={true}
          onDismiss={onDismiss}
        />
      )}
    </motion.div>
  );
}

export default DualTutorFeedback;
