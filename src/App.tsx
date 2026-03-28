import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FoodProvider } from './contexts/FoodContext';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [onboarded, setOnboarded] = useState(false);

  if (loading) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg animate-pulse"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            N
          </div>
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Show onboarding if user hasn't set up profile yet
  // In demo mode, we check the onboarded state
  // In prod, we'd check if profile has required fields
  const needsOnboarding = !onboarded && !user.age;

  if (needsOnboarding) {
    return <OnboardingPage onComplete={() => setOnboarded(true)} />;
  }

  return (
    <FoodProvider>
      <DashboardPage />
    </FoodProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
