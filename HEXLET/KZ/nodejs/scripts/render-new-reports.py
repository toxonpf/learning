"""Визуальная проверка новых DOCX каноническим renderer Documents skill."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse, json, subprocess, sys
from datetime import datetime
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--renderer',required=True);parser.add_argument('--group');parser.add_argument('--number',type=int)
args=parser.parse_args()
run_folder=ROOT/'tmp/new-report-qa'/datetime.now().strftime('%Y%m%d%H%M%S')
meta=json.loads((ROOT/'scripts/new-lab-metadata.json').read_text(encoding='utf-8'))
projects=[(group,item['number']) for group,works in meta.items() for item in works if (not args.group or group==args.group) and (not args.number or item['number']==args.number)]
def render(item):
    group,number=item; project=ROOT/group/f'lesson{number}'; target=project/f'Лабораторная работа №{number}.docx'
    folder=run_folder/f'{group}-lesson{number}'
    result=subprocess.run([sys.executable,args.renderer,str(target),'--output_dir',str(folder),'--dpi','100','--emit_pdf'],capture_output=True,text=True,encoding='utf-8',timeout=180)
    if result.returncode: raise RuntimeError(result.stdout+result.stderr)
    pdf=folder/f'Лабораторная работа №{number}.pdf'
    pages=len(PdfReader(pdf).pages)
    assert len(list(folder.glob('page-*.png')))==pages
    assert pages==len(PdfReader(target.with_suffix('.pdf')).pages)
    return {'project':f'{group}/lesson{number}','pages':pages,'rendered':str(folder)}
results=[]
with ThreadPoolExecutor(max_workers=3) as pool:
    for future in as_completed([pool.submit(render,item) for item in projects]):
        result=future.result(); results.append(result);print(json.dumps(result,ensure_ascii=False),flush=True)
index_path=ROOT/'tmp/new-report-qa/index.json'
previous=json.loads(index_path.read_text(encoding='utf-8')) if index_path.exists() else []
selected={result['project'] for result in results}
index_path.write_text(json.dumps([item for item in previous if item['project'] not in selected]+results,ensure_ascii=False,indent=2),encoding='utf-8')
