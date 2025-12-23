
import React, { useState } from 'react';
import { AppStateProvider, useAppState } from './hooks/useAppState';
import AdminView from './components/AdminView';
import DriverView from './components/DriverView';
import Header from './components/Header';
import LoginView from './components/LoginView';
import { Driver } from './types';

const AppContent: React.FC = () => {
  const { state } = useAppState();
  const [currentUser, setCurrentUser] = useState<string | number | null>(null);

  const loggedInDriver: Driver | null =
    typeof currentUser === 'number'
      ? state.drivers.find(d => d.id === currentUser) || null
      : null;

  if (!currentUser) {
    return <LoginView onLogin={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        currentUser={currentUser}
        loggedInDriver={loggedInDriver}
        onLogout={() => setCurrentUser(null)}
      />
      <main className="flex-grow container mx-auto p-4 md:p-6">
        {currentUser === 'admin' ? (
          <AdminView />
        ) : (
          loggedInDriver && <DriverView driver={loggedInDriver} />
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
};

export default App;
