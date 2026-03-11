# KRX CLI - Product Requirements Document

## Overview

**krx-cli**는 KRX(한국거래소) Open API를 AI 에이전트가 효율적으로 사용할 수 있도록 설계된 agent-native CLI입니다.

Claude Code, GPT, Cursor 등의 AI 에이전트가 Bash tool을 통해 직접 호출하여 한국 주식시장 데이터를 조회합니다.

## Goals

1. **Agent-Native First**: JSON 출력 기본, 시맨틱 exit code, 스키마 인트로스펙션
2. **인증 관리**: API 키 설정 + API별 승인 상태 확인
3. **안전한 사용**: dry-run, 입력 검증, rate limit 관리
4. **확장 가능**: 새로운 KRX API 엔드포인트 추가가 쉬운 구조
5. **오픈소스 준비**: public release를 염두에 둔 문서화와 구조

## Non-Goals

- MCP 서버 (필요시 별도 프로젝트로)
- 실시간 스트리밍 (KRX Open API 미지원)
- 매매/거래 기능 (조회 전용)
- GUI/TUI 인터페이스

---

## Technical Stack

| Component | Choice | Reason |
|-----------|--------|--------|
| Language | TypeScript | AI 생태계 친화적, JSON 처리 강점 |
| Runtime | Node.js (>=20) | LTS, fetch 내장 |
| CLI Framework | Commander.js | 경량, 타입 지원 우수 |
| HTTP Client | Node.js fetch | 외부 의존성 최소화 |
| Validation | Zod | 입출력 스키마 검증 |
| Test | Vitest | 빠른 실행, ESM 네이티브 |
| Build | tsup | 빠른 번들링 |
| Package Manager | pnpm | 빠른 설치 |

---

## KRX Open API Reference

### Base URL

```
http://data-dbg.krx.co.kr/svc/apis
```

### Authentication

KRX Open API는 **2단계 인증 구조**:

1. **API Key 발급**: openapi.krx.co.kr에서 회원가입 후 AUTH_KEY 발급
2. **API별 승인**: 각 서비스(지수, 주식, 채권 등)별로 개별 사용 신청 필요

API Key가 있어도 승인되지 않은 서비스는 호출 불가.

### Request Format

- Method: POST (Content-Type: application/json; charset=utf-8)
- Header: `AUTH_KEY: <api_key>`
- Body: `{"basDd": "YYYYMMDD"}`
- 모든 응답 필드 값은 string 타입

### Response Format

```json
{
  "OutBlock_1": [
    { "BAS_DD": "20240105", "ISU_NM": "삼성전자", "TDD_CLSPRC": "71000", ... }
  ]
}
```

### Rate Limits

- 일일 10,000건
- 데이터: T-1 (전 거래일), 2010년 이후

### Endpoints (31개, 7개 카테고리)

#### 지수 (Index) — `idx` — 5개

| Path | Description |
|------|-------------|
| `/svc/apis/idx/krx_dd_trd` | KRX 시리즈 지수 일별시세 |
| `/svc/apis/idx/kospi_dd_trd` | KOSPI 시리즈 지수 일별시세 |
| `/svc/apis/idx/kosdaq_dd_trd` | KOSDAQ 시리즈 지수 일별시세 |
| `/svc/apis/idx/bon_dd_trd` | 채권지수 일별시세 |
| `/svc/apis/idx/drvprod_dd_trd` | 파생상품지수 일별시세 |

#### 주식 (Stock) — `sto` — 8개

| Path | Description |
|------|-------------|
| `/svc/apis/sto/stk_bydd_trd` | 유가증권(KOSPI) 주식 일별매매정보 |
| `/svc/apis/sto/ksq_bydd_trd` | 코스닥(KOSDAQ) 주식 일별매매정보 |
| `/svc/apis/sto/knx_bydd_trd` | 코넥스(KONEX) 주식 일별매매정보 |
| `/svc/apis/sto/sw_bydd_trd` | 신주인수권증권 일별매매정보 |
| `/svc/apis/sto/sr_bydd_trd` | 신주인수권증서 일별매매정보 |
| `/svc/apis/sto/stk_isu_base_info` | 유가증권 종목 기본정보 |
| `/svc/apis/sto/ksq_isu_base_info` | 코스닥 종목 기본정보 |
| `/svc/apis/sto/knx_isu_base_info` | 코넥스 종목 기본정보 |

#### 증권상품/ETP — `etp` — 3개

| Path | Description |
|------|-------------|
| `/svc/apis/etp/etf_bydd_trd` | ETF 일별매매정보 |
| `/svc/apis/etp/etn_bydd_trd` | ETN 일별매매정보 |
| `/svc/apis/etp/elw_bydd_trd` | ELW 일별매매정보 |

#### 채권 (Bond) — `bon` — 3개

| Path | Description |
|------|-------------|
| `/svc/apis/bon/kts_bydd_trd` | 국채전문유통시장 일별매매정보 |
| `/svc/apis/bon/bnd_bydd_trd` | 일반채권시장 일별매매정보 |
| `/svc/apis/bon/smb_bydd_trd` | 소액채권시장 일별매매정보 |

#### 파생상품 (Derivatives) — `drv` — 6개

| Path | Description |
|------|-------------|
| `/svc/apis/drv/fut_bydd_trd` | 선물 일별매매정보 |
| `/svc/apis/drv/eqsfu_stk_bydd_trd` | 유가증권 주식선물 일별매매정보 |
| `/svc/apis/drv/eqkfu_ksq_bydd_trd` | 코스닥 주식선물 일별매매정보 |
| `/svc/apis/drv/opt_bydd_trd` | 옵션 일별매매정보 |
| `/svc/apis/drv/eqsop_bydd_trd` | 유가증권 주식옵션 일별매매정보 |
| `/svc/apis/drv/eqkop_bydd_trd` | 코스닥 주식옵션 일별매매정보 |

#### 일반상품 (Commodities) — `gen` — 3개

| Path | Description |
|------|-------------|
| `/svc/apis/gen/oil_bydd_trd` | 석유시장 일별매매정보 |
| `/svc/apis/gen/gold_bydd_trd` | 금시장 일별매매정보 |
| `/svc/apis/gen/ets_bydd_trd` | 배출권시장 일별매매정보 |

#### ESG — `esg` — 3개

| Path | Description |
|------|-------------|
| `/svc/apis/esg/sri_bond_info` | 사회책임투자채권 종목정보 |
| `/svc/apis/esg/esg_etp_info` | ESG 증권상품 정보 |
| `/svc/apis/esg/esg_index_info` | ESG 지수 정보 |

---

## CLI Design

### Command Structure

```bash
# 인증 관리
krx auth set <api-key>           # API 키 저장
krx auth status                   # API 키 + 서비스별 승인 상태 확인
krx auth check <category>         # 특정 카테고리 승인 여부 확인

# 지수 조회
krx index list --date 20240105 --market kospi
krx index list --date 20240105 --market kosdaq
krx index list --date 20240105 --market krx

# 주식 조회
krx stock list --date 20240105 --market kospi
krx stock list --date 20240105 --market kosdaq
krx stock info --market kospi      # 종목 기본정보

# 증권상품 조회
krx etp list --date 20240105 --type etf
krx etp list --date 20240105 --type etn
krx etp list --date 20240105 --type elw

# 채권 조회
krx bond list --date 20240105 --market kts
krx bond list --date 20240105 --market general
krx bond list --date 20240105 --market small

# 파생상품 조회
krx derivative list --date 20240105 --type futures
krx derivative list --date 20240105 --type options

# 일반상품 조회
krx commodity list --date 20240105 --type oil
krx commodity list --date 20240105 --type gold
krx commodity list --date 20240105 --type emission

# ESG 조회
krx esg list --date 20240105 --type sri-bond
krx esg list --date 20240105 --type etp
krx esg list --date 20240105 --type index

# 스키마 인트로스펙션
krx schema --all
krx schema stock.list
```

### 인증 관리 상세

#### `krx auth set <api-key>`

API 키를 로컬에 저장 (`~/.krx-cli/config.json` 또는 환경변수 `KRX_API_KEY`).

```json
// stdout
{ "success": true, "message": "API key saved" }
```

#### `krx auth status`

API 키 유효성 + 각 카테고리별 승인 상태를 확인합니다.
각 카테고리의 대표 엔드포인트 1개에 테스트 요청을 보내 승인 여부를 판단합니다.

```json
// stdout
{
  "api_key_set": true,
  "services": {
    "index": { "approved": true, "checked_at": "2024-01-05T10:00:00Z" },
    "stock": { "approved": true, "checked_at": "2024-01-05T10:00:00Z" },
    "etp": { "approved": false, "checked_at": "2024-01-05T10:00:00Z" },
    "bond": { "approved": false, "checked_at": "2024-01-05T10:00:00Z" },
    "derivative": { "approved": false, "checked_at": "2024-01-05T10:00:00Z" },
    "commodity": { "approved": true, "checked_at": "2024-01-05T10:00:00Z" },
    "esg": { "approved": false, "checked_at": "2024-01-05T10:00:00Z" }
  }
}
```

승인 체크 방식:
- 각 카테고리의 대표 엔드포인트에 최근 거래일 기준으로 요청 전송
- 정상 응답 → `approved: true`
- 권한 없음 응답 → `approved: false`
- 결과를 로컬에 캐싱 (재확인 시까지 유지)

#### `krx auth check <category>`

특정 카테고리만 승인 여부 확인.

### Global Flags

```
--output, -o    json (기본) | table | ndjson
--fields, -f    출력 필드 필터: --fields name,close,volume
--dry-run       API 호출 없이 요청 내용만 출력
--verbose, -v   상세 로그 (stderr)
```

### Output Rules

- **stdout**: 구조화된 JSON 데이터만
- **stderr**: 경고, 에러, verbose 로그
- TTY 감지: 터미널이면 table, 파이프면 json 자동 전환

### Semantic Exit Codes

```
0 = 성공
1 = 일반 오류
2 = 사용법 오류 (잘못된 인자)
3 = 데이터 없음
4 = 인증 실패 (API 키 없음/잘못됨)
5 = Rate limit 초과
6 = 서비스 미승인 (해당 API 카테고리 미승인)
```

### 입력 검증

- 날짜: YYYYMMDD (8자리 숫자, 유효 날짜)
- 시장: kospi | kosdaq | konex | krx
- 종목코드: 6자리 숫자 (해당 명령어에서 사용 시)
- Path traversal, 제어 문자 차단

---

## Architecture

```
krx-cli/
├── src/
│   ├── cli/
│   │   ├── index.ts              # CLI 진입점
│   │   └── commands/
│   │       ├── auth.ts           # 인증 관리
│   │       ├── index-cmd.ts      # 지수 조회
│   │       ├── stock.ts          # 주식 조회
│   │       ├── etp.ts            # 증권상품 조회
│   │       ├── bond.ts           # 채권 조회
│   │       ├── derivative.ts     # 파생상품 조회
│   │       ├── commodity.ts      # 일반상품 조회
│   │       ├── esg.ts            # ESG 조회
│   │       └── schema.ts         # 스키마 인트로스펙션
│   ├── client/
│   │   ├── client.ts             # HTTP 클라이언트 코어
│   │   ├── auth.ts               # AUTH_KEY 인증 + 서비스 승인 체크
│   │   ├── rate-limit.ts         # Rate limiting 추적
│   │   └── endpoints.ts          # 엔드포인트 레지스트리 (31개)
│   ├── models/                    # Zod 스키마 (요청/응답)
│   │   ├── common.ts
│   │   ├── index.ts
│   │   ├── stock.ts
│   │   ├── etp.ts
│   │   ├── bond.ts
│   │   ├── derivative.ts
│   │   ├── commodity.ts
│   │   └── esg.ts
│   ├── output/
│   │   ├── json.ts               # JSON 출력
│   │   ├── table.ts              # 테이블 출력
│   │   └── formatter.ts          # 출력 포맷 분기
│   └── validator/
│       └── index.ts              # 입력 검증
├── tests/
│   ├── client/
│   ├── commands/
│   ├── models/
│   └── validator/
├── docs/
│   ├── PRD.md
│   └── API_REFERENCE.md
├── SKILL.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── tsup.config.ts
```

---

## Implementation Phases

### Phase 0: Project Setup

- [ ] pnpm init + TypeScript + ESLint + Prettier 설정
- [ ] Vitest 설정
- [ ] tsup 빌드 설정
- [ ] GitHub repository 초기화
- [ ] CI (GitHub Actions): lint, test, build
- [ ] Commander.js 기본 CLI 프레임워크
- [ ] 출력 모듈 (JSON/table/ndjson)

### Phase 1: 인증 + Core MVP

- [ ] HTTP 클라이언트 (`src/client/client.ts`)
- [ ] AUTH_KEY 인증 (`src/client/auth.ts`)
- [ ] 엔드포인트 레지스트리 (`src/client/endpoints.ts`)
- [ ] 입력 검증 (`src/validator/`)
- [ ] `krx auth set` — API 키 저장
- [ ] `krx auth status` — 서비스별 승인 상태 확인
- [ ] `krx auth check` — 특정 카테고리 승인 확인
- [ ] `krx index list` — 지수 조회
- [ ] `krx stock list` — 주식 조회
- [ ] 시맨틱 exit code 처리

### Phase 2: Extended Coverage

- [ ] `krx etp list` — ETF/ETN/ELW 조회
- [ ] `krx bond list` — 채권 조회
- [ ] `krx commodity list` — 일반상품 조회
- [ ] `krx esg list` — ESG 조회
- [ ] `krx derivative list` — 파생상품 조회
- [ ] Rate limit 추적 + 경고
- [ ] `--dry-run` 지원
- [ ] `--fields` 필드 마스킹

### Phase 3: Agent Features + Release

- [ ] `krx schema` — 스키마 인트로스펙션
- [ ] SKILL.md 작성
- [ ] README.md (설치, 사용법, 예시)
- [ ] npm publish 설정
- [ ] Public release 준비 (LICENSE, CONTRIBUTING.md)

---

## Success Criteria

1. Phase 1 명령어 동작 + 테스트 커버리지 80%+
2. `krx auth status`로 7개 카테고리 승인 상태 확인 가능
3. Claude Code에서 `krx stock list --date 20240105 --market kospi` 호출 가능
4. SKILL.md를 통해 에이전트가 정확한 명령어 생성 가능
5. `npx krx-cli` 또는 `npm install -g krx-cli`로 설치 가능
