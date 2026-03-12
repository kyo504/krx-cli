# krx-cli

AI 에이전트를 위한 KRX(한국거래소) Open API CLI 도구입니다.

Claude Code, GPT, Cursor 등의 AI 에이전트가 Bash tool을 통해 한국 주식시장 데이터를 조회할 수 있습니다.

## 특징

- **Agent-Native**: JSON 출력 기본, 시맨틱 exit code, 스키마 인트로스펙션
- **전체 시장 커버리지**: 지수, 주식, ETF/ETN/ELW, 채권, 파생상품, 일반상품, ESG (31개 엔드포인트)
- **종목 검색**: 종목명으로 검색 후 코드 조회 (`krx stock search`)
- **시장 요약**: 한 번의 호출로 지수/상승·하락/Top movers 확인 (`krx market summary`)
- **워치리스트**: 관심 종목 저장 및 일괄 시세 조회 (`krx watchlist`)
- **기간 조회**: `--from/--to`로 여러 날짜 데이터 병렬 조회
- **데이터 파이프라인**: `--sort`, `--limit`, `--code` 로 서버 사이드 필터링
- **파일 캐싱**: 과거 데이터 자동 캐싱으로 rate limit 절약
- **안전한 사용**: 입력 검증, rate limit 추적, dry-run 지원
- **서비스 승인 관리**: API별 승인 상태 자동 확인

## 설치

```bash
npm install -g krx-cli
```

## 설정

### 1. API 키 발급

[KRX Open API 포털](https://openapi.krx.co.kr/)에서 회원가입 후 API 키를 발급받습니다.

### 2. API 키 등록

```bash
krx auth set <your-api-key>

# 또는 환경변수 사용
export KRX_API_KEY=<your-api-key>
```

### 3. 서비스 승인 확인

KRX Open API는 카테고리별로 별도 승인이 필요합니다.

```bash
krx auth status
```

```json
{
  "api_key_set": true,
  "services": {
    "index": { "approved": true },
    "stock": { "approved": true },
    "etp": { "approved": true },
    "bond": { "approved": true },
    "derivative": { "approved": true },
    "commodity": { "approved": true },
    "esg": { "approved": false, "error": "Unauthorized API Call" }
  }
}
```

## 사용법

### 지수 조회

```bash
krx index list --date 20260310 --market kospi
krx index list --date 20260310 --market kosdaq
```

### 주식 조회

```bash
krx stock list --date 20260310 --market kospi
krx stock list --date 20260310 --market kosdaq
krx stock info --market kospi
krx stock search 삼성전자     # 종목 검색
```

### 시장 요약

```bash
krx market summary                    # 최근 거래일 시장 요약
krx market summary --date 20260310    # 특정 날짜
```

### 기간 조회

```bash
krx index list --market kospi --from 20260301 --to 20260310
krx stock list --market kospi --from 20260301 --to 20260305 --code KR7005930003
```

### 정렬 및 제한

```bash
krx stock list --date 20260310 --market kospi --sort FLUC_RT --limit 10
krx stock list --date 20260310 --market kospi --sort ACC_TRDVAL --asc --limit 5
```

### 워치리스트

```bash
krx watchlist add 삼성전자          # 종목 검색 후 워치리스트 추가
krx watchlist remove 삼성전자       # 정확한 이름으로 제거
krx watchlist remove KR7005930003   # 종목코드로 제거
krx watchlist list                   # 워치리스트 조회
krx watchlist show                   # 워치리스트 종목 시세 조회
krx watchlist show --date 20260310  # 특정 날짜 시세
```

### 캐시 관리

```bash
krx cache status    # 캐시 현황 조회
krx cache clear     # 캐시 전체 삭제
```

### ETF/ETN/ELW 조회

```bash
krx etp list --date 20260310 --type etf
krx etp list --date 20260310 --type etn
```

### 채권 조회

```bash
krx bond list --date 20260310 --market kts
krx bond list --date 20260310 --market general
```

### 파생상품 조회

```bash
krx derivative list --date 20260310 --type futures
krx derivative list --date 20260310 --type options
```

### 일반상품 조회

```bash
krx commodity list --date 20260310 --type gold
krx commodity list --date 20260310 --type oil
```

### ESG 조회

```bash
krx esg list --date 20260310 --type index
krx esg list --date 20260310 --type sri-bond
```

### 스키마 조회

```bash
krx schema --all
krx schema stock.stk_bydd_trd
```

## 글로벌 옵션

| 옵션                    | 설명                                | 기본값                         |
| ----------------------- | ----------------------------------- | ------------------------------ |
| `-o, --output <format>` | 출력 형식: json, table, ndjson, csv | json (파이프) / table (터미널) |
| `-f, --fields <fields>` | 출력 필드 필터 (쉼표 구분)          | 전체                           |
| `--code <isuCd>`        | 종목코드 필터 (ISU_CD)              | -                              |
| `--sort <field>`        | 결과 정렬 기준 필드                 | -                              |
| `--asc`                 | 오름차순 정렬 (기본: 내림차순)      | -                              |
| `--limit <n>`           | 결과 개수 제한                      | -                              |
| `--from <date>`         | 기간 조회 시작일 (YYYYMMDD)         | -                              |
| `--to <date>`           | 기간 조회 종료일 (YYYYMMDD)         | -                              |
| `--no-cache`            | 캐시 무시하고 새로 조회             | -                              |
| `--filter <expression>` | 필터 표현식 (예: "FLUC_RT > 5")     | -                              |
| `--save <path>`         | 결과를 파일로 저장                  | -                              |
| `--dry-run`             | API 호출 없이 요청 내용 출력        | -                              |
| `-v, --verbose`         | 상세 로그 (stderr)                  | -                              |

## Exit Codes

| 코드 | 의미                          |
| ---- | ----------------------------- |
| 0    | 성공                          |
| 1    | 일반 오류                     |
| 2    | 사용법 오류 (잘못된 인자)     |
| 3    | 데이터 없음                   |
| 4    | 인증 실패                     |
| 5    | Rate limit 초과 (일 10,000건) |
| 6    | 서비스 미승인                 |

## AI 에이전트 연동

krx-cli는 AI 에이전트가 Bash tool로 직접 호출하도록 설계되었습니다. 연동은 2단계입니다:

1. **CLI 설치** — 실제 실행 가능한 `krx` 바이너리
2. **스킬 설치** — 에이전트에게 사용법을 알려주는 SKILL.md

### Step 1: CLI 설치

```bash
npm install -g krx-cli
```

### Step 2: 스킬 설치

[skills.sh](https://skills.sh)를 통해 SKILL.md를 에이전트에 등록합니다.

```bash
# 모든 에이전트에 글로벌 설치 (권장)
npx skills add kyo504/krx-cli -g

# 특정 에이전트만 지정
npx skills add kyo504/krx-cli -g -a claude-code
npx skills add kyo504/krx-cli -g -a cursor

# 프로젝트 단위 설치 (팀 공유 시)
npx skills add kyo504/krx-cli
```

### Step 3: API 키 설정

```bash
krx auth set <your-api-key>
# 또는
export KRX_API_KEY=<your-api-key>
```

### 지원 에이전트

skills.sh는 40개 이상의 에이전트를 지원합니다:

| 에이전트       | 스킬 설치 경로              |
| -------------- | --------------------------- |
| Claude Code    | `~/.claude/skills/`         |
| Cursor         | `~/.cursor/skills/`         |
| GitHub Copilot | `~/.github-copilot/skills/` |
| Cline          | `~/.cline/skills/`          |
| Windsurf       | `~/.windsurf/skills/`       |
| 기타           | `~/.agents/skills/`         |

### 사용 예시

스킬 설치 후 에이전트에게 자연어로 요청합니다:

```
"오늘 코스피 지수 보여줘"
→ krx index list --date 20250311 --market kospi --fields IDX_NM,CLSPRC_IDX,FLUC_RT

"삼성전자 주가 알려줘"
→ krx stock list --date 20250311 --market kospi --fields ISU_NM,TDD_CLSPRC,FLUC_RT -o json

"금 시세 확인해줘"
→ krx commodity list --date 20250311 --type gold

"어떤 API가 승인되어 있어?"
→ krx auth status
```

### 스킬 관리

```bash
npx skills list -g          # 설치된 스킬 확인
npx skills check             # 업데이트 확인
npx skills update            # 업데이트
npx skills remove krx-cli    # 제거
```

### 수동 연동 (skills.sh 없이)

SKILL.md를 직접 에이전트 설정 디렉토리에 복사할 수도 있습니다:

```bash
# Claude Code
mkdir -p ~/.claude/skills && cp SKILL.md ~/.claude/skills/krx-cli.md

# Cursor
mkdir -p ~/.cursor/skills && cp SKILL.md ~/.cursor/skills/krx-cli.md
```

## MCP 서버 (Claude Desktop / ChatGPT Desktop)

CLI 외에 MCP(Model Context Protocol) 서버도 제공합니다. Claude Desktop, ChatGPT Desktop 등 MCP를 지원하는 클라이언트에서 사용할 수 있습니다.

### 설정 (Claude Desktop)

API 키는 `krx auth set <key>`로 등록한 것이 자동으로 사용됩니다.
`krx-mcp`는 `npm install -g krx-cli`로 설치하면 함께 설치됩니다.

### Claude Desktop

설정 파일 위치:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "krx": {
      "command": "krx-mcp"
    }
  }
}
```

### ChatGPT Desktop

설정 파일 위치:

- **macOS**: `~/Library/Application Support/com.openai.chat/mcp.json`
- **Windows**: `%LOCALAPPDATA%\OpenAI\ChatGPT\mcp.json`

```json
{
  "mcpServers": {
    "krx": {
      "command": "krx-mcp"
    }
  }
}
```

설정 후 앱을 재시작하면 MCP 도구가 활성화됩니다.

### 제공 Tool

| Tool                 | 설명                                         |
| -------------------- | -------------------------------------------- |
| `krx_index`          | 지수 일별시세 (KOSPI/KOSDAQ/KRX/채권/파생)   |
| `krx_stock`          | 주식 일별매매정보 + 종목 기본정보            |
| `krx_etp`            | ETF/ETN/ELW 일별매매정보                     |
| `krx_bond`           | 채권 일별매매정보 (국채/일반/소액)           |
| `krx_derivative`     | 선물/옵션 일별매매정보                       |
| `krx_commodity`      | 금/석유/배출권 일별매매정보                  |
| `krx_esg`            | ESG 지수/채권/ETP 정보                       |
| `krx_search`         | 종목명 검색 (KOSPI + KOSDAQ)                 |
| `krx_market_summary` | 시장 요약 (지수/상승·하락/Top movers/거래량) |
| `krx_watchlist`      | 관심종목 관리 (추가/제거/조회/시세)          |
| `krx_schema`         | 엔드포인트 응답 필드 스키마 조회             |
| `krx_rate_limit`     | 일일 API 호출 현황 조회                      |

### 사용 예시

MCP 클라이언트에서 자연어로 요청하면 됩니다:

```
"오늘 코스피 지수 보여줘"
→ krx_index tool 호출 (endpoint: "kospi_dd_trd")

"삼성전자 주가 알려줘"
→ krx_stock tool 호출 (endpoint: "stk_bydd_trd", fields: ["ISU_NM", "TDD_CLSPRC", "FLUC_RT"])

"오늘 API 몇 번 호출했어?"
→ krx_rate_limit tool 호출
```

## 개발

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```

## 라이선스

MIT
