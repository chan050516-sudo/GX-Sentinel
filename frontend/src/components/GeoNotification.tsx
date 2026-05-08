import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import './GeoNotification.css';

export default function GeoNotification() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  // Global keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'n') {
        setShow(true);
      }
      // Esc to exit
      if (e.key === 'Escape') {
        setShow(false);
      }
    };

    // Global listening
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean Up Function
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  return (
    <div className={`geo-notification-wrapper ${show ? 'show' : ''}`}>
      <div 
        className="geo-notification"
        onClick={() => {
          setShow(false);
          setTimeout(() => {
            navigate('/location'); 
          }, 300);
        }}
      >
        <div className="geo-icon-box">
          <MapPin size={24} />
        </div>
        <div className="geo-text-box">
          <strong>High-Spend Zone Detected</strong>
          <span>Entering Pavilion KL area. Radar scan active.</span>
        </div>
        <div className="geo-action">
          <ChevronRight size={20} />
        </div>
      </div>
    </div>
  );
}