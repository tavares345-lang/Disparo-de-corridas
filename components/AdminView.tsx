
import React, { useState, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import RideCard from './RideCard';
import { RideStatus, Driver } from '../types';
import { PlusCircleIcon, UsersIcon, XCircleIcon, PencilIcon, AlarmClockIcon, LockIcon } from './Icons';

interface EditDriverModalProps {
    driver: Driver;
    onClose: () => void;
    onSave: (driver: Driver) => void;
}

const EditDriverModal: React.FC<EditDriverModalProps> = ({ driver, onClose, onSave }) => {
    const [name, setName] = useState(driver.name);
    const [unitNumber, setUnitNumber] = useState(driver.unitNumber);
    const [vehicleModel, setVehicleModel] = useState(driver.vehicleModel);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...driver, name, unitNumber, vehicleModel });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-md border border-slate-700">
                <h2 className="text-2xl font-bold mb-4">Editar Motorista</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Nome</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Unidade</label>
                        <input type="text" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Modelo do Veículo</label>
                        <input type="text" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" placeholder="Ex: Sedan, SUV" required />
                    </div>
                    <div className="flex justify-end gap-4 pt-2">
                        <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                            Cancelar
                        </button>
                        <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 px-4 rounded-md transition duration-300">
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminView: React.FC = () => {
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

  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Password Change State
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

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if(newDriverName && newDriverUnit && newDriverVehicle) {
        dispatch({
            type: 'ADD_DRIVER',
            payload: { name: newDriverName, unitNumber: newDriverUnit, vehicleModel: newDriverVehicle }
        });
        setNewDriverName('');
        setNewDriverUnit('');
        setNewDriverVehicle('');
    }
  };

   const handleEditDriver = (driver: Driver) => {
    dispatch({ type: 'EDIT_DRIVER', payload: driver });
    setEditingDriver(null);
  };

  const handleRemoveDriver = (driverId: number) => {
      if (window.confirm('Tem certeza que deseja remover este motorista? As corridas em andamento ou oferecidas a ele serão retornadas à fila.')) {
          dispatch({ type: 'REMOVE_DRIVER', payload: { driverId } });
      }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'As senhas não coincidem.' });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordStatus({ type: 'error', message: 'A senha deve ter pelo menos 4 caracteres.' });
      return;
    }
    dispatch({ type: 'CHANGE_ADMIN_PASSWORD', payload: { newPassword } });
    setPasswordStatus({ type: 'success', message: 'Senha alterada com sucesso!' });
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordStatus(null), 3000);
  };

  const ridesByStatus = (status: RideStatus) =>
    state.rides.filter(ride => ride.status === status);

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
          <div className="bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <PlusCircleIcon className="w-7 h-7 text-amber-400" />
              Nova Corrida
            </h2>
            <form onSubmit={handleSubmitRide} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Embarque</label>
                <input type="text" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Ex: Av. Paulista, 1000" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Destino</label>
                <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Ex: Aeroporto de Congonhas" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Horário</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Valor (R$)</label>
                  <input type="number" value={fare} onChange={(e) => setFare(e.target.value)} step="0.01" placeholder="35.50" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Disparar Corrida às (opcional)</label>
                <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Atribuir a motorista específico (opcional)</label>
                 <select value={specificDriverId} onChange={(e) => setSpecificDriverId(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500">
                    <option value="">Próximo da Fila (Disponível)</option>
                    {state.drivers.map(d => (
                        <option key={d.id} value={d.id}>
                            {d.position}. {d.name} (Un. {d.unitNumber})
                        </option>
                    ))}
                 </select>
              </div>
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 px-4 rounded-md transition duration-300">
                Publicar Corrida
              </button>
            </form>
          </div>
          
          <div className="bg-slate-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <UsersIcon className="w-7 h-7 text-amber-400" />
                  Gerenciar Motoristas
              </h2>
              <form onSubmit={handleAddDriver} className="space-y-4 mb-6">
                  <div className="space-y-3">
                      <input type="text" value={newDriverName} onChange={(e) => setNewDriverName(e.target.value)} placeholder="Nome do Motorista" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" required />
                      <div className="grid grid-cols-2 gap-3">
                          <input type="text" value={newDriverUnit} onChange={(e) => setNewDriverUnit(e.target.value)} placeholder="Unidade" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" required />
                          <input type="text" value={newDriverVehicle} onChange={(e) => setNewDriverVehicle(e.target.value)} placeholder="Veículo" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" required />
                      </div>
                  </div>
                  <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                      Cadastrar Motorista
                  </button>
              </form>

              <h3 className="text-lg font-semibold mb-3 text-slate-300">Fila de Motoristas ({state.drivers.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {state.drivers.sort((a,b) => a.position - b.position).map(driver => (
                      <div key={driver.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-md">
                          <div className="flex items-center gap-3">
                              <span className="font-bold text-lg text-amber-400 w-6 text-center">{driver.position}</span>
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${driver.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} title={driver.isAvailable ? 'Disponível' : 'Indisponível'}></span>
                                <div>
                                    <p className="font-semibold text-slate-100">{driver.name}</p>
                                    <p className="text-xs text-slate-400">Un. {driver.unitNumber} - {driver.vehicleModel}</p>
                                </div>
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                              <button onClick={() => setEditingDriver(driver)} className="text-slate-500 hover:text-amber-500 transition-colors" aria-label={`Editar ${driver.name}`}>
                                  <PencilIcon className="w-5 h-5"/>
                              </button>
                              <button onClick={() => handleRemoveDriver(driver.id)} className="text-slate-500 hover:text-rose-500 transition-colors" aria-label={`Remover ${driver.name}`}>
                                  <XCircleIcon className="w-5 h-5"/>
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-slate-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-100">
                  <LockIcon className="w-6 h-6 text-amber-400" />
                  Configurações do Sistema
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-3">
                  <p className="text-sm text-slate-400 mb-2">Alterar senha administrativa:</p>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Nova senha" 
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" 
                    required 
                  />
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Confirmar nova senha" 
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" 
                    required 
                  />
                  {passwordStatus && (
                    <p className={`text-xs ${passwordStatus.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {passwordStatus.message}
                    </p>
                  )}
                  <button type="submit" className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                      Atualizar Senha
                  </button>
              </form>
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3 text-purple-300 flex items-center gap-2">
                <AlarmClockIcon className="w-5 h-5"/>
                Agendadas ({ridesByStatus(RideStatus.SCHEDULED).length})
            </h3>
            <div className="space-y-4">
              {ridesByStatus(RideStatus.SCHEDULED).map(ride => (
                <RideCard key={ride.id} ride={ride} />
              ))}
              {ridesByStatus(RideStatus.SCHEDULED).length === 0 && <p className="text-slate-500">Nenhuma corrida agendada.</p>}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3 text-slate-300">Aguardando Motorista ({ridesByStatus(RideStatus.WAITING).length})</h3>
            <div className="space-y-4">
              {ridesByStatus(RideStatus.WAITING).map(ride => (
                <RideCard key={ride.id} ride={ride} />
              ))}
              {ridesByStatus(RideStatus.WAITING).length === 0 && <p className="text-slate-500">Nenhuma corrida aguardando.</p>}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3 text-sky-400">Em Atendimento ({ridesByStatus(RideStatus.IN_PROGRESS).length})</h3>
            <div className="space-y-4">
              {ridesByStatus(RideStatus.IN_PROGRESS).map(ride => (
                <RideCard key={ride.id} ride={ride} />
              ))}
              {ridesByStatus(RideStatus.IN_PROGRESS).length === 0 && <p className="text-slate-500">Nenhuma corrida em atendimento.</p>}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3 text-emerald-400">Finalizadas ({ridesByStatus(RideStatus.COMPLETED).length})</h3>
            <div className="space-y-4">
              {ridesByStatus(RideStatus.COMPLETED).map(ride => (
                <RideCard key={ride.id} ride={ride} />
              ))}
              {ridesByStatus(RideStatus.COMPLETED).length === 0 && <p className="text-slate-500">Nenhuma corrida finalizada.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminView;
