import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('frontend/voice.js','utf8').replaceAll('export ','');
function runtime(cap) {
 const calls=[];
 const context={window:{Capacitor:cap},document:{documentElement:{lang:'en'},body:{classList:{remove(){}}}},Promise};
 vm.createContext(context);vm.runInContext(source,context);
 return {context,run:code=>vm.runInContext(code,context),calls};
}
test('Android injected bridge supports stopping and reading without registerPlugin',async()=>{
 const calls=[];
 const {run}=runtime({isNativePlatform:()=>true,nativePromise:(plugin,method,options)=>{calls.push({plugin,method,options});return Promise.resolve();}});
 run('stopVoice()');await run('speakText("Test read aloud")');
 assert.deepEqual(calls.map(c=>c.method),['stop','speak']);assert.equal(calls[1].plugin,'BallighniVoice');assert.equal(calls[1].options.text,'Test read aloud');
});
test('missing or throwing Android voice service cannot block navigation',()=>{
 for(const cap of [{isNativePlatform:()=>true},{isNativePlatform:()=>true,nativePromise(){throw Error('unavailable');}}]) {
  const {run}=runtime(cap);assert.doesNotThrow(()=>run('stopVoice()'));
 }
});
test('home renders immediately with a saved session while backend never responds',()=>{
 const elements=new Map();const el=()=>({textContent:'',innerHTML:'',classList:{toggle(){},remove(){},add(){}},querySelectorAll:()=>[]});
 const doc={querySelector:s=>{if(!elements.has(s))elements.set(s,el());return elements.get(s);},querySelectorAll:()=>[],body:{classList:{contains:()=>false}},documentElement:{},activeElement:null};
 const code=readFileSync('frontend/app.js','utf8').replace(/^import[\s\S]*?from ["'][^"']+["'];\r?\n/gm,'');
 const context={document:doc,window:{BALLIGHNI_CONFIG:{apiUrl:'https://example.test'},addEventListener(){},scrollTo(){}},location:{hash:'#home',hostname:'localhost'},localStorage:{getItem:()=>null},sessionStorage:{getItem:()=> 'saved-session'},applyAccessibility(){},setupLanguage(){},refreshIcons(){},setupVoiceDialog(){},stopVoice(){},installVoiceTools(){},homeScreen:()=>'<h1>Home ready</h1>',setInterval(){},fetch:()=>new Promise(()=>{}),AbortSignal,URL};
 vm.runInNewContext(code,context);assert.equal(elements.get('#main').innerHTML,'<h1>Home ready</h1>');
});
