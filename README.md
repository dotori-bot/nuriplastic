# nuriplastic

부자재 유통 사업 전략 검토와 그에 따른 산출물을 담은 저장소입니다.

## 산출물

| 파일 | 내용 |
|---|---|
| `docs/master-report.html` | **사업 전략 종합 보고서** — 시장 진단, 산업 구조, 화학적 상용성 분석, 데이터 구축 전략, 비대면 사업 모델, 2인 팀 로드맵 (참고문헌 51건) |
| `docs/data-collection-protocol.md` | 경험 데이터 인출 프로토콜 — 정리된 자료 없이 초기 데이터셋을 구축하는 절차 |
| `tools/compat-db.html` | 상용성 데이터베이스 도구 — 브라우저에서 파일을 직접 열어 사용 |
| `docs/strategy-report.html` | 초기 전략 보고서 (범위가 좁은 초안, 보존용) |

## 설치된 스킬

### agent-reach

[Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) — 15개 플랫폼
(Reddit, X/Twitter, YouTube, GitHub, LinkedIn, Instagram, Facebook, V2EX, Bilibili,
샤오홍슈, RSS 등)에서 검색·본문 수집을 수행하는 리서치 스킬입니다.

설치:

```bash
npx -y skills add Panniantong/Agent-Reach@agent-reach -g -a claude-code
```

`~/.claude/skills/agent-reach/`에 파일이 복사되는 방식이라
`.claude/settings.json`으로 선언되지 않습니다. **새 환경에서는 위 명령을 다시 실행해야
합니다.**

상태 점검:

```bash
agent-reach doctor --json
```

**원격 세션에서의 제약:** Claude Code 원격 환경은 이그레스 정책상 reddit.com, x.com,
bilibili.com 등 대부분의 소스를 차단합니다(api.github.com은 허용). 이 스킬의 상당수
채널은 원격 세션에서 빈 결과를 반환하므로, 로컬 머신에서 사용하시는 것이 맞습니다.
