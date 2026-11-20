/* PptxGenJS 환경에서 LH 발표 공통 서식과 도식을 제공한다. 이야기와 장 구성은 팀 자료에 맞게 정한다. */
const path = require('path');
const theme = require('../assets/theme.json');
const ASSET = name => path.join(__dirname, '..', 'assets', theme.assets[name]);
const inch = value => value / 96;
const pt = value => value * 0.75;

function createKit(PptxGenJS, metadata = {}) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({name:'LH_POC', width:theme.canvas.inchWidth, height:theme.canvas.inchHeight});
  pptx.layout = 'LH_POC';
  pptx.author = metadata.author || '';
  pptx.subject = 'LH AI Agent PoC 결과와 현업 적용 제안';
  pptx.title = metadata.title || 'LH AI Agent PoC 발표';
  pptx.lang = 'ko-KR';
  pptx.theme = {headFontFace:theme.font, bodyFontFace:theme.font, lang:'ko-KR'};
  const dept = metadata.dept || '';   // 하단 오른쪽에 넣을 발표 부서 이름
  let page = 0;

  function text(slide, value, box, options = {}) {
    slide.addText(value, {x:inch(box.x), y:inch(box.y), w:inch(box.w), h:inch(box.h),
      fontFace:theme.font, fontSize:pt(box.size || theme.body.size),
      color:theme.colors.body, margin:0, breakLine:false, valign:'top',
      paraSpaceAfterPt:0, ...options});
  }

  function image(slide, name, box) {
    slide.addImage({path:ASSET(name), x:inch(box.x), y:inch(box.y), w:inch(box.w), h:inch(box.h)});
  }

  /* 표지: LH 권장양식(표지가 있는 보고서)의 구성. 슬로건, 두 줄 띠 사이의 제목, 날짜, 소속.
     stage = 현재 위치(예: 가상 데이터 500건 시험 단계). 사실대로 적는다 */
  function coverSlide({title, subtitle = '', stage = '', date = '', team = '', notes = ''}) {
    if (page !== 0) throw new Error('표지는 1쪽입니다.');
    page += 1;
    const slide = pptx.addSlide();
    slide.background = {color:theme.colors.background};
    image(slide, 'slogan', {x:64, y:52, w:280, h:80});
    image(slide, 'bar', {x:140, y:226, w:1000, h:10});
    text(slide, title, {x:140, y:250, w:1000, h:130, size:46},
      {bold:true, color:'000000', align:'center', valign:'middle'});
    image(slide, 'bar', {x:140, y:394, w:1000, h:10});
    if (subtitle) text(slide, subtitle, {x:140, y:420, w:1000, h:40, size:24}, {align:'center', color:theme.colors.muted});
    if (stage) slide.addText(stage, {x:inch(440), y:inch(476), w:inch(400), h:inch(38), fontFace:theme.font,
      fontSize:pt(19), bold:true, color:theme.colors.primary, align:'center', valign:'middle', margin:0,
      shape:pptx.ShapeType.roundRect, rectRadius:0.2, fill:{color:theme.colors.light}, line:{color:theme.colors.primary, width:1}});
    if (date) text(slide, date, {x:140, y:544, w:1000, h:40, size:26}, {align:'center', bold:true});
    if (team) text(slide, team, {x:140, y:604, w:1000, h:48, size:30}, {align:'center', bold:true});
    if (notes) slide.addNotes(notes);
    return slide;
  }

  /* 본문 장. label = 제목 위의 짧은 구분(예: 핵심 요약, 기존 업무의 문제), source = 하단 출처 줄.
     hidden:true 면 숨김 부록 */
  function addSlide({title, label = '', source = '', notes = '', hidden = false}) {
    page += 1;
    const slide = pptx.addSlide();
    slide.background = {color:theme.colors.background};
    if (hidden) slide.hidden = true;
    if (label) text(slide, label, theme.header, {color:theme.colors.primary, bold:true});
    text(slide, title, theme.title, {color:theme.colors.title, bold:true, valign:'middle'});
    image(slide, 'bar', theme.titleBar);
    image(slide, 'logo', theme.logo);
    if (source) text(slide, source, theme.source, {color:theme.colors.muted, valign:'middle'});
    text(slide, dept ? `${dept}   ${page}` : String(page), theme.footer, {align:'right', color:theme.colors.muted, valign:'middle'});
    if (notes) slide.addNotes(notes);
    return slide;
  }

  /* 목차가 필요한 긴 발표에만 쓴다. items = 합의한 장 이름 */
  function agendaSlide(items) {
    const slide = addSlide({title:'목차'});
    const half = Math.ceil(items.length / 2), step = Math.min(96, 440 / half);
    items.forEach((name, i) => {
      const x = i < half ? 64 : 668, y = 190 + (i % half) * step;
      text(slide, String(i+1).padStart(2,'0'), {x, y, w:52, h:40, size:24}, {color:theme.colors.primary, bold:true});
      text(slide, name, {x:x+60, y, w:484, h:50, size:25}, {color:theme.colors.title});
    });
    return slide;
  }

  /* 한 줄 전후 대비: 같은 구간, 같은 단위의 두 값을 크게. note = 아래에 붙는 한 줄 */
  function headline(slide, {before, after, beforeLabel = '지금', afterLabel = '바뀐 뒤', note = '', size = 60}, box = {x:64, y:186, w:1152, h:190}) {
    const w = (box.w - 120) / 2;
    slide.addShape(pptx.ShapeType.rect, {x:inch(box.x), y:inch(box.y), w:inch(box.w), h:inch(box.h),
      fill:{color:theme.colors.light}, line:{color:theme.colors.light, width:0.5}});
    text(slide, beforeLabel, {x:box.x, y:box.y + 18, w, h:28, size:19}, {align:'center', color:theme.colors.muted, bold:true});
    text(slide, before, {x:box.x, y:box.y + 50, w, h:90, size}, {align:'center', valign:'middle', bold:true, color:theme.colors.muted});
    slide.addShape(pptx.ShapeType.rightArrow, {x:inch(box.x + w + 30), y:inch(box.y + 70), w:inch(60), h:inch(50),
      fill:{color:theme.colors.primary}, line:{color:theme.colors.primary, width:0.5}});
    text(slide, afterLabel, {x:box.x + w + 120, y:box.y + 18, w, h:28, size:19}, {align:'center', color:theme.colors.primary, bold:true});
    text(slide, after, {x:box.x + w + 120, y:box.y + 50, w, h:90, size}, {align:'center', valign:'middle', bold:true, color:theme.colors.title});
    if (note) text(slide, note, {x:box.x, y:box.y + box.h - 40, w:box.w, h:28, size:20}, {align:'center', color:theme.colors.body});
  }

  /* 닫는 장: 한 문장 선언과 근거 세 가지 */
  function closingSlide({statement, proofs = [], notes = ''}) {
    page += 1;
    const slide = pptx.addSlide();
    slide.background = {color:theme.colors.background};
    image(slide, 'bar', {x:140, y:196, w:1000, h:8});
    text(slide, statement, {x:140, y:220, w:1000, h:170, size:42}, {bold:true, color:theme.colors.title, align:'center', valign:'middle'});
    image(slide, 'bar', {x:140, y:406, w:1000, h:8});
    const w = 1000 / Math.max(proofs.length, 1);
    proofs.forEach((p, i) => text(slide, p, {x:140 + i * w + 10, y:440, w:w - 20, h:90, size:22}, {align:'center', color:theme.colors.body}));
    image(slide, 'slogan', {x:500, y:584, w:280, h:80});
    if (notes) slide.addNotes(notes);
    return slide;
  }

  /* LH 개조식: level 1 □, 2 ㅇ, 3 -, 4 *(참고). items = [[level, text]] 또는 [{level, text, bold}] */
  function bullets(slide, items, box = theme.body) {
    const b = theme.bullets;
    // 단락마다 왼쪽 여백을 따로 줄 수 없어, 줄 앞에 줄바꿈되지 않는 공백을 넣어 단계를 맞춘다.
    // 그래서 한 항목은 한 줄에 들어가게 쓴다. 두 줄로 넘어가면 둘째 줄이 왼쪽 끝에서 시작한다.
    const pad = n => ' '.repeat(Math.round(n / 8.5));
    const runs = items.map((raw, i) => {
      const it = Array.isArray(raw) ? {level:raw[0], text:raw[1]} : raw;
      const k = Math.min(Math.max(it.level || 1, 1), 4) - 1;
      return {text:`${pad(b.indent[k])}${b.marks[k]} ${it.text}`, options:{
        fontFace:theme.font, fontSize:pt(b.size[k]), bold:!!it.bold || k === 0,
        color:k === 3 ? theme.colors.muted : k === 0 ? theme.colors.title : theme.colors.body,
        paraSpaceBefore:i === 0 ? 0 : b.gapBefore[k], breakLine:i < items.length - 1}};
    });
    slide.addText(runs, {x:inch(box.x), y:inch(box.y), w:inch(box.w), h:inch(box.h), margin:0, valign:'top'});
  }

  function table(slide, rows, box, options = {}) {
    const cells = rows.map((row, ri) => row.map(value => ({text:String(value), options:{
      bold:ri === 0, color:ri === 0 ? theme.colors.title : theme.colors.body,
      align:ri === 0 ? 'center' : undefined, valign:'middle',
      fill:{color:ri === 0 ? theme.colors.light : theme.colors.background}}})));
    slide.addTable(cells, {x:inch(box.x), y:inch(box.y), w:inch(box.w), h:inch(box.h),
      fontFace:theme.font, fontSize:pt(box.size || 22), color:theme.colors.body,
      border:{type:'solid', color:theme.colors.line, pt:0.75}, margin:pt(9),
      autoPage:false, ...options});
  }

  function barChart(slide, {series, box, percent = false, max, options = {}}) {
    if (!Array.isArray(series) || !series.length) throw new Error('실제 수치 계열을 제공하세요.');
    const labels = series[0].labels;
    if (!Array.isArray(labels) || !labels.length) throw new Error('범주 이름이 필요합니다.');
    for (const s of series) {
      if (JSON.stringify(s.labels) !== JSON.stringify(labels) || s.values.length !== labels.length ||
          s.values.some(v => !Number.isFinite(v) || v < 0 || (percent && v > 1))) {
        throw new Error('같은 범주와 유한한 음수 아닌 값을 사용하세요. 비율은 0~1입니다.');
      }
    }
    const whole = series.every(s => s.values.every(Number.isInteger));
    const numFmt = percent ? '0.0%' : whole ? '#,##0' : '#,##0.0';
    slide.addChart(pptx.ChartType.bar, series, {
      x:inch(box.x), y:inch(box.y), w:inch(box.w), h:inch(box.h),
      catAxisLabelFontFace:theme.font, catAxisLabelFontSize:pt(20),
      valAxisLabelFontFace:theme.font, valAxisLabelFontSize:pt(17),
      dataLabelFormatCode:numFmt, valAxisLabelFormatCode:percent ? '0%' : whole ? '#,##0' : '#,##0.0',
      dataLabelFontFace:theme.font, dataLabelFontSize:pt(19),
      catAxisLabelColor:theme.colors.body, valAxisLabelColor:theme.colors.muted,
      dataLabelColor:theme.colors.title, dataLabelPosition:'outEnd',
      // 계열이 하나면 막대를 한 색으로 둔다. 범주마다 색을 바꾸면 색에 뜻이 있는 것처럼 보인다.
      chartColors:series.length === 1 ? [theme.colors.primary] : [theme.colors.muted, theme.colors.primary, theme.colors.green],
      showLegend:series.length > 1, legendPos:'b', showValue:true, showTitle:false,
      legendFontFace:theme.font, legendFontSize:pt(17), barDir:'col', barGrouping:'clustered',
      catAxisLineColor:theme.colors.line, valAxisLineColor:theme.colors.line,
      valGridLine:{color:theme.colors.line, width:0.5},
      ...options, valAxisMinVal:0, ...(percent ? {valAxisMaxVal:1} : max !== undefined ? {valAxisMaxVal:max} : {})
    });
  }

  /* ===== 도식: 모두 편집 가능한 도형과 선으로 그린다. 좌표와 크기는 px ===== */
  const ROLE = theme.roles;
  const roleOf = key => ROLE[key] || ROLE.data;

  /* 글자가 든 상자 하나. role = code | ai | human | data, gap:true 면 미정(빨간 점선) */
  function node(slide, {label, sub = '', role = 'data', gap = false}, box) {
    const r = roleOf(role);
    const runs = [{text:label, options:{bold:true, fontSize:pt(box.size || 19), color:theme.colors.body, breakLine:!!sub}}];
    if (sub) runs.push({text:sub, options:{fontSize:pt((box.size || 19) - 4), color:theme.colors.muted}});
    slide.addText(runs, {shape:pptx.ShapeType.roundRect, rectRadius:0.06,
      x:inch(box.x), y:inch(box.y), w:inch(box.w), h:inch(box.h),
      fill:{color:gap ? 'FDECEC' : r.fill},
      line:{color:gap ? theme.colors.alert : r.line, width:1.5, dashType:gap ? 'dash' : 'solid'},
      fontFace:theme.font, align:'center', valign:'middle', margin:pt(6)});
  }

  function seg(slide, x1, y1, x2, y2, arrow = false, dashed = false) {
    const horizontal = y1 === y2;
    const forward = horizontal ? x2 >= x1 : y2 >= y1;
    slide.addShape(pptx.ShapeType.line, {
      x:inch(Math.min(x1, x2)), y:inch(Math.min(y1, y2)),
      w:inch(Math.abs(x2 - x1)), h:inch(Math.abs(y2 - y1)),
      line:{color:theme.colors.muted, width:1.5, dashType:dashed ? 'dash' : 'solid',
        ...(arrow ? (forward ? {endArrowType:'triangle'} : {beginArrowType:'triangle'}) : {})}});
  }

  /* 상자 a의 오른쪽에서 상자 b의 왼쪽으로. 높이가 다르면 꺾은선 */
  function connect(slide, a, b, dashed = false) {
    const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
    if (Math.abs(y1 - y2) < 1) return seg(slide, x1, y1, x2, y2, true, dashed);
    const mid = Math.round((x1 + x2) / 2);
    seg(slide, x1, y1, mid, y1, false, dashed);
    seg(slide, mid, y1, mid, y2, false, dashed);
    seg(slide, mid, y2, x2, y2, true, dashed);
  }

  /* 역할 범례. 색만으로 뜻을 전하지 않도록 도식 옆에 함께 둔다 */
  function legend(slide, {x, y, roles = ['code', 'ai', 'human']}) {
    roles.forEach((key, i) => {
      const r = roleOf(key), lx = x + i * 210;
      slide.addShape(pptx.ShapeType.roundRect, {x:inch(lx), y:inch(y + 3), w:inch(22), h:inch(16), rectRadius:0.03,
        fill:{color:r.fill}, line:{color:r.line, width:1.5}});
      text(slide, r.name, {x:lx + 30, y, w:175, h:24, size:16}, {color:theme.colors.muted});
    });
  }

  /* 단계 흐름: 왼쪽에서 오른쪽으로. 6개가 넘으면 두 줄로 나눈다.
     steps = [{label, sub, role, gap}] */
  function flow(slide, steps, box) {
    const perRow = steps.length > 6 ? Math.ceil(steps.length / 2) : steps.length;
    const rows = Math.ceil(steps.length / perRow), gapX = 34, gapY = 46;
    const w = (box.w - gapX * (perRow - 1)) / perRow;
    const h = Math.min(110, (box.h - gapY * (rows - 1)) / rows);
    const boxes = steps.map((s, i) => {
      const b = {x:box.x + (i % perRow) * (w + gapX), y:box.y + Math.floor(i / perRow) * (h + gapY), w, h, size:box.size};
      node(slide, s, b); return b;
    });
    boxes.forEach((b, i) => {
      if (i === 0) return;
      const a = boxes[i - 1];
      if (a.y === b.y) return connect(slide, a, b);
      // 줄이 바뀔 때: 앞 줄 끝에서 내려와 다음 줄 처음으로
      const yMid = a.y + a.h + gapY / 2;
      seg(slide, a.x + a.w / 2, a.y + a.h, a.x + a.w / 2, yMid);
      seg(slide, a.x + a.w / 2, yMid, b.x + b.w / 2, yMid);
      seg(slide, b.x + b.w / 2, yMid, b.x + b.w / 2, b.y, true);
    });
    return boxes;
  }

  /* 역할 레인: 가로줄이 담당(코드, AI, 사람 또는 팀원), 왼쪽에서 오른쪽으로 시간 순서.
     lanes = [{key, label, role}], steps = [{lane, label, sub, role, gap}]
     backs = [{from, to, label}] 는 반려 경로(점선). from, to 는 steps 의 순번(0부터) */
  function swimlane(slide, {lanes, steps, backs = []}, box) {
    const labelW = 120, n = steps.length, gapX = 26;
    const laneH = box.h / lanes.length;
    const colW = (box.w - labelW - gapX * (n + 1)) / n;
    const nodeH = Math.min(84, laneH - 26);
    lanes.forEach((lane, i) => {
      const y = box.y + i * laneH, r = roleOf(lane.role || lane.key);
      slide.addShape(pptx.ShapeType.rect, {x:inch(box.x), y:inch(y), w:inch(box.w), h:inch(laneH),
        fill:{color:i % 2 ? 'FFFFFF' : 'F7F9FB'}, line:{color:theme.colors.line, width:0.75}});
      slide.addText(lane.label, {x:inch(box.x), y:inch(y), w:inch(labelW), h:inch(laneH),
        fontFace:theme.font, fontSize:pt(18), bold:true, color:r.line === ROLE.data.line ? theme.colors.muted : r.text,
        align:'center', valign:'middle', margin:0});
    });
    const index = key => Math.max(0, lanes.findIndex(l => l.key === key));
    const boxes = steps.map((s, i) => {
      const li = index(s.lane);
      const b = {x:box.x + labelW + gapX + i * (colW + gapX), y:box.y + li * laneH + (laneH - nodeH) / 2, w:colW, h:nodeH, size:box.size || 19};
      node(slide, {role:lanes[li].role || lanes[li].key, ...s}, b); return b;
    });
    boxes.forEach((b, i) => { if (i) connect(slide, boxes[i - 1], b); });
    backs.forEach(k => {
      const a = boxes[k.from], b = boxes[k.to];
      const y = box.y + box.h + 14;
      seg(slide, a.x + a.w / 2, a.y + a.h, a.x + a.w / 2, y, false, true);
      seg(slide, a.x + a.w / 2, y, b.x + b.w / 2, y, false, true);
      seg(slide, b.x + b.w / 2, y, b.x + b.w / 2, b.y + b.h, false, true);
      slide.addShape(pptx.ShapeType.triangle, {x:inch(b.x + b.w / 2 - 6), y:inch(b.y + b.h), w:inch(12), h:inch(10),
        fill:{color:theme.colors.muted}, line:{color:theme.colors.muted, width:0.5}});
      if (k.label) text(slide, k.label, {x:Math.min(a.x, b.x), y:y + 4, w:Math.abs(a.x - b.x) + a.w, h:22, size:15},
        {align:'center', color:theme.colors.muted});
    });
    return boxes;
  }

  /* 현행과 개선 비교: 같은 업무 단계를 위에서 아래로 나란히 둔다.
     before / after = {title, steps:[{label, time, role, gap}], total} */
  function beforeAfter(slide, {before, after}, box) {
    const gap = 70, w = (box.w - gap) / 2;
    [before, after].forEach((side, si) => {
      const x = box.x + si * (w + gap), isAfter = si === 1;
      slide.addText(side.title, {x:inch(x), y:inch(box.y), w:inch(w), h:inch(40), fontFace:theme.font, fontSize:pt(21),
        bold:true, color:'FFFFFF', align:'center', valign:'middle', margin:0,
        fill:{color:isAfter ? theme.colors.primary : theme.colors.muted}});
      const rows = side.steps.length, footH = side.total ? 46 : 0;
      const rowH = Math.min(64, (box.h - 52 - footH) / rows);
      side.steps.forEach((s, i) => {
        const y = box.y + 52 + i * rowH;
        node(slide, {label:s.label, role:s.role || 'data', gap:s.gap}, {x, y, w:w - 150, h:rowH - 10, size:18});
        text(slide, s.time || '', {x:x + w - 140, y, w:128, h:rowH - 10, size:19},
          {align:'right', valign:'middle', bold:true, color:theme.colors.body});
      });
      if (side.total) {
        const y = box.y + 52 + rows * rowH;
        slide.addShape(pptx.ShapeType.line, {x:inch(x), y:inch(y), w:inch(w), h:0, line:{color:theme.colors.line, width:1}});
        text(slide, side.total, {x, y:y + 8, w, h:34, size:22}, {align:'right', bold:true, color:isAfter ? theme.colors.primary : theme.colors.body});
      }
    });
    slide.addShape(pptx.ShapeType.rightArrow, {x:inch(box.x + w + 18), y:inch(box.y + box.h / 2 - 18), w:inch(34), h:inch(36),
      fill:{color:theme.colors.primary}, line:{color:theme.colors.primary, width:0.5}});
  }

  /* 단계와 현재 위치: state = done | now | next. 현재 위치를 사실대로 표시한다 */
  function stages(slide, items, box) {
    const gap = 14, w = (box.w - gap * (items.length - 1)) / items.length, headH = 54;
    items.forEach((it, i) => {
      const x = box.x + i * (w + gap), now = it.state === 'now', done = it.state === 'done';
      slide.addText(it.label, {shape:i === 0 ? pptx.ShapeType.homePlate : pptx.ShapeType.chevron,
        x:inch(x), y:inch(box.y), w:inch(w), h:inch(headH), fontFace:theme.font, fontSize:pt(20), bold:true,
        color:now ? 'FFFFFF' : done ? theme.colors.primary : theme.colors.muted, align:'center', valign:'middle', margin:0,
        fill:{color:now ? theme.colors.primary : done ? theme.colors.light : 'F1F2F3'},
        line:{color:now ? theme.colors.primary : done ? theme.colors.primary : '9A9C9F', width:1}});
      if (now) text(slide, '현재 위치', {x, y:box.y - 28, w, h:24, size:16}, {align:'center', bold:true, color:theme.colors.primary});
      if (it.sub) text(slide, it.sub, {x:x + 8, y:box.y + headH + 12, w:w - 16, h:box.h - headH - 12, size:19},
        {align:'left', color:theme.colors.body, breakLine:true});
    });
  }

  /* AntV Infographic 문법으로 그린 도식을 편집 가능한 도형과 글상자로 넣는다. references/infographic.md
     opts.roles = ['human','code','ai'] 처럼 항목(레인) 순서의 역할. 없으면 LH 파랑 한 색 */
  async function infographic(slide, syntax, box = {x:64, y:186, w:1152, h:462}, opts = {}) {
    return require('./infographic.cjs').addInfographic(pptx, slide, syntax, box, opts);
  }

  return {pptx, theme, inch, pt, coverSlide, addSlide, agendaSlide, closingSlide, headline, text, image, bullets, table, barChart,
    node, connect, legend, flow, swimlane, beforeAfter, stages, infographic};
}
module.exports = {createKit, theme, inch, pt};
