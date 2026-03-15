import type { Scenario } from "./types.js";

export const truncationScenarios: readonly Scenario[] = [
  {
    id: "truncation-full-list-fields",
    description:
      "전체 종목 요청 시 LLM이 fields를 활용해 컨텍스트 초과 없이 처리",
    prompt: "KOSPI 전체 종목의 종목명과 종가, 등락률을 알려줘.",
    expectedKeywords: {
      anyOf: ["종목", "종가", "등락"],
      mustNotContain: ["Error", "error"],
    },
    expectedStructure: {
      mustNotBeError: true,
    },
    tags: ["truncation"],
    maxTurns: 8,
  },
  {
    id: "truncation-count-query",
    description: "전체 종목 수 질문 시 LLM이 적절히 처리",
    prompt: "오늘 KOSPI에 상장된 종목 수가 총 몇 개야?",
    expectedKeywords: {
      anyOf: ["개", "종목"],
      mustNotContain: ["Error", "error"],
    },
    expectedStructure: {
      mustNotBeError: true,
    },
    tags: ["truncation"],
    maxTurns: 8,
  },
];
