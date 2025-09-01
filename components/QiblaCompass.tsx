import React, { useState, useEffect } from 'react';

interface QiblaCompassProps {
  qiblaDirection: number;
}

const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

export const QiblaCompass: React.FC<QiblaCompassProps> = ({ qiblaDirection }) => {
  const [heading, setHeading] = useState<number | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLevel, setIsLevel] = useState(true);
  const [showCalibration, setShowCalibration] = useState(false);

  const handleOrientation = (event: DeviceOrientationEvent) => {
    // webkitCompassHeading is for iOS
    const compassHeading = (event as any).webkitCompassHeading ?? event.alpha;
    if (compassHeading !== null) {
      setHeading(compassHeading);
    }

    // Tilt detection
    const beta = event.beta; // Front-to-back tilt (-180 to 180)
    const gamma = event.gamma; // Left-to-right tilt (-90 to 90)
    
    if (beta !== null && gamma !== null) {
        // Define a threshold for being "level". E.g., within 15 degrees.
        const levelThreshold = 15;
        setIsLevel(Math.abs(beta) <= levelThreshold && Math.abs(gamma) <= levelThreshold);
    }
  };

  const requestPermission = async () => {
    setError(null);
    if (isIOS && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
          setPermissionGranted(true);
        } else {
          setError('Permission for device orientation was denied.');
          setPermissionGranted(false);
        }
      } catch (err) {
        setError('Error requesting device orientation permission.');
        console.error(err);
        setPermissionGranted(false);
      }
    } else {
      // For non-iOS browsers that support the event directly or don't require permission
       if (typeof (DeviceOrientationEvent as any) !== 'undefined') {
            window.addEventListener('deviceorientation', handleOrientation);
            setPermissionGranted(true);
       } else {
            setError('Device orientation is not supported by your browser.');
       }
    }
  };

  useEffect(() => {
    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);
  
  const rotation = heading !== null ? 360 - heading + qiblaDirection : 0;
  
  const CalibrationInstructions = () => (
    <div className="absolute inset-0 bg-cream/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 rounded-full z-20">
      <h4 className="font-bold text-lg text-islamic-green-dark">Calibrate Compass</h4>
      <p className="text-stone-600 my-2 text-sm">For an accurate reading, move your device in a figure-8 pattern.</p>
      <svg className="w-12 h-12 text-stone-400 my-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.5 12C15.5 14.4853 13.4853 16.5 11 16.5C8.51472 16.5 6.5 14.4853 6.5 12C6.5 9.51472 8.51472 7.5 11 7.5C13.4853 7.5 15.5 9.51472 15.5 12ZM15.5 12C15.5 9.51472 17.5147 7.5 20 7.5C22.4853 7.5 24.5 9.51472 24.5 12C24.5 14.4853 22.4853 16.5 20 16.5C17.5147 16.5 15.5 14.4853 15.5 12Z" transform="translate(-4, 0)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <button
        onClick={() => setShowCalibration(false)}
        className="mt-2 px-4 py-2 bg-islamic-green text-white rounded-lg hover:bg-islamic-green-dark transition shadow-sm font-medium text-sm"
      >
        Done
      </button>
    </div>
  );

  const TiltWarning = () => (
      <div className="absolute inset-0 bg-amber-400/20 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 rounded-full z-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
      </div>
  );


  if (!permissionGranted) {
    return (
      <div className="text-center">
        <button
          onClick={requestPermission}
          className="px-4 py-2 bg-islamic-green text-white rounded-lg hover:bg-islamic-green-dark transition shadow-sm font-medium"
        >
          Activate Compass
        </button>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        <p className="text-xs text-stone-500 mt-2">Compass requires access to your device's motion sensors.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-48 h-48">
        {/* Compass Background */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="48" fill="#FDFCF9" stroke="#d4d4d4" strokeWidth="1" />
          <text x="50" y="15" textAnchor="middle" fontSize="8" fill="#285a43" fontWeight="bold">N</text>
          <text x="50" y="90" textAnchor="middle" fontSize="8" fill="#a3a3a3">S</text>
          <text x="10" y="53" textAnchor="middle" fontSize="8" fill="#a3a3a3">W</text>
          <text x="90" y="53" textAnchor="middle" fontSize="8" fill="#a3a3a3">E</text>
        </svg>

        {/* Needle */}
        <div
          className={`absolute top-0 left-0 w-full h-full transition-transform duration-500 ease-in-out ${!isLevel ? 'opacity-30' : ''}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Kaaba Icon */}
                <path d="M50 2 L46 15 L54 15 Z" fill="#c5a35d" />
            </svg>
        </div>
        {/* Conditional Overlays */}
        {!isLevel && <TiltWarning />}
        {showCalibration && <CalibrationInstructions />}
      </div>
      <p className="font-semibold text-lg text-islamic-green-dark h-7 flex items-center">
        {heading === null ? 'Calibrating...' : !isLevel ? (
            <span className="text-amber-700 text-base font-medium">Hold Device Flat</span>
        ) : `${Math.round(qiblaDirection)}°`}
      </p>
      <button 
          onClick={() => setShowCalibration(c => !c)}
          className="text-sm text-stone-500 hover:text-islamic-green-dark underline transition-colors"
      >
          {showCalibration ? 'Close' : 'Recalibrate Compass'}
      </button>
    </div>
  );
};
