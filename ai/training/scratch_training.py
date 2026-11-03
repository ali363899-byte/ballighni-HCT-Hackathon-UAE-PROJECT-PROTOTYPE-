"""Reproducible free-GPU fine-tuning experiment. Never deploys unvalidated weights."""
import argparse, concurrent.futures, hashlib, json, random, shutil, time, zipfile, re
from pathlib import Path
from urllib.parse import quote
import requests, torch, yaml
from ultralytics import YOLO

REPO = 'tugberkkalay/autodamageiq-vehicle-damage-dataset'
REVISION = 'b5abbf54bdf7c8817a4e20b6ab39c8f1fe98a0e5'
MODEL_URL = 'https://media.githubusercontent.com/media/ReverendBayes/YOLO11m-Car-Damage-Detector/cd1cb118b5111634b49e02b3dc790f2636d49d82/trained.pt'
MODEL_SHA = '40d324e82d8a9cef052d747bba1b65ba70e66fa2153cc832570370128d2c3818'
NAMES = {0:'dent',1:'scratch',2:'crack',3:'glass shatter',4:'lamp broken',5:'tire flat'}
CLASS_MAP = {0:2,1:0,2:3,3:4,4:1,5:5}

def fetch_file(remote, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.stat().st_size: return target
    for attempt in range(6):
        try:
            r = requests.get(remote, timeout=90)
            r.raise_for_status()
            target.write_bytes(r.content)
            return target
        except requests.RequestException:
            if attempt == 5: raise
            time.sleep(min(30, 2 ** attempt))

def group_key(path):
    # VehiDE filenames retain the original image timestamp before augmentation/hash.
    return re.sub(r'_[0-9a-f]{32}$', '', Path(path).stem)

def prepare(root, train_count=800, val_count=160, test_count=160):
    metadata = requests.get(f'https://huggingface.co/api/datasets/{REPO}/revision/{REVISION}',timeout=60)
    metadata.raise_for_status()
    files = [x['rfilename'] for x in metadata.json()['siblings']]
    train = [p for p in files if p.startswith('images/train/vehide_') and p.endswith('.jpg')]
    evaluation = [p for p in files if p.startswith('images/val/vehide_') and p.endswith('.jpg')]
    def unique_groups(paths):
        buckets = {}
        for p in paths: buckets.setdefault(group_key(p), p)
        return sorted(buckets.values(),key=lambda p:hashlib.sha256(('ballighni42'+group_key(p)).encode()).hexdigest())
    evaluation = unique_groups(evaluation)
    if len(evaluation) < val_count + test_count: raise ValueError('Not enough independent VehiDE validation groups')
    validation = evaluation[:val_count]
    test = evaluation[val_count:val_count+test_count]
    heldout_groups = {group_key(p) for p in validation+test}
    train = [p for p in unique_groups(train) if group_key(p) not in heldout_groups][:train_count]
    if len(train) < train_count: raise ValueError('Not enough independent VehiDE training groups')
    splits = {'train':train,'val':validation,'test':test}
    tasks = []
    for paths in splits.values():
        for image in paths:
            for name in [image,image.replace('images/','labels/').rsplit('.',1)[0]+'.txt']:
                tasks.append((f'https://huggingface.co/datasets/{REPO}/resolve/{REVISION}/{quote(name)}',root/'raw'/name))
    for name in ['README.md','data.yaml']:
        fetch_file(f'https://huggingface.co/datasets/{REPO}/resolve/{REVISION}/{name}',root/'raw'/name)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(fetch_file,*task) for task in tasks]
        for i,f in enumerate(concurrent.futures.as_completed(futures),1):
            f.result()
            if i % 100 == 0: print(f'Downloaded {i}/{len(tasks)} public files',flush=True)
    seen = set()
    manifest = []
    # Test first, then validation: exact duplicates are removed from later splits.
    for split in ['test','val','train']:
        for path in splits[split]:
            raw = root/'raw'/path
            digest = hashlib.sha256(raw.read_bytes()).hexdigest()
            if digest in seen: continue
            seen.add(digest)
            image = root/'dataset'/'images'/split/raw.name
            label = root/'dataset'/'labels'/split/(raw.stem+'.txt')
            image.parent.mkdir(parents=True,exist_ok=True);label.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(raw,image)
            source_label = root/'raw'/path.replace('images/','labels/').rsplit('.',1)[0]
            source_label = Path(str(source_label)+'.txt')
            lines=[]
            for line in source_label.read_text().splitlines():
                parts=line.split()
                if len(parts)!=5: raise ValueError(f'Invalid label: {source_label}')
                cls=int(parts[0]); values=[float(v) for v in parts[1:]]
                if cls not in CLASS_MAP or any(not 0<=v<=1 for v in values) or values[2]<=0 or values[3]<=0: raise ValueError('Invalid bounding box')
                lines.append(str(CLASS_MAP[cls])+' '+' '.join(parts[1:]))
            label.write_text('\n'.join(lines)+'\n')
            manifest.append({'split':split,'source':path,'sha256':digest,'group':group_key(path)})
    root.joinpath('dataset/data.yaml').write_text(yaml.safe_dump({'path':str((root/'dataset').resolve()),'train':'images/train','val':'images/val','test':'images/test','names':NAMES}))
    root.joinpath('manifest.json').write_text(json.dumps({'dataset':REPO,'revision':REVISION,'license':'CC-BY-4.0 (uploader declaration)','attribution':'AutoDamageIQ Vehicle Damage Detection Dataset, Tugberk Kalay, 2026','files':manifest},indent=2))
    print('Prepared split counts:',{s:sum(x['split']==s for x in manifest) for s in splits},flush=True)
    return root/'dataset/data.yaml'

def scores(metrics):
    indices = list(metrics.box.ap_class_index)
    if 1 not in indices: raise ValueError('Scratch labels missing from evaluation set')
    i=indices.index(1)
    return {'scratch_precision':float(metrics.box.p[i]),'scratch_recall':float(metrics.box.r[i]),'scratch_ap50':float(metrics.box.ap50[i]),'scratch_ap50_95':float(metrics.box.ap[i]),'all_map50_95':float(metrics.box.map)}

def run(root, epochs=12, train_count=800, val_count=160, test_count=160):
    if not torch.cuda.is_available(): raise RuntimeError('No free GPU attached. Select Runtime > Change runtime type > T4 GPU. This notebook refuses a slow CPU training run.')
    root.mkdir(parents=True,exist_ok=True)
    print('GPU:',torch.cuda.get_device_name(0),flush=True)
    dataset=prepare(root,train_count,val_count,test_count)
    base=fetch_file(MODEL_URL,root/'baseline.pt')
    if hashlib.sha256(base.read_bytes()).hexdigest()!=MODEL_SHA: raise RuntimeError('Baseline checkpoint checksum mismatch')
    baseline=YOLO(str(base))
    if list(baseline.names.values())!=['dent','scratch','crack','shattered_glass','broken_lamp','flat_tire']: raise RuntimeError('Unexpected baseline class order')
    common={'data':str(dataset),'imgsz':1024,'batch':4,'device':0,'workers':2,'plots':True,'project':str(root/'runs'),'exist_ok':True}
    baseline_val=scores(baseline.val(**common,split='val',name='baseline_val'))
    # Preserve class semantics, including spacing aliases, through YOLO dataset names.
    candidate=YOLO(str(base))
    candidate.train(**common,epochs=epochs,patience=5,seed=42,deterministic=True,optimizer='AdamW',lr0=.0001,cos_lr=True,mosaic=.3,close_mosaic=3,mixup=0,copy_paste=0,fliplr=.5,degrees=3,translate=.05,scale=.15,cache=False,save=True,name='scratch_finetune')
    best=root/'runs/scratch_finetune/weights/best.pt'
    tuned=YOLO(str(best))
    candidate_val=scores(tuned.val(**common,split='val',name='candidate_val'))
    eligible=(candidate_val['scratch_ap50_95']>=baseline_val['scratch_ap50_95']+.02 and candidate_val['scratch_precision']>=baseline_val['scratch_precision']-.03 and candidate_val['all_map50_95']>=baseline_val['all_map50_95']-.02)
    # Evaluate the untouched test split once, after all fitting/model selection.
    baseline_test=scores(baseline.val(**common,split='test',name='baseline_test'))
    candidate_test=scores(tuned.val(**common,split='test',name='candidate_test'))
    eligible=eligible and candidate_test['scratch_ap50_95']>baseline_test['scratch_ap50_95'] and candidate_test['scratch_precision']>=baseline_test['scratch_precision']-.03
    report={'status':'training_complete','gpu':torch.cuda.get_device_name(0),'epochs_requested':epochs,'dataset_revision':REVISION,'baseline_val':baseline_val,'candidate_val':candidate_val,'baseline_test':baseline_test,'candidate_test':candidate_test,'eligible_for_further_review':eligible,'candidate_sha256':hashlib.sha256(best.read_bytes()).hexdigest(),'limits':['Pilot subset, not a claim of best possible model.','Uploader includes automatic labels; audit scratches and intact-panel negatives.','Unknown prior pretraining overlap cannot be excluded.','No guarantee of microscopic scratches; image detail limits detection.','Do not deploy on metric improvement alone: manually inspect false positives and negatives.']}
    root.joinpath('training-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2),flush=True)
    archive=root/'Ballighni-Training-Results.zip'
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
        for path in [best,root/'training-report.json',root/'manifest.json',root/'runs/scratch_finetune/results.csv']:
            if path.exists():z.write(path,str(path.relative_to(root)))
    print('Download results:',archive,flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--root',default='/content/ballighni-training');parser.add_argument('--epochs',type=int,default=12);parser.add_argument('--train-count',type=int,default=800)
    args=parser.parse_args();run(Path(args.root),args.epochs,args.train_count)
