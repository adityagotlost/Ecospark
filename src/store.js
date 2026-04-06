// Central data store using localStorage
// ================================================

const STORAGE_KEYS = {
  USER: 'ecospark_user',
  USERS_DB: 'ecospark_users_db',
  COMPLETED_LESSONS: 'ecospark_lessons',
  COMPLETED_CHALLENGES: 'ecospark_challenges',
  COMPLETED_QUIZZES: 'ecospark_quizzes',
  BADGES: 'ecospark_badges',
  PURCHASED: 'ecospark_purchased',
};

// ── Auth ──────────────────────────────────────────

export function registerUser({ name, email, password, school, grade }) {
  const db = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS_DB) || '{}');
  if (db[email]) return { error: 'Email already registered!' };
  const user = {
    id: Date.now().toString(),
    name, email, password,
    school: school || 'Green Valley School',
    grade: grade || '10th',
    avatar: name.charAt(0).toUpperCase(),
    ecoPoints: 0,
    streak: 1,
    joinedAt: new Date().toISOString(),
    completedLessons: [],
    completedChallenges: [],
    completedQuizzes: [],
    badges: [],
    weeklyPoints: [0, 0, 0, 0, 0, 0, 0],
    lastLogin: new Date().toISOString(),
  };
  db[email] = user;
  localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(db));
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  return { user };
}

export function loginUser({ email, password }) {
  const db = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS_DB) || '{}');
  const user = db[email];
  if (!user) return { error: 'No account found with this email.' };
  if (user.password !== password) return { error: 'Incorrect password.' };
  // update streak
  const lastLogin = new Date(user.lastLogin);
  const today = new Date();
  
  // Calculate difference in calendar days
  const lastLoginDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((todayDate - lastLoginDate) / 86400000);
  
  if (diffDays === 1) user.streak = (user.streak || 0) + 1;
  else if (diffDays > 1) user.streak = 1;
  user.lastLogin = today.toISOString();
  db[email] = user;
  localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(db));
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  return { user };
}

export function getUser() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
}

export function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.USER);
}

export function updateUser(updates) {
  const user = getUser();
  if (!user) return;
  const db = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS_DB) || '{}');
  const updated = { ...user, ...updates };
  db[user.email] = updated;
  localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(db));
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
  return updated;
}

// ── Eco Points ─────────────────────────────────────

export function addEcoPoints(points, reason) {
  const user = getUser();
  if (!user) return;
  const today = new Date().getDay(); // 0=Sun,...,6=Sat
  const weekly = [...(user.weeklyPoints || [0,0,0,0,0,0,0])];
  weekly[today] = (weekly[today] || 0) + points;
  return updateUser({
    ecoPoints: (user.ecoPoints || 0) + points,
    weeklyPoints: weekly,
  });
}

// ── Lessons ────────────────────────────────────────

export function completeLesson(lessonId, points = 50) {
  const user = getUser();
  if (!user) return;
  if ((user.completedLessons || []).includes(lessonId)) return user;
  const updated = addEcoPoints(points, `Completed lesson: ${lessonId}`);
  const completedLessons = [...(updated.completedLessons || []), lessonId];
  const u = updateUser({ completedLessons });
  checkAndAwardBadges(u);
  return u;
}

// ── Challenges ─────────────────────────────────────

export function completeChallenge(challengeId, points = 100) {
  const user = getUser();
  if (!user) return;
  if ((user.completedChallenges || []).includes(challengeId)) return user;
  const updated = addEcoPoints(points, `Completed challenge: ${challengeId}`);
  const completedChallenges = [...(updated.completedChallenges || []), challengeId];
  const u = updateUser({ completedChallenges });
  checkAndAwardBadges(u);
  return u;
}

// ── Quizzes ────────────────────────────────────────

export function completeQuiz(quizId, score, total) {
  const user = getUser();
  if (!user) return;
  const points = Math.round((score / total) * 80);
  const updated = addEcoPoints(points);
  const completedQuizzes = [...(updated.completedQuizzes || []), { quizId, score, total }];
  const u = updateUser({ completedQuizzes });
  checkAndAwardBadges(u);
  return u;
}

// ── Badges ─────────────────────────────────────────

export const ALL_BADGES = [
  { id: 'first_leaf',      icon: '\uD83C\uDF31', name: 'First Leaf',        desc: 'Complete your first lesson',               color: '#34d364', condition: u => u.completedLessons?.length >= 1 },
  { id: 'eco_warrior',    icon: '\u2694\uFE0F', name: 'Eco Warrior',      desc: 'Earn 500 EcoPoints',                       color: '#00e5c4', condition: u => u.ecoPoints >= 500 },
  { id: 'quiz_master',    icon: '\uD83E\uDDE0', name: 'Quiz Master',      desc: 'Complete 3 quizzes',                       color: '#a78bfa', condition: u => u.completedQuizzes?.length >= 3 },
  { id: 'challenger',     icon: '\uD83C\uDFC6', name: 'Challenger',       desc: 'Complete 3 real-world challenges',         color: '#ffd700', condition: u => u.completedChallenges?.length >= 3 },
  { id: 'green_thumb',    icon: '\uD83C\uDF3F', name: 'Green Thumb',      desc: 'Complete 5 lessons',                       color: '#4ade80', condition: u => u.completedLessons?.length >= 5 },
  { id: 'planet_saver',   icon: '\uD83C\uDF0D', name: 'Planet Saver',     desc: 'Earn 1000 EcoPoints',                      color: '#f97316', condition: u => u.ecoPoints >= 1000 },
  { id: 'streak_7',       icon: '\uD83D\uDD25', name: 'On Fire!',          desc: 'Maintain a 7-day streak',                  color: '#ef4444', condition: u => u.streak >= 7 },
  { id: 'all_rounder',    icon: '\uD83C\uDF1F', name: 'All Rounder',      desc: 'Complete a lesson, quiz and challenge',    color: '#fbbf24', condition: u => u.completedLessons?.length >= 1 && u.completedQuizzes?.length >= 1 && u.completedChallenges?.length >= 1 },
  { id: 'biodiversity',   icon: '\uD83E\uDD8B', name: 'Biodiversity Fan', desc: 'Complete the biodiversity lesson',         color: '#60a5fa', condition: u => u.completedLessons?.includes('biodiversity') },
  { id: 'solar_champ',    icon: '\u2600\uFE0F', name: 'Solar Champion',   desc: 'Complete the renewable energy lesson',     color: '#facc15', condition: u => u.completedLessons?.includes('renewable-energy') },
  { id: 'ocean_guardian', icon: '\uD83C\uDF0A', name: 'Ocean Guardian',   desc: 'Complete the ocean health lesson',         color: '#0ea5e9', condition: u => u.completedLessons?.includes('ocean-health') },
  { id: 'air_defender',   icon: '\uD83C\uDF2B\uFE0F', name: 'Air Defender', desc: 'Complete the air pollution lesson',      color: '#94a3b8', condition: u => u.completedLessons?.includes('air-pollution') },
  { id: 'plastic_free',       icon: '🧴', name: 'Plastic Free',        desc: 'Complete the plastic crisis lesson',           color: '#ec4899', condition: u => u.completedLessons?.includes('plastic-crisis') },
  { id: 'soil_keeper',        icon: '🪱', name: 'Soil Keeper',         desc: 'Complete the soil health lesson',              color: '#92400e', condition: u => u.completedLessons?.includes('soil-health') },
  { id: 'city_builder',       icon: '🏙️', name: 'City Builder',        desc: 'Complete the Building Green Cities lesson',    color: '#10b981', condition: u => u.completedLessons?.includes('green-cities') },
  { id: 'sdg_hero',           icon: '🎯', name: 'SDG Hero',            desc: 'Complete the Climate Action SDG lesson',       color: '#6366f1', condition: u => u.completedLessons?.includes('climate-action') },
  { id: 'carbon_tracker',     icon: '👣', name: 'Carbon Tracker',      desc: 'Complete the carbon footprint lesson',         color: '#f97316', condition: u => u.completedLessons?.includes('carbon-footprint') },
  { id: 'quiz_ace',           icon: '🥇', name: 'Quiz Ace',            desc: 'Complete 6 quizzes',                           color: '#adff2f', condition: u => u.completedQuizzes?.length >= 6 },
  { id: 'lesson_legend',      icon: '📚', name: 'Lesson Legend',       desc: 'Complete 10 lessons',                          color: '#c084fc', condition: u => u.completedLessons?.length >= 10 },
  { id: 'eco_champion',       icon: '🦁', name: 'Eco Champion',        desc: 'Earn 2500 EcoPoints',                          color: '#adff2f', condition: u => u.ecoPoints >= 2500 },
  { id: 'eco_master',         icon: '🎓', name: 'Eco Master',          desc: 'Complete 15 lessons',                          color: '#f43f5e', condition: u => u.completedLessons?.length >= 15 },
  { id: 'quiz_legend',        icon: '👑', name: 'Quiz Legend',         desc: 'Complete 10 quizzes',                          color: '#eab308', condition: u => u.completedQuizzes?.length >= 10 },
  { id: 'eco_explorer',       icon: '📍', name: 'Eco Explorer',        desc: 'Scan your first Eco-Station QR',               color: '#0ea5e9', condition: u => u.ecoStations?.length >= 1 },
  // New lesson-specific badges
  { id: 'forest_guardian',    icon: '🌲', name: 'Forest Guardian',     desc: 'Complete the Deforestation lesson',            color: '#16a34a', condition: u => u.completedLessons?.includes('deforestation') },
  { id: 'compost_king',       icon: '🥬', name: 'Compost King',        desc: 'Complete the Composting lesson',               color: '#65a30d', condition: u => u.completedLessons?.includes('composting') },
  { id: 'urban_ranger',       icon: '🦔', name: 'Urban Ranger',        desc: 'Complete the Urban Biodiversity lesson',       color: '#0d9488', condition: u => u.completedLessons?.includes('urban-biodiversity') },
  { id: 'ev_pioneer',         icon: '⚡', name: 'EV Pioneer',          desc: 'Complete the Electric Vehicles lesson',        color: '#2563eb', condition: u => u.completedLessons?.includes('electric-vehicles') },
  { id: 'dark_sky',           icon: '🌌', name: 'Dark Sky Defender',   desc: 'Complete the Light Pollution lesson',          color: '#7c3aed', condition: u => u.completedLessons?.includes('light-pollution') },
  { id: 'local_eater',        icon: '🥗', name: 'Local Eater',         desc: 'Complete the Food Miles lesson',               color: '#c2410c', condition: u => u.completedLessons?.includes('food-miles') },
  { id: 'silence_keeper',     icon: '🔇', name: 'Silence Keeper',      desc: 'Complete the Noise Pollution lesson',          color: '#9f1239', condition: u => u.completedLessons?.includes('noise-pollution') },
  { id: 'slow_fashion',       icon: '👗', name: 'Slow Fashion Icon',   desc: 'Complete the Eco-Fashion lesson',              color: '#be185d', condition: u => u.completedLessons?.includes('eco-fashion') },
  { id: 'groundwater_guard',  icon: '🏺', name: 'Groundwater Guard',   desc: 'Complete the Groundwater lesson',              color: '#06b6d4', condition: u => u.completedLessons?.includes('groundwater-crisis') },
  { id: 'rain_catcher',       icon: '🌧️', name: 'Rain Catcher',        desc: 'Complete the Rainwater Harvesting lesson',     color: '#3b82f6', condition: u => u.completedLessons?.includes('rainwater-harvesting') },
  { id: 'river_hero',         icon: '🛶', name: 'River Hero',         desc: 'Complete the River Rejuvenation lesson',       color: '#0ea5e9', condition: u => u.completedLessons?.includes('river-rejuvenation') },
  // Expanded milestone badges
  { id: 'eco_grandmaster',    icon: '🌟', name: 'Eco Grandmaster',     desc: 'Complete 20 lessons',                          color: '#f59e0b', condition: u => u.completedLessons?.length >= 20 },
  { id: 'quiz_grandmaster',   icon: '🏆', name: 'Quiz Grandmaster',    desc: 'Complete 15 quizzes',                          color: '#22c55e', condition: u => u.completedQuizzes?.length >= 15 },
];

// ── Marketplace Items ──────────────────────────────
export const MARKETPLACE_ITEMS = [
  { 
    id: 'bamboo_kit', 
    name: 'Eco-Bamboo Kit', 
    image: '/bamboo_kit_prod.png', 
    price: 300, 
    desc: 'Sustainable bamboo toothbrush & straw set.',
    category: 'Voucher',
    color: '#10b981'
  },
  { 
    id: 'tree_certificate', 
    name: 'Plant-a-Tree', 
    image: '/tree_cert_prod.png', 
    price: 500, 
    desc: 'Get a certificate for a real tree planted in your name.',
    category: 'Impact',
    color: '#059669'
  },
  { 
    id: 'organic_seeds', 
    name: 'Organic Herb Seeds', 
    image: '/organic_seeds_prod.png', 
    price: 200, 
    desc: 'Grow your own balcony garden with heirloom seeds.',
    category: 'Voucher',
    color: '#84cc16'
  },
  { 
    id: 'solar_lamp', 
    name: 'Solar Study Lamp', 
    image: '/solar_lamp_prod.png', 
    price: 1200, 
    desc: 'Discount voucher for a premium solar-powered lamp.',
    category: 'Gear',
    color: '#facc15'
  },
  { 
    id: 'compost_bin', 
    name: 'Home Composter', 
    image: '/compost_bin_prod.png', 
    price: 800, 
    desc: 'A stylish indoor composter for your kitchen waste.',
    category: 'Gear',
    color: '#65a30d'
  },
  { 
    id: 'profile_frame_gold', 
    name: 'Gold Guardian Frame', 
    image: '/gold_frame_prod.png', 
    price: 1500, 
    desc: 'Exclusive golden profile frame for ultimate eco-heroes.',
    category: 'Digital',
    color: '#fbbf24'
  }
];

// ── Eco Insights Data ────────────────────────────────
export const INSIGHTS_TOPICS = [
  'Climate Action',
  'Renewable Energy',
  'Sustainable Cities',
  'Ocean Health',
  'Plastic Solutions',
  'Biodiversity',
  'Green Tech'
];

export const DEFAULT_TIPS = [
  { text: "Replacing one plastic bottle saves about 80g of CO2 emissions.", metric: "80g CO2" },
  { text: "Turning off the tap while brushing saves up to 12 liters of water.", metric: "12L Water" },
  { text: "Using an LED bulb instead of incandescent saves 75% more energy.", metric: "75% Energy" },
  { text: "Composting kitchen scraps can reduce your household waste by 30%.", metric: "30% Waste" },
  { text: "One tree can absorb up to 22kg of CO2 per year.", metric: "22kg CO2" }
];

// ── Profile Themes (unlocked by level / ecoPoints) ────────────
export const PROFILE_THEMES = [
  {
    id: 'seedling',
    name: '🌱 Seedling',
    unlockPoints: 0,
    unlockLabel: 'Default theme',
    primary: '#34d364',
    secondary: '#00e5c4',
    glow: 'rgba(52,211,100,0.35)',
    bg: 'rgba(52,211,100,0.05)',
    gradient: 'linear-gradient(135deg, #34d364 0%, #00e5c4 100%)',
  },
  {
    id: 'guardian',
    name: '🌿 Guardian',
    unlockPoints: 250,
    unlockLabel: 'Reach 250 EcoPoints',
    primary: '#4ade80',
    secondary: '#06b6d4',
    glow: 'rgba(74,222,128,0.35)',
    bg: 'rgba(6,182,212,0.06)',
    gradient: 'linear-gradient(135deg, #4ade80 0%, #06b6d4 100%)',
  },
  {
    id: 'warrior',
    name: '⚔️ Warrior',
    unlockPoints: 500,
    unlockLabel: 'Reach 500 EcoPoints',
    primary: '#00e5c4',
    secondary: '#3b82f6',
    glow: 'rgba(0,229,196,0.35)',
    bg: 'rgba(59,130,246,0.06)',
    gradient: 'linear-gradient(135deg, #00e5c4 0%, #3b82f6 100%)',
  },
  {
    id: 'knight',
    name: '🧠 Knight',
    unlockPoints: 1000,
    unlockLabel: 'Reach 1000 EcoPoints',
    primary: '#a78bfa',
    secondary: '#ec4899',
    glow: 'rgba(167,139,250,0.35)',
    bg: 'rgba(167,139,250,0.06)',
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
  },
  {
    id: 'planet_saver',
    name: '🌍 Planet Saver',
    unlockPoints: 2000,
    unlockLabel: 'Reach 2000 EcoPoints',
    primary: '#f97316',
    secondary: '#fbbf24',
    glow: 'rgba(249,115,22,0.35)',
    bg: 'rgba(249,115,22,0.06)',
    gradient: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
  },
  {
    id: 'legend',
    name: '👑 Eco Legend',
    unlockPoints: 5000,
    unlockLabel: 'Reach 5000 EcoPoints',
    primary: '#fbbf24',
    secondary: '#f43f5e',
    glow: 'rgba(251,191,36,0.45)',
    bg: 'rgba(251,191,36,0.07)',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #f43f5e 50%, #a78bfa 100%)',
  },
];

// ── Avatar Frames (unlocked by badge) ─────────────────────────
export const AVATAR_FRAMES = [
  {
    id: 'default',
    name: '⬡ Default',
    unlockBadge: null,
    unlockLabel: 'Always unlocked',
    borderColor: '#34d364',
    animation: 'frame-pulse-green',
    glow: 'rgba(52,211,100,0.4)',
  },
  {
    id: 'leaf_ring',
    name: '🌿 Leaf Ring',
    unlockBadge: 'first_leaf',
    unlockLabel: 'Earn "First Leaf" badge',
    borderColor: '#4ade80',
    animation: 'frame-pulse-leaf',
    glow: 'rgba(74,222,128,0.5)',
  },
  {
    id: 'fire_ring',
    name: '🔥 Fire Ring',
    unlockBadge: 'streak_7',
    unlockLabel: 'Earn "On Fire!" badge (7-day streak)',
    borderColor: '#ef4444',
    animation: 'frame-pulse-fire',
    glow: 'rgba(239,68,68,0.55)',
  },
  {
    id: 'cosmic_ring',
    name: '✨ Cosmic Ring',
    unlockBadge: 'eco_warrior',
    unlockLabel: 'Earn "Eco Warrior" badge',
    borderColor: '#a78bfa',
    animation: 'frame-pulse-cosmic',
    glow: 'rgba(167,139,250,0.55)',
  },
  {
    id: 'ocean_ring',
    name: '🌊 Ocean Ring',
    unlockBadge: 'ocean_guardian',
    unlockLabel: 'Earn "Ocean Guardian" badge',
    borderColor: '#0ea5e9',
    animation: 'frame-pulse-ocean',
    glow: 'rgba(14,165,233,0.55)',
  },
  {
    id: 'solar_ring',
    name: '☀️ Solar Ring',
    unlockBadge: 'solar_champ',
    unlockLabel: 'Earn "Solar Champion" badge',
    borderColor: '#facc15',
    animation: 'frame-pulse-solar',
    glow: 'rgba(250,204,21,0.55)',
  },
  {
    id: 'diamond_ring',
    name: '💎 Diamond Ring',
    unlockBadge: 'lesson_legend',
    unlockLabel: 'Earn "Lesson Legend" badge (10 lessons)',
    borderColor: '#e0f2fe',
    animation: 'frame-pulse-diamond',
    glow: 'rgba(224,242,254,0.6)',
  },
  {
    id: 'rainbow_ring',
    name: '🌈 Rainbow Ring',
    unlockBadge: 'eco_champion',
    unlockLabel: 'Earn "Eco Champion" badge (2500 pts)',
    borderColor: 'transparent',
    animation: 'frame-pulse-rainbow',
    glow: 'rgba(251,191,36,0.5)',
    isRainbow: true,
  },
];

export function checkAndAwardBadges(user) {
  if (!user) return;
  const earned = user.badges || [];
  const newBadges = ALL_BADGES.filter(b => !earned.includes(b.id) && b.condition(user)).map(b => b.id);
  if (newBadges.length > 0) {
    updateUser({ badges: [...earned, ...newBadges] });
    return newBadges;
  }
  return [];
}

// ── Leaderboard ────────────────────────────────────

export function getLeaderboard() {
  const db = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS_DB) || '{}');
  const currentUser = getUser();
  // Build base list from real users
  const realUsers = Object.values(db).map(u => ({
    id: u.id,
    name: u.name,
    school: u.school,
    avatar: u.avatar,
    ecoPoints: u.ecoPoints || 0,
    badges: [...new Set(u.badges || [])].filter(id => ALL_BADGES.some(b => b.id === id)).length,
    isCurrentUser: u.id === currentUser?.id,
  }));

  // Seed with demo users if less than 10 real users
  const seed = [
    { id: 's1', name: 'Priya Sharma',     school: 'Delhi Public School',      avatar: 'P', ecoPoints: 2340, badges: 8 },
    { id: 's2', name: 'Arjun Mehta',      school: 'Kendriya Vidyalaya',       avatar: 'A', ecoPoints: 2180, badges: 7 },
    { id: 's3', name: 'Sneha Patel',      school: 'Navodaya Vidyalaya',       avatar: 'S', ecoPoints: 1950, badges: 7 },
    { id: 's4', name: 'Ravi Kumar',       school: 'Army Public School',       avatar: 'R', ecoPoints: 1800, badges: 6 },
    { id: 's5', name: 'Ananya Singh',     school: 'Sardar Patel Vidalaya',    avatar: 'A', ecoPoints: 1670, badges: 5 },
    { id: 's6', name: 'Vivek Nair',       school: 'St. Xavier\'s College',    avatar: 'V', ecoPoints: 1540, badges: 5 },
    { id: 's7', name: 'Deepa Verma',      school: 'Green Valley School',      avatar: 'D', ecoPoints: 1390, badges: 4 },
    { id: 's8', name: 'Karan Joshi',      school: 'Ryan International',       avatar: 'K', ecoPoints: 1200, badges: 4 },
    { id: 's9', name: 'Meera Iyer',       school: 'Bal Bharati Public School',avatar: 'M', ecoPoints: 1050, badges: 3 },
    { id:'s10', name: 'Aditya Ghosh',     school: 'Modern School',            avatar: 'A', ecoPoints:  920, badges: 3 },
  ];

  const combined = [...realUsers];
  seed.forEach(s => {
    if (!realUsers.find(u => u.id === s.id)) combined.push(s);
  });

  return combined.sort((a, b) => b.ecoPoints - a.ecoPoints).slice(0, 20);
}

// ── Lesson Content ─────────────────────────────────

export const LESSONS = [
  {
    id: 'climate-change',
    title: 'Climate Change Basics',
    icon: '🌡️',
    category: 'Climate',
    difficulty: 'Beginner',
    points: 50,
    color: '#ef4444',
    content: [
      { type: 'text', body: 'Climate change refers to long-term shifts in global temperatures and weather patterns. While natural factors play a role, human activities—burning fossil fuels, deforestation—have been the main driver since the 1800s.' },
      { type: 'fact', body: '🌡️ The Earth has warmed by about 1.1°C since pre-industrial times. Even 0.5°C more could be devastating.' },
      { type: 'text', body: 'Greenhouse gases like CO₂ and methane trap heat in the atmosphere, causing the planet to warm—similar to how a car heats up in the sun.' },
      { type: 'fact', body: '📊 India is the 3rd largest emitter of CO₂ globally, yet contributes only 7% of global emissions per capita.' },
      { type: 'text', body: 'The impacts of climate change include more frequent and intense droughts, storms, heat waves, rising sea levels, melting glaciers and warming oceans.' },
      { type: 'fact', body: '🌊 Global sea levels have risen by about 8 inches since 1880, and the rate of rise is accelerating. This threatens coastal cities worldwide.' },
      { type: 'text', body: 'We can mitigate climate change by shifting to renewable energy, improving energy efficiency, and protecting forests and oceans which absorb carbon.' }
    ],
  },
  {
    id: 'waste-segregation',
    title: 'Waste Segregation',
    icon: '♻️',
    category: 'Waste',
    difficulty: 'Beginner',
    points: 50,
    color: '#22c55e',
    content: [
      { type: 'text', body: 'India generates 62 million tonnes of waste annually, of which only 43 million tonnes are collected. Proper segregation at source is the first step to responsible waste management.' },
      { type: 'fact', body: '🗑️ Wet waste (organic): 55% | Dry waste (recyclable): 25% | Hazardous: 5% | Others: 15%' },
      { type: 'text', body: 'Segregate into: Green bin (wet/organic), Blue bin (dry/recyclable), Red bin (hazardous). This simple act reduces landfill burden dramatically.' },
      { type: 'text', body: 'Wet waste can be composted at home to create nutrient-rich soil for plants. This prevents methane emissions from rotting food in landfills.' },
      { type: 'fact', body: '⚡ Recycling just one aluminum can saves enough energy to listen to a full album on your phone. Aluminum can be recycled infinitely without losing quality.' },
      { type: 'text', body: 'Electronic waste (e-waste) contains toxic heavy metals like lead and mercury. It should never be thrown in regular bins but given to authorized e-waste recyclers.' }
    ],
  },
  {
    id: 'water-conservation',
    title: 'Water Conservation',
    icon: '💧',
    category: 'Water',
    difficulty: 'Beginner',
    points: 50,
    color: '#3b82f6',
    content: [
      { type: 'text', body: 'India faces a severe water crisis—600 million people face high to extreme water stress. Groundwater is being used 3× faster than it can replenish.' },
      { type: 'fact', body: '💧 Fixing a leaky tap can save 15 litres/day. A 5-minute shower uses 60L; a bath uses 150L.' },
      { type: 'text', body: 'Simple acts: turn off taps, harvest rainwater, use drip irrigation, and reuse greywater for plants.' },
      { type: 'fact', body: '🚰 Agriculture accounts for about 80% of India\'s total water use, heavily relying on rapidly depleting groundwater.' },
      { type: 'text', body: 'Water footprints matter too. The "hidden water" in products we consume daily is enormous. For example, it takes about 2,500 liters of water to produce a single cotton t-shirt.' },
      { type: 'text', body: 'Implementing rainwater harvesting in residential buildings and schools can significantly recharge local groundwater levels.' }
    ],
  },
  {
    id: 'biodiversity',
    title: 'Biodiversity & Ecosystems',
    icon: '🦋',
    category: 'Ecology',
    difficulty: 'Intermediate',
    points: 60,
    color: '#8b5cf6',
    content: [
      { type: 'text', body: 'India is one of the 17 megadiverse countries, home to over 7.6% of all mammal species and 12.6% of all bird species on Earth.' },
      { type: 'fact', body: '🐅 India has 70% of the world\'s tigers. Yet, 21% of its mammal species are threatened with extinction.' },
      { type: 'text', body: 'Biodiversity loss disrupts food chains, reduces crop yields, and can trigger disease outbreaks—affecting human health directly.' },
      { type: 'fact', body: '🐝 Bees and other pollinators are responsible for 1 out of every 3 bites of food we eat. Their decline threatens global food security.' },
      { type: 'text', body: 'Protecting natural habitats from deforestation, pollution, and invasive species is crucial for maintaining ecological balance.' },
      { type: 'text', body: 'Creating small native gardens or "pollinator patches" in urban areas can help support local biodiversity and insect populations.' }
    ],
  },
  {
    id: 'renewable-energy',
    title: 'Renewable Energy',
    icon: '☀️',
    category: 'Energy',
    difficulty: 'Intermediate',
    points: 60,
    color: '#f59e0b',
    content: [
      { type: 'text', body: 'India has the 4th largest renewable energy capacity in the world! Solar, wind, hydro, and biomass energy are India\'s green future.' },
      { type: 'fact', body: '☀️ India\'s target: 500 GW of renewable energy by 2030. Current capacity: ~170 GW (2024).' },
      { type: 'text', body: 'Even at home: switch to LED bulbs (use 75% less energy), unplug devices on standby, and opt for green energy providers.' },
      { type: 'fact', body: '🌬️ A single large wind turbine can generate enough electricity to power about 600 homes continuously.' },
      { type: 'text', body: 'Unlike fossil fuels, renewable energy sources do not emit greenhouse gases or toxic pollutants, leading to cleaner air and better public health.' },
      { type: 'text', body: 'Solar energy costs have dropped by over 80% in the last decade, making it the cheapest source of new electricity in many parts of the world.' }
    ],
  },
  {
    id: 'sustainable-agriculture',
    title: 'Sustainable Agriculture',
    icon: '🌾',
    category: 'Food',
    difficulty: 'Advanced',
    points: 70,
    color: '#84cc16',
    content: [
      { type: 'text', body: 'Agriculture uses 70% of freshwater worldwide and contributes 24% of greenhouse gas emissions. Sustainable farming can reverse these impacts.' },
      { type: 'fact', body: '🌾 Organic farming can increase crop yields by 20-30% in developing countries while reducing chemical use dramatically.' },
      { type: 'text', body: 'Practices like crop rotation, agroforestry, and integrated pest management naturally enhance soil health without relying on synthetic fertilizers.' },
      { type: 'fact', body: '🍎 About one-third of all food produced globally is lost or wasted. Reducing food waste is a major part of sustainable agriculture.' },
      { type: 'text', body: 'Eating locally sourced, seasonal produce reduces the carbon footprint associated with long-distance food transportation and cold storage.' },
      { type: 'text', body: 'Transitioning to sustainable agriculture not only combats climate change but also secures the livelihoods of millions of smallholder farmers worldwide.' }
    ],
  },
  {
    id: 'air-pollution',
    title: 'Air Pollution & Your Health',
    icon: '🌫️',
    category: 'Climate',
    difficulty: 'Beginner',
    points: 50,
    color: '#94a3b8',
    content: [
      { type: 'text', body: 'Air pollution is now the leading environmental cause of disease. India has 14 of the world\'s 20 most polluted cities. Fine particulate matter (PM2.5) penetrates deep into lungs and enters the bloodstream.' },
      { type: 'fact', body: '🏥 Air pollution causes ~1.67 million deaths in India annually - more than any other environmental risk factor.' },
      { type: 'text', body: 'Sources: vehicle exhaust, industrial emissions, crop burning, and construction dust. Solutions include electric vehicles, clean cooking fuels, and urban tree planting.' },
      { type: 'fact', body: '🌳 A single tree can absorb up to 22 kg of CO2 per year and filter up to 100 grams of dust from the air.' },
      { type: 'text', body: 'Indoor air pollution from burning solid fuels (wood, dung) for cooking affects millions of rural households, primarily women and children.' },
      { type: 'text', body: 'Switching to public transport, carpooling, or cycling can drastically cut down personal contributions to urban air pollution.' }
    ],
  },
  {
    id: 'ocean-health',
    title: 'Our Oceans in Crisis',
    icon: '🌊',
    category: 'Ecology',
    difficulty: 'Intermediate',
    points: 60,
    color: '#0ea5e9',
    content: [
      { type: 'text', body: 'The ocean covers 71% of Earth and produces 50% of the oxygen we breathe. Yet over 8 million tonnes of plastic enter the ocean every year - the equivalent of dumping a garbage truck of plastic every minute.' },
      { type: 'fact', body: '🐢 By 2050, there could be more plastic in the ocean than fish by weight if we don\'t act now.' },
      { type: 'text', body: 'Ocean acidification - caused by CO2 absorption - has increased ocean acidity by 26% since the Industrial Revolution, threatening coral reefs and shellfish worldwide.' },
      { type: 'fact', body: '🪸 India\'s Lakshadweep coral reefs are among the most biodiverse in the world, but are bleaching rapidly due to warming seas.' },
      { type: 'text', body: 'Overfishing threatens marine food webs. Sustainable fishing practices and marine protected areas (MPAs) are essential to allow fish populations to recover.' },
      { type: 'text', body: 'Reducing your single-use plastic consumption directly helps protect marine life from ingestion and entanglement.' }
    ],
  },
  {
    id: 'carbon-footprint',
    title: 'Understanding Your Carbon Footprint',
    icon: '👣',
    category: 'Climate',
    difficulty: 'Intermediate',
    points: 60,
    color: '#f97316',
    content: [
      { type: 'text', body: 'A carbon footprint is the total greenhouse gas emissions caused by an individual, event, organization, or product. Understanding yours is the first step to reducing it.' },
      { type: 'fact', body: '✈️ A single long-haul flight generates more CO₂ than a month of daily car commuting. Flying less is one of the highest-impact choices you can make.' },
      { type: 'text', body: 'The average Indian emits ~1.9 tonnes of CO₂ per year — far below the global average of 4.7, but cities like Delhi and Mumbai are rising fast.' },
      { type: 'fact', body: '🥩 Switching from beef to plant-based protein for one year saves more CO₂ than giving up your car for the same period.' },
      { type: 'text', body: 'Buying second-hand clothes or wearing clothes longer reduces the massive carbon footprint of the "fast fashion" industry.' },
      { type: 'text', body: 'Small lifestyle changes, aggregated over millions of people, can lead to massive global reductions in greenhouse gas emissions.' }
    ],
  },
  {
    id: 'plastic-crisis',
    title: 'The Plastic Crisis',
    icon: '🧴',
    category: 'Waste',
    difficulty: 'Beginner',
    points: 50,
    color: '#ec4899',
    content: [
      { type: 'text', body: 'Plastic was invented in 1907. Since then, we have produced over 8.3 billion metric tonnes of plastic — 91% of which has never been recycled.' },
      { type: 'fact', body: '🧴 India banned single-use plastics in 2022, targeting straws, cutlery, plates, cups, and packaging below 75 microns.' },
      { type: 'text', body: 'Microplastics — particles smaller than 5mm — are now found in human blood, lungs, and even breast milk. Reducing plastic use protects your health, not just the environment.' },
      { type: 'fact', body: '♻️ Only 9% of all plastic ever made has been recycled. 12% has been incinerated. The other 79% is in landfills or the environment.' },
      { type: 'text', body: 'Carrying a reusable water bottle and shopping bags are the easiest and most effective ways to break our reliance on single-use plastics.' },
      { type: 'text', body: 'Many plastics take over 400 years to degrade, meaning almost every piece of plastic ever created still exists in some form today.' }
    ],
  },
  {
    id: 'soil-health',
    title: 'Soil: The Living Foundation',
    icon: '🪱',
    category: 'Food',
    difficulty: 'Intermediate',
    points: 65,
    color: '#92400e',
    content: [
      { type: 'text', body: 'Soil is not just dirt — it is a living ecosystem teeming with bacteria, fungi, and millions of organisms. One teaspoon of healthy soil contains more microorganisms than there are humans on Earth.' },
      { type: 'fact', body: '⚠️ India loses approximately 5.3 billion tonnes of topsoil annually to erosion caused by overfarming, deforestation, and poor land management.' },
      { type: 'text', body: 'Healthy soil sequesters carbon, filters water, and grows food. Composting kitchen waste, avoiding chemical fertilizers, and practicing crop rotation all help restore soil health.' },
      { type: 'fact', body: '🌱 Cover cropping — growing plants specifically to improve soil — can increase organic matter by 1-2% over five years, dramatically improving fertility.' },
      { type: 'text', body: 'Healthy soils act like a sponge, absorbing rainfall and preventing severe flooding, while storing water for deeper roots during droughts.' },
      { type: 'text', body: 'Home composting transforms your kitchen scraps into rich fertilizer for pots and gardens, directly returning life-giving nutrients to the earth.' }
    ],
  },
  {
    id: 'green-cities',
    title: 'Building Green Cities',
    icon: '🏙️',
    category: 'Energy',
    difficulty: 'Advanced',
    points: 75,
    color: '#10b981',
    content: [
      { type: 'text', body: 'Cities consume 78% of the world\'s energy and produce 60% of greenhouse gas emissions, yet cover only 3% of Earth\'s surface. How we design cities will define climate outcomes.' },
      { type: 'fact', body: '🚇 A single metro train replaces ~600 cars on the road. Mumbai Metro reduces 250,000 tonnes of CO₂ annually.' },
      { type: 'text', body: 'Green building principles: natural ventilation, solar panels on rooftops, rainwater harvesting, green roofs, and passive cooling reduce energy demand by 30-70%.' },
      { type: 'fact', body: '🌳 Urban forests (miyawaki forests) grow 10× faster than natural forests and are 30× denser — perfect for Indian cities with limited land.' },
      { type: 'text', body: 'Walkable neighborhoods and dedicated cycling lanes reduce reliance on fossil fuels and foster healthier, more connected communities.' },
      { type: 'text', body: 'Urban heat islands occur when concrete buildings absorb the sun\'s heat. Planting trees and creating green spaces drastically cool down neighborhoods naturally.' }
    ],
  },
  {
    id: 'climate-action',
    title: 'SDG 13: Climate Action',
    icon: '🎯',
    category: 'Climate',
    difficulty: 'Advanced',
    points: 80,
    color: '#6366f1',
    content: [
      { type: 'text', body: 'The UN Sustainable Development Goal 13 calls for urgent action to combat climate change and its impacts. India has pledged to achieve net-zero emissions by 2070.' },
      { type: 'fact', body: '🇮🇳 India has already achieved 43% of its electricity capacity from non-fossil fuel sources — ahead of its 2030 Nationally Determined Contribution target.' },
      { type: 'text', body: 'Individual and community action matters: carbon offsetting, advocacy, lifestyle changes, and supporting climate-conscious businesses all contribute to SDG 13.' },
      { type: 'fact', body: '🌏 The Paris Agreement targets limiting global warming to 1.5°C. Every 0.1°C above this threshold means millions more people exposed to extreme heat and flooding.' },
      { type: 'text', body: 'Youth climate movements like Fridays for Future have directly influenced national policies. You have the power to drive change through awareness and action.' },
      { type: 'text', body: 'Climate justice is a core principle of SDG 13, recognizing that the most vulnerable communities often suffer the worst impacts of climate change while contributing the least to it.' }
    ],
  },
  {
    id: 'energy-conservation',
    title: 'Energy Conservation at Home',
    icon: '🔌',
    category: 'Energy',
    difficulty: 'Beginner',
    points: 50,
    color: '#eab308',
    content: [
      { type: 'text', body: 'Energy conservation means using less energy by adjusting our behaviors and habits. It saves money and reduces the strain on power grids.' },
      { type: 'fact', body: '🔌 Vampire power (devices on standby) can account for up to 10% of an average home\'s electricity use.' },
      { type: 'text', body: 'Simple changes like using natural light, washing clothes in cold water, and turning off fans when leaving a room make a huge difference.' },
      { type: 'fact', body: '🧑‍🍳 Keeping a lid on cooking pots can reduce cooking energy by up to 14%, and using pressure cookers saves even more.' },
      { type: 'text', body: 'Setting the AC temperature slightly higher (at 24°C or 25°C) instead of 18°C can lower cooling energy consumption by over 20%.' },
      { type: 'text', body: 'Smart power strips can automatically cut off connection to devices that are in standby mode, eliminating vampire power draw effortlessly.' }
    ],
  },
  {
    id: 'circular-economy',
    title: 'The Circular Economy',
    icon: '🔁',
    category: 'Waste',
    difficulty: 'Intermediate',
    points: 60,
    color: '#14b8a6',
    content: [
      { type: 'text', body: 'Our current economy is mostly linear: "take, make, dispose". A circular economy designs out waste, keeps materials in use, and regenerates natural systems.' },
      { type: 'fact', body: '📱 Electronic waste is the fastest-growing waste stream globally, but 70% of the toxic chemicals in landfills come from it.' },
      { type: 'text', body: 'By repairing, refurbishing, and recycling products, we drastically reduce the need to extract new raw materials from the earth.' },
      { type: 'fact', body: '👗 The fashion industry produces 10% of all humanity\'s carbon emissions and is the second-largest consumer of the world\'s water supply.' },
      { type: 'text', body: 'Embracing "Product-as-a-Service" models—like renting tools or clothing instead of buying them—significantly advances the circular economy model.' },
      { type: 'text', body: 'Extended Producer Responsibility (EPR) holds manufacturers accountable for the entire lifecycle of their products, ensuring correct disposal and recycling.' }
    ],
  },
  {
    id: 'environmental-policy',
    title: 'Environmental Policy & Law',
    icon: '⚖️',
    category: 'Ecology',
    difficulty: 'Advanced',
    points: 70,
    color: '#4f46e5',
    content: [
      { type: 'text', body: 'While individual actions matter, systemic change is driven by strong environmental policies, international treaties, and climate justice laws.' },
      { type: 'fact', body: '📜 The Montreal Protocol successfully phased out 99% of ozone-depleting chemicals, showing that global policy cooperation works.' },
      { type: 'text', body: 'Understanding policy helps you vote efficiently and advocate for laws that hold large polluters accountable and protect vulnerable communities.' },
      { type: 'fact', body: '🏦 A rising trend is imposing "Carbon Taxes", which charge major industrial emitters a fee for the carbon they release, pushing them to innovate cleaner methods.' },
      { type: 'text', body: 'International agreements like the UN Convention on Biological Diversity set global targets to protect at least 30% of land and seas by 2030.' },
      { type: 'text', body: 'Public consultations and activism play crucial roles in shaping environmental impact assessments (EIA) for large infrastructure projects in India.' }
    ],
  },
  {
    id: 'climate-technology',
    title: 'Future Climate Tech',
    icon: '🔬',
    category: 'Energy',
    difficulty: 'Advanced',
    points: 75,
    color: '#06b6d4',
    content: [
      { type: 'text', body: 'New technologies are emerging to tackle the climate crisis, from Direct Air Capture (DAC) of CO₂ to lab-grown meat and next-gen solid-state batteries.' },
      { type: 'fact', body: '💨 Decarbonizing heavy industries like steel and cement could require green hydrogen, a technology still scaling up globally.' },
      { type: 'text', body: 'While tech won\'t solve everything without reducing consumption, it will play a critical role in reaching net-zero emissions by 2050.' },
      { type: 'fact', body: '🛰️ Satellites powered by AI are now used to track illegal deforestation and monitor specific methane leak points in real-time from space.' },
      { type: 'text', body: 'Precision agriculture utilizes drones and sensors to deliver exactly the required water and nutrients to crops, minimizing waste and chemical use.' },
      { type: 'text', body: 'Solid-state batteries are the next frontier for electric vehicles—promising longer ranges, faster charging, and lower risks of fire than current lithium-ion models.' }
    ],
  },
  {
    id: 'sustainable-finance',
    title: 'Sustainable Finance',
    icon: '📈',
    category: 'Climate',
    difficulty: 'Advanced',
    points: 70,
    color: '#059669',
    content: [
      { type: 'text', body: 'Money drives the global economy. Sustainable finance (ESG investing) directs capital toward projects that benefit the environment rather than fossil fuels.' },
      { type: 'fact', body: '🏦 Since the Paris Agreement, the world\'s 60 largest banks have still poured over $5.5 trillion into fossil fuel projects.' },
      { type: 'text', body: 'By choosing green banks, divesting pension funds from oil, and supporting carbon pricing markets, the financial sector can accelerate the green transition.' },
      { type: 'fact', body: '💵 The global market for "Green Bonds"—debt designed to fund climate-related projects—surpassed $2.5 trillion in total issuance by 2023.' },
      { type: 'text', body: 'Environmental, Social, and Governance (ESG) criteria are increasingly used by investors to screen companies based on their ecological impact and transparency.' },
      { type: 'text', body: 'Microfinance initiatives often provide zero-interest loans to rural households to help them install residential solar panels, merging financial inclusion with sustainability.' }
    ],
  },
  {
    id: 'deforestation',
    title: 'Deforestation & Forest Loss',
    icon: '🪓',
    category: 'Ecology',
    difficulty: 'Intermediate',
    points: 60,
    color: '#16a34a',
    content: [
      { type: 'text', body: 'Forests cover about 31% of the Earth\'s land area, but we are losing them at an alarming rate. Every minute, an area of forest equal to 40 football fields is destroyed.' },
      { type: 'fact', body: '🪓 About 15 billion trees are cut down each year globally. We have lost roughly half of the world\'s forests since the dawn of civilization.' },
      { type: 'text', body: 'Deforestation is largely driven by agriculture (especially cattle ranching and palm oil), logging, and urban expansion.' },
      { type: 'fact', body: '🇧🇷 The Amazon Rainforest absorbs ~2 billion tonnes of CO2 per year. When deforested, that same CO2 is released back into the atmosphere.' },
      { type: 'text', body: 'India is actually one of the few countries with a net positive increase in forest cover recently, adding over 1,500 sq. km between 2019–2021.' },
      { type: 'fact', body: '🌍 Tropical forests are home to more than half of the world\'s plant and animal species, making deforestation the #1 driver of biodiversity loss.' },
      { type: 'text', body: 'Sustainable forestry, reduced meat consumption, and certified wood products (FSC label) are effective ways to fight deforestation.' },
    ],
  },
  {
    id: 'composting',
    title: 'The Art of Composting',
    icon: '🥬',
    category: 'Waste',
    difficulty: 'Beginner',
    points: 50,
    color: '#65a30d',
    content: [
      { type: 'text', body: 'Composting is nature\'s way of recycling. Organic matter like food scraps and leaves are broken down by microorganisms into a rich, dark fertilizer called compost or "black gold".' },
      { type: 'fact', body: '♻️ About 30–40% of the food supply in India goes to waste. Composting this waste would slash methane emissions from landfills dramatically.' },
      { type: 'text', body: 'A home compost pile only needs 4 things: Greens (nitrogen-rich food waste), Browns (carbon-rich dry leaves), water (moisture), and air (turning).' },
      { type: 'fact', body: '🌡️ An active compost pile can reach temperatures of 60°C, which kills harmful pathogens and weed seeds, making the compost safe for plants.' },
      { type: 'text', body: 'Finished compost improves soil structure, adding beneficial microbes, retaining moisture, and reducing the need for chemical fertilizers.' },
      { type: 'text', body: 'Even in a small apartment, vermicomposting (using worms!) is a clean, space-efficient method to turn kitchen scraps into powerful plant food.' },
    ],
  },
  {
    id: 'urban-biodiversity',
    title: 'Urban Biodiversity & Wildlife Corridors',
    icon: '🦔',
    category: 'Ecology',
    difficulty: 'Intermediate',
    points: 65,
    color: '#0d9488',
    content: [
      { type: 'text', body: 'Cities are not ecological wastelands. With smart design, urban areas can become rich habitats for birds, insects, and small mammals alongside their human residents.' },
      { type: 'fact', body: '🦜 Over 1,300 bird species have been recorded in Indian cities. Even cities like Mumbai are home to flamingos, leopards, and migratory birds.' },
      { type: 'text', body: 'Wildlife corridors are strips of natural habitat that connect fragmented patches of wilderness, allowing animals to safely move between them without crossing busy roads.' },
      { type: 'fact', body: '🌳 A single mature tree in an urban area can support over 400 species of insects, birds, and fungi, providing a complete mini-ecosystem.' },
      { type: 'text', body: 'Green rooftops, balcony gardens, and native plant landscaping are easy ways residents can create micro-habitats for pollinators and birds.' },
      { type: 'text', body: 'The biggest threats to urban wildlife include light pollution, glass buildings (bird strikes), and the use of pesticides in parks and gardens.' },
    ],
  },
  {
    id: 'electric-vehicles',
    title: 'Electric Vehicles & Clean Transport',
    icon: '⚡',
    category: 'Energy',
    difficulty: 'Intermediate',
    points: 60,
    color: '#2563eb',
    content: [
      { type: 'text', body: 'Transport accounts for about 16% of global greenhouse gas emissions. Electric vehicles (EVs) offer a path to dramatically cut these emissions, especially when charged with renewable energy.' },
      { type: 'fact', body: '🚗 India is the 3rd largest automobile market in the world. The government\'s FAME-II scheme has deployed over 1.5 million electric vehicles to date.' },
      { type: 'text', body: 'EVs have far lower lifetime emissions than petrol cars, even when accounting for the energy used to manufacture their batteries.' },
      { type: 'fact', body: '⚡ An EV converts about 77% of electrical energy to movement. A petrol car only converts about 12–30%, wasting the rest as heat.' },
      { type: 'text', body: 'The biggest challenge for EVs in India is charging infrastructure. But battery-swapping technology for two-wheelers is rapidly emerging as a local solution.' },
      { type: 'fact', body: '🛵 Electric two-wheelers and three-wheelers (e-rickshaws) are already transforming last-mile urban transport across Indian cities.' },
      { type: 'text', body: 'Choosing public transport, carpooling, cycling, or walking remains the most impactful option — zero emissions, zero battery required!' },
    ],
  },
  {
    id: 'light-pollution',
    title: 'Light Pollution & The Dark Sky Crisis',
    icon: '🌃',
    category: 'Ecology',
    difficulty: 'Beginner',
    points: 50,
    color: '#7c3aed',
    content: [
      { type: 'text', body: 'Artificial light at night (ALAN) is so pervasive that 80% of the world\'s population now lives under light-polluted skies. Most people in cities have never seen the Milky Way.' },
      { type: 'fact', body: '🌌 India wastes an estimated ₹15,000 crore worth of electricity annually due to inefficient outdoor lighting, much of it directed upward into the sky.' },
      { type: 'text', body: 'Light pollution disrupts the circadian rhythms of insects, birds, sea turtles, and frogs. Sea turtle hatchlings navigate by moonlight and are fatally confused by beachfront lights.' },
      { type: 'fact', body: '🐝 Nocturnal pollinator insects are attracted to and disoriented by artificial light. This significantly reduces their effectiveness at pollinating night-blooming plants.' },
      { type: 'text', body: 'Solutions include switching to warm (amber) LED lights, using motion sensors, shielding fixtures to direct light downward, and observing "Dark Sky" nights in communities.' },
      { type: 'text', body: 'Turning off unnecessary lights between midnight and dawn in shops and offices is a simple, high-impact action for energy saving and wildlife protection.' },
    ],
  },
  {
    id: 'food-miles',
    title: 'Food Miles & Sustainable Eating',
    icon: '🥗',
    category: 'Food',
    difficulty: 'Beginner',
    points: 50,
    color: '#c2410c',
    content: [
      { type: 'text', body: 'Food miles refers to the distance food travels from farm to fork. The average meal in a developed country has ingredients from 5+ different countries, travelling over 1,500 miles.' },
      { type: 'fact', body: '🚚 The global food system contributes 26% of all greenhouse gas emissions. A large chunk of this comes from transportation and refrigeration.' },
      { type: 'text', body: 'Eating local and seasonal food reduces transport emissions and supports local farmers. Look for "sabzi mandi" and local weekly markets for the freshest produce.' },
      { type: 'fact', body: '🥩 The food with the highest carbon footprint by far is beef. Replacing one beef meal a week with lentils or chickpeas can cut your annual food emissions by 10%.' },
      { type: 'text', body: 'Plant-rich diets are not just good for the environment — they are linked to significantly lower rates of heart disease, diabetes, and cancer.' },
      { type: 'fact', body: '🌾 India is the world\'s largest producer of pulses (lentils, chickpeas, beans). Adding more daal to your diet is one of the most eco-friendly food choices possible.' },
      { type: 'text', body: 'Growing even a small pot of tomatoes, chillies, or herbs at home eliminates food miles entirely for those items and connects you to the food system.' },
    ],
  },
  {
    id: 'noise-pollution',
    title: 'Noise Pollution & Its Hidden Impact',
    icon: '🔊',
    category: 'Climate',
    difficulty: 'Beginner',
    points: 50,
    color: '#9f1239',
    content: [
      { type: 'text', body: 'Noise pollution is the presence of harmful or disruptive sounds in the environment. While often overlooked, it is a serious public health and ecological crisis.' },
      { type: 'fact', body: '📢 The World Health Organization considers noise a major environmental health problem. Prolonged exposure above 70 dB causes hearing damage.' },
      { type: 'text', body: 'In oceans, man-made noise from ships and sonar disrupts whale and dolphin communication, making it impossible for them to find mates, food, and each other.' },
      { type: 'fact', body: '🐦 Urban noise pollution causes song birds to sing at higher pitches to be heard over traffic. This changes their communication and mate selection.' },
      { type: 'text', body: 'City sounds stress out animals in urban parks, causing premature births, abandonment of young, and reduced foraging effectiveness.' },
      { type: 'fact', body: '🌆 Delhi, Mumbai and Kolkata consistently exceed WHO noise limits. Road traffic is the #1 source, followed by construction and amplified music.' },
      { type: 'text', body: 'Solutions include noise barriers on highways, quieter tire designs, urban green belts (which absorb sound), and strict limits on amplified outdoor events.' },
    ],
  },
  {
    id: 'eco-fashion',
    title: 'Eco-Fashion & The Clothing Revolution',
    icon: '👗',
    category: 'Waste',
    difficulty: 'Intermediate',
    points: 60,
    color: '#be185d',
    content: [
      { type: 'text', body: 'The fashion industry is one of the most polluting on Earth. It accounts for 10% of global carbon emissions and 20% of industrial wastewater pollution.' },
      { type: 'fact', body: '👖 Making a single pair of blue jeans requires about 7,500 litres of water — enough for one person to drink for 7 years.' },
      { type: 'text', body: 'Fast fashion brands release up to 52 "micro-seasons" a year, designed to make clothes feel outdated quickly and drive impulse buying and rapid disposal.' },
      { type: 'fact', body: '🧴 When synthetic fabrics like polyester are washed, they release millions of microplastic fibres that flow straight into rivers and oceans. One wash releases up to 700,000 fibres.' },
      { type: 'text', body: 'Sustainable alternatives include: buying second-hand, choosing natural and organic fibres, renting clothes for one-off events, and supporting slow fashion brands.' },
      { type: 'fact', body: '🪡 Khadi — India\'s hand-spun and hand-woven fabric — is one of the most sustainable textiles in the world, with a tiny carbon footprint and strong artisan livelihoods.' },
      { type: 'text', body: 'Caring for clothes properly (cold wash, air dry, mend before discarding) can at least double the lifespan of a garment and halve its environmental impact.' },
    ],
  },
  {
    id: 'groundwater-crisis',
    title: 'Groundwater: The Invisible Crisis',
    icon: '🏺',
    category: 'Water',
    difficulty: 'Intermediate',
    points: 65,
    color: '#06b6d4',
    content: [
      { type: 'text', body: 'Groundwater is the water found underground in the cracks and spaces in soil, sand and rock. It is a vital resource that provides 25% of all the world\'s fresh water.' },
      { type: 'fact', body: '⚠️ India is the world\'s largest user of groundwater, extracting more than the US and China combined.' },
      { type: 'text', body: 'Over-extraction for agriculture and industry is causing groundwater levels to drop at an alarming rate, leading to water scarcity and land subsidence.' },
      { type: 'fact', body: '📉 In some parts of India, groundwater levels are falling by up to 1 metre per year.' },
      { type: 'text', body: 'Climate change is also affecting groundwater recharge by altering rainfall patterns and increasing the frequency of droughts.' },
      { type: 'text', body: 'Protecting and restoring natural recharge areas, such as wetlands and forests, is essential for sustaining groundwater levels for future generations.' }
    ],
  },
  {
    id: 'rainwater-harvesting',
    title: 'Rainwater Harvesting',
    icon: '🌧️',
    category: 'Water',
    difficulty: 'Intermediate',
    points: 60,
    color: '#3b82f6',
    content: [
      { type: 'text', body: 'Rainwater harvesting is the simple process of collecting and storing rainwater for later use, rather than letting it run off.' },
      { type: 'fact', body: '🌧️ A single rooftop can collect thousands of litres of water in a single rainy season, which can be used for gardening, flushing toilets, and even drinking (with proper treatment).' },
      { type: 'text', body: 'Harvesting rainwater reduces the demand on municipal water supplies and helps to recharge local groundwater levels.' },
      { type: 'fact', body: '💧 Tamil Nadu was the first Indian state to make rainwater harvesting mandatory for all buildings.' },
      { type: 'text', body: 'Basic systems can be as simple as a rain barrel connected to a downspout, while more advanced systems can include large storage tanks and filtration systems.' },
      { type: 'text', body: 'Community-scale rainwater harvesting can provide a reliable source of water for entire neighbourhoods and farms.' }
    ],
  },
  {
    id: 'river-rejuvenation',
    title: 'River Rejuvenation',
    icon: '🛶',
    category: 'Water',
    difficulty: 'Advanced',
    points: 75,
    color: '#0ea5e9',
    content: [
      { type: 'text', body: 'Rivers are the lifeblood of many ecosystems and human civilizations. However, many of our rivers are struggling due to pollution, excessive water extraction, and habitat destruction.' },
      { type: 'fact', body: '🌊 The Ganga is one of the most polluted rivers in the world, receiving over 1 billion gallons of raw sewage every day.' },
      { type: 'text', body: 'River rejuvenation involves restoring the natural flow, water quality, and biodiversity of a river system.' },
      { type: 'fact', body: '🌱 Planting trees along riverbanks (riparian buffers) helps to filter pollutants, prevent erosion, and provide habitat for wildlife.' },
      { type: 'text', body: 'Successful river rejuvenation requires a combination of waste treatment, water conservation, reforestation, and community engagement.' },
      { type: 'text', body: 'Projects like the Namami Gange Programme are working to restore the ecological health and cultural significance of India\'s major rivers.' }
    ],
  },
];

// ── Quiz Content ───────────────────────────────────

export const QUIZZES = [
  {
    id: 'quiz-climate',
    title: 'Climate Change Quiz',
    icon: '🌡️',
    lessonId: 'climate-change',
    questions: [
      { q: 'By how much has Earth warmed since pre-industrial times?', options: ['0.5°C', '1.1°C', '2.0°C', '3.5°C'], answer: 1 },
      { q: 'Which gas is the primary greenhouse gas?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], answer: 2 },
      { q: 'What percentage of CO₂ does India contribute per capita globally?', options: ['7%', '15%', '25%', '30%'], answer: 0 },
      { q: 'What activity is the main driver of climate change since 1800s?', options: ['Agriculture', 'Human burning of fossil fuels', 'Volcanic eruptions', 'Solar flares'], answer: 1 },
    ],
  },
  {
    id: 'quiz-waste',
    title: 'Waste Management Quiz',
    icon: '♻️',
    lessonId: 'waste-segregation',
    questions: [
      { q: 'How many million tonnes of waste does India generate annually?', options: ['10 MT', '30 MT', '62 MT', '100 MT'], answer: 2 },
      { q: 'Which bin is used for dry/recyclable waste?', options: ['Green bin', 'Red bin', 'Blue bin', 'Yellow bin'], answer: 2 },
      { q: 'What percentage of Indian waste is wet/organic?', options: ['25%', '35%', '55%', '75%'], answer: 2 },
    ],
  },
  {
    id: 'quiz-water',
    title: 'Water Conservation Quiz',
    icon: '💧',
    lessonId: 'water-conservation',
    questions: [
      { q: 'How many million people face extreme water stress in India?', options: ['100 million', '300 million', '600 million', '900 million'], answer: 2 },
      { q: 'Fixing a leaky tap saves how much water per day?', options: ['5 litres', '10 litres', '15 litres', '30 litres'], answer: 2 },
      { q: 'What does drip irrigation primarily conserve?', options: ['Energy', 'Water', 'Soil', 'Seeds'], answer: 1 },
    ],
  },
  {
    id: 'quiz-biodiversity',
    title: 'Biodiversity Quiz',
    icon: '\uD83E\uDD8B',
    lessonId: 'biodiversity',
    questions: [
      { q: 'What percentage of the world\'s tigers are in India?', options: ['30%', '50%', '70%', '90%'], answer: 2 },
      { q: 'India is one of how many megadiverse countries?', options: ['5', '10', '17', '25'], answer: 2 },
      { q: 'What percentage of India\'s mammal species are threatened?', options: ['5%', '10%', '21%', '40%'], answer: 2 },
    ],
  },
  {
    id: 'quiz-air-pollution',
    title: 'Air Pollution Quiz',
    icon: '\uD83C\uDF2B\uFE0F',
    lessonId: 'air-pollution',
    questions: [
      { q: 'How many deaths does air pollution cause in India annually?', options: ['0.5 million', '1 million', '1.67 million', '3 million'], answer: 2 },
      { q: 'How many of the world\'s 20 most polluted cities are in India?', options: ['5', '8', '14', '20'], answer: 2 },
      { q: 'What is PM2.5?', options: ['A type of plant', 'Fine particulate matter < 2.5 microns', 'A water pollutant', 'A carbon unit'], answer: 1 },
      { q: 'How much CO2 can a single tree absorb per year?', options: ['5 kg', '10 kg', '22 kg', '50 kg'], answer: 2 },
    ],
  },
  {
    id: 'quiz-ocean',
    title: 'Ocean Health Quiz',
    icon: '\uD83C\uDF0A',
    lessonId: 'ocean-health',
    questions: [
      { q: 'How much of Earth\'s oxygen does the ocean produce?', options: ['20%', '35%', '50%', '70%'], answer: 2 },
      { q: 'How many million tonnes of plastic enter the ocean every year?', options: ['1 million', '4 million', '8 million', '20 million'], answer: 2 },
      { q: 'By how much has ocean acidity increased since the Industrial Revolution?', options: ['5%', '13%', '26%', '40%'], answer: 2 },
      { q: 'By 2050, what could outnumber fish in the ocean?', options: ['Jellyfish', 'Seaweed', 'Plastic', 'Coral'], answer: 2 },
    ],
  },
  {
    id: 'quiz-carbon',
    title: 'Carbon Footprint Quiz',
    icon: '\uD83D\uDC63',
    lessonId: 'carbon-footprint',
    questions: [
      { q: 'What is the average annual CO2 emission per Indian citizen?', options: ['0.5 tonnes', '1.9 tonnes', '4.7 tonnes', '8 tonnes'], answer: 1 },
      { q: 'Which has the biggest single-trip carbon impact?', options: ['Driving 1 month', 'A long-haul flight', 'Using AC daily', 'Eating meat weekly'], answer: 1 },
      { q: 'What is the global average CO2 emission per person per year?', options: ['1.5 tonnes', '4.7 tonnes', '8 tonnes', '12 tonnes'], answer: 1 },
      { q: 'What dietary change saves the most CO2 per year?', options: ['Eating less sugar', 'Switching from beef to plant-based protein', 'Reducing dairy', 'Avoiding seafood'], answer: 1 },
    ],
  },
  {
    id: 'quiz-plastic',
    title: 'Plastic Crisis Quiz',
    icon: '\uD83E\uDDF4',
    lessonId: 'plastic-crisis',
    questions: [
      { q: 'What percentage of all plastic ever made has been recycled?', options: ['9%', '25%', '45%', '60%'], answer: 0 },
      { q: 'When did India ban single-use plastics?', options: ['2015', '2018', '2020', '2022'], answer: 3 },
      { q: 'What are microplastics?', options: ['Biodegradable plastics', 'Plastic particles smaller than 5mm', 'Recycled plastic pellets', 'Plastic used in medicine'], answer: 1 },
      { q: 'How many billion metric tonnes of plastic have we produced in total?', options: ['1 billion', '3.5 billion', '8.3 billion', '15 billion'], answer: 2 },
    ],
  },
  {
    id: 'quiz-energy',
    title: 'Renewable Energy Quiz',
    icon: '\u2600\uFE0F',
    lessonId: 'renewable-energy',
    questions: [
      { q: 'What is India\'s renewable energy target by 2030?', options: ['200 GW', '350 GW', '500 GW', '750 GW'], answer: 2 },
      { q: 'What is India\'s current renewable energy capacity (2024)?', options: ['50 GW', '100 GW', '170 GW', '300 GW'], answer: 2 },
      { q: 'LED bulbs use how much less energy than incandescent bulbs?', options: ['25%', '50%', '75%', '90%'], answer: 2 },
      { q: 'What is India\'s global rank in renewable energy capacity?', options: ['1st', '2nd', '4th', '7th'], answer: 2 },
    ],
  },
  {
    id: 'quiz-energy-conservation',
    title: 'Energy Conservation Quiz',
    icon: '🔌',
    lessonId: 'energy-conservation',
    questions: [
      { q: 'What is "vampire power"?', options: ['Solar energy', 'Devices using power on standby', 'Nighttime energy use', 'Energy from batteries'], answer: 1 },
      { q: 'How much of an average home\'s electricity use can standby power account for?', options: ['1%', '5%', '10%', '25%'], answer: 2 },
      { q: 'Which is an energy conservation practice?', options: ['Leaving lights on', 'Washing clothes in hot water', 'Washing clothes in cold water', 'Keeping the fridge open'], answer: 2 },
    ],
  },
  {
    id: 'quiz-circular-economy',
    title: 'Circular Economy Quiz',
    icon: '🔁',
    lessonId: 'circular-economy',
    questions: [
      { q: 'What describes a linear economy?', options: ['Take, make, dispose', 'Reduce, reuse, recycle', 'Design out waste', 'Regenerate nature'], answer: 0 },
      { q: 'What is the fastest-growing waste stream globally?', options: ['Plastic bags', 'Food waste', 'Electronic waste', 'Glass bottles'], answer: 2 },
      { q: 'What does a circular economy aim to do?', options: ['Extract more raw materials', 'Keep materials in use', 'Burn waste for fuel', 'Increase landfill size'], answer: 1 },
    ],
  },
  {
    id: 'quiz-policy',
    title: 'Environmental Policy Quiz',
    icon: '⚖️',
    lessonId: 'environmental-policy',
    questions: [
      { q: 'What did the Montreal Protocol successfully phase out?', options: ['Fossil fuels', 'Single-use plastics', 'Ozone-depleting chemicals', 'Pesticides'], answer: 2 },
      { q: 'What is the main driver of systemic environmental change?', options: ['Recycling at home', 'Strong environmental policies', 'Planting single trees', 'Using less water'], answer: 1 },
      { q: 'Why is understanding policy important?', options: ['To build solar panels', 'To advocate for laws that hold polluters accountable', 'To learn how to compost', 'To measure your carbon footprint'], answer: 1 },
    ],
  },
  {
    id: 'quiz-climate-tech',
    title: 'Climate Tech Quiz',
    icon: '🔬',
    lessonId: 'climate-technology',
    questions: [
      { q: 'What does DAC stand for in climate technology?', options: ['Direct Air Capture', 'Digital Action Climate', 'Dual Air Conditioning', 'Direct Atmospheric Control'], answer: 0 },
      { q: 'Which fuel is seen as key for decarbonizing heavy industries like steel?', options: ['Natural gas', 'Green hydrogen', 'Coal', 'Diesel'], answer: 1 },
      { q: 'Can technology alone solve the climate crisis?', options: ['Yes', 'No, it requires reducing consumption too', 'Yes, if we build enough solar', 'Yes, with AI'], answer: 1 },
    ],
  },
  {
    id: 'quiz-finance',
    title: 'Sustainable Finance Quiz',
    icon: '📈',
    lessonId: 'sustainable-finance',
    questions: [
      { q: 'What does ESG stand for?', options: ['Energy, Solar, Green', 'Environmental, Social, Governance', 'Earth, Sustainability, Growth', 'Ecological Savings Group'], answer: 1 },
      { q: 'How much have the top 60 banks invested in fossil fuels since the Paris Agreement?', options: ['$100 billion', '$1 trillion', '$5.5 trillion', '$10 trillion'], answer: 2 },
      { q: 'How can the financial sector accelerate the green transition?', options: ['By printing more money', 'By directing capital toward green projects', 'By investing in coal', 'By closing all banks'], answer: 1 },
    ],
  },
  {
    id: 'quiz-deforestation',
    title: 'Deforestation Quiz',
    icon: '🪓',
    lessonId: 'deforestation',
    questions: [
      { q: 'How many trees are cut down globally each year?', options: ['1 billion', '5 billion', '10 billion', '15 billion'], answer: 3 },
      { q: 'What is the #1 driver of deforestation worldwide?', options: ['Urban expansion', 'Mining', 'Agriculture', 'Logging'], answer: 2 },
      { q: 'How much CO₂ does the Amazon absorb per year?', options: ['500 million tonnes', '1 billion tonnes', '2 billion tonnes', '5 billion tonnes'], answer: 2 },
      { q: 'Which label indicates wood products come from sustainable forests?', options: ['ISO', 'FSC', 'BIS', 'WHO'], answer: 1 },
    ],
  },
  {
    id: 'quiz-composting',
    title: 'Composting Quiz',
    icon: '🥬',
    lessonId: 'composting',
    questions: [
      { q: 'What temperature can an active compost pile reach?', options: ['20°C', '40°C', '60°C', '100°C'], answer: 2 },
      { q: 'What are the 4 ingredients a compost pile needs?', options: ['Soil, sand, water, light', 'Greens, browns, water, air', 'Food, leaves, worms, soil', 'Nitrogen, oxygen, carbon, heat'], answer: 1 },
      { q: 'What is vermicomposting?', options: ['Composting in a volcano', 'Composting using worms', 'Composting in water', 'Composting with bacteria only'], answer: 1 },
      { q: 'What does finished compost primarily provide to soil?', options: ['More acidity', 'Beneficial microbes and moisture retention', 'More clay', 'Nothing significant'], answer: 1 },
    ],
  },
  {
    id: 'quiz-urban-biodiversity',
    title: 'Urban Biodiversity Quiz',
    icon: '🦔',
    lessonId: 'urban-biodiversity',
    questions: [
      { q: 'Approximately how many bird species have been recorded in Indian cities?', options: ['200', '600', '1300', '3000'], answer: 2 },
      { q: 'What is a "wildlife corridor"?', options: ['A road for animals', 'A strip of habitat connecting fragmented areas', 'A wildlife sanctuary', 'An urban park'], answer: 1 },
      { q: 'How many species can a single mature urban tree support?', options: ['10', '50', '200', '400'], answer: 3 },
      { q: 'Which is a major threat to urban wildlife?', options: ['Too many trees', 'Green rooftops', 'Light pollution and glass buildings', 'Rain gardens'], answer: 2 },
    ],
  },
  {
    id: 'quiz-evs',
    title: 'Electric Vehicles Quiz',
    icon: '⚡',
    lessonId: 'electric-vehicles',
    questions: [
      { q: 'What percentage of electrical energy does an EV convert to movement?', options: ['30%', '50%', '77%', '95%'], answer: 2 },
      { q: 'What is India\'s rank in global automobile markets?', options: ['1st', '2nd', '3rd', '5th'], answer: 2 },
      { q: 'Which government scheme promotes EV adoption in India?', options: ['JAIS-II', 'FAME-II', 'GREEN-I', 'SOLAR-V'], answer: 1 },
      { q: 'What is a petrol car\'s typical energy conversion efficiency?', options: ['5–10%', '12–30%', '50–60%', '70–80%'], answer: 1 },
    ],
  },
  {
    id: 'quiz-light-pollution',
    title: 'Light Pollution Quiz',
    icon: '🌃',
    lessonId: 'light-pollution',
    questions: [
      { q: 'What percentage of the world population lives under light-polluted skies?', options: ['20%', '50%', '65%', '80%'], answer: 3 },
      { q: 'How are sea turtle hatchlings affected by beachfront lights?', options: ['They grow faster', 'They are fatally disoriented', 'They become nocturnal', 'They avoid the beach'], answer: 1 },
      { q: 'What color of LED light is recommended to reduce light pollution?', options: ['Cool white', 'Blue', 'Warm amber', 'Red'], answer: 2 },
      { q: 'What is the main ecological harm of light falling upward into the sky?', options: ['Heating the atmosphere', 'Reducing rainfall', 'Wasting energy & disrupting wildlife', 'Nothing'], answer: 2 },
    ],
  },
  {
    id: 'quiz-food-miles',
    title: 'Food Miles Quiz',
    icon: '🥗',
    lessonId: 'food-miles',
    questions: [
      { q: 'What percentage of global GHG emissions does the food system contribute?', options: ['5%', '12%', '26%', '40%'], answer: 2 },
      { q: 'Which food has the highest carbon footprint?', options: ['Rice', 'Tomatoes', 'Chicken', 'Beef'], answer: 3 },
      { q: 'India is the world\'s largest producer of which food?', options: ['Rice', 'Wheat', 'Pulses (lentils, chickpeas)', 'Sugar'], answer: 2 },
      { q: 'What is the best way to eliminate food miles for a specific ingredient?', options: ['Buy organic', 'Buy imported', 'Grow it at home', 'Buy in bulk'], answer: 2 },
    ],
  },
  {
    id: 'quiz-noise-pollution',
    title: 'Noise Pollution Quiz',
    icon: '🔊',
    lessonId: 'noise-pollution',
    questions: [
      { q: 'At what decibel level does prolonged exposure cause hearing damage?', options: ['40 dB', '55 dB', '70 dB', '90 dB'], answer: 2 },
      { q: 'How does urban noise affect songbirds?', options: ['Makes them sing at lower pitches', 'Makes them sing at higher pitches', 'Makes them stop singing', 'Has no effect'], answer: 1 },
      { q: 'What is the #1 source of noise pollution in Indian cities?', options: ['Factories', 'Airplanes', 'Road traffic', 'Construction'], answer: 2 },
      { q: 'How does ocean noise pollution affect whales?', options: ['Improves their navigation', 'Makes them swim faster', 'Disrupts communication for finding mates and food', 'Helps them avoid ships'], answer: 2 },
    ],
  },
  {
    id: 'quiz-eco-fashion',
    title: 'Eco-Fashion Quiz',
    icon: '👗',
    lessonId: 'eco-fashion',
    questions: [
      { q: 'What % of global carbon emissions does the fashion industry account for?', options: ['2%', '5%', '10%', '20%'], answer: 2 },
      { q: 'How many litres of water does making one pair of jeans require?', options: ['1,000', '3,000', '5,000', '7,500'], answer: 3 },
      { q: 'What are microplastic fibres released from?', options: ['Cotton t-shirts being dried', 'Synthetic fabrics being washed', 'Leather being tanned', 'Wool being sheared'], answer: 1 },
      { q: 'Which Indian fabric is considered one of the most sustainable textiles?', options: ['Silk', 'Denim', 'Polyester', 'Khadi'], answer: 3 },
    ],
  },
  {
    id: 'quiz-groundwater',
    title: 'Groundwater Quiz',
    icon: '🏺',
    lessonId: 'groundwater-crisis',
    questions: [
      { q: 'What percentage of the world\'s fresh water is provided by groundwater?', options: ['5%', '15%', '25%', '50%'], answer: 2 },
      { q: 'Which country is the world\'s largest extractor of groundwater?', options: ['USA', 'China', 'India', 'Brazil'], answer: 2 },
      { q: 'What is a major cause of groundwater level drops?', options: ['Too much rain', 'Over-extraction for agriculture', 'Ocean tides', 'Solar energy'], answer: 1 },
      { q: 'By how much are groundwater levels falling annually in some parts of India?', options: ['1 cm', '10 cm', '1 metre', '10 metres'], answer: 2 },
    ],
  },
  {
    id: 'quiz-rainwater',
    title: 'Rainwater Harvesting Quiz',
    icon: '🌧️',
    lessonId: 'rainwater-harvesting',
    questions: [
      { q: 'Which Indian state was the first to make rainwater harvesting mandatory?', options: ['Maharashtra', 'Tamil Nadu', 'Kerala', 'Karnataka'], answer: 1 },
      { q: 'What is a primary benefit of rainwater harvesting?', options: ['Increases air pollution', 'Recharges groundwater', 'Reduces soil fertility', 'Increases municipal debt'], answer: 1 },
      { q: 'What is the simplest way to collect rainwater?', options: ['A bucket', 'A rain barrel connected to a downspout', 'A large dam', 'A solar panel'], answer: 1 },
      { q: 'Where can harvested rainwater be used directly?', options: ['Gardening', 'Swimming', 'Only for drinking', 'Nowhere'], answer: 0 },
    ],
  },
  {
    id: 'quiz-river',
    title: 'River Rejuvenation Quiz',
    icon: '🛶',
    lessonId: 'river-rejuvenation',
    questions: [
      { q: 'What is a major threat to river health?', options: ['Fish', 'Pollution and over-extraction', 'Clean water', 'Natural rain'], answer: 1 },
      { q: 'What helps prevent riverbank erosion and filters pollutants?', options: ['Concrete walls', 'Planting trees along banks', 'Mining sand', 'Building more bridges'], answer: 1 },
      { q: 'Which Indian programme is dedicated to cleaning the Ganga?', options: ['Green India', 'Clean India', 'Namami Gange', 'Project Tiger'], answer: 2 },
      { q: 'What is required for successful river rejuvenation?', options: ['Only money', 'Community engagement and waste treatment', 'Building more dams', 'Ignoring the pollution'], answer: 1 },
    ],
  },
];

// ── Challenges ─────────────────────────────────────

export const CHALLENGES = [
  { id: 'plant-tree',    icon: '🌳', title: 'Plant a Tree',           desc: 'Plant a sapling in your area and upload proof.',        points: 150, difficulty: 'Medium',   category: 'Nature',  badge: null },
  { id: 'no-plastic',    icon: '🚫', title: 'Plastic-Free Day',       desc: 'Spend an entire day without using single-use plastic.', points: 100, difficulty: 'Easy',    category: 'Waste',   badge: null },
  { id: 'waste-sort',    icon: '🗑️', title: 'Waste Segregation Week', desc: 'Segregate household waste correctly for 7 days.',        points: 200, difficulty: 'Medium',   category: 'Waste',   badge: null },
  { id: 'cycle-day',     icon: '🚴', title: 'Cycle to School',        desc: 'Use a bicycle instead of a motorized vehicle today.',   points: 120, difficulty: 'Easy',    category: 'Energy',  badge: null },
  { id: 'rainwater',     icon: '🌧️', title: 'Rainwater Harvesting',   desc: 'Set up a simple rainwater collector at home.',          points: 180, difficulty: 'Hard',    category: 'Water',   badge: null },
  { id: 'energy-audit',  icon: '💡', title: 'Home Energy Audit',      desc: 'Identify 5 ways to reduce energy usage at home.',       points: 130, difficulty: 'Medium',  category: 'Energy',  badge: null },
  { id: 'eco-art',       icon: '🎨', title: 'Eco Art Project',        desc: 'Create artwork from recycled materials.',               points: 100, difficulty: 'Easy',    category: 'Waste',   badge: null },
  { id: 'cleanup',       icon: '🧹', title: 'Community Cleanup',      desc: 'Organize or join a local area cleanup drive.',          points: 200, difficulty: 'Hard',    category: 'Nature',  badge: null },
];

// ── Certificate Milestones ─────────────────────────────────────

export const CERTIFICATE_MILESTONES = [
  {
    id: 'cert_first_steps',
    title: 'First Steps in Sustainability',
    subtitle: 'Eco Explorer Certificate',
    icon: '🌱',
    color: '#34d364',
    gradient: 'linear-gradient(135deg, #34d364 0%, #00e5c4 100%)',
    condition: (u) => (u?.completedLessons?.length || 0) >= 1,
    description: 'Completed your very first lesson on EcoSpark',
    level: 'Beginner',
  },
  {
    id: 'cert_eco_student',
    title: 'Eco Student',
    subtitle: 'Environmental Learning Certificate',
    icon: '📚',
    color: '#00e5c4',
    gradient: 'linear-gradient(135deg, #00e5c4 0%, #3b82f6 100%)',
    condition: (u) => (u?.completedLessons?.length || 0) >= 5,
    description: 'Completed 5 environmental science lessons',
    level: 'Intermediate',
  },
  {
    id: 'cert_lesson_master',
    title: 'Environmental Education Master',
    subtitle: 'Academic Excellence Certificate',
    icon: '🎓',
    color: '#a78bfa',
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
    condition: (u) => (u?.completedLessons?.length || 0) >= 10,
    description: 'Mastered 10 environmental science lessons',
    level: 'Advanced',
  },
  {
    id: 'cert_eco_warrior',
    title: 'Eco Warrior',
    subtitle: 'Climate Action Certificate',
    icon: '⚔️',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
    condition: (u) => (u?.ecoPoints || 0) >= 500,
    description: 'Earned 500 EcoPoints through sustainable actions',
    level: 'Intermediate',
  },
  {
    id: 'cert_planet_saver',
    title: 'Planet Saver',
    subtitle: 'Sustainability Champion Certificate',
    icon: '🌍',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
    condition: (u) => (u?.ecoPoints || 0) >= 1000,
    description: 'Earned 1000 EcoPoints — a true champion of the planet',
    level: 'Advanced',
  },
  {
    id: 'cert_challenge_hero',
    title: 'Real-World Impact Hero',
    subtitle: 'Community Action Certificate',
    icon: '🏆',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #34d364 100%)',
    condition: (u) => (u?.completedChallenges?.length || 0) >= 3,
    description: 'Completed 3 real-world environmental challenges',
    level: 'Intermediate',
  },
  {
    id: 'cert_quiz_scholar',
    title: 'Environmental Science Scholar',
    subtitle: 'Academic Proficiency Certificate',
    icon: '🧠',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
    condition: (u) => (u?.completedQuizzes?.length || 0) >= 5,
    description: 'Demonstrated knowledge across 5 environmental quizzes',
    level: 'Advanced',
  },
  {
    id: 'cert_eco_legend',
    title: 'Eco Legend',
    subtitle: 'Hall of Fame Certificate',
    icon: '👑',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #f43f5e 50%, #a78bfa 100%)',
    condition: (u) => (u?.ecoPoints || 0) >= 2000,
    description: 'Achieved Legendary status with 2000+ EcoPoints',
    level: 'Legendary',
  },
];

