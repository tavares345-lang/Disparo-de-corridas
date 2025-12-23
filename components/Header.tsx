
import React from 'react';
import { Driver } from '../types';
import { CarIcon, UserIcon, LogOutIcon } from './Icons';

interface HeaderProps {
  currentUser: string | number;
  loggedInDriver: Driver | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, loggedInDriver, onLogout }) => {
  const getDisplayName = () => {
    if (currentUser === 'admin') {
      return 'Painel de Administração';
    }
    if (loggedInDriver) {
      return `Olá, ${loggedInDriver.name}`;
    }
    return '';
  };

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10 shadow-md">
      <div className="container mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <CarIcon className="w-8 h-8 text-amber-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Cootramo <span className="text-amber-400">Digital</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-right">
                <UserIcon className="w-5 h-5 text-slate-400 hidden sm:block" />
                <div>
                  <span className="text-slate-100 font-semibold">{getDisplayName()}</span>
                  {loggedInDriver && <span className="text-xs text-slate-400 block sm:inline sm:ml-2">(Un. {loggedInDriver.unitNumber})</span>}
                </div>
            </div>
            <button
                onClick={onLogout}
                className="flex items-center gap-2 bg-slate-700 hover:bg-rose-600/50 text-slate-300 hover:text-rose-300 font-semibold py-2 px-3 rounded-md transition-colors duration-300"
                aria-label="Sair"
            >
                <LogOutIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Sair</span>
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
