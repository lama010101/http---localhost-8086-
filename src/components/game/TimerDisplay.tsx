import React, { useEffect, useRef } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useSettingsStore } from '@/lib/useSettingsStore';

interface TimerDisplayProps {
  remainingTime: number;
  setRemainingTime: React.Dispatch<React.SetStateAction<number>>;
  isActive: boolean;
  onTimeout?: () => void;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  remainingTime,
  setRemainingTime,
  isActive,
  onTimeout
}) => {
  const { roundTimerSec } = useGame();
  const initializedRef = useRef(false);
  const { soundEnabled } = useSettingsStore();
  const countdownBeepRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      countdownBeepRef.current = new Audio('/sounds/countdown-beep.mp3');
      countdownBeepRef.current.preload = 'auto';
    }
    
    return () => {
      if (countdownBeepRef.current) {
        countdownBeepRef.current.pause();
        countdownBeepRef.current = null;
      }
    };
  }, []);
  
  // Play countdown sound effect when time <= 10 seconds
  useEffect(() => {
    if (isActive && remainingTime <= 10 && remainingTime > 0 && soundEnabled) {
      if (countdownBeepRef.current) {
        // Clone the audio to allow rapid playback
        const beepSound = countdownBeepRef.current.cloneNode() as HTMLAudioElement;
        beepSound.volume = 0.5;
        beepSound.play().catch(e => console.error('Error playing countdown sound:', e));
      }
    }
  }, [remainingTime, isActive, soundEnabled]);
  
  // Initialize timer from context settings
  useEffect(() => {
    if (!initializedRef.current && roundTimerSec > 0) {
      setRemainingTime(roundTimerSec);
      initializedRef.current = true;
    }
  }, [roundTimerSec, setRemainingTime]);

  // Skip timer if roundTimerSec is 0 (no timer)
  if (roundTimerSec === 0) {
    return null;
  }
  
  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (remainingTime <= 0 && roundTimerSec > 0) {
      // Time's up - handle completion only if timer is enabled
      if (onTimeout) {
        onTimeout();
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, remainingTime, onTimeout, setRemainingTime, roundTimerSec]);

  // We don't render anything here because the timer display is handled elsewhere
  return null;
};

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default TimerDisplay;
