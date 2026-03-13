import type { Scenario } from "./types.js";
import { indexScenarios } from "./index.scenario.js";
import { stockScenarios } from "./stock.scenario.js";
import { etpScenarios } from "./etp.scenario.js";
import { bondScenarios } from "./bond.scenario.js";
import { derivativeScenarios } from "./derivative.scenario.js";
import { commodityScenarios } from "./commodity.scenario.js";
import { esgScenarios } from "./esg.scenario.js";
import { marketScenarios } from "./market.scenario.js";

export const allScenarios: readonly Scenario[] = [
  ...indexScenarios,
  ...stockScenarios,
  ...etpScenarios,
  ...bondScenarios,
  ...derivativeScenarios,
  ...commodityScenarios,
  ...esgScenarios,
  ...marketScenarios,
];

export function getScenariosByTag(tag: string): readonly Scenario[] {
  return allScenarios.filter((s) => s.tags?.includes(tag));
}

export function getScenarioById(id: string): Scenario | undefined {
  return allScenarios.find((s) => s.id === id);
}
