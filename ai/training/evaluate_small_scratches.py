"""Fixed-threshold held-out recall for small annotated scratches; no model tuning."""
import argparse,json
from pathlib import Path
from ultralytics import YOLO

def iou(a,b):
    intersection=max(0,min(a[2],b[2])-max(a[0],b[0]))*max(0,min(a[3],b[3])-max(a[1],b[1]))
    union=(a[2]-a[0])*(a[3]-a[1])+(b[2]-b[0])*(b[3]-b[1])-intersection
    return intersection/union if union>0 else 0

def evaluate(model_path,root,device='cpu'):
    model=YOLO(str(model_path));scratch_ids={int(k) for k,v in model.names.items() if v=='scratch'}
    total=hits=0
    examples=[]
    for image in sorted((root/'dataset/images/test').glob('*.jpg')):
        labels=root/'dataset/labels/test'/(image.stem+'.txt')
        truth=[]
        for line in labels.read_text().splitlines():
            cls,x,y,w,h=map(float,line.split())
            if int(cls)==1 and w*h<=.01:truth.append([x-w/2,y-h/2,x+w/2,y+h/2])
        if not truth:continue
        prediction=model.predict(str(image),imgsz=1024,conf=.45,device=device,verbose=False)[0]
        boxes=[b.xyxyn[0].tolist() for b in prediction.boxes if int(b.cls[0]) in scratch_ids]
        pairs=sorted([(iou(t,b),ti,bi) for ti,t in enumerate(truth) for bi,b in enumerate(boxes)],reverse=True)
        matched_t=set();matched_b=set()
        for overlap,ti,bi in pairs:
            if overlap>=.5 and ti not in matched_t and bi not in matched_b:matched_t.add(ti);matched_b.add(bi)
        total+=len(truth);hits+=len(matched_t)
        examples.append({'image':image.name,'small_truth':len(truth),'matched':len(matched_t)})
    return {'small_definition':'annotated scratch box <=1% of image area; this is not a physical scratch-width measurement','confidence':.45,'iou':.5,'total_small_labels':total,'matched':hits,'recall':hits/total if total else None,'sample_adequate':total>=20,'examples':examples}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--root',default='/content/ballighni-training');parser.add_argument('--device',default='0');args=parser.parse_args();root=Path(args.root)
    report={name:evaluate(path,root,args.device) for name,path in [('baseline',root/'baseline.pt'),('candidate',root/'runs/scratch_finetune/weights/best.pt')]}
    root.joinpath('small-scratch-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
