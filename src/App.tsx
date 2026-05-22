import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { 
  UserProfile, 
  ConsumptionLog, 
  Notification, 
  Goal, 
  View,
  DrinkType 
} from './types';
import LandingPage from './components/LandingPage';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import DrinkTracker from './components/DrinkTracker';
import NotificationCenter from './components/NotificationCenter';
import Analytics from './components/Analytics';
import History from './components/History';
import Goals from './components/Goals';
import Settings from './components/Settings';
import EducationModule from './components/EducationModule';
import { AnimatePresence, motion } from 'motion/react';
import { checkAndUpdateNotifications, playNotificationSound } from './utils/notifications';

const INITIAL_PROFILE: UserProfile = {
  name: '',
  dailyLimit: 400,
  weight: 70,
  sensitivity: 'Medium',
  onboarded: false,
  sleepGoal: 8,
  streak: 0,
  theme: 'light',
  bedtime: '23:00',
  lifestyle: 'Office',
  lastLogDate: null
};

const INITIAL_GOALS: Goal[] = [
  { id: 'sleep', title: 'Sleep First', description: 'Avoid caffeine 8 hours before bedtime', target: 5, current: 0, icon: 'Moon', isCompleted: false },
  { id: 'limit', title: 'Smart Balancer', description: 'Stay under your daily limit', target: 7, current: 0, icon: 'Zap', isCompleted: false },
  { id: 'water', title: 'Hydration Hero', description: 'Drink water after each coffee', target: 10, current: 0, icon: 'Droplets', isCompleted: false },
];

export default function App() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('mycoffee_profile', INITIAL_PROFILE);
  const [logs, setLogs] = useLocalStorage<ConsumptionLog[]>('mycoffee_logs', []);
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('mycoffee_notifications', []);
  const [goals, setGoals] = useLocalStorage<Goal[]>('mycoffee_goals', INITIAL_GOALS);
  const [customDrinks, setCustomDrinks] = useLocalStorage<DrinkType[]>('mycoffee_custom_drinks', []);
  
  const [view, setView] = useState<View>(profile.onboarded ? 'DASHBOARD' : 'LANDING');
  const [showDrinkTracker, setShowDrinkTracker] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  // Rejuvenate dates from local storage
  const activeLogs = useMemo(() => {
    return logs.map(log => ({
      ...log,
      timestamp: new Date(log.timestamp)
    })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [logs]);

  useEffect(() => {
    if (profile.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile.theme]);

  // Periodic notification check
  useEffect(() => {
    if (profile.onboarded) {
      const newNotif = checkAndUpdateNotifications(logs, profile, notifications);
      if (newNotif) {
        setNotifications(prev => [newNotif, ...prev]);
        playNotificationSound();
      }
    }
  }, [logs, profile, notifications]);

  const handleAddLog = useCallback((log: ConsumptionLog) => {
    setLogs(prev => [log, ...prev]);
  }, [setLogs]);

  const handleRemoveLog = useCallback((id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  }, [setLogs]);

  const handleLogWater = useCallback(() => {
    const waterLog: ConsumptionLog = {
      id: Math.random().toString(36).substr(2, 9),
      drinkId: 'water',
      name: 'Glass of Water',
      caffeine: 0,
      timestamp: new Date(),
      size: '250ml'
    };
    setLogs(prev => [waterLog, ...prev]);
  }, [setLogs]);

  const handleRemoveCustomDrink = useCallback((id: string) => {
    setCustomDrinks(prev => prev.filter(d => d.id !== id));
  }, [setCustomDrinks]);

  const handleReset = useCallback(() => {
     setLogs([]);
     setProfile(INITIAL_PROFILE);
     setNotifications([]);
     setGoals(INITIAL_GOALS);
     setCustomDrinks([]);
     setView('LANDING');
  }, [setLogs, setProfile, setNotifications, setGoals, setCustomDrinks, setView]);

  const handleAddCustomDrink = useCallback((d: DrinkType) => {
    setCustomDrinks(prev => [d, ...prev]);
  }, [setCustomDrinks]);

  const handleMarkNotifAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, [setNotifications]);

  const handleClearNotifs = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

  const handleBackToDashboard = useCallback(() => {
    setView('DASHBOARD');
  }, [setView]);

  const handleStartOnboarding = useCallback(() => {
    setView('ONBOARDING');
  }, [setView]);

  const handleOnboardingComplete = useCallback((p: UserProfile) => {
    setProfile(p);
    setView('DASHBOARD');
  }, [setProfile, setView]);

  const handleShowDrinkTracker = useCallback(() => setShowDrinkTracker(true), []);
  const handleHideDrinkTracker = useCallback(() => setShowDrinkTracker(false), []);
  const handleShowNotifs = useCallback(() => setShowNotifs(true), []);
  const handleHideNotifs = useCallback(() => setShowNotifs(false), []);

  return (
    <div className={`min-h-screen transition-colors duration-500 bg-soft-white ${profile.theme === 'dark' ? 'dark bg-espresso text-soft-white' : ''}`}>
      <AnimatePresence mode="wait">
        {view === 'LANDING' && (
          <motion.div key="landing" exit={{ opacity: 0 }}>
            <LandingPage onStart={handleStartOnboarding} onNavigate={setView} />
          </motion.div>
        )}

        {view === 'ONBOARDING' && (
          <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Onboarding onComplete={handleOnboardingComplete} />
          </motion.div>
        )}

        {view === 'DASHBOARD' && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Dashboard 
              logs={activeLogs} 
              profile={profile} 
              onAddDrink={handleShowDrinkTracker}
              onLogWater={handleLogWater}
              onNavigate={setView}
              onToggleNotifs={handleShowNotifs}
              hasUnreadNotifs={notifications.some(n => !n.read)}
            />
          </motion.div>
        )}

        {view === 'ANALYTICS' && (
          <motion.div key="analytics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Analytics logs={activeLogs} profile={profile} onBack={handleBackToDashboard} />
          </motion.div>
        )}

        {view === 'HISTORY' && (
          <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <History logs={activeLogs} onRemoveLog={handleRemoveLog} onBack={handleBackToDashboard} />
          </motion.div>
        )}

        {view === 'GOALS' && (
          <motion.div key="goals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Goals goals={goals} onBack={handleBackToDashboard} />
          </motion.div>
        )}

        {view === 'SETTINGS' && (
          <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Settings 
              profile={profile} 
              customDrinks={customDrinks}
              onUpdate={setProfile} 
              onBack={handleBackToDashboard} 
              onReset={handleReset} 
              onRemoveCustomDrink={handleRemoveCustomDrink}
            />
          </motion.div>
        )}

        {view === 'EDUCATION' && (
          <motion.div key="education" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <EducationModule onBack={handleBackToDashboard} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDrinkTracker && (
          <DrinkTracker 
            onClose={handleHideDrinkTracker} 
            onLog={handleAddLog} 
            customDrinks={customDrinks}
            onAddCustomDrink={handleAddCustomDrink}
          />
        )}

        {showNotifs && (
          <NotificationCenter 
            notifications={notifications}
            onClose={handleHideNotifs}
            onClear={handleClearNotifs}
            onMarkAsRead={handleMarkNotifAsRead}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
