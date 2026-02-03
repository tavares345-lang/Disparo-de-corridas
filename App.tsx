
import React, { useState } from 'react';
import { AppStateProvider, useAppState } from './hooks/useAppState';
import AdminView from './components/AdminView';
import DriverView from './components/DriverView';
import Header from './components/Header';
import LoginView from './components/LoginView';
import { Driver } from './types';
import { RocketIcon } from './components/Icons';

const AppContent: React.FC = () => {
  const { state } = useAppState();
  const [currentUser, setCurrentUser] = useState<string | number | null>(null);

  // Se o estado ainda não foi carregado do localStorage, exibe tela de carregamento
  if (!state._isHydrated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <RocketIcon className="w-16 h-16 text-amber-400 animate-bounce mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Cootramo Digital</h1>
        <p className="text-slate-400 animate-pulse">Sincronizando banco de dados...</p>
      </div>
    );
  }

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
        {(currentUser === 'admin' || currentUser === 'superadmin') ? (
          <AdminView accessLevel={currentUser as any} />
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
