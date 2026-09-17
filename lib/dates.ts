export function startOfDay(d:Date){return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
export function endOfDay(d:Date){return new Date(d.getFullYear(),d.getMonth(),d.getDate(),23,59,59,999)}
export function isWeekday(d:Date){return d.getDay()!==0&&d.getDay()!==6}
export function monthBounds(month:string){const m=/^(\d{4})-(\d{2})$/.exec(month);if(!m)throw new Error("Month must be YYYY-MM");const y=+m[1],n=+m[2];if(n<1||n>12)throw new Error("Month must be YYYY-MM");return{start:new Date(y,n-1,1),end:new Date(y,n,0,23,59,59,999)}}
export function weekdaysBetween(start:Date,end:Date){const out:Date[]=[];for(let d=startOfDay(start);d<=end;d.setDate(d.getDate()+1)){if(isWeekday(d))out.push(new Date(d))}return out}
export function parseFlexibleDate(v:string){const s=v.trim();if(!s)return null;let m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);if(m)return new Date(+m[1],+m[2]-1,+m[3]);m=/^(\d{4})\/(\d{2})\/(\d{2})$/.exec(s);if(m)return new Date(+m[1],+m[2]-1,+m[3]);m=/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(s);if(m){const a=+m[1],b=+m[2],y=+m[3];if(a>12)return new Date(y,b-1,a);return new Date(y,a-1,b)}return null}
