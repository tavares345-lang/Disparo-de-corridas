
import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { CarIcon, UserIcon, LockIcon, UsersIcon } from './Icons';

interface LoginViewProps {
  onLogin: (user: string | number) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const { state } = useAppState();
  if (!state) return null;

  const [unitNumber, setUnitNumber] = useState('');
  const [driverPassword, setDriverPassword] = useState('');
  const [driverError, setDriverError] = useState('');

  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const [view, setView] = useState<'driver' | 'admin'>('driver');

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
    try {
      if (adminPassword === (state.superAdminPassword || 'Master123')) {
        onLogin('superadmin');
      } else {
        setAdminError('Senha administrativa incorreta.');
      }
    } catch (err) {
      setAdminError('Erro ao processar login. Tente novamente.');
      console.error(err);
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
          {view === 'driver' && (
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
                  className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-amber-500 focus:border-amber-500 text-center text-lg text-white"
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
                  className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-amber-500 focus:border-amber-500 text-center text-lg text-white"
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

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-slate-800 px-2 text-slate-500">Administração</span>
                </div>
              </div>
              
              <button
                  type="button"
                  onClick={() => setView('admin')}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-4 rounded-md transition duration-300 flex items-center justify-center gap-2 shadow-lg"
              >
                  <UsersIcon className="w-6 h-6" />
                  Acesso Administrativo
              </button>
            </form>
          )}

          {view === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
                <h2 className="text-2xl font-bold text-center text-white mb-2">
                    Administrador
                </h2>
                <p className="text-center text-slate-400 text-sm mb-6">
                    Controle total do sistema
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
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:ring-amber-500 focus:border-amber-500 text-center text-lg text-white"
                    required
                    autoFocus
                  />
                </div>
                {adminError && <p className="text-rose-400 text-sm mb-4 text-center">{adminError}</p>}
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-4 rounded-md transition duration-300 flex items-center justify-center gap-2 mb-4 shadow-lg"
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
        <div className="mt-8 text-center">
          <button 
            onClick={() => {
              if (window.confirm('Isso apagará todas as unidades e corridas. Deseja continuar?')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="text-[10px] text-slate-600 hover:text-rose-400 transition-colors uppercase tracking-widest font-bold"
          >
            Resetar Sistema (Uso Técnico)
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
