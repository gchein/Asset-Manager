import { InverterProvider } from "./types";
import { SolarEdgeProvider } from "./solaredge";

const providers: Record<string, InverterProvider> = {
  solaredge: new SolarEdgeProvider(),
};

export function getInverterProvider(slug: string): InverterProvider {
  const provider = providers[slug];
  if (!provider) {
    throw new Error(`Unknown inverter provider: ${slug}`);
  }
  return provider;
}

export * from "./types";
