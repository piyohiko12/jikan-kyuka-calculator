'use client';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { Clock3, ArrowDownLeft, ArrowUpRight, ArrowRight, Settings2, Coffee, Copy, Info, RotateCcw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { calculate, defaults, duration, time, type Settings, type Mode } from '@/lib/leave';

function TimeField({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}) {
 return <label className="time-field"><span>{label}</span><input type="time" step="60" value={value} onChange={e=>onChange(e.target.value)} required /></label>;
}
export default function Home() {
 const [settings,setSettings]=useState<Settings>(defaults),[mode,setMode]=useState<Mode>('departure'),[arrival,setArrival]=useState('09:30'),[departure,setDeparture]=useState('15:30'),[ready,setReady]=useState(false),[copied,setCopied]=useState('');
 useEffect(()=>{try {const saved=JSON.parse(localStorage.getItem('jikan-settings')||'null');if(saved && Object.keys(defaults).every(k=>typeof saved[k]===typeof defaults[k as keyof Settings]))setSettings(saved);}catch{}setReady(true);},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem('jikan-settings',JSON.stringify(settings));}catch{}},[settings,ready]);
 const update=(key:keyof Settings,value:string|boolean)=>setSettings(s=>({...s,[key]:value}));
 const result=calculate(settings,mode,arrival,departure);
 const summary=result.entries.map(e=>`${e.kind==='arrival'?'出勤前':'早退後'}：${time(e.from)}〜${time(e.to)}（時間休 ${duration(e.rounded)}${e.breakMinutes ? `／休憩${duration(e.breakMinutes)}を除く` : ''}）`).join('\n');
 useEffect(()=>setCopied(''),[summary]);
 useEffect(()=>{
  type Tool = { name:string; title:string; description:string; inputSchema:object; annotations:object; execute:(input:unknown)=>unknown };
  const context=(document as Document & {modelContext?:{registerTool:(tool:Tool, options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const tool:Tool={name:'calculate_leave_proposal',title:'時間休の入力候補を計算',description:'現在の勤務設定で出勤・早退時刻を計算し、画面に候補を表示します。休暇申請は行いません。',inputSchema:{type:'object',properties:{mode:{type:'string',enum:['arrival','departure','both']},arrival:{type:'string',pattern:'^([01][0-9]|2[0-3]):[0-5][0-9]$'},departure:{type:'string',pattern:'^([01][0-9]|2[0-3]):[0-5][0-9]$'}},required:['mode','arrival','departure'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){
   if(!input||typeof input!=='object')throw new Error('時刻を入力してください。');
   const x=input as Record<string,unknown>;
   if(!['arrival','departure','both'].includes(String(x.mode)) || typeof x.arrival!=='string'||typeof x.departure!=='string')throw new Error('入力が正しくありません。');
   const next=calculate(settings,x.mode as Mode,x.arrival,x.departure);
   if(next.error)throw new Error(next.error);
   flushSync(()=>{setMode(x.mode as Mode);setArrival(x.arrival as string);setDeparture(x.departure as string);setCopied('');});
   return {totalMinutes:next.total,entries:next.entries};
  }};
  try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
  return ()=>lifecycle.abort();
 },[settings]);
 async function copy(){try{await navigator.clipboard.writeText(`${summary}\n合計：${duration(result.total)}`);setCopied('コピーしました');}catch{setCopied('コピーできませんでした。上の時刻を選択してコピーしてください。');}}
 const inputFields=<div className="actual-fields">{mode!=='departure'&&<TimeField label="実際の出勤時刻" value={arrival} onChange={setArrival}/>} {mode!=='arrival'&&<TimeField label="実際の早退時刻" value={departure} onChange={setDeparture}/>}</div>;
 const points=!result.error ? Array.from(new Set([result.start,result.end,...(settings.hasBreak?[result.bs,result.be]:[]),...result.entries.flatMap(e=>[e.from,e.to])])).sort((a,b)=>a-b) : [];
 return <div className="app-shell">
  <header className="topbar"><a href="/" className="brand"><span className="brand-icon"><Clock3 size={23}/></span>じかん休<span className="brand-divider"/><span className="brand-caption">休暇入力計算</span></a><span className="unit-pill">1時間単位</span></header>
  <main>
   <div className="page-heading"><div><p className="eyebrow">LEAVE CALCULATOR</p><h1>休暇の入力、迷わずに。</h1><p>出勤・早退の時刻から、申請する時間休を計算します。</p></div><span className="auto-label"><span/>入力すると自動計算</span></div>
   <div className="workspace">
    <aside className="settings card"><div className="section-heading"><Settings2 size={20}/><h2>勤務の設定</h2></div><p className="small muted">いつもの勤務時間を設定してください。</p><div className="pair"><TimeField label="勤務開始" value={settings.start} onChange={v=>update('start',v)}/><TimeField label="勤務終了" value={settings.end} onChange={v=>update('end',v)}/></div><div className="break-heading"><span><Coffee size={18}/>休憩時間</span><Switch aria-label="休憩時間を使う" checked={settings.hasBreak} onCheckedChange={v=>update('hasBreak',v)}/></div>{settings.hasBreak&&<div className="pair"><TimeField label="休憩開始" value={settings.breakStart} onChange={v=>update('breakStart',v)}/><TimeField label="休憩終了" value={settings.breakEnd} onChange={v=>update('breakEnd',v)}/></div>}<div className="scheduled"><span>休憩を除く勤務時間</span><strong>{result.scheduled?duration(result.scheduled):'—'}</strong></div><div className="rule"><Clock3 size={18}/><div><strong>時間休は1時間ごと</strong><p>端数は1時間に切り上げます。休憩時間はカウントしません。</p></div></div><button className="reset" onClick={()=>setSettings(defaults)}><RotateCcw size={14}/>初期設定に戻す</button><p className="device-note">勤務の設定はこのブラウザに保存されます。</p></aside>
    <div className="main-column">
     <section className="input-card card"><div className="section-heading"><span className="step">01</span><h2>出勤・早退時刻を入力</h2></div><Tabs value={mode} onValueChange={v=>{setMode(v as Mode);setCopied('');}}><TabsList className="mode-tabs"><TabsTrigger value="arrival"><ArrowDownLeft/>遅い出勤</TabsTrigger><TabsTrigger value="departure"><ArrowUpRight/>早退</TabsTrigger><TabsTrigger value="both">両方</TabsTrigger></TabsList>{(['arrival','departure','both'] as const).map(m=><TabsContent key={m} value={m}>{inputFields}</TabsContent>)}</Tabs><p className="input-hint">{mode==='arrival'?'勤務開始から出勤までの時間を計算します。':mode==='departure'?'早退から勤務終了までの時間を計算します。':'出勤前と早退後を、それぞれ1時間単位で計算します。'}</p></section>
     <section className="result-card" aria-live="polite" aria-atomic="true"><div className="result-top"><div className="section-heading"><span className="step">02</span><h2>休暇入力の提案</h2></div><span className="result-tag">計算結果</span></div>{result.error?<div className="error" role="alert"><Info size={22}/><p>{result.error}</p></div>:<><div className="result-total"><span>申請する時間休</span><div><strong>{result.total/60}</strong><span>時間</span></div><p>{result.total?`休憩を除く不在 ${duration(result.missing)} を、1時間単位に切り上げ`:'勤務時間内の不在はありません。時間休は不要です。'}</p></div>{result.entries.length>0&&<><div className="suggestions">{result.entries.map(e=><div className="suggestion" key={e.kind}><div className="suggestion-title"><span>{e.kind==='arrival'?'出勤前の休暇':'早退後の休暇'}</span><strong>{duration(e.rounded)}</strong></div><div className="range"><span>{time(e.from)}</span><ArrowRight size={20}/><span>{time(e.to)}</span></div><div className="suggestion-detail"><span>不在 {duration(e.missing)}</span><span>切り上げ +{duration(e.extra)}</span>{e.breakMinutes>0&&<span>休憩 {duration(e.breakMinutes)}を除外</span>}</div>{e.extra>0&&<p className="adjustment">{e.kind==='arrival'?`出勤時刻より後まで、勤務時間を${duration(e.extra)}多く含む提案です。`:`早退時刻より前から、勤務時間を${duration(e.extra)}多く含む提案です。`}実際に勤務した時間と重なる場合は、申請前に扱いを確認してください。</p>}</div>)}</div><button className="copy-button" onClick={copy}><Copy size={17}/>提案した時刻をコピー</button><span className="copy-status" role="status">{copied}</span></>}</>}</section>
    </div>
   </div>
   {!result.error&&<section className="timeline-card card"><div className="timeline-header"><div className="section-heading"><Clock3 size={19}/><h2>1日の時間の配分</h2></div><div className="legend"><span><i className="work"/>勤務</span><span><i className="rest"/>休憩</span><span><i className="leave"/>提案する休暇</span></div></div><div className="timeline" role="img" aria-label={`勤務 ${settings.start}から${settings.end}。${settings.hasBreak?`休憩 ${settings.breakStart}から${settings.breakEnd}。`:''}${summary}`}>{points.slice(0,-1).map((p,i)=>{const q=points[i+1],isRest=settings.hasBreak&&p>=result.bs&&q<=result.be,isLeave=result.entries.some(e=>p>=e.from&&q<=e.to);return <div key={p} title={`${time(p)}〜${time(q)} ${isRest?'休憩':isLeave?'休暇':'勤務'}`} className={isRest?'rest':isLeave?'leave':'work'} style={{flex:q-p}}/>;})}</div><div className="timeline-labels"><span>{settings.start}<small>勤務開始</small></span>{settings.hasBreak&&<span>{settings.breakStart} – {settings.breakEnd}<small>休憩</small></span>}<span>{settings.end}<small>勤務終了</small></span></div></section>}
   <footer><Info size={17}/><p>このアプリは入力候補を提案します。休暇の申請・登録は行いません。端数の扱いは職場の運用に合わせて確認してください。</p></footer>
  </main>
 </div>;
}
