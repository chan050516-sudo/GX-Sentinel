import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Map as MapIcon, Coffee, Utensils, ShoppingBag, ShieldAlert, ArrowLeft, Target, AlertTriangle, MapPin, Eye } from "lucide-react";
import "./LocationRadar.css";

// --- Data Models ---
type Alternative = {
  id: number;
  name: string;
  category: string;
  avgSpend: number;
  lat: number;
  lng: number;
};

type Spot = {
  id: number;
  name: string;
  category: string;
  dangerLevel: "critical" | "warning" | "safe";
  avgSpend: number;
  runwayDrop: number;
  resilienceDrop: number;
  advice: string;
  alternatives: Alternative[];
  lat: number;
  lng: number;
};

type Zone = {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  baseZoomLevel: number;
  spots: Spot[];
};

// 辅助函数：在给定中心点附近生成偏移坐标（范围约50-150米）
const offsetLatLng = (lat: number, lng: number, seed: number) => {
  const angle = seed * 2 * Math.PI;
  const radius = 0.0008 + (seed % 7) * 0.0001;
  return { lat: lat + Math.cos(angle) * radius, lng: lng + Math.sin(angle) * radius };
};

// 中心点：Bukit Bintang, Kuala Lumpur
const center = { lat: 3.1466, lng: 101.7115 };

// ---------- 完整 Mock 数据：12 个 High-Spend Zones，每个 spot 包含独立坐标 ----------
const zones: Zone[] = [
  {
    id: 1, name: "Pavilion Kuala Lumpur", type: "Luxury Retail & Dining Hub", lat: 3.1488, lng: 101.7133, baseZoomLevel: 10,
    spots: [
      {
        id: 101, name: "Premium Omakase Dining", category: "Dining", dangerLevel: "critical", avgSpend: 850,
        runwayDrop: 5.2, resilienceDrop: 8.5,
        advice: "Severe risk. This single transaction accounts for 30% of your monthly variable budget. It directly conflicts with your 'Emergency Fund' goal.",
        lat: 3.1492, lng: 101.7130,
        alternatives: [
          { id: 901, name: "Tokyo Street Food Hall", category: "Dining", avgSpend: 45, lat: 3.1485, lng: 101.7125 },
          { id: 902, name: "Suki-Ya Pavilion", category: "Dining", avgSpend: 85, lat: 3.1495, lng: 101.7140 }
        ]
      },
      {
        id: 102, name: "Luxury Designer Boutique", category: "Retail", dangerLevel: "critical", avgSpend: 3200,
        runwayDrop: 18.5, resilienceDrop: 15.0,
        advice: "Critical warning. Purchasing luxury goods right now will break your 14-day saving streak and severely compromise your financial runway.",
        lat: 3.1480, lng: 101.7142,
        alternatives: [
          { id: 903, name: "High-Street Fashion Brands", category: "Retail", avgSpend: 250, lat: 3.1478, lng: 101.7138 }
        ]
      },
      {
        id: 103, name: "Artisan Coffee Roastery", category: "Cafe", dangerLevel: "warning", avgSpend: 35,
        runwayDrop: 0.2, resilienceDrop: 1.0,
        advice: "Borderline impulse. While affordable, frequenting premium cafes forms a micro-drain pattern on your liquidity.",
        lat: 3.1490, lng: 101.7128,
        alternatives: [
          { id: 904, name: "Local Kopitiam", category: "Cafe", avgSpend: 12, lat: 3.1483, lng: 101.7135 }
        ]
      },
      {
        id: 104, name: "Grand Millennium Spa", category: "Wellness", dangerLevel: "critical", avgSpend: 380,
        runwayDrop: 2.4, resilienceDrop: 4.2,
        advice: "Luxury self-care. Consider if this aligns with your current savings goals for Bali trip.",
        lat: 3.1475, lng: 101.7125,
        alternatives: [
          { id: 906, name: "Local Reflexology", category: "Wellness", avgSpend: 60, lat: 3.1470, lng: 101.7120 }
        ]
      },
      {
        id: 105, name: "Electronics Paradise", category: "Electronics", dangerLevel: "warning", avgSpend: 1200,
        runwayDrop: 7.8, resilienceDrop: 6.5,
        advice: "High-ticket electronic item. Ensure this is a planned purchase from 'Future Expenses' pocket.",
        lat: 3.1485, lng: 101.7145,
        alternatives: [
          { id: 907, name: "Mid-range Tech Store", category: "Electronics", avgSpend: 450, lat: 3.1479, lng: 101.7140 }
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
        lat: 3.1415, lng: 101.7182,
        alternatives: []
      },
      {
        id: 202, name: "% Arabica Coffee", category: "Cafe", dangerLevel: "warning", avgSpend: 28,
        runwayDrop: 0.1, resilienceDrop: 0.5,
        advice: "Acceptable occasionally, but triggers our 'Latte Factor' alert. You've purchased 4 similar items this week.",
        lat: 3.1422, lng: 101.7190,
        alternatives: [
          { id: 905, name: "Zus Coffee", category: "Cafe", avgSpend: 10, lat: 3.1418, lng: 101.7185 }
        ]
      },
      {
        id: 203, name: "Premium Fitness Club", category: "Fitness", dangerLevel: "warning", avgSpend: 350,
        runwayDrop: 2.1, resilienceDrop: 2.8,
        advice: "Monthly membership commitment. Match against your 'fixedExpenses' budget before committing.",
        lat: 3.1425, lng: 101.7195,
        alternatives: [
          { id: 908, name: "Community Gym", category: "Fitness", avgSpend: 80, lat: 3.1420, lng: 101.7190 }
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
        lat: 3.1478, lng: 101.7080,
        alternatives: []
      },
      {
        id: 302, name: "Club Kyo", category: "Nightlife", dangerLevel: "critical", avgSpend: 180,
        runwayDrop: 1.1, resilienceDrop: 2.5,
        advice: "High-risk environment for impulse spending. Cover charge + drinks will exceed RM200 easily.",
        lat: 3.1472, lng: 101.7078,
        alternatives: [
          { id: 909, name: "Beer Factory", category: "Nightlife", avgSpend: 60, lat: 3.1468, lng: 101.7075 }
        ]
      },
      {
        id: 303, name: "Hookah Lounge", category: "Nightlife", dangerLevel: "warning", avgSpend: 85,
        runwayDrop: 0.5, resilienceDrop: 1.2,
        advice: "Social spending that adds up. Consider limiting to once per month.",
        lat: 3.1470, lng: 101.7085,
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
        lat: 3.1580, lng: 101.7115,
        alternatives: []
      },
      {
        id: 402, name: "Aquaria KLCC Ticket", category: "Entertainment", dangerLevel: "safe", avgSpend: 65,
        runwayDrop: 0.4, resilienceDrop: 0.2,
        advice: "Experience-based spending with good value. Minor impact on runway.",
        lat: 3.1575, lng: 101.7122,
        alternatives: []
      },
      {
        id: 403, name: "Signature Bakery", category: "Cafe", dangerLevel: "warning", avgSpend: 45,
        runwayDrop: 0.3, resilienceDrop: 0.8,
        advice: "Premium bakery items. Your 3-day safe streak is at risk.",
        lat: 3.1582, lng: 101.7125,
        alternatives: [
          { id: 910, name: "Garden Bakery", category: "Cafe", avgSpend: 15, lat: 3.1577, lng: 101.7128 }
        ]
      }
    ]
  },
  {
    id: 5, name: "Mid Valley Megamall", type: "Massive Shopping Complex", lat: 3.1175, lng: 101.6769, baseZoomLevel: 11,
    spots: [
      {
        id: 501, name: "Cinema IMAX", category: "Entertainment", dangerLevel: "safe", avgSpend: 38,
        runwayDrop: 0.2, resilienceDrop: 0.1,
        advice: "Entertainment spending within reasonable range.",
        lat: 3.1170, lng: 101.6765,
        alternatives: []
      },
      {
        id: 502, name: "Popular Bookstore", category: "Retail", dangerLevel: "safe", avgSpend: 75,
        runwayDrop: 0.5, resilienceDrop: 0.3,
        advice: "Educational spending is generally acceptable.",
        lat: 3.1178, lng: 101.6772,
        alternatives: []
      },
      {
        id: 503, name: "Daiso Japan", category: "Retail", dangerLevel: "safe", avgSpend: 25,
        runwayDrop: 0.1, resilienceDrop: 0.1,
        advice: "Low-cost retail. Minimal impact on financial health.",
        lat: 3.1180, lng: 101.6775,
        alternatives: []
      },
      {
        id: 504, name: "Uniqlo", category: "Retail", dangerLevel: "warning", avgSpend: 180,
        runwayDrop: 1.1, resilienceDrop: 1.5,
        advice: "Clothing purchase. Check if you have similar items purchased this month.",
        lat: 3.1173, lng: 101.6760,
        alternatives: [
          { id: 911, name: "Padini Concept Store", category: "Retail", avgSpend: 90, lat: 3.1168, lng: 101.6758 }
        ]
      }
    ]
  },
  {
    id: 6, name: "Bangsar Shopping Centre", type: "Upscale Boutique Strip", lat: 3.1312, lng: 101.6686, baseZoomLevel: 13,
    spots: [
      {
        id: 601, name: "Antipodean Cafe", category: "Dining", dangerLevel: "warning", avgSpend: 55,
        runwayDrop: 0.3, resilienceDrop: 0.7,
        advice: "Brunch culture trap. You've dined out 3 times this week.",
        lat: 3.1315, lng: 101.6682,
        alternatives: [
          { id: 912, name: "Local Hawker Center", category: "Dining", avgSpend: 15, lat: 3.1308, lng: 101.6679 }
        ]
      },
      {
        id: 602, name: "Bangsar Village Wine Shop", category: "Retail", dangerLevel: "critical", avgSpend: 200,
        runwayDrop: 1.2, resilienceDrop: 2.0,
        advice: "Alcohol purchase. Remember your commitment to reduce discretionary spending.",
        lat: 3.1310, lng: 101.6690,
        alternatives: []
      }
    ]
  },
  {
    id: 7, name: "Mont Kiara", type: "Expat Hub", lat: 3.1749, lng: 101.6514, baseZoomLevel: 13,
    spots: [
      {
        id: 701, name: "The Great Escape", category: "Dining", dangerLevel: "warning", avgSpend: 70,
        runwayDrop: 0.4, resilienceDrop: 0.9,
        advice: "Popular brunch spot with premium pricing.",
        lat: 3.1746, lng: 101.6518,
        alternatives: [
          { id: 913, name: "Kiara Cafe", category: "Dining", avgSpend: 25, lat: 3.1742, lng: 101.6512 }
        ]
      },
      {
        id: 702, name: "TMC Gym", category: "Fitness", dangerLevel: "warning", avgSpend: 250,
        runwayDrop: 1.5, resilienceDrop: 2.0,
        advice: "Premium gym membership. Evaluate if you'll use it consistently.",
        lat: 3.1752, lng: 101.6510,
        alternatives: [
          { id: 914, name: "Community Park", category: "Fitness", avgSpend: 0, lat: 3.1755, lng: 101.6505 }
        ]
      }
    ]
  },
  {
    id: 8, name: "Petaling Jaya (PJU)", type: "Suburban Commercial", lat: 3.1073, lng: 101.6067, baseZoomLevel: 12,
    spots: [
      {
        id: 801, name: "SS2 Durian Stalls", category: "Food", dangerLevel: "safe", avgSpend: 50,
        runwayDrop: 0.3, resilienceDrop: 0.2,
        advice: "Local delicacy. One-time treat is acceptable.",
        lat: 3.1070, lng: 101.6063,
        alternatives: []
      },
      {
        id: 802, name: "Jaya Grocer", category: "Groceries", dangerLevel: "safe", avgSpend: 120,
        runwayDrop: 0.7, resilienceDrop: 0.3,
        advice: "Essential grocery shopping. Use your 'variableBudget' pocket.",
        lat: 3.1076, lng: 101.6070,
        alternatives: []
      }
    ]
  },
  {
    id: 9, name: "Damansara Heights", type: "Affluent District", lat: 3.1333, lng: 101.6719, baseZoomLevel: 14,
    spots: [
      {
        id: 901, name: "The Poke Bowl Co", category: "Dining", dangerLevel: "warning", avgSpend: 45,
        runwayDrop: 0.3, resilienceDrop: 0.6,
        advice: "Healthy but pricey lunch option.",
        lat: 3.1336, lng: 101.6722,
        alternatives: [
          { id: 915, name: "Economy Rice", category: "Dining", avgSpend: 12, lat: 3.1330, lng: 101.6716 }
        ]
      }
    ]
  },
  {
    id: 10, name: "Chow Kit", type: "Bustling Market Area", lat: 3.1674, lng: 101.7042, baseZoomLevel: 14,
    spots: [
      {
        id: 1001, name: "Chow Kit Night Market", category: "Market", dangerLevel: "safe", avgSpend: 40,
        runwayDrop: 0.2, resilienceDrop: 0.1,
        advice: "Bargain hunting opportunity. Great for saving money!",
        lat: 3.1670, lng: 101.7045,
        alternatives: []
      }
    ]
  },
  {
    id: 11, name: "KL Sentral", type: "Transit Hub", lat: 3.1345, lng: 101.6863, baseZoomLevel: 12,
    spots: [
      {
        id: 1101, name: "Nu Sentral Mall", category: "Retail", dangerLevel: "safe", avgSpend: 80,
        runwayDrop: 0.5, resilienceDrop: 0.3,
        advice: "Convenient shopping but be mindful of impulse buys during transit.",
        lat: 3.1342, lng: 101.6860,
        alternatives: []
      }
    ]
  },
  {
    id: 12, name: "Subang Jaya SS15", type: "Student Hub", lat: 3.0751, lng: 101.5862, baseZoomLevel: 13,
    spots: [
      {
        id: 1201, name: "SS15 Bubble Tea Street", category: "Food", dangerLevel: "warning", avgSpend: 18,
        runwayDrop: 0.1, resilienceDrop: 0.3,
        advice: "Frequent bubble tea purchases add up. You've bought 7 this month.",
        lat: 3.0748, lng: 101.5865,
        alternatives: [
          { id: 916, name: "Homemade Tea", category: "Beverage", avgSpend: 2, lat: 3.0742, lng: 101.5860 }
        ]
      }
    ]
  }
];

export default function LocationRadar() {
  const MapComp = GoogleMap as any;
  const MarkerComp = Marker as any;
  const InfoWindowComp = InfoWindow as any;
  const LoadScriptComp = LoadScript as any;

  const [mapZoom, setMapZoom] = useState<number>(14);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [selectedAlternative, setSelectedAlternative] = useState<Alternative | null>(null);
  const [nearbyZoneCount, setNearbyZoneCount] = useState<number>(0);
  const [showNearbyHint, setShowNearbyHint] = useState<boolean>(false);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const selectedSpot = selectedZone?.spots.find(s => s.id === selectedSpotId);

  // 更新可见区域内 Zone 的数量（基于当前地图边界）
  const updateNearbyZones = useCallback(() => {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    if (!bounds) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const visible = zones.filter(zone => {
      return zone.lat >= sw.lat() && zone.lat <= ne.lat() && zone.lng >= sw.lng() && zone.lng <= ne.lng();
    });
    const newCount = visible.length;
    setNearbyZoneCount(newCount);
    // 当移动到有 Zone 的区域且未选中任何 Zone 时，短暂显示提示条
    if (newCount > 0 && !selectedZoneId) {
      setShowNearbyHint(true);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => setShowNearbyHint(false), 5000);
    }
  }, [selectedZoneId]);

  const onLoad = useCallback((m: google.maps.Map) => {
    mapRef.current = m;
    setMapZoom(m.getZoom() || 14);
    m.addListener("idle", () => {
      setMapZoom(m.getZoom() || 14);
      updateNearbyZones();
    });
    // 初次加载时也计算一次
    setTimeout(updateNearbyZones, 500);
  }, [updateNearbyZones]);

  const onZoomChanged = useCallback(() => {
    if (mapRef.current) {
      setMapZoom(mapRef.current.getZoom() || 14);
      updateNearbyZones();
    }
  }, [updateNearbyZones]);

  // 当选中状态变化时重新计算附近区域（避免地图移动后提示不更新）
  useEffect(() => {
    updateNearbyZones();
  }, [selectedZoneId, updateNearbyZones]);

  const handleZoneClick = (zone: Zone) => {
    setSelectedZoneId(zone.id);
    setSelectedSpotId(null);
    setSelectedAlternative(null);
    setShowNearbyHint(false);
    mapRef.current?.panTo({ lat: zone.lat, lng: zone.lng });
    mapRef.current?.setZoom(16);
  };

  const handleSpotSelect = (spot: Spot) => {
    setSelectedSpotId(spot.id);
    setSelectedAlternative(null);
    mapRef.current?.panTo({ lat: spot.lat, lng: spot.lng });
    mapRef.current?.setZoom(18);
  };

  const handleAlternativeSelect = (alt: Alternative) => {
    setSelectedAlternative(alt);
    mapRef.current?.panTo({ lat: alt.lat, lng: alt.lng });
    mapRef.current?.setZoom(18);
  };

  const handleBackToList = () => {
    setSelectedSpotId(null);
    setSelectedAlternative(null);
  };

  const handleBackToMap = () => {
    setSelectedZoneId(null);
    setSelectedSpotId(null);
    setSelectedAlternative(null);
  };

  // 根据危险等级获取 Marker 填充色
  const getMarkerColor = (level: string) => {
    if (level === "critical") return "#f43f5e";
    if (level === "warning") return "#f59e0b";
    return "#10b981";
  };

  const renderIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("cafe") || cat.includes("coffee")) return <Coffee size={18} />;
    if (cat.includes("dining") || cat.includes("food") || cat.includes("brunch")) return <Utensils size={18} />;
    if (cat.includes("wellness") || cat.includes("spa") || cat.includes("fitness") || cat.includes("gym")) return <MapIcon size={18} />;
    return <ShoppingBag size={18} />;
  };

  const getDangerColor = (level: string) => {
    if (level === "critical") return "text-critical";
    if (level === "warning") return "text-warning";
    return "text-safe";
  };

//   const mapOptions: google.maps.MapOptions = {
//     disableDefaultUI: true,
//     styles: [
//         { elementType: "geometry", stylers: [{ color: "#ebeced" }] },
//         { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
//         { elementType: "labels.text.fill", stylers: [{ color: "#3c4043" }] },
//         { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
//         { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#d5d8dc" }] },
//         { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
//         { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#cbd0d5" }] },
//         { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#5f6368" }] },
//         { featureType: "water", elementType: "geometry", stylers: [{ color: "#d4e1f5" }] },
//         { featureType: "poi", elementType: "geometry", stylers: [{ color: "#f1f3f4" }] }
//     ]
//   };

  const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    styles: [
        { elementType: "geometry", stylers: [{ color: "#2a2744" }] },        // 更亮的深紫灰
        { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] }, // 亮灰色文字
        { elementType: "labels.text.stroke", stylers: [{ color: "#2a2744" }] },
        { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#3b3760" }] },
        { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#3b3760" }] },      // 道路提亮
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#544e7a" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#e2e8f0" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#1e1b3b" }] },          // 水体略深增加层次
        { featureType: "poi", elementType: "geometry", stylers: [{ color: "#302c4e" }] }
    ]
  };
//   const mapOptions: google.maps.MapOptions = {
//     disableDefaultUI: true,
//     styles: [
//       { elementType: "geometry", stylers: [{ color: "#0C0121" }] },
//       { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
//       { elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
//       { elementType: "labels.text.stroke", stylers: [{ color: "#0C0121" }] },
//       { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#334155" }] },
//       { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#1e1b4b" }] },
//       { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#312e81" }] },
//       { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
//       { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] }
//     ]
//   };

  const GOOGLE_MAPS_API_KEY = "AIzaSyCM9IUKisgyTl3n9UTOH6A7P-m6CIyAJq8";

  // 根据缩放级别显示 Zone 标记（语义缩放）
  const visibleZones = zones.filter(zone => mapZoom >= zone.baseZoomLevel);

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
              {/* 显示所有可见 Zone 标记 */}
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
                />
              ))}

              {/* 当前选中的 Spot 对应的彩色小点 */}
              {selectedSpot && (
                <MarkerComp
                  position={{ lat: selectedSpot.lat, lng: selectedSpot.lng }}
                  icon={{
                    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                    fillColor: getMarkerColor(selectedSpot.dangerLevel),
                    fillOpacity: 1,
                    strokeWeight: 0,
                    scale: 1.3,
                  }}
                />
              )}

              {/* 当前选中的 Alternative 对应的彩色小点（紫色） */}
              {selectedAlternative && (
                <MarkerComp
                  position={{ lat: selectedAlternative.lat, lng: selectedAlternative.lng }}
                  icon={{
                    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                    fillColor: "#8b5cf6",
                    fillOpacity: 1,
                    strokeWeight: 0,
                    scale: 1.1,
                  }}
                />
              )}

              {/* 模拟用户当前位置 */}
              <MarkerComp 
                position={{ lat: 3.1455, lng: 101.7100 }} 
                icon="https://maps.google.com/mapfiles/ms/icons/blue-dot.png" 
              />

              {/* 选中 Zone 时的信息窗口 */}
              {selectedZoneId && (
                <InfoWindowComp
                  position={{ lat: zones.find(z => z.id === selectedZoneId)?.lat || 0, lng: zones.find(z => z.id === selectedZoneId)?.lng || 0 }}
                  onCloseClick={handleBackToMap}
                >
                  <div className="map-tooltip">
                    <strong>{selectedZone?.name}</strong>
                    <span>{selectedZone?.spots.length} monitored spots inside</span>
                  </div>
                </InfoWindowComp>
              )}
            </MapComp>
          </LoadScriptComp>

          {/* HUD 信息 */}
          <div className="radar-hud-overlay">
            <span>ZOOM: {mapZoom.toFixed(1)}x</span>
            <span>TARGETS: {visibleZones.length}</span>
            <span>SYS: ONLINE</span>
          </div>

          {/* 附近区域提示条 */}
          {showNearbyHint && nearbyZoneCount > 0 && !selectedZoneId && (
            <div style={{
              position: "absolute",
              bottom: "20px",
              left: "20px",
              right: "20px",
              background: "rgba(16, 185, 129, 0.9)",
              backdropFilter: "blur(8px)",
              padding: "10px 16px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "#0C0121",
              zIndex: 10,
              animation: "slideInUp 0.3s ease-out"
            }}>
              <Eye size={18} />
              <span>{nearbyZoneCount} commercial zone(s) detected nearby. Click a pin to inspect.</span>
            </div>
          )}
        </div>

        {/* RIGHT: Dynamic Info Panel */}
        <div className="details-panel">
          {!selectedZone ? (
            /* 未选中任何 Zone */
            <div className="spot-detail-card empty-detail">
              <Target size={48} />
              <p>Select a High-Spend Zone on the map to run a financial environment scan.</p>
              {nearbyZoneCount > 0 && (
                <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#10b981", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <MapPin size={14} />
                  <span>{nearbyZoneCount} zones nearby — click a marker to inspect</span>
                </div>
              )}
            </div>
          ) : !selectedSpot ? (
            /* 显示 Zone 内的 Spots 列表 */
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
                    <div className="spot-list-item" key={spot.id} onClick={() => handleSpotSelect(spot)}>
                      <div className="spot-list-icon">{renderIcon(spot.category)}</div>
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
              <button onClick={handleBackToMap} style={{ marginTop: "1.5rem", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "0.75rem", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                ← Back to Map
              </button>
            </div>
          ) : (
            /* 显示选中 Spot 的详细审计信息及替代方案 */
            <div className="spot-detail-card animate-slide-in">
              <button className="back-to-zone-btn" onClick={handleBackToList}>
                <ArrowLeft size={16} /> Back to {selectedZone.name}
              </button>
              <div className="detail-header">
                <div>
                  <h3>{selectedSpot.name}</h3>
                  <span className="category-tag">{selectedSpot.category}</span>
                </div>
                <div className="spend-indicator">
                  <span className={`spend-amount ${getDangerColor(selectedSpot.dangerLevel)}`}>RM {selectedSpot.avgSpend}</span>
                  <span className="spend-label">Avg. Transaction</span>
                </div>
              </div>
              <div className="financial-impact-grid">
                <div className="impact-card"><span className="impact-label">Runway Impact</span><strong className="impact-value text-critical">-{selectedSpot.runwayDrop} Days</strong></div>
                <div className="impact-card"><span className="impact-label">Resilience Penalty</span><strong className="impact-value text-warning">-{selectedSpot.resilienceDrop} Pts</strong></div>
              </div>
              <div className={`advice-box ${selectedSpot.dangerLevel}`}>
                <div className="advice-title"><AlertTriangle size={18} /><strong>AI Audit Verdict</strong></div>
                <p>{selectedSpot.advice}</p>
              </div>
              {selectedSpot.alternatives.length > 0 && (
                <div className="alternatives-section">
                  <h4>Rational Alternatives Nearby</h4>
                  <div className="alt-list">
                    {selectedSpot.alternatives.map(alt => (
                      <div className="alt-item" key={alt.id} onClick={() => handleAlternativeSelect(alt)} style={{ cursor: "pointer" }}>
                        <div className="alt-icon">{renderIcon(alt.category)}</div>
                        <div className="alt-info"><strong>{alt.name}</strong><span>{alt.category}</span></div>
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