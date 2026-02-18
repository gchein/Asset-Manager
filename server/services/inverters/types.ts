export interface EnergyReport {
  currentPower: number;       // Watts
  todayEnergy: number;        // Wh
  last7DaysEnergy: number;    // Wh
  monthToDateEnergy: number;  // Wh
  lifetimeEnergy: number;     // Wh
}

export interface InverterProvider {
  getEnergyReport(siteId: string): Promise<EnergyReport>;
}
