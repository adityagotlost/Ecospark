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
  { id: 'first_leaf',    icon: '🌱', name: 'First Leaf',      desc: 'Complete your first lesson',             color: '#34d364', condition: u => u.completedLessons?.length >= 1 },
  { id: 'eco_warrior',   icon: '⚔️',  name: 'Eco Warrior',    desc: 'Earn 500 eco-points',                    color: '#00e5c4', condition: u => u.ecoPoints >= 500 },
  { id: 'quiz_master',   icon: '🧠', name: 'Quiz Master',     desc: 'Complete 3 quizzes',                     color: '#a78bfa', condition: u => u.completedQuizzes?.length >= 3 },
  { id: 'challenger',    icon: '🏆', name: 'Challenger',      desc: 'Complete 3 real-world challenges',       color: '#ffd700', condition: u => u.completedChallenges?.length >= 3 },
  { id: 'green_thumb',   icon: '🌿', name: 'Green Thumb',     desc: 'Complete 5 lessons',                     color: '#4ade80', condition: u => u.completedLessons?.length >= 5 },
  { id: 'planet_saver',  icon: '🌍', name: 'Planet Saver',    desc: 'Earn 1000 eco-points',                   color: '#f97316', condition: u => u.ecoPoints >= 1000 },
  { id: 'streak_7',      icon: '🔥', name: 'On Fire!',        desc: 'Maintain a 7-day streak',                color: '#ef4444', condition: u => u.streak >= 7 },
  { id: 'all_rounder',   icon: '🌟', name: 'All Rounder',     desc: 'Complete a lesson, quiz and challenge',  color: '#fbbf24', condition: u => u.completedLessons?.length >= 1 && u.completedQuizzes?.length >= 1 && u.completedChallenges?.length >= 1 },
  { id: 'biodiversity',  icon: '🦋', name: 'Biodiversity Fan','desc': 'Complete the biodiversity lesson',     color: '#60a5fa', condition: u => u.completedLessons?.includes('biodiversity') },
  { id: 'solar_champ',   icon: '☀️',  name: 'Solar Champion',  desc: 'Complete the renewable energy lesson',   color: '#facc15', condition: u => u.completedLessons?.includes('renewable-energy') },
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
    icon: '🦋',
    lessonId: 'biodiversity',
    questions: [
      { q: 'What percentage of the world\'s tigers are in India?', options: ['30%', '50%', '70%', '90%'], answer: 2 },
      { q: 'India is one of how many megadiverse countries?', options: ['5', '10', '17', '25'], answer: 2 },
      { q: 'What percentage of India\'s mammal species are threatened?', options: ['5%', '10%', '21%', '40%'], answer: 2 },
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
