// Central data store using localStorage
// ================================================

const STORAGE_KEYS = {
  USER: 'ecospark_user',
  USERS_DB: 'ecospark_users_db',
  COMPLETED_LESSONS: 'ecospark_lessons',
  COMPLETED_CHALLENGES: 'ecospark_challenges',
  COMPLETED_QUIZZES: 'ecospark_quizzes',
  BADGES: 'ecospark_badges',
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
  const diffDays = Math.floor((today - lastLogin) / 86400000);
  if (diffDays === 1) user.streak += 1;
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
  { id: 'plastic_free',   icon: '\uD83E\uDDF4', name: 'Plastic Free',     desc: 'Complete the plastic crisis lesson',       color: '#ec4899', condition: u => u.completedLessons?.includes('plastic-crisis') },
  { id: 'soil_keeper',    icon: '\uD83E\uDEB1', name: 'Soil Keeper',      desc: 'Complete the soil health lesson',          color: '#92400e', condition: u => u.completedLessons?.includes('soil-health') },
  { id: 'city_builder',   icon: '\uD83C\uDFD9\uFE0F', name: 'City Builder', desc: 'Complete the Building Green Cities lesson', color: '#10b981', condition: u => u.completedLessons?.includes('green-cities') },
  { id: 'sdg_hero',       icon: '\uD83C\uDFAF', name: 'SDG Hero',         desc: 'Complete the Climate Action SDG lesson',   color: '#6366f1', condition: u => u.completedLessons?.includes('climate-action') },
  { id: 'carbon_tracker', icon: '\uD83D\uDC63', name: 'Carbon Tracker',   desc: 'Complete the carbon footprint lesson',     color: '#f97316', condition: u => u.completedLessons?.includes('carbon-footprint') },
  { id: 'quiz_ace',       icon: '\uD83E\uDD47', name: 'Quiz Ace',          desc: 'Complete 6 quizzes',                       color: '#adff2f', condition: u => u.completedQuizzes?.length >= 6 },
  { id: 'lesson_legend',  icon: '\uD83D\uDCDA', name: 'Lesson Legend',    desc: 'Complete 10 lessons',                      color: '#c084fc', condition: u => u.completedLessons?.length >= 10 },
  { id: 'eco_champion',   icon: '\uD83E\uDD8D', name: 'Eco Champion',     desc: 'Earn 2500 EcoPoints',                      color: '#adff2f', condition: u => u.ecoPoints >= 2500 },
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
    badges: u.badges?.length || 0,
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
    duration: '10 min',
    points: 50,
    color: '#ef4444',
    content: [
      { type: 'text', body: 'Climate change refers to long-term shifts in global temperatures and weather patterns. While natural factors play a role, human activities—burning fossil fuels, deforestation—have been the main driver since the 1800s.' },
      { type: 'fact', body: '🌡️ The Earth has warmed by about 1.1°C since pre-industrial times. Even 0.5°C more could be devastating.' },
      { type: 'text', body: 'Greenhouse gases like CO₂ and methane trap heat in the atmosphere, causing the planet to warm—similar to how a car heats up in the sun.' },
      { type: 'fact', body: '📊 India is the 3rd largest emitter of CO₂ globally, yet contributes only 7% of global emissions per capita.' },
    ],
  },
  {
    id: 'waste-segregation',
    title: 'Waste Segregation',
    icon: '♻️',
    category: 'Waste',
    difficulty: 'Beginner',
    duration: '8 min',
    points: 50,
    color: '#22c55e',
    content: [
      { type: 'text', body: 'India generates 62 million tonnes of waste annually, of which only 43 million tonnes are collected. Proper segregation at source is the first step to responsible waste management.' },
      { type: 'fact', body: '🗑️ Wet waste (organic): 55% | Dry waste (recyclable): 25% | Hazardous: 5% | Others: 15%' },
      { type: 'text', body: 'Segregate into: Green bin (wet/organic), Blue bin (dry/recyclable), Red bin (hazardous). This simple act reduces landfill burden dramatically.' },
    ],
  },
  {
    id: 'water-conservation',
    title: 'Water Conservation',
    icon: '💧',
    category: 'Water',
    difficulty: 'Beginner',
    duration: '9 min',
    points: 50,
    color: '#3b82f6',
    content: [
      { type: 'text', body: 'India faces a severe water crisis—600 million people face high to extreme water stress. Groundwater is being used 3× faster than it can replenish.' },
      { type: 'fact', body: '💧 Fixing a leaky tap can save 15 litres/day. A 5-minute shower uses 60L; a bath uses 150L.' },
      { type: 'text', body: 'Simple acts: turn off taps, harvest rainwater, use drip irrigation, and reuse greywater for plants.' },
    ],
  },
  {
    id: 'biodiversity',
    title: 'Biodiversity & Ecosystems',
    icon: '🦋',
    category: 'Ecology',
    difficulty: 'Intermediate',
    duration: '12 min',
    points: 60,
    color: '#8b5cf6',
    content: [
      { type: 'text', body: 'India is one of the 17 megadiverse countries, home to over 7.6% of all mammal species and 12.6% of all bird species on Earth.' },
      { type: 'fact', body: '🐅 India has 70% of the world\'s tigers. Yet, 21% of its mammal species are threatened with extinction.' },
      { type: 'text', body: 'Biodiversity loss disrupts food chains, reduces crop yields, and can trigger disease outbreaks—affecting human health directly.' },
    ],
  },
  {
    id: 'renewable-energy',
    title: 'Renewable Energy',
    icon: '☀️',
    category: 'Energy',
    difficulty: 'Intermediate',
    duration: '11 min',
    points: 60,
    color: '#f59e0b',
    content: [
      { type: 'text', body: 'India has the 4th largest renewable energy capacity in the world! Solar, wind, hydro, and biomass energy are India\'s green future.' },
      { type: 'fact', body: '☀️ India\'s target: 500 GW of renewable energy by 2030. Current capacity: ~170 GW (2024).' },
      { type: 'text', body: 'Even at home: switch to LED bulbs (use 75% less energy), unplug devices on standby, and opt for green energy providers.' },
    ],
  },
  {
    id: 'sustainable-agriculture',
    title: 'Sustainable Agriculture',
    icon: '🌾',
    category: 'Food',
    difficulty: 'Advanced',
    duration: '14 min',
    points: 70,
    color: '#84cc16',
    content: [
      { type: 'text', body: 'Agriculture uses 70% of freshwater worldwide and contributes 24% of greenhouse gas emissions. Sustainable farming can reverse these impacts.' },
      { type: 'fact', body: '🌾 Organic farming can increase crop yields by 20-30% in developing countries while reducing chemical use dramatically.' },
    ],
  },
  {
    id: 'air-pollution',
    title: 'Air Pollution & Your Health',
    icon: '🌫️',
    category: 'Climate',
    difficulty: 'Beginner',
    duration: '10 min',
    points: 50,
    color: '#94a3b8',
    content: [
      { type: 'text', body: 'Air pollution is now the leading environmental cause of disease. India has 14 of the world\'s 20 most polluted cities. Fine particulate matter (PM2.5) penetrates deep into lungs and enters the bloodstream.' },
      { type: 'fact', body: '\uD83C\uDFE5 Air pollution causes ~1.67 million deaths in India annually - more than any other environmental risk factor.' },
      { type: 'text', body: 'Sources: vehicle exhaust, industrial emissions, crop burning, and construction dust. Solutions include electric vehicles, clean cooking fuels, and urban tree planting.' },
      { type: 'fact', body: '\uD83C\uDF33 A single tree can absorb up to 22 kg of CO2 per year and filter up to 100 grams of dust from the air.' },
    ],
  },
  {
    id: 'ocean-health',
    title: 'Our Oceans in Crisis',
    icon: '🌊',
    category: 'Ecology',
    difficulty: 'Intermediate',
    duration: '12 min',
    points: 60,
    color: '#0ea5e9',
    content: [
      { type: 'text', body: 'The ocean covers 71% of Earth and produces 50% of the oxygen we breathe. Yet over 8 million tonnes of plastic enter the ocean every year - the equivalent of dumping a garbage truck of plastic every minute.' },
      { type: 'fact', body: '\uD83D\uDC22 By 2050, there could be more plastic in the ocean than fish by weight if we don\'t act now.' },
      { type: 'text', body: 'Ocean acidification - caused by CO2 absorption - has increased ocean acidity by 26% since the Industrial Revolution, threatening coral reefs and shellfish worldwide.' },
      { type: 'fact', body: '\uD83E\uDEB8 India\'s Lakshadweep coral reefs are among the most biodiverse in the world, but are bleaching rapidly due to warming seas.' },
    ],
  },
  {
    id: 'carbon-footprint',
    title: 'Understanding Your Carbon Footprint',
    icon: '👣',
    category: 'Climate',
    difficulty: 'Intermediate',
    duration: '11 min',
    points: 60,
    color: '#f97316',
    content: [
      { type: 'text', body: 'A carbon footprint is the total greenhouse gas emissions caused by an individual, event, organization, or product. Understanding yours is the first step to reducing it.' },
      { type: 'fact', body: '✈️ A single long-haul flight generates more CO₂ than a month of daily car commuting. Flying less is one of the highest-impact choices you can make.' },
      { type: 'text', body: 'The average Indian emits ~1.9 tonnes of CO₂ per year — far below the global average of 4.7, but cities like Delhi and Mumbai are rising fast.' },
      { type: 'fact', body: '🥩 Switching from beef to plant-based protein for one year saves more CO₂ than giving up your car for the same period.' },
    ],
  },
  {
    id: 'plastic-crisis',
    title: 'The Plastic Crisis',
    icon: '🧴',
    category: 'Waste',
    difficulty: 'Beginner',
    duration: '9 min',
    points: 50,
    color: '#ec4899',
    content: [
      { type: 'text', body: 'Plastic was invented in 1907. Since then, we have produced over 8.3 billion metric tonnes of plastic — 91% of which has never been recycled.' },
      { type: 'fact', body: '🧴 India banned single-use plastics in 2022, targeting straws, cutlery, plates, cups, and packaging below 75 microns.' },
      { type: 'text', body: 'Microplastics — particles smaller than 5mm — are now found in human blood, lungs, and even breast milk. Reducing plastic use protects your health, not just the environment.' },
      { type: 'fact', body: '♻️ Only 9% of all plastic ever made has been recycled. 12% has been incinerated. The other 79% is in landfills or the environment.' },
    ],
  },
  {
    id: 'soil-health',
    title: 'Soil: The Living Foundation',
    icon: '🪱',
    category: 'Food',
    difficulty: 'Intermediate',
    duration: '13 min',
    points: 65,
    color: '#92400e',
    content: [
      { type: 'text', body: 'Soil is not just dirt — it is a living ecosystem teeming with bacteria, fungi, and millions of organisms. One teaspoon of healthy soil contains more microorganisms than there are humans on Earth.' },
      { type: 'fact', body: '⚠️ India loses approximately 5.3 billion tonnes of topsoil annually to erosion caused by overfarming, deforestation, and poor land management.' },
      { type: 'text', body: 'Healthy soil sequesters carbon, filters water, and grows food. Composting kitchen waste, avoiding chemical fertilizers, and practicing crop rotation all help restore soil health.' },
      { type: 'fact', body: '🌱 Cover cropping — growing plants specifically to improve soil — can increase organic matter by 1-2% over five years, dramatically improving fertility.' },
    ],
  },
  {
    id: 'green-cities',
    title: 'Building Green Cities',
    icon: '🏙️',
    category: 'Energy',
    difficulty: 'Advanced',
    duration: '15 min',
    points: 75,
    color: '#10b981',
    content: [
      { type: 'text', body: 'Cities consume 78% of the world\'s energy and produce 60% of greenhouse gas emissions, yet cover only 3% of Earth\'s surface. How we design cities will define climate outcomes.' },
      { type: 'fact', body: '🚇 A single metro train replaces ~600 cars on the road. Mumbai Metro reduces 250,000 tonnes of CO₂ annually.' },
      { type: 'text', body: 'Green building principles: natural ventilation, solar panels on rooftops, rainwater harvesting, green roofs, and passive cooling reduce energy demand by 30-70%.' },
      { type: 'fact', body: '🌳 Urban forests (miyawaki forests) grow 10× faster than natural forests and are 30× denser — perfect for Indian cities with limited land.' },
    ],
  },
  {
    id: 'climate-action',
    title: 'SDG 13: Climate Action',
    icon: '🎯',
    category: 'Climate',
    difficulty: 'Advanced',
    duration: '15 min',
    points: 80,
    color: '#6366f1',
    content: [
      { type: 'text', body: 'The UN Sustainable Development Goal 13 calls for urgent action to combat climate change and its impacts. India has pledged to achieve net-zero emissions by 2070.' },
      { type: 'fact', body: '🇮🇳 India has already achieved 43% of its electricity capacity from non-fossil fuel sources — ahead of its 2030 Nationally Determined Contribution target.' },
      { type: 'text', body: 'Individual and community action matters: carbon offsetting, advocacy, lifestyle changes, and supporting climate-conscious businesses all contribute to SDG 13.' },
      { type: 'fact', body: '🌏 The Paris Agreement targets limiting global warming to 1.5°C. Every 0.1°C above this threshold means millions more people exposed to extreme heat and flooding.' },
      { type: 'text', body: 'Youth climate movements like Fridays for Future have directly influenced national policies. You have the power to drive change through awareness and action.' },
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
