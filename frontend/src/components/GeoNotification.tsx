import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import './GeoNotification.css';

export default function GeoNotification() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  // 模拟：页面加载 3 秒后，用户“走入”了高消费区
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className={`geo-notification-wrapper ${show ? 'show' : ''}`}>
      <div 
        className="geo-notification"
        onClick={() => {
          setShow(false);
          navigate('/location'); // 点击后跳转到地图页
        }}
      >
        <div className="geo-icon-box">
          <MapPin size={24} />
        </div>
        <div className="geo-text-box">
          <strong>High-Spend Zone Detected</strong>
          <span>You are near Starbucks Reserve (Avg RM25)</span>
        </div>
        <div className="geo-action">
          <ChevronRight size={20} />
        </div>
      </div>
    </div>
  );
}