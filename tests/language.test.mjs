import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('language changes settle instead of scheduling endless page rewrites',()=>{
 let observer, label='', frames=[];
 const button={lang:'',set textContent(v){label=v;observer?.();},get textContent(){return label;}};
 const context={localStorage:{getItem:()=>null,setItem(){}},NodeFilter:{SHOW_TEXT:4},document:{body:{},documentElement:{},querySelector:()=>button,createTreeWalker:()=>({nextNode:()=>null})},MutationObserver:class{constructor(fn){observer=fn;}observe(){}},requestAnimationFrame:fn=>frames.push(fn)};
 vm.runInNewContext(readFileSync('frontend/language.js','utf8').replace('export function setupLanguage','function setupLanguage')+';setupLanguage();',context);
 const settle=()=>{let count=0;while(frames.length&&count++<10)frames.shift()();assert.equal(frames.length,0,'language observer must stop rewriting unchanged labels');};
 settle();assert.equal(label,'العربية');button.onclick();settle();assert.equal(label,'English');button.onclick();settle();assert.equal(label,'العربية');
});
