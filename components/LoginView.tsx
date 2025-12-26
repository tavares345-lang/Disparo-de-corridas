
import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { CarIcon, UserIcon, LockIcon, UsersIcon } from './Icons';

interface LoginViewProps {
  onLogin: (user: string | number) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const { state } = useAppState();
  const [unitNumber, setUnitNumber] = useState('');
  const [driverPassword, setDriverPassword] = useState('');
  const [driverError, setDriverError] = useState('');

  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const [view, setView] = useState<'driver' | 'admin' | 'super'>('driver');

  const handleDriverLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber || !driverPassword) {
      setDriverError('Por favor, insira unidade e senha.');
      return;
    }

    const driver = state.drivers.find(d => d.unitNumber === unitNumber.trim());
    if (driver) {
      if (driver.password === driverPassword) {
        onLogin(driver.id);
      } else {
        setDriverError('Senha incorreta para esta unidade.');
      }
    } else {
      setDriverError('Unidade não encontrada. Verifique o número.');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (view === 'admin') {
        if (adminPassword === state.adminPassword) {
            onLogin('admin');
        } else {
            setAdminError('Senha incorreta. Tente novamente.');
        }
    } else {
        if (adminPassword === state.superAdminPassword) {
            onLogin('superadmin');
        } else {
            setAdminError('Senha do Administrador Geral incorreta.');
        }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <CarIcon className="w-16 h-16 text-amber-400 mx-auto" />
          <h1 className="text-4xl font-bold text-white tracking-tight mt-4">
            Cootramo <span className="text-amber-400">Digital</span>
          </h1>
          <p className="text-slate-400 mt-2">Gestão inteligente de corridas.</p>
        </div>
        
        <div className="bg-slate-800 rounded-lg shadow-lg p-8">
          {view === 'driver' ? (
            <>
              <form onSubmit={handleDriverLogin} className="space-y-4">
                <h2 className="text-2xl font-bold text-center text-white mb-6">Acesso Unidade</h2>
                <div>
                  <label htmlFor="unitNumber" className="block text-sm font-medium text-slate-300 mb-1">
                    Número da Unidade
                  </label>
                  <input
                    id="unitNumber"
                    type="text"
                    value={unitNumber}
                    onChange={(e) => {
                      setUnitNumber(e.target.value);
                      setDriverError('');
                    }}
                    placeholder="Ex: 101"
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-amber-500 focus:border-amber-500 text-center text-lg"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="driverPassword" className="block text-sm font-medium text-slate-300 mb-1">
                    Senha da Unidade
                  </label>
                  <input
                    id="driverPassword"
                    type="password"
                    value={driverPassword}
                    onChange={(e) => {
                      setDriverPassword(e.target.value);
                      setDriverError('');
                    }}
                    placeholder="••••••"
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-amber-500 focus:border-amber-500 text-center text-lg"
                    required
                  />
                </div>
                {driverError && <p className="text-rose-400 text-sm mb-2 text-center">{driverError}</p>}
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-4 rounded-md transition duration-300 flex items-center justify-center gap-2"
                >
                  <UserIcon className="w-5 h-5" />
                  Acessar Painel
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-slate-800 px-2 text-slate-500">Administração</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <button
                    onClick={() => setView('admin')}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-md transition duration-300"
                >
                    Operador Administrativo
                </button>
                <button
                    onClick={() => setView('super')}
                    className="w-full bg-slate-700 hover:bg-sky-600/20 text-sky-400 font-bold py-3 px-4 rounded-md border border-sky-600/30 transition duration-300 flex items-center justify-center gap-2"
                >
                    <UsersIcon className="w-5 h-5" />
                    Administrador Geral
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleAdminLogin}>
                <h2 className="text-2xl font-bold text-center text-white mb-2">
                    {view === 'admin' ? 'Administração' : 'Administrador Geral'}
                </h2>
                <p className="text-center text-slate-400 text-sm mb-6">
                    {view === 'admin' ? 'Acesso operacional' : 'Controle total do sistema'}
                </p>
                 <div className="mb-4">
                  <label htmlFor="adminPassword" className="block text-sm font-medium text-slate-300 mb-2">
                    Senha de Acesso
                  </label>
                  <input
                    id="adminPassword"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setAdminError('');
                    }}
                    placeholder="••••••••"
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-amber-500 focus:border-amber-500 text-center text-lg"
                    required
                    autoFocus
                  />
                </div>
                {adminError && <p className="text-rose-400 text-sm mb-4 text-center">{adminError}</p>}
                <button
                  type="submit"
                  className={`w-full ${view === 'admin' ? 'bg-sky-600 hover:bg-sky-700' : 'bg-sky-500 hover:bg-sky-600'} text-white font-bold py-3 px-4 rounded-md transition duration-300 flex items-center justify-center gap-2 mb-4 shadow-lg`}
                >
                  <LockIcon className="w-5 h-5" />
                  Entrar no Painel
                </button>
                 <button
                    type="button"
                    onClick={() => {
                        setView('driver');
                        setAdminError('');
                        setAdminPassword('');
                    }}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                >
                    Voltar
                </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginView;
