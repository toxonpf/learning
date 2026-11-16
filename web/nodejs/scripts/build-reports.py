#!/usr/bin/env python3
"""Собрать отчёты по реальному коду (Pillow, Pygments и LibreOffice)."""
from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZipFile, ZIP_DEFLATED
import argparse
import json
import re
import shutil
import subprocess
import tempfile
import textwrap
from datetime import datetime
from zoneinfo import ZoneInfo

from PIL import Image, ImageDraw, ImageFont
from pygments import lex
from pygments.lexer import RegexLexer
from pygments.lexers import TextLexer, get_lexer_by_name, get_lexer_for_filename
from pygments.style import Style
from pygments.token import Comment, Error, Keyword, Name, Number, Operator, Punctuation, String, Text, Token
from pygments.util import ClassNotFound

ROOT = Path(__file__).resolve().parent.parent
META = json.loads((ROOT / 'scripts/lab-metadata.json').read_text())
FONT = '/usr/share/fonts/TTF/DejaVuSansMono.ttf'
LISTING_COLUMNS = 88


class CodeStyle(Style):
    """Палитра One Dark для снимков кода в стиле редактора."""
    background_color = '#282c34'
    styles = {
        Token: '#abb2bf',
        Text: '#abb2bf',
        Comment: '#7f848e',
        Keyword: '#c678dd',
        Keyword.Constant: '#d19a66',
        Keyword.Type: '#e5c07b',
        Name: '#e06c75',
        Name.Function: '#61afef',
        Name.Class: '#e5c07b',
        Name.Builtin: '#e5c07b',
        Name.Attribute: '#d19a66',
        Name.Decorator: '#c678dd',
        Name.Tag: '#e06c75',
        String: '#98c379',
        Number: '#d19a66',
        Operator: '#56b6c2',
        Punctuation: '#abb2bf',
        Error: '#e06c75',
    }


class PrismaLexer(RegexLexer):
    """Подсветка схем Prisma, для которых нет встроенного lexer в Pygments."""
    name = 'Prisma'
    tokens = {'root': [
        (r'\s+', Text),
        (r'//[^\n]*', Comment.Single),
        (r'/\*[\s\S]*?\*/', Comment.Multiline),
        (r'"(?:\\.|[^"\\])*"', String.Double),
        (r'\b(model|enum|type|view|generator|datasource)\b', Keyword.Declaration),
        (r'\b(String|Int|BigInt|Float|Decimal|Boolean|DateTime|Json|Bytes|Unsupported)\b', Keyword.Type),
        (r'@@?[A-Za-z_]\w*(?:\.\w+)*', Name.Decorator),
        (r'\b(true|false|null)\b', Keyword.Constant),
        (r'\b\d+(?:\.\d+)?\b', Number),
        (r'[A-Za-z_]\w*', Name),
        (r'[{}\[\](),.?=:]', Punctuation),
        (r'.', Text),
    ]}


def highlighted_lines(source, filename):
    # Разбираем весь файл до разбивки на картинки: многострочные строки и
    # комментарии сохраняют подсветку при переносах и на следующих страницах.
    if filename.endswith('.prisma'):
        lexer = PrismaLexer(stripnl=False, ensurenl=False)
    elif filename.endswith('.sql'):
        lexer = get_lexer_by_name('postgresql', stripnl=False, ensurenl=False)
    else:
        try:
            lexer = get_lexer_for_filename(filename, stripnl=False, ensurenl=False)
        except ClassNotFound:
            lexer = TextLexer(stripnl=False, ensurenl=False)
    tokens = list(lex(source.expandtabs(4), lexer))
    # JavaScript lexer помечает вызовы как Name.Other; выделяем их синим.
    for index, (token, value) in enumerate(tokens):
        if token in Name and token not in (Name.Tag, Name.Attribute, Name.Decorator):
            following = next((text for _, text in tokens[index + 1:] if text.strip()), '')
            if following.startswith('('):
                tokens[index] = (Name.Function, value)

    physical_lines, spans = [], []
    for token, value in tokens:
        styled = token
        while styled not in CodeStyle.styles:
            styled = styled.parent
        color = '#' + (CodeStyle.style_for_token(styled)['color'] or 'abb2bf')
        parts = value.split('\n')
        for part_index, part in enumerate(parts):
            if part:
                spans.append((part, color))
            if part_index < len(parts) - 1:
                physical_lines.append(spans)
                spans = []
    if spans:
        physical_lines.append(spans)

    rows = []
    for number, spans in enumerate(physical_lines, 1):
        line = ''.join(text for text, _ in spans)
        parts = textwrap.wrap(line, width=LISTING_COLUMNS, replace_whitespace=False,
                              drop_whitespace=False, break_on_hyphens=False) or ['']
        offset = 0
        for part_index, part in enumerate(parts):
            selected, position = [], 0
            for text, color in spans:
                start = max(0, offset-position)
                end = min(len(text), offset+len(part)-position)
                if end > start:
                    selected.append((text[start:end], color))
                position += len(text)
            rows.append((number if part_index == 0 else None, selected))
            offset += len(part)
    return rows or [(1, [])]


def paragraph(text='', *, bold=False, align=None, size=28, before=0, after=120, page=False):
    properties = f'<w:spacing w:before="{before}" w:after="{after}" w:line="320" w:lineRule="auto"/>'
    if align:
        properties += f'<w:jc w:val="{align}"/>'
    if bold:
        properties += '<w:keepNext/>'
    if page:
        properties += '<w:pageBreakBefore/>'
    runs = ''
    for line_number, line in enumerate(text.split('\n')):
        if line_number:
            runs += '<w:r><w:br/></w:r>'
        runs += f'<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="{size}"/>{"<w:b/>" if bold else ""}</w:rPr><w:t xml:space="preserve">{escape(line)}</w:t></w:r>'
    return f'<w:p><w:pPr>{properties}</w:pPr>{runs}</w:p>'


def listing_image(path, lines, label):
    font = ImageFont.truetype(FONT, 26)
    numberfont = ImageFont.truetype(FONT, 21)
    titlefont = ImageFont.truetype(FONT, 20)
    width, row = 1560, 36
    height = 142 + len(lines) * row
    image = Image.new('RGB', (width, height), '#e8ebf0')
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((28, 32, width-20, height-16), radius=18, fill='#c4c9d2')
    draw.rounded_rectangle((24, 24, width-28, height-24), radius=18, fill=CodeStyle.background_color)
    draw.rounded_rectangle((24, 24, width-28, 94), radius=18, fill='#21252b')
    draw.rectangle((24, 74, width-28, 94), fill='#21252b')
    for x, color in [(52, '#ff5f57'), (80, '#febc2e'), (108, '#28c840')]:
        draw.ellipse((x, 48, x+16, 64), fill=color)
    draw.text((width/2, 44), label, font=titlefont, fill='#c6ccd6', anchor='mt')
    draw.line((100, 110, 100, height-42), fill='#353b45', width=1)
    for i, (number, spans) in enumerate(lines):
        y = 112 + i * row
        draw.text((82, y+3), str(number) if number is not None else '·', font=numberfont, fill='#69717e', anchor='rt')
        x = 120
        for text, color in spans:
            draw.text((x, y), text, font=font, fill=color)
            x += draw.textlength(text, font=font)
    image.save(path)


class Document:
    def __init__(self):
        self.body = []
        self.images = []

    def p(self, text='', **kwargs):
        self.body.append(paragraph(text, **kwargs))

    def picture(self, path, caption):
        with Image.open(path) as im:
            width, height = im.size
        scale = min(5800000 / width, 7400000 / height)
        cx, cy = int(width * scale), int(height * scale)
        i = len(self.images) + 1
        self.images.append(path)
        self.body.append(f'''<w:p><w:pPr><w:jc w:val="center"/><w:keepNext/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{cx}" cy="{cy}"/><wp:docPr id="{i}" name="Рисунок {i}" descr="{escape(caption)}"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="{i}" name="image{i}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId{i}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>''')
        self.p(caption, align='center', size=22, after=180)

    def save(self, path):
        ns = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"'
        doc = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document {ns}><w:body>'+''.join(self.body)+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1134" w:bottom="1134" w:left="1440"/></w:sectPr></w:body></w:document>'
        rels = ''.join(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image{i}.png"/>' for i in range(1, len(self.images)+1))
        content = '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
        with ZipFile(path, 'w', ZIP_DEFLATED) as z:
            z.writestr('[Content_Types].xml', content)
            z.writestr('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdDocument" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
            z.writestr('word/document.xml', doc)
            z.writestr('word/_rels/document.xml.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+rels+'</Relationships>')
            for i, image_path in enumerate(self.images, 1):
                z.write(image_path, f'word/media/image{i}.png')


def build(group, number, metadata, temp):
    project = ROOT / group / f'lesson{number}'
    evidence = json.loads((project / 'verification.json').read_text())
    source = project / metadata.get('source', f'ЛР-{number}.pdf')
    assignment = (subprocess.check_output(['pdftotext', '-layout', str(source), '-'], text=True)
                  if source.suffix == '.pdf' else source.read_text())
    doc = Document()
    doc.p('ТОО ”Колледж Хекслет”', bold=True, align='center')
    doc.p(f'Лабораторная работа №{number}', bold=True, align='center', before=3200, after=0)
    doc.p(metadata['title'], align='center', after=0)
    doc.p('Выполнено студентом:', bold=True, align='right', before=7350, after=0)
    doc.p('Дубинин Кирилл', align='right', after=0)
    doc.p('Практическое задание', bold=True, page=True)
    doc.p(f'Раздел {group}. {metadata["title"]}.')
    goal = re.search(r'Цель(?: работы)?\s*:\s*(.*?)(?:\n\s*\n|Практическое задание|Дисциплина:)', assignment, re.S)
    if goal:
        goal_text = re.sub(r'-\s*\n\s*', '-', goal.group(1))
        doc.p('Цель: '+re.sub(r'\s+', ' ', goal_text))
    doc.p('Условие: '+str(source.relative_to(ROOT)))
    if 'Требования к результату' in assignment:
        requirements = assignment.split('Требования к результату', 1)[1].split('Критерии оценивания', 1)[0]
        requirements = re.split(r'\n\s*PS:', requirements)[0]
        items = re.findall(r'•\s*(.*?)(?=\s*•|\Z)', requirements, re.S)
        if items:
            doc.p('Требования задания', bold=True)
            for item in items:
                doc.p('• '+re.sub(r'\s+', ' ', item).strip(), size=25)
    elif source.suffix == '.md':
        doc.p('Задания', bold=True)
        for item in assignment.split('\n\n'):
            if item.strip() and not item.startswith('#'):
                doc.p(item.strip(), size=25)
    doc.p('Ход выполнения', bold=True)
    doc.p(metadata['summary'])
    doc.p('Проект: '+str(project.relative_to(ROOT)))
    doc.p(metadata.get('run') or ('Запуск: npm install; npm start. Для PostgreSQL параметры подключения задаются в .env по образцу .env.example. Порядок применения SQL и миграций приведён в README.md проекта.' if group != 'RO4_2' else 'Запуск из каталога проекта: npm install, затем npm start. Адрес сервера: http://localhost:3000.'))
    figure = 0
    for filename in metadata['files']:
        doc.p(filename, bold=True, before=160)
        lines = highlighted_lines((project / filename).read_text(), filename)
        for start in range(0, len(lines), 35):
            figure += 1
            path = temp / f'{group}-{number}-{figure}.png'
            listing_image(path, lines[start:start+35], filename)
            caption = f'Листинг {figure}. {filename}'+(f' (часть {start//35+1})' if len(lines)>35 else '')
            doc.picture(path, caption)
    doc.p('Проверка результата', bold=True, page=True)
    checked_at = datetime.fromisoformat(evidence['checkedAt'].replace('Z', '+00:00')).astimezone(ZoneInfo('Asia/Almaty'))
    doc.p(f'Проверено: {checked_at:%d.%m.%Y %H:%M} (Алматы). Node.js {evidence["runtime"]}.')
    doc.p('Приведены фактические результаты проверки. Полный журнал: verification.json.')
    for check in evidence['checks']:
        doc.p('• '+check, size=26)
    if evidence['requests']:
        doc.p('HTTP-запросы', bold=True)
    for request in evidence['requests']:
        if request['path'].endswith(('.js', '.css', '.html')) or (request['path']=='/' and isinstance(request['response'],str) and '<' in request['response']):
            continue
        doc.p(f'{request["method"]} {request["path"]} → {request["status"]}', size=22, after=50)
    if evidence['requests']:
        doc.p('Примеры ответов', bold=True, before=160)
    examples = []
    if group=='RO4_4':
        for method,path in [('POST','/api/auth/register'),('POST','/api/auth/login'),('GET','/api/auth/me')]:
            match = next((r for r in evidence['requests'] if r['method']==method and r['path']==path and r['status']<300),None)
            if match:examples.append(match)
    else:
        for method in ['POST','PATCH','DELETE']:
            match = next((r for r in evidence['requests'] if r['method']==method and '/api/products' in r['path'] and r['status']<300),None)
            if match: examples.append(match)
    if not examples:examples=evidence['requests'][:2]
    for example in examples:
        doc.p(f'{example["method"]} {example["path"]} → {example["status"]}', bold=True, size=24)
        body=json.dumps(example['response'],ensure_ascii=False,indent=2)
        if len(body)>2200:body=body[:2200]+'\n… (полный ответ в verification.json)'
        for line in body.splitlines(): doc.p(line,size=21,after=0)
    browser=project/'screenshots/browser.png'
    if browser.exists():
        doc.p('Проверка в браузере Chromium',bold=True,page=True)
        doc.picture(browser,'Скриншот работающего приложения после выполнения действий через интерфейс.')
    studio = project/'screenshots/studio.png'
    if studio.exists():
        doc.p('Проверка данных в Prisma Studio', bold=True, page=True)
        doc.picture(studio, 'Prisma Studio: таблицы и данные проверенной учебной базы.')
    doc.p('Результат',bold=True,before=200)
    doc.p('Проверены обязательные операции и указанные ошибочные сценарии; результаты сохранены вместе с исходным кодом.')
    docx=project/f'Лабораторная работа №{number}.docx'
    doc.save(docx)
    return docx


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--docx-only',action='store_true')
    args=parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='nodejs-lab-reports-') as temporary:
        temp=Path(temporary)
        docs=[]
        for group,works in META.items():
            for number,metadata in enumerate(works,1):
                number = metadata.get('number', number)
                docx=build(group,number,metadata,temp)
                # Уникальные временные имена позволяют конвертировать все отчёты одним процессом.
                unique=temp/f'{group}-lesson{number}.docx'
                shutil.copy2(docx,unique)
                docs.append((docx,unique))
        if not args.docx_only:
            executable=shutil.which('libreoffice')
            if not executable:raise RuntimeError('Для PDF необходим LibreOffice')
            result=subprocess.run([executable,'--headless',f'-env:UserInstallation={temp.as_uri()}/lo-profile','--convert-to','pdf','--outdir',str(temp),*[str(unique) for _,unique in docs]],capture_output=True,text=True,timeout=240)
            if result.returncode:raise RuntimeError(result.stdout+result.stderr)
            for docx,unique in docs:
                pdf=unique.with_suffix('.pdf')
                if not pdf.exists():raise RuntimeError(f'PDF не создан: {docx}\n{result.stdout}\n{result.stderr}')
                shutil.copy2(pdf,docx.with_suffix('.pdf'))
        print(f'Создано отчётов DOCX: {len(docs)}; PDF: {0 if args.docx_only else len(docs)}')


if __name__=='__main__':
    main()
