import test from 'node:test';
import assert from 'node:assert/strict';
import {analyze} from '../backend/ai.mjs';
test('upgraded model analyzes all six evidence photos with source attribution',async(t)=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response(JSON.stringify({model:'reverendbayes-yolo11m-cardd-cd1cb11',detections:[{label:'dent',confidence:.82,box:[.1,.2,.4,.6]}]}));});
 const photos=Array.from({length:6},(_,i)=>({id:'photo-'+i,bytes:Buffer.from('synthetic')}));
 const result=await analyze({narrative:'Synthetic account',location:'Test location'},photos,{AI_PROVIDER:'damage'});
 assert.equal(calls,6);assert.equal(result.mode,'ai');assert.deepEqual(result.findings.map(f=>f.source_id),photos.map(f=>f.id));
});
