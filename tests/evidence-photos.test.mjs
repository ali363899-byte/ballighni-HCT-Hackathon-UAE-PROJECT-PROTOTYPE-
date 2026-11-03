import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeEvidencePhotos} from '../frontend/evidence-photos.js';
const photo=(name='photo.jpg',size=100,type='image/jpeg')=>({name,size,type,lastModified:1});
test('camera shots append to gallery evidence without losing previous selections',()=>{
 const gallery=[photo('gallery.jpg')]; const combined=mergeEvidencePhotos(gallery,[photo('camera.jpg')]);
 assert.deepEqual(combined.map(f=>f.name),['gallery.jpg','camera.jpg']);assert.equal(gallery.length,1);
 assert.equal(mergeEvidencePhotos(combined,[photo('camera.jpg')]).length,2);
 assert.equal(mergeEvidencePhotos(combined,[]).length,2);
});
test('invalid or excessive camera and gallery evidence is rejected without mutating the queue',()=>{
 const original=[photo()];assert.throws(()=>mergeEvidencePhotos(original,[photo('bad.heic',100,'image/heic')]),/JPEG/);
 assert.throws(()=>mergeEvidencePhotos(original,[photo('huge.jpg',9*1024*1024)]),/8 MB/);
 assert.throws(()=>mergeEvidencePhotos(original,Array.from({length:6},(_,i)=>photo('extra'+i+'.jpg'))),/six/);assert.equal(original.length,1);
});
