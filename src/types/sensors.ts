export interface SensorsData {
  berat: number;
  pwm: number;
  rpm: number;
}

export interface SensorRecord extends SensorsData {
  total_kwh: number;
  total_cost: number;
  timestamp: number;
}
