import { useState } from "react";

export const useConfetti = () => {
  const [showConfetti, setShowConfetti] = useState(false);

  const triggerConfetti = () => {
    setShowConfetti(true);
  };

  const onConfettiComplete = () => {
    setShowConfetti(false);
  };

  return {
    showConfetti,
    triggerConfetti,
    onConfettiComplete,
  };
};
