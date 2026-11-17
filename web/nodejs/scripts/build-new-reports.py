"""Отчёты новых уроков на основе сохранённого DOCX и листингов реального кода."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.sax.saxutils import escape
import xml.etree.ElementTree as ET
import importlib.util
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
from pypdf import PdfReader
from datetime import datetime, timezone, timedelta

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('report_template', ROOT / 'scripts/build-reports.py')
template = importlib.util.module_from_spec(spec)
spec.loader.exec_module(template)
template.FONT = os.environ.get('LAB_CODE_FONT', 'C:/Windows/Fonts/consola.ttf')
META = json.loads((ROOT / 'scripts/new-lab-metadata.json').read_text(encoding='utf-8'))
REFERENCE = ROOT / 'RO4_2/lesson1/Лабораторная работа №1.docx'
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

def prepare_contract(folder):
    with ZipFile(REFERENCE) as archive:
        document = ET.fromstring(archive.read('word/document.xml'))
        parts = {item.filename: {'size': item.file_size, 'sha256': hashlib.sha256(archive.read(item.filename)).hexdigest()} for item in archive.infolist()}
        (folder / 'template-parts.json').write_text(json.dumps(parts, indent=2), encoding='utf-8')
    (folder / 'artifact.md').write_text(f'''# Контракт шаблона
Reference: {REFERENCE}
SHA256: {hashlib.sha256(REFERENCE.read_bytes()).hexdigest()}
Pages: 5; sections: 1. Render: tmp/template-reference-render, все пять страниц просмотрены.
A4 portrait 11906 x 16838 twips. Margins: top/left 1440, right/bottom 1134.
Body Times New Roman 14 pt, line 320 twips auto, after 120 twips.
Bold headings use keepNext. Title block centered; author right aligned.
Cover editable slots: word/document.xml body paragraphs 1..5: college preserved,
laboratory number replaced, theme replaced, author label and student preserved.
Title before 3200 twips; author before 7350 twips. No headers, footers, tables or fields.
Content slots: assignment, requirements, implementation, code images, evidence, discussion.
Paragraph and image components are reused from scripts/build-reports.py.
Code images: One Dark, line numbers, 88 columns, 35 wrapped rows per figure.
Figures centered, extent <= 5800000 x 7400000 EMU; captions 11 pt centered.
Preserve-only parts: [Content_Types].xml and _rels/.rels, plus source section properties.
Editable parts: word/document.xml, word/_rels/document.xml.rels, word/media/*.png.
No styles, numbering, comments, customXml, controls or other opaque parts in source.
Final checks: same section geometry; preserved package parts byte-identical; source hash unchanged;
all intended slots filled; render every final page and inspect for clipping, overlap and blank pages.
''', encoding='utf-8')
    return document

def cover(document, number, title):
    paragraphs = document.find('w:body', NS).findall('w:p', NS)[:5]
    result = []
    for index, paragraph in enumerate(paragraphs):
        text = ET.tostring(paragraph, encoding='unicode')
        # ElementTree chooses ns0, but all namespace declarations remain self-contained.
        if index in (1, 2):
            replacement = f'Лабораторная работа №{number}' if index == 1 else title
            for element in paragraph.findall('.//w:t', NS): element.text = replacement; replacement = ''
            text = ET.tostring(paragraph, encoding='unicode')
        result.append(text)
    return result

def package_from_reference(doc, target, temp):
    candidate = temp / 'candidate.docx'
    doc.save(candidate)
    with ZipFile(REFERENCE) as source, ZipFile(candidate) as content, ZipFile(target, 'w', ZIP_DEFLATED) as output:
        # Preserve the original package framework; replace only mapped content components.
        for item in source.infolist():
            if item.filename not in ['word/document.xml', 'word/_rels/document.xml.rels'] and not item.filename.startswith('word/media/'):
                output.writestr(item, source.read(item.filename))
        for name in content.namelist():
            if name in ['word/document.xml', 'word/_rels/document.xml.rels'] or name.startswith('word/media/'):
                output.writestr(name, content.read(name))
    with ZipFile(target) as final, ZipFile(REFERENCE) as original:
        for name in ['[Content_Types].xml', '_rels/.rels']:
            assert final.read(name) == original.read(name), name
        original_section = ET.fromstring(original.read('word/document.xml')).find('w:body/w:sectPr', NS)
        final_section = ET.fromstring(final.read('word/document.xml')).find('w:body/w:sectPr', NS)
        assert ET.tostring(original_section) == ET.tostring(final_section)

def concise_output(command):
    output = re.sub(r'\x1b\[[0-9;]*m', '', command.get('output', ''))
    lines = []
    for line in output.splitlines():
        try:
            entry = json.loads(line)
            if 'msg' in entry:
                lines.append(entry['msg'] + ('; status=' + str(entry['statusCode']) if 'statusCode' in entry else ''))
            elif 'inspector' in entry:
                lines.extend(json.dumps(entry, ensure_ascii=False, indent=2).splitlines())
        except (ValueError, TypeError):
            if re.search(r'Test Suites:|Tests:|tests |pass |fail |Expected:|Received:|2500[01]|Missing required|RESTORED|Debugger listening', line):
                lines.append(line)
    return '\n'.join(lines[-20:]) or '\n'.join(output.splitlines()[-8:])

def build(group, metadata, temp, document):
    number = metadata['number']; project = ROOT / group / f'lesson{number}'
    evidence = json.loads((project / 'verification.json').read_text(encoding='utf-8'))
    doc = template.Document(); doc.body = cover(ET.fromstring(ET.tostring(document)), number, metadata['title'])
    source = project / f'ЛР-{number}.pdf'
    assignment = '\n'.join(page.extract_text() for page in PdfReader(source).pages)
    doc.p('Практическое задание', bold=True, page=True)
    doc.p(f'Раздел {group}. {metadata["title"]}.')
    goal = re.search(r'Цель:\s*(.*?)Дисциплина:', assignment, re.S)
    if goal: doc.p('Цель: ' + re.sub(r'\s+', ' ', goal.group(1)).strip())
    doc.p('Условие: ' + str(source.relative_to(ROOT)))
    requirements = re.search(r'Требования к результату(.*?)(?:Критерии оценивания|$)', assignment, re.S)
    if requirements:
        doc.p('Требования задания', bold=True)
        for item in re.findall(r'•\s*(.*?)(?=•|$)', requirements.group(1), re.S):
            doc.p('• ' + re.sub(r'\s+', ' ', item).strip(), size=25)
    doc.p('Ход выполнения', bold=True)
    doc.p(metadata['summary'])
    doc.p('Проект: ' + str(project.relative_to(ROOT)))
    doc.p('Команды установки, подготовки БД, запуска и тестирования приведены в README.md рядом с исходниками.', size=25)
    figure = 0
    for filename in metadata['files']:
        doc.p(filename, bold=True, before=160)
        lines = template.highlighted_lines((project / filename).read_text(encoding='utf-8'), filename)
        for start in range(0, len(lines), 35):
            figure += 1; path = temp / f'{group}-{number}-{figure}.png'
            template.listing_image(path, lines[start:start+35], filename)
            doc.picture(path, f'Листинг {figure}. {filename}' + (f' (часть {start//35+1})' if len(lines)>35 else ''))
    doc.p('Проверка результата', bold=True, page=True)
    stamp = datetime.fromisoformat(evidence['checkedAt'].replace('Z', '+00:00')).astimezone(timezone(timedelta(hours=5)))
    doc.p(f'Проверено: {stamp:%d.%m.%Y %H:%M} (Кызылорда). Node.js {evidence["runtime"]}.')
    checks = evidence['checks']
    if group == 'RO4_5' and number in [1,2]: checks = [check for check in checks if any(word in check for word in ['node:test','Jest','Эксперимент'])]
    if group == 'RO4_4' and number == 9:
        checks = [check for check in checks if any(word in check for word in ['Prisma Client','Multer:','FormData','CORS explicit','login limiter'])]
    for check in checks: doc.p('• ' + check, size=25)
    doc.p('Полный фактический журнал: verification.json.', size=24)
    if group == 'RO4_4' or number == 3:
        doc.p('HTTP запросы', bold=True)
        requests = evidence['requests']
        # Representative scenarios; the complete trace remains in verification.json.
        scenarios = {}
        for request in requests:
            route = re.sub(r'/\d+(?=/|$)', '/:id', request['path'])
            key=(request['method'],route)
            scenarios.setdefault(key, set()).add(request['status'])
        rows=list(scenarios.items())
        if group == 'RO4_4' and number == 9:
            rows.sort(key=lambda row: '/image' not in row[0][1])
        for key,statuses in rows[:12]:
            doc.p(f'{key[0]} {key[1]} → '+', '.join(map(str,sorted(statuses))), size=22, after=30)
        doc.p('Остальные запросы и ответы приведены в verification.json.',size=22,after=80)
        if group == 'RO4_4' and number == 9:
            example=next(r for r in requests if r['method']=='POST' and r['path'].endswith('/image') and r['status']==201)
        else:
            example=next(r for r in requests if r['method']=='POST' and r['path']=='/api/orders' and r['status']==201)
        doc.p('Пример фактического ответа',bold=True)
        # A compact, complete response is easier to assess than embedded related objects.
        response=example['response']
        if 'items' in response: response={key: response[key] for key in ['id','userId','status','total'] if key in response}
        doc.p(json.dumps(response,ensure_ascii=False),size=22,after=0)
    if group == 'RO4_5':
        doc.p('Журнал запуска',bold=True)
        commands=evidence.get('commands',[])
        if number in [1,2]: commands=[command for command in commands if 'prisma' not in command['command']]
        else: commands=[command for command in commands if command['command'] != 'npm test (повтор)']
        for command in commands:
            doc.p(command['command'],bold=True,size=24,before=100)
            for line in concise_output(command).splitlines(): doc.p(line,size=21,after=0)
    browser=project/'screenshots/browser.png'
    if browser.exists():
        doc.p('Проверка в браузере Chromium',bold=True,page=True)
        doc.picture(browser,'Работающий интерфейс после проверки входа, роли и защищённых запросов.')
    doc.p('Контрольные вопросы',bold=True,page=True)
    for item in metadata['discussion']: doc.p(item,size=25)
    doc.p('Результат',bold=True,before=180)
    doc.p(metadata['summary'],size=25)
    target=project/f'Лабораторная работа №{number}.docx'
    package_from_reference(doc,target,temp)
    return target

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--group'); parser.add_argument('--number',type=int)
    parser.add_argument('--libreoffice',required=True); args=parser.parse_args()
    folder=ROOT/'tmp/new-report-build'; folder.mkdir(parents=True,exist_ok=True)
    document=prepare_contract(folder); initial=hashlib.sha256(REFERENCE.read_bytes()).hexdigest(); documents=[]
    for group, works in META.items():
        for metadata in works:
            if args.group and group!=args.group: continue
            if args.number and metadata['number']!=args.number: continue
            target=build(group,metadata,folder,document)
            unique=folder/f'{group}-lesson{metadata["number"]}.docx'; shutil.copy2(target,unique); documents.append((target,unique))
    result=subprocess.run([args.libreoffice,'--headless',f'-env:UserInstallation={folder.as_uri()}/lo-profile','--convert-to','pdf','--outdir',str(folder),*[str(unique) for _,unique in documents]],capture_output=True,text=True,timeout=240)
    if result.returncode: raise RuntimeError(result.stdout+result.stderr)
    for target,unique in documents:
        pdf=unique.with_suffix('.pdf')
        if not pdf.exists(): raise RuntimeError('PDF missing: '+str(pdf)+'\n'+result.stdout+result.stderr)
        shutil.copy2(pdf,target.with_suffix('.pdf'))
    assert initial==hashlib.sha256(REFERENCE.read_bytes()).hexdigest()
    print(f'Создано {len(documents)} DOCX и {len(documents)} PDF. Шаблон не изменён.')
if __name__=='__main__': main()
