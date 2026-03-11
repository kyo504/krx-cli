# krx-cli

AI 에이전트를 위한 KRX(한국거래소) Open API CLI 도구입니다.

Claude Code, GPT, Cursor 등의 AI 에이전트가 Bash tool을 통해 한국 주식시장 데이터를 조회할 수 있습니다.

## 특징

- **Agent-Native**: JSON 출력 기본, 시맨틱 exit code, 스키마 인트로스펙션
- **전체 시장 커버리지**: 지수, 주식, ETF/ETN/ELW, 채권, 파생상품, 일반상품, ESG (31개 엔드포인트)
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

| 옵션                    | 설명                           | 기본값                         |
| ----------------------- | ------------------------------ | ------------------------------ |
| `-o, --output <format>` | 출력 형식: json, table, ndjson | json (파이프) / table (터미널) |
| `-f, --fields <fields>` | 출력 필드 필터 (쉼표 구분)     | 전체                           |
| `--dry-run`             | API 호출 없이 요청 내용 출력   | -                              |
| `-v, --verbose`         | 상세 로그 (stderr)             | -                              |

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
