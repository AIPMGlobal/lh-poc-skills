#!/usr/bin/env python3
"""Fill the bundled official PRD. Python 3 standard library only."""
import argparse
from pathlib import Path
from copy import deepcopy
from zipfile import ZipFile, ZIP_DEFLATED
import json
import xml.etree.ElementTree as E

W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS={'w':W}
E.register_namespace('w',W)
def q(n): return '{'+W+'}'+n
def txt(e): return ''.join(t.text or '' for t in e.iter(q('t')))
def write_cell(cell,value):
    if not isinstance(value,str) or not value.strip():
        raise ValueError('모든 작성 칸에 문자열 또는 [확인 필요: 질문]을 넣으세요.')
    p0=cell.find('w:p',NS)
    pp=deepcopy(p0.find('w:pPr',NS)) if p0 is not None and p0.find('w:pPr',NS) is not None else None
    rp0=cell.find('.//w:rPr',NS); rp=deepcopy(rp0) if rp0 is not None else None
    for e in list(cell):
        if e.tag!=q('tcPr'): cell.remove(e)
    for line in value.split('\n'):
        p=E.SubElement(cell,q('p'))
        if pp is not None: p.append(deepcopy(pp))
        r=E.SubElement(p,q('r'))
        if rp is not None: r.append(deepcopy(rp))
        rpr=r.find('w:rPr',NS)
        if rpr is None: rpr=E.SubElement(r,q('rPr'))
        for tag in ('color','u'):
            for c in list(rpr.findall('w:'+tag,NS)): rpr.remove(c)
        E.SubElement(rpr,q('color'),{q('val'):'000000'})
        E.SubElement(r,q('t')).text=line
def fill(table,rows):
    original=table.findall('w:tr',NS)
    sample=deepcopy(original[1])
    width=len(sample.findall('w:tc',NS))
    for r in original[1:]: table.remove(r)
    if not rows: raise ValueError('표에 행이 없습니다. 미확정 내용은 확인 질문으로 입력하세요.')
    for values in rows:
        if len(values)!=width: raise ValueError(f'열 개수 불일치: 필요 {width}개 / 입력 {len(values)}개')
        row=deepcopy(sample)
        for c,v in zip(row.findall('w:tc',NS),values): write_cell(c,v)
        # Allow rows to grow; prevent ordinary records splitting over pages.
        pr=row.find('w:trPr',NS)
        if pr is None: pr=E.SubElement(row,q('trPr'))
        for h in list(pr.findall('w:trHeight',NS)): pr.remove(h)
        E.SubElement(pr,q('cantSplit'))
        table.append(row)
    hp=original[0].find('w:trPr',NS)
    if hp is None: hp=E.SubElement(original[0],q('trPr'))
    repeat=hp.find('w:tblHeader',NS)
    if repeat is None: repeat=E.SubElement(hp,q('tblHeader'))
    repeat.set(q('val'),'1')
    for p in original[0].iter(q('p')):
        pp=p.find('w:pPr',NS)
        if pp is None: pp=E.SubElement(p,q('pPr'))
        for k in list(pp.findall('w:keepNext',NS)): pp.remove(k)
        E.SubElement(pp,q('keepNext'))

def build(state,output,draft=False):
    if state.get('schema_version')!=2: raise ValueError('schema_version은 2이어야 합니다.')
    if not str(state.get('source_text','')).strip(): raise ValueError('업무 설명 또는 Agent 정의서 원문이 없습니다.')
    reviews=state.get('reviews',{})
    if not draft and any(reviews.get(str(i)) not in ('reviewed','deferred') for i in range(1,6)):
        raise ValueError('Section 1~5 검토가 완료되지 않았습니다. 중간 출력은 --draft를 사용하세요.')
    agents=state['agents']
    if not agents: raise ValueError('Agent가 한 개 이상 필요합니다.')
    template=Path(__file__).resolve().parents[1]/'assets/LH_PoC_PRD_template.docx'
    if output.resolve()==template.resolve(): raise ValueError('템플릿 원본을 덮어쓸 수 없습니다.')
    with ZipFile(template) as z: parts={n:z.read(n) for n in z.namelist()}
    doc=E.fromstring(parts['word/document.xml']); body=doc.find('w:body',NS)
    tables=body.findall('w:tbl',NS)
    if len(tables)!=16 or '과제명' not in txt(tables[0]): raise ValueError('동봉 템플릿 구조와 일치하지 않습니다.')
    t=state['tables']
    for i,key in [(0,'metadata'),(1,'members'),(2,'basic'),(3,'overview'),(4,'stakeholders'),(5,'rnr'),(6,'comparison'),(7,'effects'),(8,'considerations'),(9,'flow'),(12,'external')]:
        fill(tables[i],t[key])
    labels=['Agent 이름','목적 (한 줄)','담당자','시작 조건 (Trigger)','Input','Output','수행 단계 (순서)','Human 개입 지점','AI 기술 유형','과정 (구현 플랫폼 노드)','결과 화면 (선택)']
    keys=['name','purpose','owner','trigger','input','output','steps','human_review','ai_type','nodes','screen']
    children=list(body); a=children.index(tables[10]); b=children.index(tables[11])
    heading=children[a-1]; proto=deepcopy(tables[10]); insert_at=a-1
    # Remove both original Agent blocks including their interstitial guides.
    end=b+1
    for e in children[a-1:end]: body.remove(e)
    for number,agent in enumerate(agents,1):
        h=deepcopy(heading)
        for e in list(h):
            if e.tag!=q('pPr'): h.remove(e)
        E.SubElement(E.SubElement(h,q('r')),q('t')).text=f'Agent {number}'
        table=deepcopy(proto)
        values=[]
        for label,key in zip(labels,keys):
            v=agent[key]
            if key=='name': v=f"A{number:02d} {v} / 세부 Task: {agent['task']}"
            if key=='steps': v += '\n단계별 Tool: ' + agent['tools']
            if key=='output': v += '\n기대 산출물: ' + agent['expected_result']
            values.append([label,v])
        fill(table,values)
        body.insert(insert_at,h); body.insert(insert_at+1,table); insert_at+=2
    for table,width in [(tables[13],4),(tables[14],4),(tables[15],5)]:
        key={13:'scope',14:'success',15:'ui'}[tables.index(table)]
        rows=t.get(key) or [[f'Agent {n}']+['후속 멘토링에서 확정']*(width-1) for n in range(1,len(agents)+1)]
        fill(table,rows)
    # Remove writing instructions only, preserving official headings and structure.
    guidance=False
    for e in list(body):
        if e.tag!=q('p'): continue
        s=txt(e).strip()
        if s=='작성 방법': guidance=True
        if s.startswith('A.') or s.startswith('A '): guidance=False
        if guidance or s.startswith('작성 TIP:'): body.remove(e)
    # Reflow filled content; manual blank-form page breaks cause sparse pages.
    for p in body.iter(q('p')):
        pp=p.find('w:pPr',NS)
        if pp is not None:
            for br in list(pp.findall('w:pageBreakBefore',NS)): pp.remove(br)
        for r in p.findall('w:r',NS):
            for br in list(r.findall('w:br',NS)):
                if br.get(q('type'))=='page': r.remove(br)
    for p in body.findall('w:p',NS):
        s=txt(p).strip()
        if not s: continue
        pp=p.find('w:pPr',NS)
        if pp is None: pp=E.SubElement(p,q('pPr'))
        if s.startswith(('Section ','1.','2.','3.','4.','5.','6.','7.','Agent ','A.','B.','C.')):
            for k in list(pp.findall('w:keepNext',NS)): pp.remove(k)
            E.SubElement(pp,q('keepNext'))
        if s.startswith(('A. 과제','B. Agent','C. 후속','Section 3.')):
            E.SubElement(pp,q('pageBreakBefore'))
        # Google Docs export can retain run-in paragraph borders via frame data.
        for frame in list(pp.findall('w:framePr',NS)): pp.remove(frame)
    parts['word/document.xml']=E.tostring(doc,encoding='utf-8',xml_declaration=True)
    output.parent.mkdir(parents=True,exist_ok=True)
    with ZipFile(output,'w',ZIP_DEFLATED) as z:
        for n,data in parts.items(): z.writestr(n,data)
    with ZipFile(output) as z:
        if z.testzip(): raise ValueError('DOCX ZIP 검증 실패')
        rendered=txt(E.fromstring(z.read('word/document.xml')))
        for forbidden in ('D-Studio','노드 이름 또는 URL','① → ② → …'):
            if forbidden in rendered: raise ValueError('미치환 안내 문구: '+forbidden)
    return output

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--state',required=True,type=Path)
    p.add_argument('--output',required=True,type=Path)
    p.add_argument('--draft',action='store_true')
    a=p.parse_args()
    try:
        result=build(json.loads(a.state.read_text(encoding='utf-8')),a.output,a.draft)
        print(result)
    except (ValueError,KeyError,TypeError) as exc:
        p.exit(2,str(exc)+'\n')
