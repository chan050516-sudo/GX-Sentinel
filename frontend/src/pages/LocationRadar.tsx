import { useState, useCallback, useRef } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Map as MapIcon, Coffee, Utensils, ShoppingBag, ShieldAlert, ArrowRight, ArrowLeft, Target, AlertTriangle } from "lucide-react";
import "./LocationRadar.css";

// --- Data Models ---
type Alternative = {
  id: number;
  name: string;
  category: string;
  avgSpend: number;
};

type Spot = {
  id: number;
  name: string;
  category: string;
  dangerLevel: "critical" | "warning" | "safe";
  avgSpend: number;
  runwayDrop: number;      // How many days of runway lost
  resilienceDrop: number;  // Impact on resilience score
  advice: string;
  alternatives: Alternative[];
};

type Zone = {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  baseZoomLevel: number; // Minimum zoom level required to see this zone
  spots: Spot[];
};

// Center on Bukit Bintang, Kuala Lumpur
const center = { lat: 3.1466, lng: 101.7115 }; 

export default function LocationRadar() {
  // Google Map Components type bypassing
  const MapComp = GoogleMap as any;
  const MarkerComp = Marker as any;
  const InfoWindowComp = InfoWindow as any;
  const LoadScriptComp = LoadScript as any;

  // --- Hackathon Mock Data: High-Spend Zones ---
  const zones: Zone[] = [
    {
      id: 1, name: "Pavilion Kuala Lumpur", type: "Luxury Retail & Dining Hub", lat: 3.1488, lng: 101.7133, baseZoomLevel: 10,
      spots: [
        {
          id: 101, name: "Premium Omakase Dining", category: "Dining", dangerLevel: "critical", avgSpend: 850,
          runwayDrop: 5.2, resilienceDrop: 8.5,
          advice: "Severe risk. This single transaction accounts for 30% of your monthly variable budget. It directly conflicts with your 'Emergency Fund' goal.",
          alternatives: [
            { id: 901, name: "Tokyo Street Food Hall", category: "Dining", avgSpend: 45 },
            { id: 902, name: "Suki-Ya Pavilion", category: "Dining", avgSpend: 85 }
          ]
        },
        {
          id: 102, name: "Luxury Designer Boutique", category: "Retail", dangerLevel: "critical", avgSpend: 3200,
          runwayDrop: 18.5, resilienceDrop: 15.0,
          advice: "Critical warning. Purchasing luxury goods right now will break your 14-day saving streak and severely compromise your financial runway.",
          alternatives: [
            { id: 903, name: "High-Street Fashion Brands", category: "Retail", avgSpend: 250 }
          ]
        },
        {
          id: 103, name: "Artisan Coffee Roastery", category: "Cafe", dangerLevel: "warning", avgSpend: 35,
          runwayDrop: 0.2, resilienceDrop: 1.0,
          advice: "Borderline impulse. While affordable, frequenting premium cafes forms a micro-drain pattern on your liquidity.",
          alternatives: [
            { id: 904, name: "Local Kopitiam", category: "Cafe", avgSpend: 12 }
          ]
        }
      ]
    },
    {
      id: 2, name: "The Exchange TRX", type: "Financial & Lifestyle District", lat: 3.1419, lng: 101.7186, baseZoomLevel: 12,
      spots: [
        {
          id: 201, name: "Gordon Ramsay Bar & Grill", category: "Dining", dangerLevel: "critical", avgSpend: 600,
          runwayDrop: 3.8, resilienceDrop: 5.0,
          advice: "High-friction transaction. Unless this is a pre-planned milestone celebration, this breaks your behavioral discipline framework.",
          alternatives: []
        },
        {
          id: 202, name: "% Arabica Coffee", category: "Cafe", dangerLevel: "warning", avgSpend: 28,
          runwayDrop: 0.1, resilienceDrop: 0.5,
          advice: "Acceptable occasionally, but triggers our 'Latte Factor' alert. You've purchased 4 similar items this week.",
          alternatives: [
            { id: 905, name: "Zus Coffee", category: "Cafe", avgSpend: 10 }
          ]
        }
      ]
    },
    {
      id: 3, name: "Changkat Bukit Bintang", type: "Nightlife & Entertainment", lat: 3.1475, lng: 101.7082, baseZoomLevel: 14,
      spots: [
        {
          id: 301, name: "Premium Cocktail Bar", category: "Nightlife", dangerLevel: "critical", avgSpend: 250,
          runwayDrop: 1.5, resilienceDrop: 3.0,
          advice: "Late-night vulnerability detected. Alcohol-related environments significantly lower financial inhibition. System recommends exiting the zone.",
          alternatives: []
        }
      ]
    },
    {
      id: 4, name: "Suria KLCC", type: "Iconic Retail Hub", lat: 3.1578, lng: 101.7119, baseZoomLevel: 10,
      spots: [
         {
          id: 401, name: "Flagship Tech Store", category: "Electronics", dangerLevel: "warning", avgSpend: 4500,
          runwayDrop: 25.0, resilienceDrop: 20.0,
          advice: "Major capital expenditure. Ensure this is drawn from your 'Future Expenses' pocket, not your emergency fund.",
          alternatives: []
        }
      ]
    }
  ];

  // --- State Management ---
  const [mapZoom, setMapZoom] = useState<number>(14);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  
  const mapRef = useRef<google.maps.Map | null>(null);

  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const selectedSpot = selectedZone?.spots.find(s => s.id === selectedSpotId);

  // --- Handlers ---
  const onLoad = useCallback(function callback(m: google.maps.Map) {
    mapRef.current = m;
    setMapZoom(m.getZoom() || 14);
  }, []);

  const onZoomChanged = useCallback(() => {
    if (mapRef.current) {
      setMapZoom(mapRef.current.getZoom() || 14);
    }
  }, []);

  // Filter zones based on current zoom level (Semantic Zoom simulation)
  const visibleZones = zones.filter(zone => mapZoom >= zone.baseZoomLevel);

  const handleZoneClick = (zone: Zone) => {
    setSelectedZoneId(zone.id);
    setSelectedSpotId(null);
    mapRef.current?.panTo({ lat: zone.lat, lng: zone.lng });
    mapRef.current?.setZoom(16); // Zoom in closely to the selected zone
  };

  const renderIcon = (category: string) => {
    if (category.includes("Cafe")) return <Coffee size={18} />;
    if (category.includes("Dining") || category.includes("Food")) return <Utensils size={18} />;
    return <ShoppingBag size={18} />;
  };

  const getDangerColor = (level: string) => {
    if (level === "critical") return "text-critical";
    if (level === "warning") return "text-warning";
    return "text-safe";
  };

  // Dark Map styling seamlessly blending with Dashboard (#0C0121)
  const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#0C0121" }] },
      { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#0C0121" }] },
      { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#334155" }] },
      { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#1e1b4b" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#312e81" }] },
      { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] }
    ]
  };

  // Use your real API Key
  const GOOGLE_MAPS_API_KEY = "AIzaSyCM9IUKisgyTl3n9UTOH6A7P-m6CIyAJq8"; 

  return (
    <div className="location-container gx-theme">
      <header className="location-header">
        <h2>Risk Radar</h2>
        <p>Proactive spatial tracking of high-friction commercial environments.</p>
      </header>

      <main className="location-main">
        {/* LEFT: Map Panel */}
        <div className="map-card" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
          <LoadScriptComp googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <MapComp
              mapContainerStyle={{ width: '100%', height: '100%', minHeight: '600px', borderRadius: '24px' }}
              center={center}
              zoom={14}
              onLoad={onLoad}
              onZoomChanged={onZoomChanged}
              options={mapOptions}
            >
              {/* Plot High-Spend Zones instead of individual spots */}
              {visibleZones.map(zone => (
                <MarkerComp
                  key={zone.id}
                  position={{ lat: zone.lat, lng: zone.lng }}
                  onClick={() => handleZoneClick(zone)}
                  icon={{
                    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                    fillColor: selectedZoneId === zone.id ? "#F8326D" : "#f59e0b",
                    fillOpacity: 1,
                    strokeWeight: 0,
                    scale: selectedZoneId === zone.id ? 2 : 1.5,
                  }}
                >
                  {/* Tooltip on hover/select */}
                  {selectedZoneId === zone.id && (
                    <InfoWindowComp onCloseClick={() => setSelectedSpotId(null)}>
                      <div className="map-tooltip">
                        <strong>{zone.name}</strong>
                        <span>{zone.spots.length} High-Risk Spots</span>
                      </div>
                    </InfoWindowComp>
                  )}
                </MarkerComp>
              ))}
              
              {/* Optional: Your current location */}
              <MarkerComp 
                position={{ lat: 3.1455, lng: 101.7100 }} 
                icon="https://maps.google.com/mapfiles/ms/icons/blue-dot.png" 
              />
            </MapComp>
          </LoadScriptComp>
          
          <div className="radar-hud-overlay">
            <span>ZOOM: {mapZoom.toFixed(1)}x</span>
            <span>TARGETS: {visibleZones.length}</span>
            <span>SYS: ONLINE</span>
          </div>
        </div>

        {/* RIGHT: Dynamic Info Panel */}
        <div className="details-panel">
          {!selectedZone ? (
            /* STATE 0: No Zone Selected */
            <div className="spot-detail-card empty-detail">
              <Target size={48} />
              <p>Select a High-Spend Zone on the map to run a financial environment scan.</p>
            </div>
          ) : !selectedSpot ? (
             /* STATE 1: Zone Selected, Show Spots List */
            <div className="spot-detail-card animate-slide-in">
              <div className="zone-overview-header">
                <h3>{selectedZone.name}</h3>
                <span className="zone-type">{selectedZone.type}</span>
              </div>
              
              <div className="zone-alert-box">
                <ShieldAlert size={20} color="#f59e0b" />
                <span>You are entering a dense commercial hub. High probability of impulse triggers detected.</span>
              </div>

              <div className="spots-list-container">
                <h4>Monitored Spots Nearby</h4>
                <div className="spots-list">
                  {selectedZone.spots.map(spot => (
                    <div className="spot-list-item" key={spot.id} onClick={() => setSelectedSpotId(spot.id)}>
                      <div className="spot-list-icon">
                        {renderIcon(spot.category)}
                      </div>
                      <div className="spot-list-info">
                        <strong>{spot.name}</strong>
                        <span>Avg RM {spot.avgSpend}</span>
                      </div>
                      <div className={`spot-risk-badge ${spot.dangerLevel}`}>
                        {spot.dangerLevel.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* STATE 2: Spot Selected, Show Financial Audit Details */
            <div className="spot-detail-card animate-slide-in">
              <button className="back-to-zone-btn" onClick={() => setSelectedSpotId(null)}>
                <ArrowLeft size={16} /> Back to Zone
              </button>

              <div className="detail-header">
                <div>
                  <h3>{selectedSpot.name}</h3>
                  <span className="category-tag">{selectedSpot.category}</span>
                </div>
                <div className="spend-indicator">
                  <span className={`spend-amount ${getDangerColor(selectedSpot.dangerLevel)}`}>
                    RM {selectedSpot.avgSpend}
                  </span>
                  <span className="spend-label">Avg. Google Spend</span>
                </div>
              </div>

              {/* Financial Impact Dashboard */}
              <div className="financial-impact-grid">
                <div className="impact-card">
                  <span className="impact-label">Runway Impact</span>
                  <strong className="impact-value text-critical">-{selectedSpot.runwayDrop} Days</strong>
                </div>
                <div className="impact-card">
                  <span className="impact-label">Resilience Penalty</span>
                  <strong className="impact-value text-warning">-{selectedSpot.resilienceDrop} Pts</strong>
                </div>
              </div>

              <div className={`advice-box ${selectedSpot.dangerLevel}`}>
                <div className="advice-title">
                  <AlertTriangle size={18} />
                  <strong>AI Audit Verdict</strong>
                </div>
                <p>{selectedSpot.advice}</p>
              </div>

              {selectedSpot.alternatives.length > 0 && (
                <div className="alternatives-section">
                  <h4>Rational Alternatives Nearby</h4>
                  <div className="alt-list">
                    {selectedSpot.alternatives.map(alt => (
                      <div className="alt-item" key={alt.id}>
                        <div className="alt-icon">
                          {renderIcon(alt.category)}
                        </div>
                        <div className="alt-info">
                          <strong>{alt.name}</strong>
                          <span>{alt.category}</span>
                        </div>
                        <span className="alt-price">RM {alt.avgSpend}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}