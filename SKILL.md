---
name: krx-cli
description: Query KRX (Korea Exchange) market data via CLI
required_env:
  - KRX_API_KEY
install: npm install -g krx-cli
binary: krx
invariants:
  - Always use YYYYMMDD format for --date (e.g., 20250307)
  - Data is T-1 (previous trading day), available from 2010 onwards
  - Default output is JSON to stdout, errors go to stderr
  - Rate limit is 10,000 API calls per day
  - Each API category requires separate approval from KRX
  - All response field values are strings (including numbers)
---

# krx-cli

Agent-native CLI for querying KRX (Korea Exchange) Open API data.

## Setup

```bash
# Install
npm install -g krx-cli

# Set API key (get from https://openapi.krx.co.kr/)
krx auth set <your-api-key>

# Check which services are approved
krx auth status
```

## Commands

### Authentication

```bash
krx auth set <api-key>       # Save API key
krx auth status               # Check all service approvals (JSON)
krx auth check <category>     # Check specific category: index, stock, etp, bond, derivative, commodity, esg
```

### Index (지수)

```bash
krx index list --date 20250307 --market kospi     # KOSPI index
krx index list --date 20250307 --market kosdaq     # KOSDAQ index
krx index list --date 20250307 --market krx        # KRX index
krx index list --date 20250307 --market bond       # Bond index
krx index list --date 20250307 --market derivative # Derivative index
```

### Stock (주식)

```bash
krx stock list --date 20250307 --market kospi   # KOSPI stocks
krx stock list --date 20250307 --market kosdaq   # KOSDAQ stocks
krx stock list --date 20250307 --market konex    # KONEX stocks
krx stock info --market kospi                     # Stock base info
```

### ETP (ETF/ETN/ELW)

```bash
krx etp list --date 20250307 --type etf   # ETF
krx etp list --date 20250307 --type etn   # ETN
krx etp list --date 20250307 --type elw   # ELW
```

### Bond (채권)

```bash
krx bond list --date 20250307 --market kts       # Government bonds
krx bond list --date 20250307 --market general    # General bonds
krx bond list --date 20250307 --market small      # Small bonds
```

### Derivative (파생상품)

```bash
krx derivative list --date 20250307 --type futures          # Futures
krx derivative list --date 20250307 --type options           # Options
krx derivative list --date 20250307 --type futures-kospi     # KOSPI stock futures
krx derivative list --date 20250307 --type futures-kosdaq    # KOSDAQ stock futures
krx derivative list --date 20250307 --type options-kospi     # KOSPI stock options
krx derivative list --date 20250307 --type options-kosdaq    # KOSDAQ stock options
```

### Commodity (일반상품)

```bash
krx commodity list --date 20250307 --type gold       # Gold
krx commodity list --date 20250307 --type oil         # Oil
krx commodity list --date 20250307 --type emission    # Emission trading
```

### ESG

```bash
krx esg list --date 20250307 --type index       # ESG index
krx esg list --date 20250307 --type etp          # ESG ETP
krx esg list --date 20250307 --type sri-bond     # SRI bonds
```

### Schema (introspection)

```bash
krx schema --all              # All 31 endpoint schemas (JSON)
krx schema index.kospi_dd_trd # Specific endpoint schema
```

## Global Flags

```
--output, -o <format>    json (default) | table | ndjson
--fields, -f <fields>    Filter output fields: --fields ISU_NM,TDD_CLSPRC,FLUC_RT
--dry-run                Show request details without calling API
--verbose, -v            Verbose logging to stderr
```

## Exit Codes

```
0 = Success
1 = General error
2 = Usage error (bad arguments)
3 = No data found
4 = Auth failure (no/invalid API key)
5 = Rate limit exceeded (10,000/day)
6 = Service not approved (category not activated)
```

## Common Patterns

### Get KOSPI closing price for a specific date

```bash
krx index list --date 20250307 --market kospi --fields IDX_NM,CLSPRC_IDX,FLUC_RT
```

### Get Samsung Electronics stock price

```bash
krx stock list --date 20250307 --market kospi --fields ISU_NM,TDD_CLSPRC,FLUC_RT | jq '.[] | select(.ISU_NM == "삼성전자")'
```

### Check API availability before querying

```bash
krx auth status -o json
```

### Dry run to verify request

```bash
krx stock list --date 20250307 --market kospi --dry-run
```

## Response Fields

Use `krx schema <command>` to get full field definitions for any endpoint. All values are strings.

### Index (kospi/kosdaq/krx)

| Field         | Description         |
| ------------- | ------------------- |
| BAS_DD        | 기준일자 (YYYYMMDD) |
| IDX_CLSS      | 계열구분            |
| IDX_NM        | 지수명              |
| CLSPRC_IDX    | 종가                |
| CMPPREVDD_IDX | 전일대비            |
| FLUC_RT       | 등락률(%)           |
| OPNPRC_IDX    | 시가                |
| HGPRC_IDX     | 고가                |
| LWPRC_IDX     | 저가                |
| ACC_TRDVOL    | 거래량              |
| ACC_TRDVAL    | 거래대금            |
| MKTCAP        | 상장시가총액        |

### Stock (kospi/kosdaq/konex)

| Field         | Description         |
| ------------- | ------------------- |
| BAS_DD        | 기준일자 (YYYYMMDD) |
| ISU_CD        | 종목코드            |
| ISU_NM        | 종목명              |
| MKT_NM        | 시장구분            |
| SECT_TP_NM    | 소속부              |
| TDD_CLSPRC    | 종가                |
| CMPPREVDD_PRC | 전일대비            |
| FLUC_RT       | 등락률(%)           |
| TDD_OPNPRC    | 시가                |
| TDD_HGPRC     | 고가                |
| TDD_LWPRC     | 저가                |
| ACC_TRDVOL    | 거래량              |
| ACC_TRDVAL    | 거래대금            |
| MKTCAP        | 시가총액            |
| LIST_SHRS     | 상장주식수          |

### ETF

| Field          | Description     |
| -------------- | --------------- |
| ISU_CD         | 종목코드        |
| ISU_NM         | 종목명          |
| TDD_CLSPRC     | 종가            |
| FLUC_RT        | 등락률(%)       |
| NAV            | 순자산가치(NAV) |
| ACC_TRDVOL     | 거래량          |
| MKTCAP         | 시가총액        |
| IDX_IND_NM     | 기초지수명      |
| OBJ_STKPRC_IDX | 기초지수종가    |

### Futures

| Field          | Description    |
| -------------- | -------------- |
| PROD_NM        | 상품명         |
| ISU_NM         | 종목명         |
| TDD_CLSPRC     | 종가           |
| SPOT_PRC       | 현물가         |
| SETL_PRC       | 정산가         |
| ACC_OPNINT_QTY | 미결제약정수량 |

### Options

| Field          | Description      |
| -------------- | ---------------- |
| PROD_NM        | 상품명           |
| RGHT_TP_NM     | 권리유형 (콜/풋) |
| ISU_NM         | 종목명           |
| TDD_CLSPRC     | 종가             |
| IMP_VOLT       | 내재변동성       |
| ACC_OPNINT_QTY | 미결제약정수량   |

### Bond

| Field      | Description |
| ---------- | ----------- |
| ISU_NM     | 종목명      |
| CLSPRC     | 종가        |
| CLSPRC_YD  | 종가수익률  |
| ACC_TRDVOL | 거래량      |
| ACC_TRDVAL | 거래대금    |

### Commodity (gold/emission)

| Field      | Description |
| ---------- | ----------- |
| ISU_NM     | 종목명      |
| TDD_CLSPRC | 종가        |
| FLUC_RT    | 등락률(%)   |
| ACC_TRDVOL | 거래량      |

### Commodity (oil)

| Field      | Description  |
| ---------- | ------------ |
| OIL_NM     | 유종명       |
| WT_AVG_PRC | 가중평균가격 |
| ACC_TRDVOL | 거래량       |

### ESG Index

| Field       | Description |
| ----------- | ----------- |
| IDX_NM      | 지수명      |
| CLSPRC_IDX  | 종가        |
| PRV_DD_CMPR | 전일대비    |
| UPDN_RATE   | 등락률(%)   |

### Schema Introspection

For full response field definitions including all fields per endpoint:

```bash
krx schema index.kospi_dd_trd    # Shows params + responseFields
krx schema stock.stk_bydd_trd   # Stock endpoint fields
krx schema --all                  # All 31 endpoints
```
