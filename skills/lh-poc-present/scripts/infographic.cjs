/* AntV Infographic(@antv/infographic) 문법으로 도식을 그린 뒤, PPT에서 직접 고칠 수 있는 도형과 글상자로 옮긴다.
   Infographic은 글자를 HTML(foreignObject)로 넣는데 PowerPoint는 이것을 그리지 못한다. 그래서 SVG를 그림으로
   붙이지 않고 사각형, 타원, 자유 도형, 선, 글상자로 하나씩 바꾼다. 색은 LH 색, 글꼴은 맑은 고딕으로 맞춘다. */
const theme = require('../assets/theme.json');

// 모듈은 작업 폴더(npm install 한 곳)에서 찾는다. 스킬 폴더에는 node_modules가 없다.
function need(name) {
  try { return require(name); } catch (_) {
    return require(require.resolve(name, {paths:[process.cwd()]}));
  }
}

const ROLE_COLOR = {code:theme.colors.primary, ai:theme.colors.green, human:theme.colors.orange, data:'9A9C9F'};

/* LH 테마를 붙인다. 문법에 theme 블록이 있어도 색과 글꼴은 LH 값으로 바꾼다.
   roles = ['human','code','ai'] 처럼 항목(또는 레인) 순서대로 역할을 주면 그 순서로 역할 색을 칠한다.
   roles가 없으면 LH 파랑 한 색이다. 한 장에서 강조색은 하나라는 디자인 원칙을 따른다. */
function lhSyntax(syntax, {roles, palette} = {}) {
  const lines = String(syntax).replace(/\t/g, '  ').split('\n');
  const out = [];
  let skip = false;
  for (const line of lines) {
    if (/^theme\b/.test(line)) { skip = true; continue; }
    if (skip && /^\S/.test(line)) skip = false;
    if (!skip) out.push(line);
  }
  while (out.length && !out[out.length - 1].trim()) out.pop();
  const colors = palette || (roles ? roles.map(r => ROLE_COLOR[r] || ROLE_COLOR.data) : [theme.colors.primary]);
  // colorPrimary는 연결 화살표처럼 팔레트를 따르지 않는 요소의 색이다. 기본값(분홍)을 LH 파랑으로 바꾼다.
  out.push('theme', `  colorPrimary #${theme.colors.primary}`, `  palette ${colors.map(c => '#' + c.replace('#', '')).join(' ')}`,
    '  base', '    text', '      font-family Malgun Gothic');
  return out.join('\n') + '\n';
}

async function renderSVG(syntax, opts = {}) {
  const {renderToString} = need('@antv/infographic/ssr');
  const origWarn = console.warn, origLog = console.log;
  const quiet = (...a) => { if (!/not registered/.test(String(a[0]))) origWarn(...a); };
  console.warn = quiet; console.log = (...a) => { if (!/not registered/.test(String(a[0]))) origLog(...a); };
  try { return await renderToString(lhSyntax(syntax, opts)); }
  finally { console.warn = origWarn; console.log = origLog; }
}

/* ---------- 행렬 ---------- */
const I = [1, 0, 0, 1, 0, 0];
const mul = (m, n) => [m[0]*n[0] + m[2]*n[1], m[1]*n[0] + m[3]*n[1], m[0]*n[2] + m[2]*n[3], m[1]*n[2] + m[3]*n[3],
  m[0]*n[4] + m[2]*n[5] + m[4], m[1]*n[4] + m[3]*n[5] + m[5]];
const apply = (m, x, y) => [m[0]*x + m[2]*y + m[4], m[1]*x + m[3]*y + m[5]];
function parseTransform(str) {
  let m = I;
  if (!str) return m;
  for (const [, fn, raw] of str.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const a = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    let t = I;
    if (fn === 'translate') t = [1, 0, 0, 1, a[0] || 0, a[1] || 0];
    else if (fn === 'scale') t = [a[0], 0, 0, a[1] ?? a[0], 0, 0];
    else if (fn === 'matrix') t = a;
    else if (fn === 'rotate') {
      const r = (a[0] || 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
      t = [c, s, -s, c, 0, 0];
      if (a.length >= 3) t = mul(mul([1, 0, 0, 1, a[1], a[2]], t), [1, 0, 0, 1, -a[1], -a[2]]);
    }
    m = mul(m, t);
  }
  return m;
}
const isAxisAligned = m => Math.abs(m[1]) < 1e-6 && Math.abs(m[2]) < 1e-6;

/* ---------- 색 ---------- */
const NAMED = {white:'FFFFFF', black:'000000', red:'FF0000', gray:'808080', grey:'808080'};
function parseColor(v) {
  if (!v) return null;
  v = v.trim();
  if (v === 'none' || v === 'transparent') return null;
  if (NAMED[v.toLowerCase()]) return {hex:NAMED[v.toLowerCase()], a:1};
  let m = v.match(/^#([0-9a-f]{3})$/i);
  if (m) return {hex:m[1].split('').map(c => c + c).join('').toUpperCase(), a:1};
  m = v.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (m) return {hex:m[1].toUpperCase(), a:m[2] ? parseInt(m[2], 16) / 255 : 1};
  m = v.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    return {hex:p.slice(0, 3).map(n => Math.round(n).toString(16).padStart(2, '0')).join('').toUpperCase(), a:p[3] ?? 1};
  }
  return null;
}

/* ---------- 변환 ---------- */
function placeSVG(pptx, slide, svgText, box, opts = {}) {
  const {minFontPx = 16, upscale = 1.6} = opts;
  const {DOMParser} = need('linkedom');
  const svgpath = need('svgpath');
  const doc = new DOMParser().parseFromString(svgText.replace(/^<\?xml[^>]*\?>\s*/gm, ''), 'image/svg+xml');
  const svg = doc.querySelector('svg');
  const vb = (svg.getAttribute('viewBox') || `0 0 ${svg.getAttribute('width')} ${svg.getAttribute('height')}`).split(/[\s,]+/).map(Number);
  const scale = Math.min(box.w / vb[2], box.h / vb[3], upscale);
  const offX = box.x + (box.w - vb[2] * scale) / 2, offY = box.y + (box.h - vb[3] * scale) / 2;
  const root = [scale, 0, 0, scale, offX - vb[0] * scale, offY - vb[1] * scale];
  const inch = v => v / 96, pt = v => v * 0.75;
  const font = theme.font;
  const report = {scale, minFontPx:Infinity, shapes:0, texts:0, skipped:{}};

  // 그러데이션은 쓰지 않는다(LH 디자인 기준). 첫 색으로 바꾼다.
  const defs = {};
  doc.querySelectorAll('linearGradient, radialGradient, mask').forEach(g => { defs[g.getAttribute('id')] = g; });
  function paint(value, opacity) {
    if (!value) return null;
    const ref = value.match(/url\(#([^)]+)\)/);
    if (ref) {
      const g = defs[ref[1]];
      const stops = g ? Array.from(g.querySelectorAll('stop')) : [];
      if (!stops.length) return null;
      const s = stops[0];
      const c = parseColor(s.getAttribute('stop-color'));
      if (!c) return null;
      // 0에서 끝나는 흐린 그러데이션(화살표 장식)은 중간 투명도로 둔다
      const so = Number(s.getAttribute('stop-opacity') ?? 1);
      return {hex:c.hex, a:c.a * so * opacity};
    }
    const c = parseColor(value);
    return c ? {hex:c.hex, a:c.a * opacity} : null;
  }
  const fillOpt = p => p ? {color:p.hex, transparency:Math.round((1 - Math.min(1, p.a)) * 100)} : {type:'none'};
  function lineOpt(el, st, m) {
    const p = paint(st.stroke, st.opacity * st.strokeOpacity);
    if (!p || st.strokeWidth <= 0) return {type:'none'};
    const k = Math.sqrt(Math.abs(m[0]*m[3] - m[1]*m[2]));
    return {color:p.hex, transparency:Math.round((1 - Math.min(1, p.a)) * 100),
      width:Math.max(0.5, pt(st.strokeWidth * k)), dashType:st.dash ? 'dash' : 'solid'};
  }

  function styleOf(el, parent) {
    const g = n => el.getAttribute(n);
    const css = {};
    (g('style') || '').split(';').forEach(kv => { const i = kv.indexOf(':'); if (i > 0) css[kv.slice(0, i).trim()] = kv.slice(i + 1).trim(); });
    const pick = n => css[n] ?? g(n);
    return {
      fill:pick('fill') ?? parent.fill,
      stroke:pick('stroke') ?? parent.stroke,
      strokeWidth:Number(pick('stroke-width') ?? parent.strokeWidth),
      dash:(pick('stroke-dasharray') ?? parent.dash) && (pick('stroke-dasharray') ?? parent.dash) !== 'none' ? (pick('stroke-dasharray') ?? parent.dash) : null,
      opacity:parent.opacity * Number(pick('opacity') ?? 1),
      fillOpacity:Number(pick('fill-opacity') ?? parent.fillOpacity),
      strokeOpacity:Number(pick('stroke-opacity') ?? parent.strokeOpacity),
      fontSize:Number(String(pick('font-size') ?? parent.fontSize).replace('px', '')),
      fontWeight:pick('font-weight') ?? parent.fontWeight,
      anchor:pick('text-anchor') ?? parent.anchor,
      baseline:pick('dominant-baseline') ?? parent.baseline,
      visible:pick('display') !== 'none' && pick('visibility') !== 'hidden',
    };
  }

  // 점 목록을 자유 도형 하나로. points는 슬라이드 px 좌표
  function custom(points, fill, line) {
    const xs = [], ys = [];
    points.forEach(p => { if (p.x !== undefined) { xs.push(p.x); ys.push(p.y); }
      if (p.curve) { xs.push(p.curve.x1, p.curve.x2 ?? p.curve.x1); ys.push(p.curve.y1, p.curve.y2 ?? p.curve.y1); } });
    if (!xs.length) return;
    const x0 = Math.min(...xs), y0 = Math.min(...ys);
    const w = Math.max(Math.max(...xs) - x0, 0.5), h = Math.max(Math.max(...ys) - y0, 0.5);
    const rel = points.map(p => {
      if (p.close) return {close:true};
      const q = {x:inch(p.x - x0), y:inch(p.y - y0)};
      if (p.moveTo) q.moveTo = true;
      if (p.curve) q.curve = {type:p.curve.type, x1:inch(p.curve.x1 - x0), y1:inch(p.curve.y1 - y0),
        ...(p.curve.x2 !== undefined ? {x2:inch(p.curve.x2 - x0), y2:inch(p.curve.y2 - y0)} : {})};
      return q;
    });
    slide.addShape(pptx.ShapeType.custGeom, {x:inch(x0), y:inch(y0), w:inch(w), h:inch(h), points:rel, fill, line});
    report.shapes += 1;
  }

  function pathPoints(d, m) {
    const pts = [];
    let cx = 0, cy = 0, sx = 0, sy = 0;
    svgpath(d).abs().unshort().unarc().iterate(seg => {
      const [c, ...a] = seg;
      if (c === 'M') { [cx, cy] = [a[0], a[1]]; [sx, sy] = [cx, cy]; const [x, y] = apply(m, cx, cy); pts.push({x, y, moveTo:true}); }
      else if (c === 'L' || c === 'H' || c === 'V') {
        if (c === 'L') [cx, cy] = [a[0], a[1]]; else if (c === 'H') cx = a[0]; else cy = a[0];
        const [x, y] = apply(m, cx, cy); pts.push({x, y});
      } else if (c === 'C') {
        const [x1, y1] = apply(m, a[0], a[1]), [x2, y2] = apply(m, a[2], a[3]); [cx, cy] = [a[4], a[5]];
        const [x, y] = apply(m, cx, cy); pts.push({x, y, curve:{type:'cubic', x1, y1, x2, y2}});
      } else if (c === 'Q') {
        const [x1, y1] = apply(m, a[0], a[1]); [cx, cy] = [a[2], a[3]];
        const [x, y] = apply(m, cx, cy); pts.push({x, y, curve:{type:'quadratic', x1, y1}});
      } else if (c === 'Z' || c === 'z') { pts.push({close:true}); [cx, cy] = [sx, sy]; }
    });
    return pts;
  }

  // 검은 사각형으로 가린 곧은 선(시퀀스 레인의 세로선)은 가린 구간을 잘라 낸다
  function maskedSegments(d, maskId) {
    const mask = defs[maskId];
    const m = d.match(/^\s*M\s*([\d.-]+)[\s,]+([\d.-]+)\s*L\s*([\d.-]+)[\s,]+([\d.-]+)\s*$/i);
    if (!mask || !m) return null;
    let [x1, y1, x2, y2] = m.slice(1).map(Number);
    const holes = Array.from(mask.querySelectorAll('rect')).filter(r => r.getAttribute('fill') === 'black')
      .map(r => ['x', 'y', 'width', 'height'].map(k => Number(r.getAttribute(k))));
    if (x1 === x2) {
      let segs = [[Math.min(y1, y2), Math.max(y1, y2)]];
      holes.filter(([hx, , hw]) => x1 >= hx && x1 <= hx + hw).forEach(([, hy, , hh]) => {
        segs = segs.flatMap(([a, b]) => hy >= b || hy + hh <= a ? [[a, b]] : [[a, hy], [hy + hh, b]].filter(([p, q]) => q - p > 1));
      });
      return segs.map(([a, b]) => `M ${x1} ${a} L ${x1} ${b}`);
    }
    if (y1 === y2) {
      let segs = [[Math.min(x1, x2), Math.max(x1, x2)]];
      holes.filter(([, hy, , hh]) => y1 >= hy && y1 <= hy + hh).forEach(([hx, , hw]) => {
        segs = segs.flatMap(([a, b]) => hx >= b || hx + hw <= a ? [[a, b]] : [[a, hx], [hx + hw, b]].filter(([p, q]) => q - p > 1));
      });
      return segs.map(([a, b]) => `M ${a} ${y1} L ${b} ${y1}`);
    }
    return null;
  }

  // 템플릿에 박힌 영어 글자를 한국어로 바꾼다(예: STEP 1 -> 1단계)
  const textMap = [[/^STEP\s*(\d+)$/i, '$1단계'], ...(opts.textMap || [])];
  function addText(content, x, y, w, h, opts) {
    for (const [re, to] of textMap) content = content.replace(re, to);
    const size = opts.size;
    report.minFontPx = Math.min(report.minFontPx, size);
    slide.addText(content, {x:inch(x), y:inch(y), w:inch(w), h:inch(h), fontFace:font, fontSize:pt(size),
      color:opts.color, bold:opts.bold, align:opts.align, valign:opts.valign, margin:0, fit:'none',
      wrap:opts.wrap !== false, paraSpaceAfterPt:0, lineSpacingMultiple:opts.lineHeight || 1.0});
    report.texts += 1;
  }

  function walk(el, m, parent) {
    const tag = (el.localName || el.tagName || '').toLowerCase();
    if (['defs', 'mask', 'lineargradient', 'radialgradient', 'clippath', 'style', 'title', 'desc'].includes(tag)) return;
    const st = styleOf(el, parent);
    if (!st.visible) return;
    const mm = mul(m, parseTransform(el.getAttribute('transform')));
    const n = k => Number(el.getAttribute(k) || 0);
    const fp = () => fillOpt(paint(st.fill, st.opacity * st.fillOpacity));

    if (tag === 'g' || tag === 'svg' || tag === 'a') {
      Array.from(el.children).forEach(c => walk(c, mm, st));
      return;
    }
    if (tag === 'rect') {
      const w = n('width'), h = n('height');
      if (w <= 0 || h <= 0) return;
      const fill = fp(), line = lineOpt(el, st, mm);
      if (fill.type === 'none' && line.type === 'none') return;
      const x = n('x'), y = n('y'), rx = Math.min(n('rx') || n('ry'), w / 2, h / 2);
      if (isAxisAligned(mm)) {
        const [X1, Y1] = apply(mm, x, y), [X2, Y2] = apply(mm, x + w, y + h);
        const W = Math.abs(X2 - X1), H = Math.abs(Y2 - Y1);
        slide.addShape(rx > 0 ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {x:inch(Math.min(X1, X2)), y:inch(Math.min(Y1, Y2)),
          w:inch(W), h:inch(H), fill, line, ...(rx > 0 ? {rectRadius:inch(rx * Math.abs(mm[0]))} : {})});
        report.shapes += 1;
      } else {
        custom(pathPoints(`M${x},${y}H${x + w}V${y + h}H${x}Z`, mm), fill, line);
      }
      return;
    }
    if (tag === 'circle' || tag === 'ellipse') {
      const cx = n('cx'), cy = n('cy'), rx = tag === 'circle' ? n('r') : n('rx'), ry = tag === 'circle' ? n('r') : n('ry');
      if (rx <= 0 || ry <= 0) return;
      const fill = fp(), line = lineOpt(el, st, mm);
      if (fill.type === 'none' && line.type === 'none') return;
      const [X1, Y1] = apply(mm, cx - rx, cy - ry), [X2, Y2] = apply(mm, cx + rx, cy + ry);
      slide.addShape(pptx.ShapeType.ellipse, {x:inch(Math.min(X1, X2)), y:inch(Math.min(Y1, Y2)),
        w:inch(Math.abs(X2 - X1)), h:inch(Math.abs(Y2 - Y1)), fill, line});
      report.shapes += 1;
      return;
    }
    if (tag === 'line') {
      const line = lineOpt(el, st, mm);
      if (line.type === 'none') return;
      custom(pathPoints(`M${n('x1')},${n('y1')}L${n('x2')},${n('y2')}`, mm), {type:'none'}, line);
      return;
    }
    if (tag === 'polygon' || tag === 'polyline') {
      const nums = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
      if (nums.length < 4) return;
      let d = `M${nums[0]},${nums[1]}`;
      for (let i = 2; i + 1 < nums.length; i += 2) d += `L${nums[i]},${nums[i + 1]}`;
      if (tag === 'polygon') d += 'Z';
      const fill = tag === 'polygon' ? fp() : {type:'none'}, line = lineOpt(el, st, mm);
      if (fill.type === 'none' && line.type === 'none') return;
      custom(pathPoints(d, mm), fill, line);
      return;
    }
    if (tag === 'path') {
      const d = el.getAttribute('d');
      if (!d) return;
      const fill = fp(), line = lineOpt(el, st, mm);
      if (fill.type === 'none' && line.type === 'none') return;
      const maskRef = (el.getAttribute('mask') || '').match(/url\(#([^)]+)\)/);
      const pieces = maskRef ? maskedSegments(d, maskRef[1]) : null;
      (pieces || [d]).forEach(p => custom(pathPoints(p, mm), fill, line));
      return;
    }
    if (tag === 'text') {
      const content = el.textContent.trim();
      if (!content) return;
      const k = Math.abs(mm[0]);
      const size = st.fontSize * k;
      const [X, Y] = apply(mm, n('x'), n('y'));
      const w = Math.max(content.length * size * 1.05, size * 2), h = size * 1.5;
      const align = st.anchor === 'middle' ? 'center' : st.anchor === 'end' ? 'right' : 'left';
      const left = align === 'center' ? X - w / 2 : align === 'right' ? X - w : X;
      const central = /central|middle/.test(st.baseline || '');
      const top = central ? Y - h / 2 : Y - size * 1.1;
      const c = paint(st.fill, st.opacity * st.fillOpacity);
      addText(content, left, top, w, h, {size, color:c ? c.hex : theme.colors.body, bold:/bold|[6-9]00/.test(st.fontWeight || ''),
        align, valign:'middle', wrap:false});
      return;
    }
    if (tag === 'foreignobject') {
      const span = el.firstElementChild;
      const content = (span ? span.textContent : el.textContent).trim();
      if (!content) return;
      const css = {};
      (span?.getAttribute('style') || '').split(';').forEach(kv => { const i = kv.indexOf(':'); if (i > 0) css[kv.slice(0, i).trim()] = kv.slice(i + 1).trim(); });
      const k = Math.abs(mm[0]);
      const size = parseFloat(css['font-size'] || '14') * k;
      const [X1, Y1] = apply(mm, n('x'), n('y')), [X2, Y2] = apply(mm, n('x') + n('width'), n('y') + n('height'));
      let x = Math.min(X1, X2), y = Math.min(Y1, Y2), w = Math.abs(X2 - X1), h = Math.abs(Y2 - Y1);
      const align = /center/.test(css['text-align'] || css['justify-content'] || '') ? 'center'
        : /right|end/.test(css['text-align'] || css['justify-content'] || '') ? 'right' : 'left';
      const v = css['align-items'] || css['align-content'] || '';
      const valign = /center/.test(v) ? 'middle' : /end/.test(v) ? 'bottom' : 'top';
      // 브라우저 없이 잰 폭이라 맑은 고딕에서 넘칠 수 있다. 가운데 정렬 글은 양옆으로 조금 넓혀 둔다.
      if (align === 'center') { const extra = w * 0.12; x -= extra / 2; w += extra; }
      h = Math.max(h, size * 1.35);
      const c = parseColor(css.color) || {hex:theme.colors.body};
      addText(content, x, y, w, h, {size, color:c.hex, bold:/bold|[6-9]00/.test(css['font-weight'] || ''),
        align, valign, lineHeight:Math.min(1.2, Number(css['line-height']) || 1.2)});
      return;
    }
    report.skipped[tag] = (report.skipped[tag] || 0) + 1;   // image, use(아이콘) 등은 옮기지 않는다
  }

  walk(svg, root, {fill:'black', stroke:null, strokeWidth:1, dash:null, opacity:1, fillOpacity:1, strokeOpacity:1,
    fontSize:14, fontWeight:'normal', anchor:'start', baseline:null});
  report.bounds = {x:offX, y:offY, w:vb[2] * scale, h:vb[3] * scale};
  if (report.minFontPx < minFontPx) {
    report.warning = `가장 작은 글자가 ${report.minFontPx.toFixed(1)}px입니다. 항목을 줄이거나 상자를 키우세요(기준 ${minFontPx}px).`;
  }
  return report;
}

/* 한 번에: 문법 -> LH 테마 -> SVG -> 편집 가능한 도형. box는 px(1280x720 기준) */
async function addInfographic(pptx, slide, syntax, box, opts = {}) {
  const svg = await renderSVG(syntax, opts);
  return placeSVG(pptx, slide, svg, box, opts);
}

module.exports = {lhSyntax, renderSVG, placeSVG, addInfographic, ROLE_COLOR};
