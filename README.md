# LH AI 워크플로 워크숍 스킬

AIPM이 LH AI Day PoC 워크숍에서 사용하는 Claude 스킬입니다. 팀 과제의 진행 상황을 점검하고, 데모와 검증 결과를 발표 자료로 정리할 때 쓸 수 있습니다. 버전은 2026년 11월 20일 AIPM의 Claude 조직 라이브러리 기준입니다.

| 스킬 | 하는 일 | 조직 버전 | 설치 파일 |
| --- | --- | --- | --- |
| [멘토 코치](skills/lh-poc-mentor-coach/SKILL.md) | 팀이 막힌 지점이나 데모 범위를 질문으로 점검하고, 다음 회차까지 할 일과 확인 방법을 정합니다. | v1 | [멘토 코치 ZIP](https://github.com/AIPMGlobal/lh-poc-skills/releases/download/2026-11-20/lh-poc-mentor-coach.zip) |
| [발표 자료 제작](skills/lh-poc-present/SKILL.md) | PRD, 데모 화면, 검증 결과를 바탕으로 발표 흐름을 잡고, LH 양식에 맞는 편집 가능한 PowerPoint를 만듭니다. | v2 | [발표 자료 제작 ZIP](https://github.com/AIPMGlobal/lh-poc-skills/releases/download/2026-11-20/lh-poc-present.zip) |

## Claude에 설치하기

1. 위 표에서 원하는 ZIP을 내려받습니다. 압축은 그대로 둡니다.
2. Claude의 **사용자 지정 → Skills**에서 **+** 메뉴를 열고 스킬 업로드를 선택합니다. [Claude 공식 설치 안내](https://support.claude.com/en/articles/12512180-use-skills-in-claude)
3. ZIP을 업로드하고 스킬을 켠 뒤, 새 대화에서 아래처럼 시작합니다.

| 스킬 | 첫 메시지 예시 |
| --- | --- |
| 멘토 코치 | “멘토 코치, 다음 데모에서 보여 줄 기능을 하나로 좁히고 싶어.” |
| 발표 자료 제작 | “lh-poc-present로 이 PRD와 데모 화면을 보고 5분 발표 흐름부터 제안해 줘.” |

멘토 코치는 이름을 불러 시작합니다. 스킬에 적힌 멘토링 날짜(11월 6일·13일·20일)는 이 워크숍의 일정입니다. 코치가 PRD 작성을 위해 안내하는 `lh-poc-prd-coach`는 AIPM 조직에 별도로 설치된 스킬입니다.

각 ZIP은 Claude 조직 라이브러리에서 내려받은 `.skill` 파일의 확장자만 바꾼 것입니다. [버전별 배포 파일](https://github.com/AIPMGlobal/lh-poc-skills/releases)
