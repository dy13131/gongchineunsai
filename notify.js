/* 공치는사이 — 정기 모임 웹푸시 발송 (GitHub Actions에서 매일 실행) */
const webpush = require('web-push');

const DB = (process.env.DB_URL || "https://tennis-534af-default-rtdb.firebaseio.com").replace(/\/$/, "");
const GROUP = "gongchineunsai";

webpush.setVapidDetails("mailto:gongchineunsai@example.com", process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);

function iso(y, m, d){ return y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0"); }

async function krHolidays(years){
  const set = new Set();
  for (const yy of years){
    try {
      const r = await fetch("https://date.nager.at/api/v3/PublicHolidays/" + yy + "/KR");
      if (r.ok){ (await r.json()).forEach(h => set.add(h.date)); }
    } catch(e){ console.log("공휴일 조회 실패", yy, e.message); }
  }
  return set;
}

function makeIsOff(holidays){
  return function(y, m, d){
    const wd = new Date(Date.UTC(y, m, d)).getUTCDay();
    return wd === 0 || wd === 6 || holidays.has(iso(y, m, d));
  };
}

function isLastMonday(y, m, d){
  const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, d)).getUTCDay() === 1 && (d + 7) > dim;
}

function twentiethMeeting(y, m, isOff){
  if (!isOff(y, m, 20)) return iso(y, m, 20);
  let dt = new Date(Date.UTC(y, m, 21));
  while (dt.getUTCDay() !== 1) dt.setUTCDate(dt.getUTCDate() + 1);
  while (isOff(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())) dt.setUTCDate(dt.getUTCDate() + 7);
  return iso(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
}

async function main(){
  const now = new Date(Date.now() + 9 * 3600 * 1000);
  const y = now.getUTCFullYear(), m = now.getUTCMonth(), d = now.getUTCDate();
  const today = iso(y, m, d);

  const holidays = await krHolidays([y - 1, y, y + 1]);
  const isOff = makeIsOff(holidays);

  const msgs = [];
  if (now.getUTCDay() === 1 && isLastMonday(y, m, d)){
    msgs.push({ title: "공치는사이 🎾", body: "신트리/삼산건강 테니스 예약" });
  }
  const prev = new Date(Date.UTC(y, m - 1, 1));
  const bDays = new Set([
    twentiethMeeting(y, m, isOff),
    twentiethMeeting(prev.getUTCFullYear(), prev.getUTCMonth(), isOff)
  ]);
  if (bDays.has(today)){
    msgs.push({ title: "공치는사이 🎾", body: "부천 테니스 예약" });
  }

  if (process.env.TEST === "1" && msgs.length === 0){
    msgs.push({ title: "공치는사이 🎾", body: "테스트 알림이에요! 잘 오면 성공 ✅" });
  }

  if (msgs.length === 0){ console.log("오늘(" + today + ")은 알림 없음"); return; }

  const res = await fetch(DB + "/groups/" + GROUP + "/pushSubs.json");
  const obj = (res.ok ? await res.json() : null) || {};
  const entries = Object.entries(obj);
  if (entries.length === 0){ console.log("등록된 알림 대상 없음"); return; }

  for (const msg of msgs){
    let ok = 0;
    for (const [key, val] of entries){
      const sub = val && val.sub ? val.sub : val;
      if (!sub || !sub.endpoint) continue;
      try {
        await webpush.sendNotification(sub, JSON.stringify(msg));
        ok++;
      } catch(err){
        const code = err && err.statusCode;
        console.log("전송 실패", code || (err && err.message));
        if (code === 404 || code === 410){
          await fetch(DB + "/groups/" + GROUP + "/pushSubs/" + key + ".json", { method: "DELETE" }).catch(()=>{});
        }
      }
    }
    console.log("발송:", msg.body, "-", ok + "/" + entries.length, "성공");
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
