import { ResponseError } from "@/lib/errors/response-error";
import { db } from "./firebase.service";
import { SensorRecord, SensorsData } from "@/lib/interfaces/sensors";
import {
  MAX_POWER_WATT,
  MIN_EFFECTIVE_PWM_PERCENT,
  MOTOR_SPECS,
  TARIF_PLN_PER_KWH,
} from "@/lib/constant/formulaDailyCost";

export class SensorService {
  private sensorHistory: SensorRecord[] = [];
  private readonly MAX_HISTORY = 20;
  private lastProcessTime = Date.now();
  private lastResetDate = new Date().toISOString().split("T")[0];
  private resetCheckSchedule = false;
  private isNewDay = false;

  constructor() {
    this.scheduleResetCheck();
    this.initializeRealtimeListener();
  }

  async writeSensorData(data: SensorsData) {
    try {
      await db.ref("/").set({
        ...data,
        timeStamp: Date.now(),
      });
    } catch (error) {
      throw new ResponseError(500, ` Firebase error : ${error}`);
    }
  }

  async readSensorData() {
    try {
      const snapshot = await db.ref("/").get();
      return snapshot.val();
    } catch (error) {
      throw new ResponseError(500, `Firebase error : ${error}`);
    }
  }

  getSensorHistory() {
    return this.sensorHistory;
  }

  private initializeRealtimeListener() {
    db.ref("/").on("value", (snapshot) => {
      const data = snapshot.val();
      if (data) {
        this.processSensorData(data);
      }
    });
  }

  private async processSensorData(data: SensorsData) {
    this.checkAndResetDailyStats();

    const now = Date.now();
    const timeDiffMs = now - this.lastProcessTime;
    const timeDiffHours = timeDiffMs / (1000 * 3600);
    this.lastProcessTime = now;

    const pwmValue = Number(data.pwm) || 0;

    if (
      pwmValue > 0 &&
      ((timeDiffHours > 0 && timeDiffHours < 1) || this.isNewDay)
    ) {
      await this.calculateAndRecordEnergy(data, timeDiffHours);
    } else {
      await this.recordWithoutEnergyCalc(data);
    }
  }

  private async calculateAndRecordEnergy(
    data: SensorsData,
    timeDiffHours: number,
  ) {
    const pwmClamped = Math.max(0, Math.min(data.pwm, MOTOR_SPECS.MAX_PWM));
    const pwmPercent = pwmClamped / MOTOR_SPECS.MAX_PWM;

    const currentWatt =
      pwmPercent < MIN_EFFECTIVE_PWM_PERCENT ? 0 : pwmPercent * MAX_POWER_WATT;

    const recordKwh = (currentWatt / 1000) * timeDiffHours;
    const recordCost = recordKwh * TARIF_PLN_PER_KWH;

    const today = new Date().toISOString().split("T")[0];
    const statsRef = db.ref(`daily_stats/${today}`);

    try {
      await statsRef.transaction((currentStats) => {
        if (!currentStats) {
          return {
            total_kwh: recordKwh,
            total_cost: recordCost,
            date: today,
          };
        }
        return {
          ...currentStats,
          total_kwh: (currentStats.total_kwh || 0) + recordKwh,
          total_cost: (currentStats.total_cost || 0) + recordCost,
          date: today,
        };
      });

      const statsSnapshot = await statsRef.get();
      const updatedStats = statsSnapshot.val();

      this.addToHistory({
        ...data,
        total_kwh: updatedStats?.total_kwh || 0,
        total_cost: updatedStats?.total_cost || 0,
        timestamp: Date.now(),
      });

      this.isNewDay = false;
    } catch (error) {
      console.error("Error calculating energy:", error);
    }
  }

  private async recordWithoutEnergyCalc(data: SensorsData) {
    const today = new Date().toISOString().split("T")[0];
    try {
      const statsSnapshot = await db.ref(`daily_stats/${today}`).get();
      const currentStats = statsSnapshot.val();

      this.addToHistory({
        ...data,
        total_kwh: currentStats?.total_kwh || 0,
        total_cost: currentStats?.total_cost || 0,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error recording sensor data:", error);
    }
  }

  private addToHistory(record: SensorRecord) {
    this.sensorHistory.push(record);
    if (this.sensorHistory.length > this.MAX_HISTORY) {
      this.sensorHistory.shift();
    }
  }

  private scheduleResetCheck() {
    if (this.resetCheckSchedule) return;

    this.resetCheckSchedule = true;
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilReset = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.checkAndResetDailyStats();
      this.resetCheckSchedule = false;
      this.scheduleResetCheck();
    }, msUntilReset);
  }

  private checkAndResetDailyStats() {
    const today = new Date().toISOString().split("T")[0];
    if (today !== this.lastResetDate) {
      const yesterday = this.lastResetDate;
      const statsRef = db.ref(`daily_stats/${yesterday}`);

      statsRef.once("value", (snapshot) => {
        if (snapshot.exists()) {
          const yesterdayData = snapshot.val();
          console.log(`Archived stats for ${yesterday}:`, yesterdayData);
        }
      });

      const todayStatsRef = db.ref(`daily_stats/${today}`);
      todayStatsRef.set({
        total_kwh: 0,
        total_cost: 0,
        date: today,
      });

      this.lastResetDate = today;
      this.isNewDay = true;
    }
  }
}

export const sensorService = new SensorService();
