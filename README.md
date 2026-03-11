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
krx index list --date 20250307 --market kospi
krx index list --date 20250307 --market kosdaq
```

### 주식 조회

```bash
krx stock list --date 20250307 --market kospi
krx stock list --date 20250307 --market kosdaq
krx stock info --market kospi
```

### ETF/ETN/ELW 조회

```bash
krx etp list --date 20250307 --type etf
krx etp list --date 20250307 --type etn
```

### 채권 조회

```bash
krx bond list --date 20250307 --market kts
krx bond list --date 20250307 --market general
```

### 파생상품 조회

```bash
krx derivative list --date 20250307 --type futures
krx derivative list --date 20250307 --type options
```

### 일반상품 조회

```bash
krx commodity list --date 20250307 --type gold
krx commodity list --date 20250307 --type oil
```

### ESG 조회

```bash
krx esg list --date 20250307 --type index
krx esg list --date 20250307 --type sri-bond
```

### 스키마 조회

```bash
krx schema --all
krx schema stock.stk_bydd_trd
```

## 글로벌 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `-o, --output <format>` | 출력 형식: json, table, ndjson | json (파이프) / table (터미널) |
| `-f, --fields <fields>` | 출력 필드 필터 (쉼표 구분) | 전체 |
| `--dry-run` | API 호출 없이 요청 내용 출력 | - |
| `-v, --verbose` | 상세 로그 (stderr) | - |

## Exit Codes

| 코드 | 의미 |
|------|------|
| 0 | 성공 |
| 1 | 일반 오류 |
| 2 | 사용법 오류 (잘못된 인자) |
| 3 | 데이터 없음 |
| 4 | 인증 실패 |
| 5 | Rate limit 초과 (일 10,000건) |
| 6 | 서비스 미승인 |

## AI 에이전트 연동

### Claude Code

SKILL.md 파일을 프로젝트에 포함하면 Claude Code가 자동으로 사용법을 인식합니다.

```bash
# Claude Code에서 바로 사용 가능
krx stock list --date 20250307 --market kospi --fields ISU_NM,TDD_CLSPRC,FLUC_RT -o json
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
