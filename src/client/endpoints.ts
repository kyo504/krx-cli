export interface EndpointDef {
  readonly path: string;
  readonly description: string;
  readonly descriptionKo: string;
  readonly category: CategoryId;
}

export type CategoryId =
  | "index"
  | "stock"
  | "etp"
  | "bond"
  | "derivative"
  | "commodity"
  | "esg";

export interface CategoryDef {
  readonly id: CategoryId;
  readonly code: string;
  readonly name: string;
  readonly nameKo: string;
  readonly probeEndpoint: string;
}

export const CATEGORIES: readonly CategoryDef[] = [
  {
    id: "index",
    code: "idx",
    name: "Index",
    nameKo: "지수",
    probeEndpoint: "/svc/apis/idx/kospi_dd_trd",
  },
  {
    id: "stock",
    code: "sto",
    name: "Stock",
    nameKo: "주식",
    probeEndpoint: "/svc/apis/sto/stk_bydd_trd",
  },
  {
    id: "etp",
    code: "etp",
    name: "ETP",
    nameKo: "증권상품",
    probeEndpoint: "/svc/apis/etp/etf_bydd_trd",
  },
  {
    id: "bond",
    code: "bon",
    name: "Bond",
    nameKo: "채권",
    probeEndpoint: "/svc/apis/bon/bnd_bydd_trd",
  },
  {
    id: "derivative",
    code: "drv",
    name: "Derivative",
    nameKo: "파생상품",
    probeEndpoint: "/svc/apis/drv/fut_bydd_trd",
  },
  {
    id: "commodity",
    code: "gen",
    name: "Commodity",
    nameKo: "일반상품",
    probeEndpoint: "/svc/apis/gen/gold_bydd_trd",
  },
  {
    id: "esg",
    code: "esg",
    name: "ESG",
    nameKo: "ESG",
    probeEndpoint: "/svc/apis/esg/esg_index_info",
  },
] as const;

export const ENDPOINTS: readonly EndpointDef[] = [
  // Index (idx)
  {
    path: "/svc/apis/idx/krx_dd_trd",
    description: "KRX series index daily trading",
    descriptionKo: "KRX 시리즈 지수 일별시세",
    category: "index",
  },
  {
    path: "/svc/apis/idx/kospi_dd_trd",
    description: "KOSPI series index daily trading",
    descriptionKo: "KOSPI 시리즈 지수 일별시세",
    category: "index",
  },
  {
    path: "/svc/apis/idx/kosdaq_dd_trd",
    description: "KOSDAQ series index daily trading",
    descriptionKo: "KOSDAQ 시리즈 지수 일별시세",
    category: "index",
  },
  {
    path: "/svc/apis/idx/bon_dd_trd",
    description: "Bond index daily trading",
    descriptionKo: "채권지수 일별시세",
    category: "index",
  },
  {
    path: "/svc/apis/idx/drvprod_dd_trd",
    description: "Derivatives index daily trading",
    descriptionKo: "파생상품지수 일별시세",
    category: "index",
  },

  // Stock (sto)
  {
    path: "/svc/apis/sto/stk_bydd_trd",
    description: "KOSPI stock daily trading",
    descriptionKo: "유가증권(KOSPI) 주식 일별매매정보",
    category: "stock",
  },
  {
    path: "/svc/apis/sto/ksq_bydd_trd",
    description: "KOSDAQ stock daily trading",
    descriptionKo: "코스닥(KOSDAQ) 주식 일별매매정보",
    category: "stock",
  },
  {
    path: "/svc/apis/sto/knx_bydd_trd",
    description: "KONEX stock daily trading",
    descriptionKo: "코넥스(KONEX) 주식 일별매매정보",
    category: "stock",
  },
  {
    path: "/svc/apis/sto/sw_bydd_trd",
    description: "Subscription warrant daily trading",
    descriptionKo: "신주인수권증권 일별매매정보",
    category: "stock",
  },
  {
    path: "/svc/apis/sto/sr_bydd_trd",
    description: "Subscription right daily trading",
    descriptionKo: "신주인수권증서 일별매매정보",
    category: "stock",
  },
  {
    path: "/svc/apis/sto/stk_isu_base_info",
    description: "KOSPI stock base info",
    descriptionKo: "유가증권 종목 기본정보",
    category: "stock",
  },
  {
    path: "/svc/apis/sto/ksq_isu_base_info",
    description: "KOSDAQ stock base info",
    descriptionKo: "코스닥 종목 기본정보",
    category: "stock",
  },
  {
    path: "/svc/apis/sto/knx_isu_base_info",
    description: "KONEX stock base info",
    descriptionKo: "코넥스 종목 기본정보",
    category: "stock",
  },

  // ETP
  {
    path: "/svc/apis/etp/etf_bydd_trd",
    description: "ETF daily trading",
    descriptionKo: "ETF 일별매매정보",
    category: "etp",
  },
  {
    path: "/svc/apis/etp/etn_bydd_trd",
    description: "ETN daily trading",
    descriptionKo: "ETN 일별매매정보",
    category: "etp",
  },
  {
    path: "/svc/apis/etp/elw_bydd_trd",
    description: "ELW daily trading",
    descriptionKo: "ELW 일별매매정보",
    category: "etp",
  },

  // Bond (bon)
  {
    path: "/svc/apis/bon/kts_bydd_trd",
    description: "KTS government bond daily trading",
    descriptionKo: "국채전문유통시장 일별매매정보",
    category: "bond",
  },
  {
    path: "/svc/apis/bon/bnd_bydd_trd",
    description: "General bond daily trading",
    descriptionKo: "일반채권시장 일별매매정보",
    category: "bond",
  },
  {
    path: "/svc/apis/bon/smb_bydd_trd",
    description: "Small bond daily trading",
    descriptionKo: "소액채권시장 일별매매정보",
    category: "bond",
  },

  // Derivatives (drv)
  {
    path: "/svc/apis/drv/fut_bydd_trd",
    description: "Futures daily trading",
    descriptionKo: "선물 일별매매정보",
    category: "derivative",
  },
  {
    path: "/svc/apis/drv/eqsfu_stk_bydd_trd",
    description: "KOSPI stock futures daily trading",
    descriptionKo: "유가증권 주식선물 일별매매정보",
    category: "derivative",
  },
  {
    path: "/svc/apis/drv/eqkfu_ksq_bydd_trd",
    description: "KOSDAQ stock futures daily trading",
    descriptionKo: "코스닥 주식선물 일별매매정보",
    category: "derivative",
  },
  {
    path: "/svc/apis/drv/opt_bydd_trd",
    description: "Options daily trading",
    descriptionKo: "옵션 일별매매정보",
    category: "derivative",
  },
  {
    path: "/svc/apis/drv/eqsop_bydd_trd",
    description: "KOSPI stock options daily trading",
    descriptionKo: "유가증권 주식옵션 일별매매정보",
    category: "derivative",
  },
  {
    path: "/svc/apis/drv/eqkop_bydd_trd",
    description: "KOSDAQ stock options daily trading",
    descriptionKo: "코스닥 주식옵션 일별매매정보",
    category: "derivative",
  },

  // Commodities (gen)
  {
    path: "/svc/apis/gen/oil_bydd_trd",
    description: "Oil market daily trading",
    descriptionKo: "석유시장 일별매매정보",
    category: "commodity",
  },
  {
    path: "/svc/apis/gen/gold_bydd_trd",
    description: "Gold market daily trading",
    descriptionKo: "금시장 일별매매정보",
    category: "commodity",
  },
  {
    path: "/svc/apis/gen/ets_bydd_trd",
    description: "Emission trading daily",
    descriptionKo: "배출권시장 일별매매정보",
    category: "commodity",
  },

  // ESG
  {
    path: "/svc/apis/esg/sri_bond_info",
    description: "SRI bond info",
    descriptionKo: "사회책임투자채권 종목정보",
    category: "esg",
  },
  {
    path: "/svc/apis/esg/esg_etp_info",
    description: "ESG ETP info",
    descriptionKo: "ESG 증권상품 정보",
    category: "esg",
  },
  {
    path: "/svc/apis/esg/esg_index_info",
    description: "ESG index info",
    descriptionKo: "ESG 지수 정보",
    category: "esg",
  },
] as const;

export function getEndpointsByCategory(
  category: CategoryId,
): readonly EndpointDef[] {
  return ENDPOINTS.filter((e) => e.category === category);
}

export function getCategoryById(id: CategoryId): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
