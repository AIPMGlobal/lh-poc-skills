#!/usr/bin/env python3
"""Fill the user's LH DOCX template; Python 3 standard library only."""
import argparse
import json
from pathlib import Path
from copy import deepcopy
from zipfile import ZipFile, ZIP_DEFLATED
import xml.etree.ElementTree as E
from build_prd import q, NS, txt, write_cell


def build(state, output):
    template = Path(__file__).resolve().parents[1] / 'assets/LH_Agent_definition_template.docx'
    if output.resolve() == template.resolve():
        raise ValueError('템플릿 원본을 덮어쓸 수 없습니다.')
    if state.get('schema_version') != 2 or not state.get('agents'):
        raise ValueError('schema_version 2와 실제 Agent 정보가 필요합니다.')
    with ZipFile(template) as z:
        parts = {n: z.read(n) for n in z.namelist()}
    root = E.fromstring(parts['word/document.xml'])
    body = root.find('w:body', NS)
    tables = body.findall('w:tbl', NS)
    if len(tables) != 7:
        raise ValueError('동봉 LH Agent 정의서 구조와 다릅니다.')
    context = state['work_context']
    write_cell(tables[0].findall('w:tr', NS)[0].find('w:tc', NS), '모듈 Task 명: ' + context['module_task'])
    groups = {}
    for number, agent in enumerate(state['agents'], 1):
        groups.setdefault(agent['task'], []).append(f"A{number:02d} {agent['name']}")
    write_cell(tables[0].findall('w:tr', NS)[1].find('w:tc', NS), '세부 Task 내 Agent:\n' + '\n'.join(
        f"세부 Task 명: {task} / 소속 Agent: {', '.join(names)}" for task, names in groups.items()))
    children = list(body)
    start = next(i for i, e in enumerate(children) if e.tag == q('p') and txt(e).strip().startswith('[Agent 1]'))
    end = next(i for i, e in enumerate(children) if e.tag == q('p') and txt(e).strip().startswith('[Agent 2]'))
    proto = [deepcopy(e) for e in children[start:end]
             if not txt(e).strip().startswith('* 세부 Task')]
    for e in children[start:]:
        if e.tag != q('sectPr'):
            body.remove(e)
    pos = start
    for number, agent in enumerate(state['agents'], 1):
        block = [deepcopy(e) for e in proto]
        title = block[0]
        for e in list(title):
            if e.tag != q('pPr'):
                title.remove(e)
        E.SubElement(E.SubElement(title, q('r')), q('t')).text = f"[Agent {number} · A{number:02d}] {agent['task']}"
        block_tables = [e for e in block if e.tag == q('tbl')]
        values = [
            [('시작 조건', 'trigger'), ('기대 산출물', 'expected_result'), ('Human 개입 지점', 'human_review')],
            [('Tool (단계별 사용 Tool 명시)', 'tools'), ('Input (데이터 항목·내용·출처·형식)', 'input'),
             ('Output (데이터 항목·내용·저장위치·형식)', 'output')],
            [('Agent 이름', 'name'), ('Agent 목적', 'purpose'), ('수행 단계(순서)', 'steps')]
        ]
        for table, fields in zip(block_tables, values):
            for row, (label, key) in zip(table.findall('w:tr', NS), fields):
                write_cell(row.find('w:tc', NS), label + ': ' + agent[key])
                pr = row.find('w:trPr', NS)
                if pr is None:
                    pr = E.SubElement(row, q('trPr'))
                E.SubElement(pr, q('cantSplit'))
                if pr is not None:
                    for height in list(pr.findall('w:trHeight', NS)):
                        pr.remove(height)
        for e in block:
            body.insert(pos, e)
            pos += 1
    # Preserve template styling; let rows grow and headings stay with their next block.
    for p in body.iter(q('p')):
        if txt(p).strip() in ('작동 방식과 기대 결과', '연결 도구 / 데이터 소스', 'Agent 역할 정의') or txt(p).startswith('[Agent '):
            pp = p.find('w:pPr', NS)
            if pp is None:
                pp = E.SubElement(p, q('pPr'))
            E.SubElement(pp, q('keepNext'))
    parts['word/document.xml'] = E.tostring(root, encoding='utf-8', xml_declaration=True)
    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, 'w', ZIP_DEFLATED) as z:
        for n, data in parts.items():
            z.writestr(n, data)
    with ZipFile(output) as z:
        if z.testzip():
            raise ValueError('DOCX ZIP 검증 실패')
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    try:
        print(build(json.loads(args.state.read_text(encoding='utf-8')), args.output))
    except (ValueError, KeyError, TypeError, StopIteration) as exc:
        parser.exit(2, str(exc) + '\n')
