
import React, { useState, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import RideCard from './RideCard';
import { RideStatus, Driver } from '../types';
import { PlusCircleIcon, UsersIcon, XCircleIcon, PencilIcon, AlarmClockIcon, LockIcon, RocketIcon, CheckCircleIcon, UserIcon, CarIcon, MegaphoneIcon, BellIcon } from './Icons';

interface EditDriverModalProps {
    driver: Driver;
    onClose: () => void;
    onSave: (driver: Driver) => void;
}

const EditDriverModal: React.FC<EditDriverModalProps> = ({ driver, onClose, onSave }) => {
    const [name, setName] = useState(driver.name);
    const [unitNumber, setUnitNumber] = useState(driver.unitNumber);
    const [vehicleModel, setVehicleModel] = useState(driver.vehicleModel);
    const [password, setPassword] = useState(driver.password || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...driver, name, unitNumber, vehicleModel, password });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-md border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-100">Editar Unidade</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Nome do Motorista</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">Número Unidade</label>
                          <input type="text" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" required />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">Senha de Acesso</label>
                          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500 font-mono" placeholder="Defina a senha" required />
                      </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Modelo do Veículo</label>
                        <input type="text" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" placeholder="Ex: Sedan, SUV" required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                        <button type="button" onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                            Cancelar
                        </button>
                        <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 px-4 rounded-md transition duration-300 shadow-lg">
                            Atualizar Unidade
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface AdminViewProps {
  accessLevel: 'admin' | 'superadmin';
}

const AdminView: React.FC<AdminViewProps> = ({ accessLevel }) => {
  const { state, dispatch } = useAppState();
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [time, setTime] = useState('');
  const [fare, setFare] = useState('');
  const [specificDriverId, setSpecificDriverId] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverUnit, setNewDriverUnit] = useState('');
  const [newDriverVehicle, setNewDriverVehicle] = useState('');
  const [newDriverPassword, setNewDriverPassword] = useState('');

  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date();
        state.rides.forEach(ride => {
            if (ride.status === RideStatus.SCHEDULED && ride.scheduledTime) {
                const [hours, minutes] = ride.scheduledTime.split(':').map(Number);
                const rideCreationDate = new Date(ride.id);
                const potentialDispatchDate = new Date(ride.id);
                potentialDispatchDate.setHours(hours, minutes, 0, 0);
                if (potentialDispatchDate < rideCreationDate) {
                    potentialDispatchDate.setDate(potentialDispatchDate.getDate() + 1);
                }
                if (now >= potentialDispatchDate) {
                    dispatch({ type: 'DISPATCH_SCHEDULED_RIDE', payload: { rideId: ride.id } });
                }
            }
        });
    }, 10000);
    return () => clearInterval(interval);
  }, [state.rides, dispatch]);

  const handleSubmitRide = (e: React.FormEvent) => {
    e.preventDefault();
    if (pickup && destination && time && fare) {
      dispatch({
        type: 'ADD_RIDE',
        payload: {
          pickup,
          destination,
          time,
          fare: parseFloat(fare),
          specificDriverId: specificDriverId ? parseInt(specificDriverId, 10) : undefined,
          scheduledTime: scheduledTime || undefined,
        },
      });
      setPickup('');
      setDestination('');
      setTime('');
      setFare('');
      setSpecificDriverId('');
      setScheduledTime('');
    }
  };

  const handleNotifyDrivers = () => {
    dispatch({ type: 'SEND_ALERT' });
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if(newDriverName && newDriverUnit && newDriverVehicle && newDriverPassword) {
        dispatch({
            type: 'ADD_DRIVER',
            payload: { 
              name: newDriverName, 
              unitNumber: newDriverUnit, 
              vehicleModel: newDriverVehicle, 
              password: newDriverPassword
            }
        });
        setNewDriverName('');
        setNewDriverUnit('');
        setNewDriverVehicle('');
        setNewDriverPassword('');
    }
  };

   const handleEditDriver = (driver: Driver) => {
    dispatch({ type: 'EDIT_DRIVER', payload: driver });
    setEditingDriver(null);
  };

  const handleRemoveDriver = (driverId: number) => {
      if (window.confirm('Tem certeza que deseja excluir permanentemente esta unidade do sistema?')) {
          dispatch({ type: 'REMOVE_DRIVER', payload: { driverId } });
      }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'As senhas não coincidem.' });
      return;
    }
    dispatch({ type: 'CHANGE_ADMIN_PASSWORD', payload: { newPassword } });
    setPasswordStatus({ type: 'success', message: 'Senha administrativa atualizada!' });
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordStatus(null), 3000);
  };

  const ridesByStatus = (status: RideStatus) =>
    state.rides.filter(ride => ride.status === status);

  // CRITICAL: Garantindo que esta constante filtre apenas quem está com turno iniciado
  const availableDrivers = state.drivers
    .filter(d => d.isAvailable)
    .sort((a, b) => a.position - b.position);

  return (
    <>
      {editingDriver && (
        <EditDriverModal 
            driver={editingDriver} 
            onClose={() => setEditingDriver(null)}
            onSave={handleEditDriver}
        />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Nova Corrida */}
          <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <PlusCircleIcon className="w-7 h-7 text-amber-400" />
              Publicar Chamado
            </h2>
            <form onSubmit={handleSubmitRide} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Local de Embarque</label>
                <input type="text" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Rua, Número, Bairro" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Destino Final</label>
                <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Rua, Número, Bairro" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Hora de Saída</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Valor Estimado (R$)</label>
                  <input type="number" value={fare} onChange={(e) => setFare(e.target.value)} step="0.01" placeholder="0,00" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500 font-bold text-amber-400" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Direcionar para Unidade</label>
                 <select value={specificDriverId} onChange={(e) => setSpecificDriverId(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500">
                    <option value="">Fila Automática (Próximo Disponível)</option>
                    {state.drivers.map(d => (
                        <option key={d.id} value={d.id}>
                            Un. {d.unitNumber} - {d.name} {d.isAvailable ? '(ONLINE)' : '(OFFLINE)'}
                        </option>
                    ))}
                 </select>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-black py-3 px-4 rounded-md transition duration-300 shadow-lg">
                  LANÇAR CORRIDA
                </button>
                <button 
                  type="button" 
                  onClick={handleNotifyDrivers}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-amber-400 font-bold py-2 px-4 rounded-md border border-amber-500/30 transition duration-300 flex items-center justify-center gap-2"
                >
                  <MegaphoneIcon className="w-5 h-5" />
                  Notificar Todos Online
                </button>
              </div>
            </form>
          </div>

          {/* Gestão de Unidades */}
          <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <UsersIcon className="w-6 h-6 text-sky-400" />
                  Gerenciar Unidades
              </h2>
              <form onSubmit={handleAddDriver} className="space-y-3 mb-6">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Nova Unidade</p>
                  <input type="text" value={newDriverName} onChange={(e) => setNewDriverName(e.target.value)} placeholder="Nome do Motorista" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm" required />
                  <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={newDriverUnit} onChange={(e) => setNewDriverUnit(e.target.value)} placeholder="Unidade (Ex: 105)" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm" required />
                      <input type="text" value={newDriverPassword} onChange={(e) => setNewDriverPassword(e.target.value)} placeholder="Senha Unidade" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm font-mono" required />
                  </div>
                   <input type="text" value={newDriverVehicle} onChange={(e) => setNewDriverVehicle(e.target.value)} placeholder="Veículo (Ex: Toyota Corolla)" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm" required />
                  <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 text-sm shadow-md">
                      Cadastrar Motorista
                  </button>
              </form>

              <h3 className="text-[10px] font-bold mb-3 text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-1">Lista Geral de Unidades</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {state.drivers.sort((a,b) => a.position - b.position).map(driver => (
                      <div key={driver.id} className="flex items-center justify-between bg-slate-700/40 p-3 rounded-md border border-slate-600/50 hover:bg-slate-700/60 transition-colors">
                          <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${driver.isAvailable ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                              <div>
                                  <p className="font-bold text-slate-100 text-sm">Un. {driver.unitNumber} <span className="text-[10px] font-normal text-slate-500 ml-1">#{driver.position}</span></p>
                                  <p className="text-[10px] text-slate-400 truncate w-24">{driver.name}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-1">
                              <button onClick={() => setEditingDriver(driver)} className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors" title="Editar">
                                  <PencilIcon className="w-4 h-4"/>
                              </button>
                              <button onClick={() => handleRemoveDriver(driver.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors" title="Remover">
                                  <XCircleIcon className="w-4 h-4"/>
                              </button>
                          </div>
                      </div>
                  ))}
              </div>

              {accessLevel === 'superadmin' && (
                <div className="mt-8 pt-6 border-t border-slate-700">
                    <h3 className="text-xs font-bold text-slate-300 mb-4 flex items-center gap-2">
                        <LockIcon className="w-3.5 h-3.5 text-amber-400" />
                        SEGURANÇA DO PAINEL
                    </h3>
                    <form onSubmit={handleChangePassword} className="space-y-3">
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova Senha Administrativa" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-xs" required />
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar Senha" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-xs" required />
                        {passwordStatus && <p className="text-[10px] text-emerald-400">{passwordStatus.message}</p>}
                        <button type="submit" className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 rounded-md transition duration-300 text-[10px]">
                            ATUALIZAR SENHA MASTER
                        </button>
                    </form>
                </div>
              )}
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          {/* Monitoramento da Frota Disponível - CRITICAL: usa availableDrivers (filtrado) */}
          <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <UsersIcon className="w-6 h-6 text-emerald-400" />
                Frota Disponível (Fila Online)
              </h2>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-bold border border-emerald-500/20">
                {availableDrivers.length} ATIVOS NO MOMENTO
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {availableDrivers.map((driver, idx) => (
                <div 
                  key={driver.id} 
                  className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all duration-300 group ${
                    idx === 0 
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                      : 'bg-slate-700/30 border-slate-600/50 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${idx === 0 ? 'bg-emerald-500 text-slate-900' : 'bg-slate-600 text-slate-300'}`}>
                      {idx + 1}º
                    </span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <span className="text-lg font-black text-white group-hover:scale-110 transition-transform">Un. {driver.unitNumber}</span>
                  <span className="text-[9px] text-slate-500 truncate w-full text-center uppercase tracking-tighter mt-1">
                    {driver.name.split(' ')[0]}
                  </span>
                </div>
              ))}
              {availableDrivers.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/20">
                  <div className="bg-slate-700/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserIcon className="w-6 h-6 text-slate-500" />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Nenhuma unidade online no momento.</p>
                  <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-widest">Aguardando motoristas iniciarem turno</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-white border-b border-slate-700 pb-2 flex items-center gap-3">
                <CarIcon className="w-8 h-8 text-amber-400" />
                Painel de Operações
            </h2>
            
            <div className="space-y-10">
              <div>
                <h3 className="text-sm font-black mb-4 text-purple-400 flex items-center gap-2 uppercase tracking-widest">
                    <AlarmClockIcon className="w-5 h-5"/>
                    Próximos Agendamentos ({ridesByStatus(RideStatus.SCHEDULED).length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ridesByStatus(RideStatus.SCHEDULED).map(ride => (
                    <RideCard key={ride.id} ride={ride} />
                  ))}
                  {ridesByStatus(RideStatus.SCHEDULED).length === 0 && <p className="text-slate-600 italic text-sm py-4">Sem corridas programadas.</p>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black mb-4 text-amber-400 flex items-center gap-2 uppercase tracking-widest">
                    <BellIcon className="w-5 h-5"/>
                    Chamados Pendentes ({ridesByStatus(RideStatus.WAITING).length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ridesByStatus(RideStatus.WAITING).map(ride => (
                    <RideCard key={ride.id} ride={ride} />
                  ))}
                  {ridesByStatus(RideStatus.WAITING).length === 0 && <p className="text-slate-600 italic text-sm py-4">Nenhum chamado pendente de aceite.</p>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black mb-4 text-sky-400 flex items-center gap-2 uppercase tracking-widest">
                    <RocketIcon className="w-5 h-5"/>
                    Em Atendimento ({ridesByStatus(RideStatus.IN_PROGRESS).length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ridesByStatus(RideStatus.IN_PROGRESS).map(ride => (
                    <RideCard key={ride.id} ride={ride} />
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-700/50">
                <h3 className="text-sm font-black mb-4 text-emerald-500 flex items-center gap-2 uppercase tracking-widest">
                    <CheckCircleIcon className="w-5 h-5"/>
                    Finalizadas Recentemente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60 hover:opacity-100 transition-opacity">
                  {ridesByStatus(RideStatus.COMPLETED).slice(0, 4).map(ride => (
                    <RideCard key={ride.id} ride={ride} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminView;
