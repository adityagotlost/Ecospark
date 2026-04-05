import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './EcoMap.css';

// ── Custom marker icons ──
function createIcon(emoji, size = 36) {
  return L.divIcon({
    className: 'eco-map-marker',
    html: `<div class="marker-pin" style="font-size:${size}px">${emoji}</div>`,
    iconSize: [size + 10, size + 10],
    iconAnchor: [(size + 10) / 2, size + 10],
    popupAnchor: [0, -(size + 5)],
  });
}

const ICONS = {
  station: createIcon('📍', 32),
  tree: createIcon('🌳', 30),
  solar: createIcon('☀️', 30),
  water: createIcon('💧', 28),
  recycle: createIcon('♻️', 28),
  school: createIcon('🏫', 30),
  garden: createIcon('🌻', 28),
  cleanup: createIcon('🧹', 28),
  bike: createIcon('🚲', 28),
  user: createIcon('🌟', 34),
};

// ── Real Roorkee eco-stations & hotspots ──
const ECO_STATIONS = [
  // IIT Roorkee Campus & Academic
  { id: 1,  name: 'IIT Roorkee — Green Campus',         type: 'school',   lat: 29.8644, lng: 77.8960, desc: 'Zero-waste campus with Miyawaki forests, rooftop solar, and LED-sensor lighting across 365 acres', impact: '85% waste diverted from landfill',   verified: 342, category: 'station' },
  { id: 2,  name: 'IIT Roorkee Solar Array',             type: 'solar',    lat: 29.8628, lng: 77.9010, desc: 'Extensive solar PV and thermal systems powering campus infrastructure and research labs',            impact: '24,000 kWh generated/year',         verified: 187, category: 'energy' },
  { id: 3,  name: 'IIT Roorkee Miyawaki Forest',         type: 'tree',     lat: 29.8680, lng: 77.8930, desc: 'Dense self-sustaining mini-forest with 50+ native species using Miyawaki technique',                impact: '500+ native trees planted',         verified: 256, category: 'nature' },

  // Ganges Canal & Water
  { id: 4,  name: 'Upper Ganges Canal — Eco Point',      type: 'water',    lat: 29.8663, lng: 77.8912, desc: 'Historic irrigation canal built in 1854, running through the heart of Roorkee city',               impact: '1,200 km of canal irrigating crops', verified: 198, category: 'water' },
  { id: 5,  name: 'Solani Aqueduct Heritage Site',       type: 'water',    lat: 29.8822, lng: 77.8961, desc: 'Engineering marvel carrying the Ganges Canal over Solani River — 19th century brick masonry',       impact: 'Rainwater harvesting demo site',     verified: 276, category: 'water' },
  { id: 6,  name: 'Solani River Cleanup Zone',           type: 'cleanup',  lat: 29.8780, lng: 77.8880, desc: 'Community-driven river cleanup drives every Sunday along the Solani River banks',                  impact: '800 kg plastic removed/month',       verified: 189, category: 'water' },

  // Recycling & Waste Management
  { id: 7,  name: 'Green Cycler — Recycling Center',     type: 'recycle',  lat: 29.8590, lng: 77.8850, desc: 'PP, LD & EPS plastic recycling facility serving Roorkee and Haridwar district',                    impact: '3,200 kg plastic recycled/month',   verified: 134, category: 'station' },
  { id: 8,  name: 'Root Recycling — E-Waste Center',     type: 'recycle',  lat: 29.8550, lng: 77.9050, desc: 'Govt-authorized e-waste recycler handling batteries, circuit boards, and electronic waste',        impact: '1,500 kg e-waste processed/month',  verified: 98,  category: 'station' },

  // Energy
  { id: 9,  name: 'Shree Cement Solar Plant',            type: 'solar',    lat: 29.8400, lng: 77.8750, desc: '7 MWp solar power plant at Shree Cement Roorkee unit — one of the largest in the district',        impact: '12,000+ MWh clean energy/year',     verified: 145, category: 'energy' },

  // Nature & Parks
  { id: 10, name: 'Solani Park & Green Trail',           type: 'garden',   lat: 29.8750, lng: 77.8920, desc: 'Popular park along the canal with walking trails, native plantations, and biodiversity spots',     impact: '30+ bird species documented',       verified: 312, category: 'nature' },
  { id: 11, name: 'Roorkee Cantonment Greenbelt',        type: 'tree',     lat: 29.8570, lng: 77.8815, desc: 'Historic Bengal Sappers cantonment area with century-old trees and maintained green cover',         impact: '200+ heritage trees preserved',     verified: 167, category: 'nature' },
  { id: 12, name: 'Bhagwanpur Community Nursery',        type: 'garden',   lat: 29.8450, lng: 77.9150, desc: 'Community-run plant nursery providing free saplings for local tree-planting drives',                impact: '5,000+ saplings distributed/year',  verified: 223, category: 'nature' },

  // Transport & Community
  { id: 13, name: 'Civil Lines Cycle Hub',               type: 'bike',     lat: 29.8700, lng: 77.8870, desc: 'Student-driven cycle repair and sharing station promoting green commute in Roorkee',               impact: '2,400 kg CO₂ saved/month',          verified: 178, category: 'transport' },
  { id: 14, name: 'National Institute of Hydrology',     type: 'school',   lat: 29.8610, lng: 77.9080, desc: 'Premier research institute studying water resources, flood management, and climate impact',        impact: 'Water quality monitoring network',  verified: 156, category: 'station' },
  { id: 15, name: 'CBRI Green Building Research',        type: 'school',   lat: 29.8690, lng: 77.9040, desc: 'Central Building Research Institute developing eco-friendly construction and sustainable materials', impact: 'Low-carbon building prototypes',    verified: 112, category: 'energy' },
];

// ── Impact hotspots (circles) ──
const IMPACT_ZONES = [
  { lat: 29.8644, lng: 77.8960, radius: 800,  color: '#10b981', label: 'IIT Roorkee Green Campus Zone',         level: 'high' },
  { lat: 29.8663, lng: 77.8912, radius: 1200, color: '#3b82f6', label: 'Ganges Canal Heritage Corridor',        level: 'high' },
  { lat: 29.8822, lng: 77.8961, radius: 600,  color: '#22c55e', label: 'Solani Aqueduct Conservation Area',      level: 'medium' },
  { lat: 29.8570, lng: 77.8815, radius: 900,  color: '#06b6d4', label: 'Cantonment Greenbelt Protected Zone',    level: 'medium' },
  { lat: 29.8450, lng: 77.9150, radius: 700,  color: '#a78bfa', label: 'Bhagwanpur Community Green Hub',         level: 'medium' },
];

// Community actions by Roorkee users
const COMMUNITY_ACTIONS = [
  { id: 'a1', user: 'Aditya G.',   action: 'Planted 8 saplings near Solani Park',        lat: 29.8740, lng: 77.8930, time: '1h ago',  pts: 200, emoji: '🌱' },
  { id: 'a2', user: 'Priya S.',    action: 'Cleaned Solani River bank (2km stretch)',     lat: 29.8790, lng: 77.8870, time: '3h ago',  pts: 250, emoji: '🧹' },
  { id: 'a3', user: 'Rohan K.',    action: 'Verified IIT Roorkee solar panel output',     lat: 29.8630, lng: 77.9005, time: '5h ago',  pts: 180, emoji: '☀️' },
  { id: 'a4', user: 'Sneha M.',    action: 'Recycled 20kg e-waste at Root Recycling',     lat: 29.8545, lng: 77.9055, time: '7h ago',  pts: 150, emoji: '♻️' },
  { id: 'a5', user: 'Arjun T.',    action: 'Documented 15 bird species at Solani Park',   lat: 29.8755, lng: 77.8915, time: '12h ago', pts: 160, emoji: '🦜' },
  { id: 'a6', user: 'Kavya D.',    action: 'Organized IIT campus Miyawaki planting drive', lat: 29.8675, lng: 77.8935, time: '1d ago',  pts: 300, emoji: '🌳' },
  { id: 'a7', user: 'Vikram S.',   action: 'Set up cycle-sharing at Civil Lines',          lat: 29.8705, lng: 77.8865, time: '1d ago',  pts: 200, emoji: '🚲' },
  { id: 'a8', user: 'Nisha R.',    action: 'Distributed 50 saplings from Bhagwanpur Nursery', lat: 29.8455, lng: 77.9145, time: '2d ago', pts: 220, emoji: '🌻' },
];

const CATEGORIES = [
  { key: 'all',       label: 'All',         icon: '🗺️', color: '#10b981' },
  { key: 'station',   label: 'Eco-Stations', icon: '📍', color: '#f59e0b' },
  { key: 'nature',    label: 'Nature',       icon: '🌳', color: '#22c55e' },
  { key: 'water',     label: 'Water',        icon: '💧', color: '#3b82f6' },
  { key: 'energy',    label: 'Energy',       icon: '☀️', color: '#eab308' },
  { key: 'transport', label: 'Transport',    icon: '🚲', color: '#8b5cf6' },
  { key: 'community', label: 'Community',    icon: '👥', color: '#ec4899' },
];

// ── Fly to location helper ──
function FlyToLocation({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 13, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

// ── Stats summary ──
function MapStats({ stations, actions }) {
  const stats = [
    { icon: '📍', val: stations.length, label: 'Eco-Stations' },
    { icon: '👥', val: actions.length, label: 'Recent Actions' },
    { icon: '✅', val: stations.reduce((s, e) => s + e.verified, 0).toLocaleString(), label: 'Verifications' },
    { icon: '🌍', val: IMPACT_ZONES.length, label: 'Impact Zones' },
  ];
  return (
    <div className="map-stats-row">
      {stats.map((s, i) => (
        <motion.div
          key={i}
          className="map-stat-chip"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <span className="msc-icon">{s.icon}</span>
          <span className="msc-val">{s.val}</span>
          <span className="msc-label">{s.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ── Activity feed ──
function ActivityFeed({ actions, onLocate }) {
  return (
    <div className="map-feed">
      <div className="feed-title">🔴 Live Eco-Activity</div>
      <div className="feed-list">
        {actions.map((a, i) => (
          <motion.div
            key={a.id}
            className="feed-item"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => onLocate([a.lat, a.lng])}
          >
            <div className="fi-emoji">{a.emoji}</div>
            <div className="fi-body">
              <div className="fi-user">{a.user}</div>
              <div className="fi-action">{a.action}</div>
              <div className="fi-meta">
                <span className="fi-time">{a.time}</span>
                <span className="fi-pts">+{a.pts} pts</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ──
export default function EcoMap({ user }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [flyTarget, setFlyTarget] = useState(null);
  const [flyZoom, setFlyZoom] = useState(14);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showCommunity, setShowCommunity] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const defaultCenter = [29.8663, 77.8912]; // Roorkee, Uttarakhand

  const filteredStations = activeCategory === 'all'
    ? ECO_STATIONS
    : ECO_STATIONS.filter(s => s.category === activeCategory);

  const handleLocate = (coords) => {
    setFlyTarget(coords);
    setFlyZoom(15);
  };

  const totalVerified = ECO_STATIONS.reduce((s, e) => s + e.verified, 0);
  const totalImpactActions = COMMUNITY_ACTIONS.length;

  return (
    <motion.div
      className="eco-map-page page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="map-header">
        <div className="map-header-left">
          <h1 className="map-title">
            🗺️ Eco Impact Map
          </h1>
          <p className="map-subtitle">
            Explore eco-stations, community actions, and impact hotspots across Roorkee
          </p>
        </div>
        <div className="map-header-right">
          <div className="map-legend-pills">
            <span className="legend-pill" style={{ '--lp-color': '#10b981' }}>
              <span className="lp-dot" /> Eco-Stations
            </span>
            <span className="legend-pill" style={{ '--lp-color': '#3b82f6' }}>
              <span className="lp-dot" /> Impact Zones
            </span>
            <span className="legend-pill" style={{ '--lp-color': '#f59e0b' }}>
              <span className="lp-dot" /> Community Actions
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <MapStats stations={ECO_STATIONS} actions={COMMUNITY_ACTIONS} />

      {/* Filters */}
      <div className="map-filters">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`map-filter-btn ${activeCategory === cat.key ? 'active' : ''}`}
            style={{ '--mf-color': cat.color }}
            onClick={() => setActiveCategory(cat.key)}
          >
            <span className="mfb-icon">{cat.icon}</span>
            <span className="mfb-label">{cat.label}</span>
          </button>
        ))}
        <div className="map-toggles">
          <label className="map-toggle">
            <input type="checkbox" checked={showHotspots} onChange={e => setShowHotspots(e.target.checked)} />
            <span className="mt-slider" />
            <span className="mt-label">Impact Zones</span>
          </label>
          <label className="map-toggle">
            <input type="checkbox" checked={showCommunity} onChange={e => setShowCommunity(e.target.checked)} />
            <span className="mt-slider" />
            <span className="mt-label">Community</span>
          </label>
        </div>
      </div>

      {/* Map + Sidebar */}
      <div className="map-layout">
        {/* Map */}
        <div className="map-container-wrap">
          <MapContainer
            center={defaultCenter}
            zoom={12}
            className="leaflet-map"
            scrollWheelZoom={true}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {flyTarget && <FlyToLocation center={flyTarget} zoom={flyZoom} />}

            {/* Eco-station markers */}
            {filteredStations.map(station => (
              <Marker
                key={station.id}
                position={[station.lat, station.lng]}
                icon={ICONS[station.type] || ICONS.station}
                eventHandlers={{
                  click: () => setSelectedStation(station),
                }}
              >
                <Popup className="eco-popup">
                  <div className="popup-inner">
                    <div className="popup-header">
                      <span className="popup-type-badge">{station.type.toUpperCase()}</span>
                      <span className="popup-verified">✅ {station.verified} verified</span>
                    </div>
                    <h3 className="popup-name">{station.name}</h3>
                    <p className="popup-desc">{station.desc}</p>
                    <div className="popup-impact">
                      <span className="popup-impact-icon">🌍</span>
                      <span>{station.impact}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Community action markers */}
            {showCommunity && COMMUNITY_ACTIONS.map(a => (
              <Marker
                key={a.id}
                position={[a.lat, a.lng]}
                icon={ICONS.user}
              >
                <Popup className="eco-popup">
                  <div className="popup-inner community-popup">
                    <div className="popup-header">
                      <span className="popup-user-badge">👤 {a.user}</span>
                      <span className="popup-pts">+{a.pts} pts</span>
                    </div>
                    <p className="popup-action">{a.emoji} {a.action}</p>
                    <span className="popup-time">{a.time}</span>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Impact hotspot circles */}
            {showHotspots && IMPACT_ZONES.map((zone, i) => (
              <Circle
                key={i}
                center={[zone.lat, zone.lng]}
                radius={zone.radius}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.color,
                  fillOpacity: 0.12,
                  weight: 1.5,
                  dashArray: '6 4',
                }}
              >
                <Popup className="eco-popup">
                  <div className="popup-inner">
                    <h3 className="popup-name">{zone.label}</h3>
                    <p className="popup-desc">Impact Level: <strong style={{ color: zone.color }}>{zone.level.toUpperCase()}</strong></p>
                  </div>
                </Popup>
              </Circle>
            ))}
          </MapContainer>

          {/* Floating mini-stats on map */}
          <div className="map-floating-stats">
            <div className="mfs-item">
              <span className="mfs-val">{totalVerified.toLocaleString()}</span>
              <span className="mfs-label">Total Verifications</span>
            </div>
            <div className="mfs-divider" />
            <div className="mfs-item">
              <span className="mfs-val">{ECO_STATIONS.length}</span>
              <span className="mfs-label">Active Stations</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className={`map-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '✕' : '☰'}
          </button>

          <ActivityFeed actions={COMMUNITY_ACTIONS} onLocate={handleLocate} />

          {/* Nearby stations list */}
          <div className="sidebar-stations">
            <div className="ss-title">📍 Eco-Stations ({filteredStations.length})</div>
            <div className="ss-list">
              {filteredStations.map(s => (
                <div
                  key={s.id}
                  className={`ss-item ${selectedStation?.id === s.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedStation(s);
                    handleLocate([s.lat, s.lng]);
                  }}
                >
                  <div className="ss-icon">{ICONS[s.type] ? s.type === 'station' ? '📍' : s.type === 'solar' ? '☀️' : s.type === 'water' ? '💧' : s.type === 'tree' ? '🌳' : s.type === 'garden' ? '🌻' : s.type === 'recycle' ? '♻️' : s.type === 'bike' ? '🚲' : s.type === 'cleanup' ? '🧹' : s.type === 'school' ? '🏫' : '📍' : '📍'}</div>
                  <div className="ss-info">
                    <div className="ss-name">{s.name}</div>
                    <div className="ss-meta">
                      <span>✅ {s.verified}</span>
                      <span className="ss-cat">{s.category}</span>
                    </div>
                  </div>
                  <div className="ss-arrow">→</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected station detail card */}
      <AnimatePresence>
        {selectedStation && (
          <motion.div
            className="station-detail-card glass-card"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            <button className="sdc-close" onClick={() => setSelectedStation(null)}>✕</button>
            <div className="sdc-header">
              <div className="sdc-badge" style={{ background: `${CATEGORIES.find(c => c.key === selectedStation.category)?.color || '#10b981'}20`, color: CATEGORIES.find(c => c.key === selectedStation.category)?.color || '#10b981' }}>
                {selectedStation.category.toUpperCase()}
              </div>
              <div className="sdc-verified">✅ {selectedStation.verified} Verified Actions</div>
            </div>
            <h2 className="sdc-name">{selectedStation.name}</h2>
            <p className="sdc-desc">{selectedStation.desc}</p>
            <div className="sdc-impact">
              <span className="sdc-impact-icon">🌍</span>
              <span className="sdc-impact-text">{selectedStation.impact}</span>
            </div>
            <div className="sdc-coords">
              📌 {selectedStation.lat.toFixed(4)}°N, {selectedStation.lng.toFixed(4)}°E
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
