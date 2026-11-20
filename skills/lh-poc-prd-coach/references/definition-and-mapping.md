# Agent 정의서 기준과 PRD 매핑

## 정의서 원본의 실제 구조

- 상단 표 첫 행: 모듈 Task 명
- 상단 표 둘째 행: 세부 Task 내 Agent — `세부 Task 명: … / 소속 Agent: …` 형식으로 기록
- Agent 블록: 작동 방식과 기대 결과(시작 조건·기대 산출물·Human 개입), 연결 도구/데이터 소스(Tool·Input·Output), Agent 역할 정의(이름·목적·수행 단계)
- 원본은 Agent 블록 2개다. 실제 개수만 남기거나 같은 구조로 반복한다.

Tool은 `단계 ①: 도구명 — 용도`처럼 수행 단계와 연결한다. 미정이면 필요한 기능과 도구 확인 필요를 구분한다. Input/Output의 항목·내용·출처 또는 저장 위치·형식을 빠뜨리지 않는다. 추가 필드·건수는 실제 자료 또는 사용자 확인이 있을 때만 채운다.

## 매핑 기준

| 정의서 또는 업무 분석 | PRD 목적지 | 통합 시 보완 |
|---|---|---|
| 모듈 Task 명·세부 Task 명 | 1.1 매핑 프로세스 | 모듈 하나에 대상 세부 Task 전부 표시 |
| 세부 Task 내 Agent 목록 | 1.4 RnR, Section 3, Section 4 | Agent ID, 담당 업무, 오너 구분 |
| As-Is·Pain Point·현행 시간 | Section 2 | 개선안과 한 행씩 대응 |
| Agent 이름·목적 | Section 4 | 모듈 내 중복 역할 확인 |
| 시작 조건 | Section 4 Trigger, Section 3 시작/연결 단계 | 전 단계 완료·승인 조건 |
| 수행 단계 | Section 4 수행 순서, Section 3 전체 흐름 | Human 단계를 포함하여 순서 연결 |
| Human 개입 지점 | Section 4, Section 3의 [HITL] | 검토자·검토 대상·판단 후 진행/반려 |
| Input·Output | Section 4, Section 3 연결 | Output→다음 Input 일치 |
| 단계별 Tool | Section 4 과정, Section 5.1 외부 연동 요청 | 도구 사용 가능성·인증은 별도 확인 |
| 기대 산출물 | Section 4 Output, Section 2 기대효과 | Section 6 성공 기준의 근거로 보존 |

Section 5는 외부 호출·접속 허용 요청서다. 데이터 반입 상세 계획을 합치지 않는다. 별도 계획서가 필요한 경우 Input의 출처·형식·건수·마스킹 확인사항을 그 계획서에 넘길 준비 정보로 관리한다. 현재 LH 데이터 반입 절차는 제공 자료만으로 확정하지 않는다.

## 추적표

작업 상태 traceability에 `task / agent / source / prd_sections / disposition`을 기록한다. disposition은 대상·Human 수행·보류·비범위 중 실제 합의 상태다. 독립 세부 Task는 억지로 직렬 연결하지 않고 분기·병렬 또는 공통 선행 단계로 표현한다. 전환된 전체 흐름의 추가 단계는 To-Be 제안으로 구분한다.
