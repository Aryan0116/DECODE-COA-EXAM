import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import Loader from './components/Loader.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx'
import { ThemeProvider } from './hooks/use-theme.tsx'

const RootComponent = () => {
  const [loading, setLoading] = useState(true);

  // Log performance time
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      if (!loading) {
        const endTime = performance.now();
        console.log(`Initial app render time: ${endTime - startTime}ms`);
      }
    };
  }, [loading]);
  
  return loading ? (
    <Loader onLoadComplete={() => setLoading(false)} />
  ) : (
    <React.StrictMode>
      <ThemeProvider defaultTheme="light" storageKey="exam-system-theme">
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

createRoot(document.getElementById('root')!).render(<RootComponent />);