import { useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Map as MapIcon, Coffee, Utensils, BookOpen, ArrowRight } from "lucide-react";
import "./LocationRadar.css";

type Spot = {
  id: number;
  name: string;
  category: string;
  dangerLevel: "high" | "mid" | "low";
  avgSpend: number;
  lat: number; 
  lng: number;
  advice: string;
  alternatives?: number[];
};

const center = { lat: 3.1408, lng: 101.6932 }; 

export default function LocationRadar() {
  // 🚀 核心改动 1：改用组件化加载，避开 React 19 的 Hook 冲突
  // 同时保留之前的方案 B 类型绕过
  const MapComp = GoogleMap as any;
  const MarkerComp = Marker as any;
  const InfoWindowComp = InfoWindow as any;
  const LoadScriptComp = LoadScript as any;

  const spots: Spot[] = [
    { 
      id: 1, name: "Starbucks Reserve", category: "Cafe", dangerLevel: "high", avgSpend: 25, 
      lat: 3.1415, lng: 101.6940, 
      advice: "高冲动消费区。基于你目前的『买车』目标，在此处购买 RM25 的咖啡会不必要地降低你的韧性评分。",
      alternatives: [3, 4]
    },
    { 
      id: 2, name: "Premium Omakase", category: "Dining", dangerLevel: "high", avgSpend: 150, 
      lat: 3.1450, lng: 101.6900, 
      advice: "奢侈级餐饮。此交易将触发强摩擦拦截，并使你的财务跑道缩短 1.5 天。",
    },
    { 
      id: 3, name: "Local Kopitiam", category: "Cafe & Food", dangerLevel: "low", avgSpend: 8, 
      lat: 3.1380, lng: 101.6920, 
      advice: "极佳的理性选择。具有极高的实用价值价格比。"
    },
    { 
      id: 4, name: "University Library Cafe", category: "Workspace", dangerLevel: "low", avgSpend: 5, 
      lat: 3.1420, lng: 101.6980, 
      advice: "非常适合你的软件工程学业。对你的财务目标零风险。"
    }
  ];

  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(1);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const selectedSpot = spots.find(s => s.id === selectedSpotId);
  const alternatives = selectedSpot?.alternatives 
    ? spots.filter(s => selectedSpot.alternatives!.includes(s.id))
    : [];

  const renderIcon = (category: string) => {
    if (category.includes("Cafe")) return <Coffee size={18} />;
    if (category.includes("Dining")) return <Utensils size={18} />;
    return <BookOpen size={18} />;
  };

  const onLoad = useCallback(function callback(m: google.maps.Map) {
    setMap(m);
  }, []);

  const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    clickableIcons: false,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#0C0121" }] },
      { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#0C0121" }] },
      { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] }
    ]
  };

  return (
    <div className="location-container gx-theme">
      <header className="location-header">
        <h2>Geo-Awareness Radar</h2>
        <p>实时分析你周围消费环境的财务风险。</p>
      </header>

      <main className="location-main">
        {/* 左侧：Google 地图区域 */}
        <div className="map-card" style={{ padding: 0, overflow: "hidden", position: "relative", height: '600px' }}>
          {/* 🚀 核心改动 2：使用 LoadScriptComp 代替 Hook */}
          <LoadScriptComp googleMapsApiKey="AIzaSyCM9IUKisgyTl3n9UTOH6A7P-m6CIyAJq8">
            <MapComp
              mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '24px' }}
              center={center}
              zoom={15}
              onLoad={onLoad}
              options={mapOptions}
            >
              <MarkerComp 
                position={center} 
                icon="https://maps.google.com/mapfiles/ms/icons/blue-dot.png" 
              />

              {spots.map(spot => (
                <MarkerComp
                  key={spot.id}
                  position={{ lat: spot.lat, lng: spot.lng }}
                  onClick={() => {
                    setSelectedSpotId(spot.id);
                    map?.panTo({ lat: spot.lat, lng: spot.lng });
                  }}
                >
                  {selectedSpotId === spot.id && (
                    <InfoWindowComp onCloseClick={() => setSelectedSpotId(null)}>
                      <div style={{ color: "#000", padding: "5px" }}>
                        <div style={{ fontWeight: "bold" }}>{spot.name}</div>
                        <div style={{ fontSize: "12px" }}>预计消费: RM{spot.avgSpend}</div>
                      </div>
                    </InfoWindowComp>
                  )}
                </MarkerComp>
              ))}
            </MapComp>
          </LoadScriptComp>
        </div>

        {/* 右侧：分析面板保持不变 */}
        <div className="details-panel">
          {selectedSpot ? (
            <div className="spot-detail-card">
              <div className="detail-header">
                <div>
                  <h3>{selectedSpot.name}</h3>
                  <span className="category-tag">{selectedSpot.category}</span>
                </div>
                <div className="spend-indicator">
                  <span className={`spend-amount ${selectedSpot.dangerLevel}`}>
                    RM {selectedSpot.avgSpend}
                  </span>
                  <span className="spend-label">人均消费</span>
                </div>
              </div>

              <div className={`advice-box ${selectedSpot.dangerLevel === 'high' ? 'danger' : 'safe'}`}>
                <p><strong>AI 审计建议:</strong> {selectedSpot.advice}</p>
              </div>

              {alternatives.length > 0 && (
                <div className="alternatives-section">
                  <h4>附近的理性替代方案</h4>
                  <div className="alt-list">
                    {alternatives.map(alt => (
                      <div className="alt-item" key={alt.id} onClick={() => {
                        setSelectedSpotId(alt.id);
                        map?.panTo({ lat: alt.lat, lng: alt.lng });
                      }}>
                        <div className="alt-icon">
                          {renderIcon(alt.category)}
                        </div>
                        <div className="alt-info">
                          <strong>{alt.name}</strong>
                          <span>{alt.category}</span>
                        </div>
                        <span className="alt-price">RM {alt.avgSpend}</span>
                        <ArrowRight size={16} color="#64748b" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="spot-detail-card empty-detail">
              <MapIcon size={48} />
              <p>在雷达地图上点击一个地点，开始地理决策分析。</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}