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

// ── Sample eco-stations & hotspots data ──
const ECO_STATIONS = [
  { id: 1, name: 'Green Valley Eco-Station',    type: 'station',  lat: 28.6139, lng: 77.2090, desc: 'Central Delhi recycling & awareness hub', impact: '2,400 kg waste recycled',        verified: 156, category: 'station' },
  { id: 2, name: 'Solar Panel Array — JNU',      type: 'solar',    lat: 28.5402, lng: 77.1662, desc: 'University solar energy demonstration',     impact: '18,000 kWh generated/year',     verified: 89,  category: 'energy' },
  { id: 3, name: 'Yamuna Cleanup Point',         type: 'water',    lat: 28.6328, lng: 77.2197, desc: 'Weekly river cleanup drive location',       impact: '1,200 kg plastic removed',      verified: 234, category: 'water' },
  { id: 4, name: 'Lodhi Garden Eco-Trail',       type: 'garden',   lat: 28.5931, lng: 77.2197, desc: 'Heritage park with biodiversity trail',     impact: '50+ native species documented', verified: 312, category: 'nature' },
  { id: 5, name: 'IIT Delhi Green Campus',       type: 'school',   lat: 28.5450, lng: 77.1926, desc: 'Zero-waste campus initiative',              impact: '85% waste diverted from landfill', verified: 178, category: 'station' },
  { id: 6, name: 'Hauz Khas Lake Restoration',   type: 'water',    lat: 28.5494, lng: 77.2001, desc: 'Lake rejuvenation & wetland conservation',  impact: '40% water quality improvement', verified: 145, category: 'water' },
  { id: 7, name: 'Saket Cycle Station',          type: 'bike',     lat: 28.5244, lng: 77.2167, desc: 'Public bike-sharing & green commute hub',   impact: '3,600 kg CO₂ saved/month',      verified: 267, category: 'transport' },
  { id: 8, name: 'Nehru Place E-Waste Drive',    type: 'recycle',  lat: 28.5491, lng: 77.2533, desc: 'Responsible e-waste collection center',     impact: '800 kg e-waste recycled',       verified: 98,  category: 'station' },
  { id: 9, name: 'Delhi Ridge Forest Walk',      type: 'tree',     lat: 28.6880, lng: 77.1740, desc: 'Urban forest conservation & tree tagging',  impact: '500+ trees tagged & monitored', verified: 203, category: 'nature' },
  { id: 10, name: 'Connaught Place Rain Garden', type: 'garden',   lat: 28.6315, lng: 77.2167, desc: 'Rainwater harvesting demonstration site',   impact: '50,000L rainwater harvested',   verified: 167, category: 'water' },
  { id: 11, name: 'Dwarka Solar Community',      type: 'solar',    lat: 28.5823, lng: 77.0500, desc: 'Residential rooftop solar cooperative',     impact: '12,000 kWh generated/year',     verified: 76,  category: 'energy' },
  { id: 12, name: 'Okhla Bird Sanctuary',        type: 'tree',     lat: 28.5600, lng: 77.3100, desc: 'Wetland bird conservation area',            impact: '320+ bird species recorded',    verified: 289, category: 'nature' },
  { id: 13, name: 'Janakpuri Community Garden',  type: 'garden',   lat: 28.6219, lng: 77.0861, desc: 'Urban farming & composting center',          impact: '2 tonnes organic produce/year', verified: 134, category: 'nature' },
  { id: 14, name: 'Rohini Waste Segregation Hub',type: 'recycle',  lat: 28.7325, lng: 77.1201, desc: 'Model waste management facility',           impact: '95% segregation rate achieved', verified: 112, category: 'station' },
  { id: 15, name: 'Mayur Vihar River Trail',     type: 'cleanup',  lat: 28.6100, lng: 77.2900, desc: 'Monthly river bank cleanup initiative',     impact: '600 kg litter collected/month', verified: 189, category: 'water' },
];

// ── Impact hotspots (circles) ──
const IMPACT_ZONES = [
  { lat: 28.6139, lng: 77.2090, radius: 2000, color: '#10b981', label: 'High Impact Zone — Central Delhi',    level: 'high' },
  { lat: 28.5450, lng: 77.1926, radius: 1500, color: '#3b82f6', label: 'University Green Belt',              level: 'medium' },
  { lat: 28.6880, lng: 77.1740, radius: 1800, color: '#22c55e', label: 'Delhi Ridge Conservation Area',      level: 'high' },
  { lat: 28.5600, lng: 77.3100, radius: 1200, color: '#06b6d4', label: 'Okhla Wetland Protected Zone',       level: 'medium' },
];

// Community actions by users
const COMMUNITY_ACTIONS = [
  { id: 'a1', user: 'Priya S.',    action: 'Planted 5 saplings',           lat: 28.6200, lng: 77.2150, time: '2h ago',  pts: 150, emoji: '🌱' },
  { id: 'a2', user: 'Arjun M.',    action: 'Cleaned 2km river bank',       lat: 28.6350, lng: 77.2210, time: '4h ago',  pts: 200, emoji: '🧹' },
  { id: 'a3', user: 'Sneha K.',    action: 'Verified solar panel install',  lat: 28.5410, lng: 77.1680, time: '6h ago',  pts: 180, emoji: '☀️' },
  { id: 'a4', user: 'Rahul P.',    action: 'Recycled 15kg e-waste',         lat: 28.5500, lng: 77.2540, time: '8h ago',  pts: 120, emoji: '♻️' },
  { id: 'a5', user: 'Ananya R.',   action: 'Documented 12 bird species',    lat: 28.5620, lng: 77.3080, time: '1d ago',  pts: 160, emoji: '🦜' },
  { id: 'a6', user: 'Karthik V.',  action: 'Organized campus cleanup',      lat: 28.5460, lng: 77.1940, time: '1d ago',  pts: 250, emoji: '🏫' },
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
  const [flyZoom, setFlyZoom] = useState(12);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showCommunity, setShowCommunity] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const defaultCenter = [28.6139, 77.2090]; // New Delhi

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
            Explore eco-stations, community actions, and impact hotspots across your city
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
