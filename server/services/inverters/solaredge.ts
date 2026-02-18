import { InverterProvider, EnergyReport } from "./types";

interface SiteOverviewResponse {
  sitesOverviews: {
    siteEnergyList: Array<{
      siteOverview: {
        currentPower: {
          power: number;
        };
        lastUpdateTime: string;
        lifeTimeData: {
          energy: number;
        };
        lastYearData: {
          energy: number;
        };
        lastMonthData: {
          energy: number;
        };
        lastDayData: {
          energy: number;
        };
      };
    }>;
  };
}

interface SiteEnergyResponse {
  sitesEnergy: {
    siteEnergyList: Array<{
      energyValues: {
        values: Array<{
          date: string;
          value: number | null;
        }>;
      };
    }>;
  };
}

export class SolarEdgeProvider implements InverterProvider {
  private readonly apiKey: string;
  private readonly apiBaseUrl: string;

  constructor() {
    const apiKey = process.env.SOLAREDGE_API_KEY;
    const apiBaseUrl = process.env.SOLAREDGE_API_BASE_URL || "https://monitoringapi.solaredge.com";

    if (!apiKey) {
      throw new Error("SOLAREDGE_API_KEY environment variable is not set");
    }

    this.apiKey = apiKey;
    this.apiBaseUrl = apiBaseUrl;
  }

  async getEnergyReport(siteId: string): Promise<EnergyReport> {
    const [overview, last7DaysEnergy] = await Promise.all([
      this.fetchOverview(siteId),
      this.fetchLast7DaysEnergy(siteId),
    ]);

    return {
      currentPower: overview.currentPower.power,
      todayEnergy: overview.lastDayData.energy,
      last7DaysEnergy,
      monthToDateEnergy: overview.lastMonthData.energy,
      lifetimeEnergy: overview.lifeTimeData.energy,
    };
  }

  private async fetchOverview(siteId: string) {
    const url = `${this.apiBaseUrl}/sites/${siteId}/overview?api_key=${this.apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`SolarEdge API error: ${response.status} ${response.statusText}`);
    }

    const data: SiteOverviewResponse = await response.json();
    const overview = data.sitesOverviews.siteEnergyList[0]?.siteOverview;

    if (!overview) {
      throw new Error("No site overview data found");
    }

    return overview;
  }

  private async fetchLast7DaysEnergy(siteId: string): Promise<number> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const url = `${this.apiBaseUrl}/sites/${siteId}/energy?timeUnit=DAY&startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&api_key=${this.apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`SolarEdge API error: ${response.status} ${response.statusText}`);
    }

    const data: SiteEnergyResponse = await response.json();
    const values = data.sitesEnergy.siteEnergyList[0]?.energyValues.values || [];

    // Sum all values, treating null as 0
    return values.reduce((sum, { value }) => sum + (value || 0), 0);
  }
}
