export enum RideStatus {
  SCHEDULED = 'Agendada',
  WAITING = 'Aguardando',
  IN_PROGRESS = 'Em Atendimento',
  COMPLETED = 'Finalizada',
}

export interface Driver {
  id: number;
  name: string;
  unitNumber: string;
  vehicleModel: string;
  position: number;
  isAvailable: boolean;
}

export interface Ride {
  id: string;
  pickup: string;
  destination: string;
  time: string;
  fare: number;
  status: RideStatus;
  assignedDriverId?: number;
  offeredToDriverId?: number;
  scheduledTime?: string;
}
