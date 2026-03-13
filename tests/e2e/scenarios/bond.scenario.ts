import type { Scenario } from "./types.js";

export const bondScenarios: readonly Scenario[] = [
  {
    id: "bond-kts-list",
    description: "국채 시세 조회",
    prompt: "국채 시세를 조회해줘.",
    expectedKeywords: {
      anyOf: ["ISU_NM", "CLSPRC", "국채", "채권"],
    },
    expectedStructure: {
      mustNotBeError: true,
    },
    tags: ["bond", "basic"],
  },
  {
    id: "bond-general-list",
    description: "일반채권 시세 조회",
    prompt: "일반채권 시세 현황을 보여줘.",
    expectedKeywords: {
      anyOf: ["ISU_NM", "CLSPRC", "채권"],
    },
    expectedStructure: {
      mustNotBeError: true,
    },
    tags: ["bond", "basic"],
  },
];
