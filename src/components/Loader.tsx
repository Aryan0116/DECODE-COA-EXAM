import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, FileCheck, Zap } from 'lucide-react';

const ExamLoader = ({ duration = 3500, onLoadComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState(0);
  
  const loadingTexts = [
    "Initializing exam environment...",
    "Preparing test questions...",
    "Setting up proctoring tools...",
    "Ready to begin assessment..."
  ];

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const calculatedProgress = (elapsed / duration) * 100;
      const newProgress = Math.min(100, calculatedProgress);
      
      setProgress(Math.round(newProgress));
      
      if (newProgress < 25) {
        setLoadingPhase(0);
      } else if (newProgress < 55) {
        setLoadingPhase(1);
      } else if (newProgress < 85) {
        setLoadingPhase(2);
      } else {
        setLoadingPhase(3);
      }
      
      if (now < endTime) {
        requestAnimationFrame(updateProgress);
      } else {
        setProgress(100);
        
        setTimeout(() => {
          if (onLoadComplete) {
            onLoadComplete();
          }
        }, 500);
      }
    };
    
    requestAnimationFrame(updateProgress);
    
    return () => {
      // Cleanup if needed
    };
  }, [duration, onLoadComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-tr from-blue-900 via-indigo-800 to-violet-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating elements */}
        <div className="absolute top-1/4 left-1/4 h-16 w-16 animate-pulse rounded-full bg-blue-400 opacity-20"></div>
        <div className="absolute top-2/3 right-1/4 h-24 w-24 animate-pulse rounded-full bg-violet-400 opacity-20"></div>
        <div className="absolute bottom-1/4 right-1/3 h-20 w-20 animate-pulse rounded-full bg-indigo-400 opacity-20"></div>
        
        {/* Code symbols animation - using divs with font styling */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-mono text-6xl text-white opacity-5">&lt;/&gt;</div>
        </div>
      </div>
      
      {/* Main loader container */}
      <div className="relative flex flex-col items-center justify-center px-8 py-10 backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 shadow-2xl max-w-md mx-4">
        {/* Logo and spinner */}
        <div className="relative flex h-36 w-36 items-center justify-center mb-6">
          <div className="absolute h-36 w-36 animate-spin rounded-full border-4 border-t-indigo-300 border-r-transparent border-b-indigo-100 border-l-transparent"></div>
          <div className="absolute h-28 w-28 rounded-full border-2 border-indigo-300/30"></div>
          <div className="absolute h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-400 shadow-lg flex items-center justify-center">
            <div className="absolute h-4 w-4 rounded-full bg-emerald-300 opacity-50"></div>
            <BookOpen size={32} className="text-white" />
          </div>
        </div>
        
        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-blue-300">DECODE</span>
            <span> CO-A </span>
            <span className="text-emerald-300">EXAM</span>
          </h1>
          <p className="text-indigo-200 mt-2 text-sm">Assessment Portal Loading</p>
        </div>
        
        {/* Progress bar */}
        <div className="w-full max-w-xs mb-4">
          <div className="h-3 w-full overflow-hidden rounded-full bg-indigo-900/50 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-300 transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full w-full bg-white/20"></div>
            </div>
          </div>
          <div className="mt-3 text-center text-sm font-medium text-indigo-100 h-6">
            {loadingTexts[loadingPhase]}
          </div>
        </div>
        
        {/* Loading indicators */}
        <div className="flex items-center justify-center space-x-4 mt-6">
          <div className="flex flex-col items-center">
            <BookOpen className={`${progress > 25 ? 'text-emerald-300' : 'text-indigo-300/40'} mb-2`} size={20} />
            <span className={`text-xs ${progress > 25 ? 'text-emerald-300' : 'text-indigo-300/40'}`}>Initialize</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`h-px w-6 ${progress > 25 ? 'bg-emerald-300' : 'bg-indigo-300/40'}`}></div>
          </div>
          <div className="flex flex-col items-center">
            <FileCheck className={`${progress > 55 ? 'text-emerald-300' : 'text-indigo-300/40'} mb-2`} size={20} />
            <span className={`text-xs ${progress > 55 ? 'text-emerald-300' : 'text-indigo-300/40'}`}>Questions</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`h-px w-6 ${progress > 55 ? 'bg-emerald-300' : 'bg-indigo-300/40'}`}></div>
          </div>
          <div className="flex flex-col items-center">
            <Clock className={`${progress > 85 ? 'text-emerald-300' : 'text-indigo-300/40'} mb-2`} size={20} />
            <span className={`text-xs ${progress > 85 ? 'text-emerald-300' : 'text-indigo-300/40'}`}>Proctor</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`h-px w-6 ${progress > 85 ? 'bg-emerald-300' : 'bg-indigo-300/40'}`}></div>
          </div>
          <div className="flex flex-col items-center">
            <Zap className={`${progress > 97 ? 'text-emerald-300' : 'text-indigo-300/40'} mb-2`} size={20} />
            <span className={`text-xs ${progress > 97 ? 'text-emerald-300' : 'text-indigo-300/40'}`}>Ready</span>
          </div>
        </div>
        
        {/* Optional timer text */}
        <div className="mt-8 bg-white/5 px-4 py-2 rounded-full">
          <span className="text-xs text-indigo-200">
            {progress < 100 ? 
              `Loading: ${progress}%` : 
              "Exam environment ready!"}
          </span>
        </div>
      </div>
      
      {/* Additional educational elements */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className="text-xs text-indigo-200/60 text-center max-w-sm px-4">
          <p>Please wait while we set up your secure exam environment.</p>
          <p className="mt-1 text-emerald-300/70">Do not refresh this page.</p>
        </div>
      </div>
    </div>
  );
};

export default ExamLoader;