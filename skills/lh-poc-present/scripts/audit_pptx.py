"""LH 발표 PPT의 구조를 보조 검사한다. Python 표준 라이브러리만 쓴다.

보는 것: 16:9 비율, 가운뎃점, 화면에 남은 미완 문구, 쪽 번호, 발표자 노트, 기본 차트의 내장 데이터.
보지 않는 것: 수치가 사실인지, 글자가 화면에서 넘치는지, 이야기가 설득력 있는지.
"""
import argparse
import io
import json
import posixpath
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

NS = {
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
    'c': 'http://schemas.openxmlformats.org/drawingml/2006/chart',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}
RID = '{' + NS['r'] + '}id'
MIDDLE_DOTS = '·․‧・ㆍ'
# 화면에는 확인한 결과만 싣는다. 아래 문구는 발표자 노트의 구두 보충이나 숨김 부록으로 옮긴다.
UNFINISHED = ['확인 필요', '미측정', '보완 예정', '보완 중', '검증 미완료', '실측 필요', '실측 예정', '미정']


def text_of(root):
    return ''.join(el.text or '' for el in root.findall('.//a:t', NS))


def relationships(z, part):
    relpath = posixpath.join(posixpath.dirname(part), '_rels', posixpath.basename(part) + '.rels')
    if relpath not in z.namelist():
        return {}
    result = {}
    for rel in ET.fromstring(z.read(relpath)):
        target = rel.get('Target', '')
        if rel.get('TargetMode') != 'External':
            target = posixpath.normpath(posixpath.join(posixpath.dirname(part), target)).lstrip('/')
        result[rel.get('Id')] = (target, rel.get('Type', ''), rel.get('TargetMode'))
    return result


def audit(path, require_chart_pages=()):
    errors, warnings = [], []
    report = {'slide_count': 0, 'chart_count': 0, 'hidden_pages': [], 'errors': errors, 'warnings': warnings,
              'scope': '구조 검사만 수행. 수치의 사실 여부, 실제 화면, 이야기의 설득력은 따로 확인.'}

    def fail(code, page, message):
        errors.append({'code': code, 'page': page, 'message': message})

    def warn(code, page, message):
        warnings.append({'code': code, 'page': page, 'message': message})

    try:
        with zipfile.ZipFile(path) as z:
            bad = z.testzip()
            if bad:
                fail('package', None, '손상된 ZIP 항목: ' + bad)
            pres = ET.fromstring(z.read('ppt/presentation.xml'))
            size = pres.find('p:sldSz', NS)
            width, height = int(size.get('cx')), int(size.get('cy'))
            if abs(width / height - 16 / 9) > .001:
                fail('aspect_ratio', None, '16:9 화면이 필요합니다.')
            rels = relationships(z, 'ppt/presentation.xml')
            parts = [rels[item.get(RID)][0] for item in pres.findall('p:sldIdLst/p:sldId', NS)]
            report['slide_count'] = len(parts)
            chart_pages = set()
            for page, part in enumerate(parts, 1):
                root = ET.fromstring(z.read(part))
                hidden = root.get('show') == '0'
                if hidden:
                    report['hidden_pages'].append(page)
                texts = text_of(root)
                if any(ch in texts for ch in MIDDLE_DOTS):
                    fail('middle_dot', page, '가운뎃점을 쉼표나 줄바꿈으로 바꾸세요.')
                if '※' in texts:
                    warn('reference_mark', page, '참고 표시는 ※ 대신 * 를 씁니다.')
                if not hidden:
                    found = [term for term in UNFINISHED if term in texts]
                    if found:
                        warn('unfinished_on_screen', page,
                             '화면에 남은 문구: ' + ', '.join(found) + '. 구두 보충이나 숨김 부록으로 옮길지 확인하세요.')
                slide_rels = relationships(z, part)
                has_notes = any(t.endswith('/notesSlide') for _, t, _ in slide_rels.values())
                if page > 1 and not hidden and not has_notes:
                    warn('notes', page, '발표자 노트(발표 대본과 구두 보충)가 없습니다.')
                if page > 1 and not hidden:
                    numbered = False
                    for sp in root.findall('.//p:sp', NS):
                        off = sp.find('p:spPr/a:xfrm/a:off', NS)
                        if off is None or int(off.get('y')) < height * .9 or int(off.get('x')) < width * .6:
                            continue
                        tail = text_of(sp).strip().split()
                        if tail and tail[-1].isdigit() and int(tail[-1]) == page:
                            numbered = True
                    if not numbered:
                        warn('page_number', page, '오른쪽 아래 쪽 번호를 확인하세요.')
                for node in root.findall('.//c:chart', NS):
                    chart_pages.add(page)
                    report['chart_count'] += 1
                    ref = slide_rels.get(node.get(RID))
                    if not ref or ref[0] not in z.namelist():
                        fail('chart_part', page, '기본 차트 파일 연결을 확인하세요.')
                        continue
                    chart = ET.fromstring(z.read(ref[0]))
                    ext = chart.find('c:externalData', NS)
                    link = relationships(z, ref[0]).get(ext.get(RID)) if ext is not None else None
                    valid = False
                    if link and link[2] != 'External' and link[0] in z.namelist():
                        try:
                            with zipfile.ZipFile(io.BytesIO(z.read(link[0]))) as wb:
                                valid = 'xl/workbook.xml' in wb.namelist()
                        except zipfile.BadZipFile:
                            pass
                    if not valid:
                        fail('chart_workbook', page, '차트에 편집 가능한 내장 데이터가 필요합니다.')
            for page in require_chart_pages:
                if page not in chart_pages:
                    fail('required_chart', page, '수치 그래프 장에 기본 PPT 차트가 없습니다.')
    except (OSError, KeyError, ValueError, TypeError, ET.ParseError, zipfile.BadZipFile) as error:
        fail('package', None, str(error))
    report['passed'] = not errors
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pptx', type=Path)
    parser.add_argument('--require-chart-page', type=int, action='append', default=[])
    args = parser.parse_args()
    result = audit(args.pptx, args.require_chart_page)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(0 if result['passed'] else 1)
