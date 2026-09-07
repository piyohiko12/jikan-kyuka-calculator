export type Settings = { start: string; end: string; breakStart: string; breakEnd: string; hasBreak: boolean };
export type Mode = 'arrival' | 'departure' | 'both';
export type Entry = { kind: 'arrival' | 'departure'; missing: number; rounded: number; extra: number; from: number; to: number; breakMinutes: number };
export const defaults: Settings = { start: '08:30', end: '17:00', breakStart: '12:00', breakEnd: '12:45', hasBreak: true };
export function minutes(value: string) { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return NaN; const [h,m] = value.split(':').map(Number); return h*60+m; }
export const time = (n: number) => `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
export const duration = (n: number) => n === 0 ? '0分' : `${Math.floor(n/60) ? `${Math.floor(n/60)}時間` : ''}${n%60 ? `${n%60}分` : ''}`;
export function calculate(s: Settings, mode: Mode, arrival: string, departure: string) {
  const start=minutes(s.start), end=minutes(s.end), bs=minutes(s.breakStart), be=minutes(s.breakEnd);
  const fail = (error: string) => ({ error, entries: [] as Entry[], total: 0, missing: 0, scheduled: 0, start, end, bs, be });
  if (![start,end].every(Number.isFinite)) return fail('勤務の開始・終了時刻を入力してください。');
  if (start>=end) return fail('勤務終了は開始より後にしてください。日をまたぐ勤務には対応していません。');
  if (s.hasBreak && (![bs,be].every(Number.isFinite) || bs<start || be>end || bs>=be)) return fail('休憩は勤務時間内で、終了を開始より後に設定してください。');
  const rest = (a:number,b:number) => s.hasBreak ? Math.max(0,Math.min(b,be)-Math.max(a,bs)) : 0;
  const work = (a:number,b:number) => Math.max(0,b-a-rest(a,b));
  const scheduled=work(start,end);
  if (!scheduled) return fail('休憩を除いた勤務時間が0分です。設定を見直してください。');
  const a = mode==='departure' ? start : minutes(arrival), d=mode==='arrival' ? end : minutes(departure);
  if (![a,d].every(Number.isFinite)) return fail('計算する出勤時刻・早退時刻を入力してください。');
  if (mode==='both' && a>d) return fail('早退時刻は出勤時刻以降にしてください。');
  const entries: Entry[]=[];
  for (const kind of ['arrival','departure'] as const) {
    if ((kind==='arrival' && mode==='departure') || (kind==='departure' && mode==='arrival')) continue;
    const missing=kind==='arrival' ? work(start,Math.max(start,Math.min(end,a))) : work(Math.max(start,Math.min(end,d)),end);
    if (!missing) continue;
    const rounded=Math.ceil(missing/60)*60;
    if (rounded>scheduled) return {...fail('1時間単位に切り上げると所定勤務時間を超えます。全日休など、別の休暇区分を確認してください。'),scheduled};
    let from=start,to=end;
    if (kind==='arrival') {to=start; while(work(start,to)<rounded) to++;}
    else {from=end; while(work(from,end)<rounded) from--;}
    entries.push({kind,missing,rounded,extra:rounded-missing,from,to,breakMinutes:rest(from,to)});
  }
  if (entries.length===2 && entries[0].to>entries[1].from) return {...fail('切り上げた出勤前・早退後の休暇が重なります。時間休の組み合わせでは提案できません。全日休などの扱いを確認してください。'),scheduled};
  return {error:'',entries,total:entries.reduce((v,e)=>v+e.rounded,0),missing:entries.reduce((v,e)=>v+e.missing,0),scheduled,start,end,bs,be};
}
