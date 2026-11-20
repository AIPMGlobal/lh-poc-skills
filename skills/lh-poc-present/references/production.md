# 제작과 검증

제작은 [대화와 구성 제안](dialogue-workflow.md)에서 합의한 흐름이 있을 때 시작한다. 사용자가 논의를 건너뛰고 바로 만들라고 했다면, 자료에서 읽은 가장 설득력 있는 흐름으로 만들고 어떤 선택을 했는지 전달할 때 알린다.

## 긴 작업 나누기

자료 읽기, 전체 장 작성, 화면 변환을 한 번의 긴 작업에 몰아넣지 않는다. 작성 코드가 길면 몇 장씩 나눠 저장하고, 실제로 작성한 구간을 알린 뒤 이어 간다. 오류나 지연이 생기면 원인과 다음 조치를 알린다. 끝나지 않은 단계를 끝났다고 말하지 않는다.

## 제작 환경

사용 환경에 PPT 제작 스킬이나 도구가 있으면 그것을 쓰고 `assets/theme.json`의 좌표, 색, 글꼴을 적용한다.

PptxGenJS를 쓸 수 있으면 `scripts/pptx_helpers.cjs`를 불러온다. 도식은 AntV Infographic 템플릿으로 그리므로 함께 설치한다. 검증한 버전은 `pptxgenjs` 4.0.1, `@antv/infographic` 0.2.20이다. 모듈이 없으면 작업 폴더에서 `npm install pptxgenjs@4.0.1 @antv/infographic@0.2.20 svgpath`로 준비한다. Infographic 설치가 막힌 환경이면 `kit.flow`, `kit.swimlane` 같은 도우미로 같은 도식을 그리고, 그렇게 했다고 전달할 때 알린다. 실행할 수 없으면 파일을 만들었다고 보고하지 않는다.

```javascript
const PptxGenJS = require('pptxgenjs');
const {createKit} = require('/설치한/lh-poc-present/scripts/pptx_helpers.cjs');
const kit = createKit(PptxGenJS, {title: projectTitle, author: teamName, dept: deptName});
// kit.infographic 이 비동기라 전체를 async 함수 안에서 작성한다

// 표지: 업무 변화의 방향을 제목으로, 현재 위치를 사실대로
kit.coverSlide({title: directionTitle, subtitle, stage: currentStage, date, team: teamName});

// 핵심 요약: 한 줄 전후 대비
const s = kit.addSlide({label: '핵심 요약', title, source: sourceLine, notes: scriptAndOralNotes});
kit.headline(s, {before, after, note});

// 본문: 합의한 장마다. 도식은 references/diagrams.md, references/infographic.md
const s2 = kit.addSlide({label, title, source, notes});
const r = await kit.infographic(s2, infographicSyntax, {x:64, y:200, w:1152, h:440}, {roles});
kit.bullets(s2, [[1, bigPoint], [2, explanation], [3, detail], [4, reference]]);
kit.table(s3, rows, {x:64, y:190, w:1152, h:300, size:22});
kit.barChart(s4, {series: measuredSeries, box:{x:64, y:200, w:760, h:380}});

// 숨김 부록과 닫는 장
kit.addSlide({label: '부록', title: '근거와 해석 범위', hidden: true});
kit.closingSlide({statement: oneSentence, proofs: [proof1, proof2, proof3]});

await kit.pptx.writeFile({fileName: outputPath});
```

변수는 작성할 때 확보한 내용으로 채운다. 예시 수치를 기본값으로 넣지 않는다. 좌표와 `size`는 px다. `bullets`는 한 항목이 한 줄에 들어간다고 보고 단계를 맞추므로, 길면 문장을 줄이거나 항목을 나눈다. 화면 캡처는 `slide.addImage`로 넣는다.

발표자 노트는 장마다 발표 대본을 먼저 쓰고, 한 줄 띄운 뒤 `구두 보충:`으로 시작하는 단락에 화면에 넣지 않은 한계, 놓친 사례, 수치의 조건을 적는다.

## 내용 확인

- 합의한 핵심 메시지와 장 순서가 그대로인가.
- 표지에 현재 위치가 사실대로 있는가. 표지 다음 장이 한 줄 전후 대비로 결론을 말하는가.
- 전후 대비가 같은 구간, 같은 단위인가. 사람 시간과 Agent 처리 시간을 한 줄에 놓지 않았는가.
- 화면에 놓친 사례, 확인 필요, 미측정 같은 문구가 남지 않았는가. 그 내용이 구두 보충과 숨김 부록에 있는가.
- 수치의 성격과 가상 데이터 조건이 하단 출처 줄에 있는가.
- 코드, AI, 사람의 역할과 사람이 확인하는 지점이 도식에 보이는가.
- 화면에 개인정보가 남아 있지 않은가.
- 다른 과제나 참조 자료의 내용과 숫자가 남아 있지 않은가.
- 마지막 장이 요약 반복이 아니라 한 문장 선언인가.

## 화면과 편집 확인

전체 슬라이드를 실제 화면으로 바꿔 본다. PowerPoint, LibreOffice, 사용 환경의 발표자료 도구 중 쓸 수 있는 것을 쓴다. 글자 넘침, 한글 줄바꿈, 개조식 단계, 도식의 선과 상자 겹침, 차트 축, 표 높이, 로고와 제목의 겹침, 하단 줄을 본다. 글자를 줄이기 전에 내용과 배치를 고친다. 한 장에서 가장 큰 요소가 주장을 뒷받침하는 증거인지 확인한다.

```bash
python scripts/audit_pptx.py /작업/발표.pptx --require-chart-page 8
```

페이지 번호는 예다. 실제로 수치 차트가 있는 장 번호로 바꾸고, 차트가 없으면 붙이지 않는다. 이 검사는 16:9 비율, 가운뎃점, 화면에 남은 미완 문구, 쪽 번호, 발표자 노트, 기본 차트의 내장 데이터를 본다. 경고는 고칠지 확인하라는 뜻이고 오류는 고쳐야 한다.

구조 검사는 그래프 값이 원자료와 맞는지, 글자가 화면에서 넘치는지까지 보증하지 않는다. 차트 숫자를 원자료와 대조한다. PowerPoint를 실제로 열지 않았다면 열어 봤다고 말하지 않는다.

## 파일

원본은 그대로 두고 새 이름으로 저장한다. 팀 저장소 규칙이 `ver.N`을 붙이는 방식이면 그 규칙을 따른다. PDF를 만들 수 있으면 같은 최종본에서 내보내고 장수와 화면을 대조한다. 결과물은 PPTX와 PDF만 전달하고 검사 기록은 넣지 않는다.
