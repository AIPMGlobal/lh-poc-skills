# 도식 그리기

업무 흐름, 역할과 책임, 현행과 개선, 적용 단계는 글보다 그림이 빠르다. 도식은 편집 가능한 도형과 선으로 그린다. 그림 파일로 붙이지 않는다. 발표 직전에 팀이 상자 하나, 글자 하나를 직접 고칠 수 있어야 하기 때문이다.

## 먼저 정할 것

도식을 그리기 전에 다음을 글로 적는다. 이것이 정해지지 않으면 그림도 흐려진다.

1. **단계:** 실제 업무 순서대로. 한 도식에 4~7단계가 읽기 좋다. 더 많으면 묶거나 두 장으로 나눈다.
2. **담당:** 단계마다 코드, AI, 사람 중 누가 하는가.
3. **넘기는 것:** 단계 사이에 무엇이 넘어가는가(파일, 결과, 승인).
4. **사람이 확인하는 지점:** 어디서 검토하고 승인하며, 반려되면 어디로 돌아가는가.

## 역할의 색

역할은 세 색으로 고정한다. 색만으로 뜻을 전하지 않도록 범례(`kit.legend`)를 함께 둔다.

| 역할 | 기준 | 색 |
|---|---|---|
| 코드 | 규칙으로 정답이 정해지는 일. 계산, 분류, 대조, 양식 채우기 | 파랑 |
| AI | 읽고 해석하고 쓰는 일. 문서 이해, 사유 분류, 문안 초안 | 초록 |
| 사람 | 책임이 따르는 판단. 검토, 승인, 확정 | 주황 |
| 자료, 산출물 | 넘어가는 파일과 결과 | 회색 |

규칙 처리만 한 단계를 AI 색으로 칠하지 않는다. 'AI Agent'라는 이름 아래에서도 실제로 한 일이 계산이면 코드다. 이 구분이 흐리면 듣는 사람은 책임이 어디 있는지 알 수 없다.

## 도식 고르기

도식은 두 가지 도구로 그린다. 둘 다 결과는 편집 가능한 도형과 글상자다.

- **Infographic 템플릿(먼저 쓴다):** 업무 순서, 구성과 범위, 현행과 개선의 항목 대비, 확인한 항목, 걸러지는 과정. 문법 몇 줄로 그리고 LH 색과 글꼴이 자동으로 붙는다. 쓸 수 있는 템플릿과 문법은 [Infographic 템플릿으로 도식 그리기](infographic.md)에 있다.
- **kit 도우미:** Infographic 템플릿이 표현하지 못하는 것. 반려 경로가 있는 역할 레인, 단계마다 시간이 붙은 현행과 개선, 현재 위치 표시, 미정 단계(빨간 점선), 한 줄 전후 대비.

| 보여 줄 것 | 도식 | 그리는 도구 | 주로 쓰는 장 |
|---|---|---|---|
| 입력에서 결과까지의 순서 | 단계 흐름 | `kit.infographic` + `list-row-simple-horizontal-arrow`(5~6단계를 두 줄로 꺾으려면 `sequence-snake-steps-compact-card`, 7단계 이상은 묶거나 두 장으로) | 실제로 이렇게 씁니다, 문제가 생기는 지점 |
| 현행과 개선의 항목 대비 | 좌우 대비 | `kit.infographic` + `compare-hierarchy-left-right-circle-node-plain-text` | 기존 업무를 이렇게 바꿨습니다 |
| Agent가 맡는 범위, 확장 범위 | 구성도 | `kit.infographic` + `hierarchy-structure` | 운영 범위, 다른 업무로의 확장 |
| 확인한 것, 나란한 요점 | 체크 목록, 요점 격자 | `kit.infographic` + `list-column-done-list`, `list-grid-simple` | 무엇을 확인했는가 |
| 전체 건수 중 사람이 보는 건수 | 깔때기 | `kit.infographic` + `sequence-funnel-simple` | 사람과 AI의 역할 |
| 확산 계획 | 올라가는 단계 | `kit.infographic` + `sequence-ascending-steps` | 다음 단계와 요청 |
| 누가 어느 단계를 맡고 어디서 넘기며, 반려되면 어디로 가는가 | 역할 레인 | `kit.swimlane` | 기존 업무를 이렇게 바꿨습니다, 운영 책임 |
| 같은 업무의 전과 후, 단계별 시간 | 현행과 개선 비교 | `kit.beforeAfter` | 기존 업무를 이렇게 바꿨습니다 |
| 결론을 한 줄로 | 한 줄 전후 대비 | `kit.headline` | 핵심 요약 |
| 지금 어디까지 왔는가 | 단계와 현재 위치 | `kit.stages` | 다음 단계와 요청 |
| 위에 없는 관계 | 상자와 선을 직접 | `kit.node`, `kit.connect` | 조건 분기, 되돌아가는 경로 |

한 장에 도식은 하나다. 도식 옆이나 아래에는 그 그림에서 읽어야 할 것을 한두 줄로 적는다. 모든 장에 도식을 넣지 않는다. 실제 화면이 증거인 장에는 화면을 크게 둔다.

## 그리는 법

좌표와 크기는 px(1280×720 기준)다. 내용 영역은 y172부터 y648 안쪽이다. Infographic 템플릿의 문법과 예시는 [infographic.md](infographic.md)를 본다.

```javascript
// Infographic 템플릿: 문법만 쓰면 LH 색과 글꼴이 붙는다. roles는 항목 순서의 역할
kit.legend(s, {x:64, y:168});
const r = await kit.infographic(s, syntax, {x:64, y:200, w:1152, h:440}, {roles:['code', 'ai', 'human', 'human']});
if (r.warning) { /* 글자가 16px 아래: 항목을 줄이거나 장을 나눈다 */ }

// 역할 레인: 가로줄이 담당, 왼쪽에서 오른쪽으로 시간 순서
kit.legend(s, {x:64, y:160});
kit.swimlane(s, {
  lanes: [{key:'human', label:'사람'}, {key:'code', label:'코드'}, {key:'ai', label:'AI'}],
  steps: [
    {lane:'human', label:stepName, sub:shortNote},
    {lane:'code',  label:stepName},
    {lane:'human', label:reviewStep},        // 사람이 확인하는 지점
    {lane:'ai',    label:draftStep},
    {lane:'human', label:confirmStep},
  ],
  backs: [{from:2, to:1, label:'반려하면 다시 처리'}],   // steps 의 순번(0부터)
}, {x:64, y:200, w:1152, h:330});

// 현행과 개선: 같은 업무 단계를 나란히
kit.beforeAfter(s, {
  before: {title:'현행', steps:[{label, time}, ...], total:totalBefore},
  after:  {title:'개선', steps:[{label, time, role:'code'}, {label, time, role:'human'}], total:totalAfter},
}, {x:64, y:186, w:1152, h:400});

// 단계 흐름: 6개가 넘으면 두 줄로 나뉜다
kit.flow(s, [{label, sub, role:'data'}, {label, role:'code'}, {label, role:'human'}], {x:64, y:220, w:1152, h:120});

// 단계와 현재 위치
kit.stages(s, [{label:'1단계', sub, state:'done'}, {label:'2단계', sub, state:'now'}, {label:'3단계', sub, state:'next'}],
  {x:64, y:230, w:1152, h:260});
```

레인의 줄은 담당자 이름으로 바꿔도 된다(`{key:'kim', label:'김태경', role:'code'}`). 그때는 `role`로 그 사람이 맡은 일의 성격을 정해 색을 맞춘다.

상자 안의 글자는 큰 글자 한 줄(최대 10자 안팎)과 작은 글자 한 줄이다. 넘치면 글자를 줄이지 말고 낱말을 줄인다. Infographic 템플릿도 같다.

## 지킬 것

- **실제 순서대로 그린다.** 구현하지 않은 연결, 아직 없는 자동 전송을 실선으로 그리지 않는다. 계획 단계는 `kit.stages`의 다음 단계로 보여 준다.
- **사람이 확인하는 지점을 뺀 그림은 완성이 아니다.** 검토와 승인이 있는 업무라면 사람 상자가 흐름 안에 있어야 한다. 반려 경로가 있으면 점선(`backs`)으로 그린다.
- **현행과 개선은 같은 단계 이름을 쓴다.** 개선 쪽에서 없어진 단계는 빼지 말고 누가 대신하는지 보여 준다. 시간은 같은 단위로 적고, 개선 쪽 시간에는 사람의 검토 시간을 넣는다.
- **미정 단계는 화면에 올리지 않는다.** 담당이나 기준이 정해지지 않은 단계는 구두 보충에 둔다. 팀 내부 논의용 도식이거나 교육생이 화면에 넣기를 원하면 `gap:true`로 빨간 점선 상자를 쓴다.
- **도구 내부 구조를 업무 흐름처럼 그리지 않는다.** 노드와 프롬프트 연결은 듣는 사람이 판단할 대상이 아니다.
- **화살표는 한 방향으로 흐른다.** 왼쪽에서 오른쪽, 위에서 아래다. 선이 상자를 가로지르면 단계를 다시 배치한다.

## 확인

Infographic 템플릿은 `kit.infographic`이 돌려준 `warning`부터 본다. 화면으로 바꿔 본 뒤 다음을 본다. 상자 안 글자가 넘치지 않는가. 선이 상자나 글자를 지나가지 않는가. 범례가 있는가. 처음 보는 사람이 왼쪽 위에서 시작해 끝까지 따라갈 수 있는가. 사람 상자가 몇 개인지 세어 보고 실제 업무의 검토 횟수와 맞는지 대조한다.
