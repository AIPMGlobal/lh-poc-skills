# Infographic 템플릿으로 도식 그리기

업무 순서, 구성, 현행과 개선의 대비, 걸러지는 과정은 AntV Infographic(`@antv/infographic`) 템플릿으로 먼저 그린다. 짧은 문법 몇 줄로 정돈된 도식이 나오고, 같은 문법을 고치면 다시 그릴 수 있다. 역할 레인과 반려 경로, 시간이 붙은 현행과 개선, 현재 위치 표시는 [도식 그리기](diagrams.md)의 `kit` 도우미가 맡는다.

## 그림이 아니라 고칠 수 있는 도형으로 들어간다

Infographic은 SVG를 만들고, 글자는 그 안에 HTML로 넣는다. PowerPoint는 SVG 속 HTML 글자를 그리지 못해서, SVG를 그림으로 붙이면 글자가 사라지거나 팀이 고칠 수 없는 그림이 된다. 그래서 `kit.infographic`은 SVG를 사각형, 타원, 자유 도형, 선, 글상자로 하나씩 바꿔 넣는다. 발표 직전에 팀이 상자 하나, 글자 하나를 직접 고칠 수 있다는 기존 원칙이 그대로 지켜진다.

옮기면서 LH 기준에 맞게 바꾸는 것:

- 색은 LH 파랑(`#005DA4`) 한 색이 기본이다. `roles`를 주면 역할 색(코드 파랑, AI 초록, 사람 주황)을 항목 순서대로 칠한다.
- 글꼴은 맑은 고딕이다. 문법에 다른 `theme`을 적어도 LH 값으로 덮어쓴다.
- 그러데이션은 첫 색의 단색으로 바꾼다. 아이콘과 그림 요소는 옮기지 않는다.
- 템플릿에 박힌 `STEP 1`은 `1단계`로 바꾼다.

## 준비

작업 폴더에 한 번 설치한다. 검증한 버전은 `@antv/infographic` 0.2.20, `pptxgenjs` 4.0.1이다.

```bash
npm install pptxgenjs@4.0.1 @antv/infographic@0.2.20 svgpath
```

`kit.infographic`은 비동기 함수다. 슬라이드를 만드는 코드를 `async` 함수 안에 두고 `await`로 부른다.

## 검증한 템플릿만 쓴다

Infographic에는 템플릿이 200개 가까이 있지만, LH 발표 화면에서 글자가 16px 이상으로 읽히고 장식이 과하지 않은 것은 일부다. 아래 표의 템플릿은 1152x460px 영역에 넣어 화면으로 확인했다. 글자 크기는 그 영역에 넣었을 때 가장 작은 글자다.

| 보여 줄 것 | 템플릿 | 주 데이터 | 항목 수 | 가장 작은 글자 | 주로 쓰는 장 |
|---|---|---|---|---|---|
| 업무 순서(번호 화살표) | `list-row-simple-horizontal-arrow` | `lists` | 4~6 | 22px | 실제로 이렇게 씁니다, 기존 업무를 이렇게 바꿨습니다 |
| 긴 업무 순서(두 줄로 꺾임) | `sequence-snake-steps-compact-card` | `sequences` | 5~6 | 16px | 문제가 생기는 지점 |
| 세로 단계 목록 | `sequence-timeline-rounded-rect-node` | `sequences` | 3~6 | 22px | 사용 순서 |
| 올라가는 단계(확산 계획) | `sequence-ascending-steps` | `sequences` | 3~5 | 18px | 다음 단계와 요청 |
| 현행과 개선의 항목 대비 | `compare-hierarchy-left-right-circle-node-plain-text` | `compares`(두 묶음) | 묶음마다 2~4 | 19px | 기존 업무를 이렇게 바꿨습니다 |
| 구성과 범위 | `hierarchy-structure` | `root` | 2단계 깊이 | 22px | Agent가 맡는 범위, 다른 업무로의 확장 |
| 나란한 요점 | `list-grid-simple` | `lists` | 3~6 | 22px | 확인한 결과 요약 |
| 확인을 마친 항목 | `list-column-done-list` | `lists` | 3~6 | 29px | 무엇을 확인했는가 |
| 걸러지는 과정 | `sequence-funnel-simple` | `sequences` | 3 | 20px | 전체 건수 중 사람이 보는 건수 |

`list-column-done-list`의 체크 표시는 실제로 확인을 마친 항목에만 쓴다. `sequence-funnel-simple`의 폭은 숫자에 비례하지 않는다. 숫자는 `label`에 글자로 적고, 비율을 그림으로 보여 줘야 하면 `kit.barChart`를 쓴다.

## 쓰지 않는 템플릿과 그 이유

- 이름에 `icon`, `illus`, `badge`가 든 템플릿: 아이콘을 옮기지 않으므로 빈 원이 남는다. LH 기준도 장식 아이콘을 피하라고 한다.
- `letter-card`가 든 템플릿, `compare-swot`, `relation-dagre-flow`(기본형): 각 항목의 첫 글자를 크게 쓴다. 한글에서는 `현`, `개` 같은 글자 하나만 크게 남아 뜻이 흐려진다.
- `compare-binary-*`: 가운데에 `Pros`, `Cons` 영어 화살표가 고정으로 들어간다. 현행과 개선은 장단점이 아니다.
- `3d`, `gradient`, `candy`, `mountain`, `cylinders`, `roadmap-vertical`(길 모양): 장식이 과하다.
- `chart-*`: 숫자가 도형으로 굳어 데이터 편집으로 고칠 수 없다. 수치 그래프는 `kit.barChart`(PPT 기본 차트)로 그린다.
- `sequence-interaction-*`: 레인이 세로로 길어 발표 화면에서 글자가 9px까지 작아진다. 역할 레인은 `kit.swimlane`으로 그린다.
- `compare-quadrant-*`, `sequence-circular-*`, `list-column-simple-vertical-arrow`: 정사각형이거나 세로로 길어 글자가 16px 아래로 내려간다.

표에 없는 템플릿을 쓰고 싶으면 먼저 시험 장에 그려 화면으로 확인하고, 아래 `warning`이 없을 때만 쓴다.

## 문법 쓰는 법

첫 줄은 `infographic <템플릿 이름>`, 그 아래 `data` 블록이다. 들여쓰기는 공백 두 칸, 항목은 `-`로 시작한다. `theme` 블록은 쓰지 않는다. 도우미가 LH 테마를 붙인다. 템플릿마다 주 데이터 키는 하나만 쓴다(위 표의 `주 데이터`).

```javascript
// 업무 순서: 항목마다 담당 역할을 roles로 준다(코드 code, AI ai, 사람 human, 자료 data)
const s = kit.addSlide({label, title, source, notes});
kit.legend(s, {x:64, y:168});                       // 역할 색을 쓰면 범례를 함께 둔다
const r = await kit.infographic(s, `infographic list-row-simple-horizontal-arrow
data
  lists
    - label ${step1}
      desc ${note1}
    - label ${step2}
      desc ${note2}
    - label ${step3}
      desc ${note3}`, {x:64, y:200, w:1152, h:440}, {roles:['code', 'ai', 'human']});
if (r.warning) console.log(r.warning);

// 현행과 개선: compares 아래에 묶음 두 개, 비교할 항목은 각 묶음의 children
await kit.infographic(s2, `infographic compare-hierarchy-left-right-circle-node-plain-text
data
  compares
    - label 현행
      children
        - label ${before1}
        - label ${before2}
    - label 개선
      children
        - label ${after1}
        - label ${after2}`);

// 구성과 범위: root 하나에 children을 두 단계까지
await kit.infographic(s3, `infographic hierarchy-structure
data
  root
    label ${agentName}
    children
      - label ${partA}
        children
          - label ${taskA1}
      - label ${partB}`);
```

변수는 작성할 때 확보한 내용으로 채운다. 예시 문구나 수치를 기본값으로 넣지 않는다. 글자는 `label` 한 줄(12자 안팎)과 `desc` 한 줄이다. 넘치면 글자를 줄이지 말고 낱말을 줄인다.

`roles`는 `lists`나 `sequences`의 항목 순서와 같은 길이로 준다. 주지 않으면 LH 파랑 한 색이다. 역할 구분이 없는 장에서는 주지 않는다.

## 넣은 뒤 확인한다

`kit.infographic`이 돌려주는 값으로 먼저 본다.

- `scale`: SVG를 슬라이드에 맞춘 배율. 원래 크기의 1.6배까지만 키운다.
- `minFontPx`: 가장 작은 글자 크기(px). 16px 아래면 `warning`이 붙는다. 항목을 줄이거나, 두 장으로 나누거나, 영역을 키운다.
- `bounds`: 도식이 실제로 차지한 영역. 도식 아래에 설명 한 줄을 둘 때 이 값 아래에 둔다.

그다음 화면으로 바꿔 [도식 그리기](diagrams.md)의 확인 항목을 본다. 글자 폭은 브라우저 없이 계산한 값이라 맑은 고딕에서 줄바꿈이 달라질 수 있다. 상자 밖으로 글자가 넘치는지 꼭 본다.

선은 상자에 붙은 연결선이 아니라 따로 그린 선이다. 팀이 상자를 옮기면 선도 함께 옮겨야 한다고 전달할 때 알린다. 자주 고칠 도식이면 문법을 발표자 노트가 아니라 작업 기록에 남겨 두고 다시 그리는 편이 빠르다.
