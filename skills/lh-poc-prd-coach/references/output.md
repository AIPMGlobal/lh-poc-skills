# 작업 상태와 파일 출력

`assets/session_state.template.json`을 작업 폴더로 복사하고 채운다. 원문 source_text, sources(파일·자료 위치), working_notes(근거·수정·질문), work_context(모듈 Task, 대상 세부 Task, 기간 3주, 통합 PRD, 구현 플랫폼), traceability를 유지한다. 여러 세부 Task 명은 work_context.detailed_task에 목록 문자열로 기록해도 된다. schema_version은 2다.

reviews의 Section 1~5 값은 pending/draft/reviewed/deferred. 실제 검토한 경우만 reviewed, 명시적 보류인 경우만 deferred. 중간 초안은 --draft로 생성하며 모든 상태를 reviewed로 바꿔서 검사를 우회하지 않는다. 이 파일은 워크샵 초안이므로 미확정 칸을 유지할 수 있다.

## tables: 머리글 제외 행 배열

| 키 | 열 순서 |
|---|---|
| metadata | 과제명, 모듈 Task 명, 작성일, 버전 |
| members | 구성원 전체(1칸) |
| basic | 항목, 내용 — 과제명/매핑 프로세스/과제 오너 3행 |
| overview | 과제 개요(1칸) |
| stakeholders | 주관 부서, 협업 부서, 외부 파트너 |
| rnr | 항목, 담당자 — 모듈리더 및 실제 Agent별 행 |
| comparison | No., As-Is, To-Be, 소요시간 |
| effects | 구분, 내용 — 정량/정성 2행 |
| considerations | 추진 시 고려사항(1칸) |
| flow | 순서, 단계(세부 Task 포함), 주체, 담당 Agent ID·이름, Input, Output |
| external | Agent ID·이름, 서비스/노드/링크, 용도, 인증, 준비, 대안 |

모든 칸은 비어 있지 않은 문자열. 줄바꿈은 JSON의 \n. 근거가 없으면 확인 필요. 이름과 ID(A01, A02…)를 모든 표에서 통일한다. metadata·basic의 과제명 및 work_context·metadata의 모듈 Task는 일치시킨다.

agents는 실제 Agent별 객체다. task/name/purpose/owner/trigger/input/output/steps/human_review/ai_type/nodes/screen/tools/expected_result는 모두 문자열이다. task에는 담당 세부 Task(공통 Agent이면 관련 목록), tools에는 단계별 Tool을 기록한다. nodes는 업무 수준 처리 흐름과 실제 구현 환경 확인 상태다. 정의서는 이 목록 전체를 한 문서로 만들고 세부 Task별 소속을 명시한다. PRD는 같은 목록을 Section 4로 가져간다.

Section 6·7은 기본적으로 후속 멘토링 표시다. 요청받아 작성할 때만 tables에 scope(Agent, Must, Should, Out), success(Agent, 정량 기준, 정성 기준, 정상/예외 시나리오), ui(Agent, 기능, 표시 데이터·출처, 레퍼런스, 우선순위)의 행 배열을 추가한다. 선택적 표도 모든 칸을 채우고 미정은 확인 필요로 쓴다.

## 검증과 전달

정의서의 모든 Agent가 PRD Section 4에 있고, Section 3의 흐름·Section 5 요청과 일치하는지 확인한다. 모든 대상 세부 Task의 disposition을 추적한다. 변경 전후의 담당자·입출력·Human 단계가 일치해야 한다. DOCX 내부의 문서·표 구조, 템플릿 원본 미변경을 확인한다. 긴 내용은 의미를 줄이지 말고 행과 페이지가 늘어나도록 한다.

렌더/문서 미리보기가 있으면 모든 페이지에서 글자 잘림·표 겹침·빈 페이지·Agent 제목 분리를 확인한다. 문제를 고치면 재확인한다. 생성한 DOCX 2개를 다운로드 링크로 제공한다. 실제 생성되지 않았거나 시각 검증하지 않은 내용을 완료했다고 표현하지 않는다.
