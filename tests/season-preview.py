"""Local UI fixture. Only synthetic data; the page cannot connect to a real backend.
Run: python3 tests/season-preview.py, then http://127.0.0.1:8765/.
"""
import re
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FIXTURE = r"""
<script>
const fixtureAthlete = {id:'11111111-1111-4111-8111-111111111111',name:'Тестовый Ученик',group_name:'М-19',status:'active'};
const fixtureExercises = [
 {id:'22222222-2222-4222-8222-222222222222',name:'Подтягивания'},
 {id:'33333333-3333-4333-8333-333333333333',name:'Отжимания от пола'},
 {id:'44444444-4444-4444-8444-444444444444',name:'Отжимания от брусьев'}
];
const fixtureOldRow = {id:'55555555-5555-4555-8555-555555555555',athlete_id:fixtureAthlete.id,
 exercise_id:fixtureExercises[0].id,value:19,recorded_at:'2025-09-15',exercises:{name:'Подтягивания'}};
if (!localStorage.getItem('wuSeasonFixtureReady')) {
 localStorage.setItem('athletesData',JSON.stringify([{id:fixtureAthlete.id,name:fixtureAthlete.name,
  lastName:'Тестовый',firstName:'Ученик',group:'М-19',status:'active',season:'2025-2026',
  performance:[{month:'Сент',pullUps:19}],records:{pullUps:{'Сент':19},pushUps:{},dips:{}}}]));
 localStorage.setItem('exercisesData',JSON.stringify(fixtureExercises));
 localStorage.setItem('fixtureDB',JSON.stringify([fixtureOldRow]));
 localStorage.setItem('wuSeasonFixtureReady','1');
}
window.supabaseSDKLoaded=true;
window.supabase={createClient:()=>({from(table){
 let start=0,end=499,action='read',payload;
 return {select(){return this},order(){return this},eq(){return this},range(a,b){start=a;end=b;return this},
  update(data){action='update';payload=data;return this},
  upsert(data){action='upsert';payload=data;return this},
  delete(){throw Error('DELETE запрещён в проверке')},
  then(resolve){
   const rows=JSON.parse(localStorage.getItem('fixtureDB'));
   if(action==='upsert'){
    const found=rows.findIndex(row=>row.id===payload.id);
    const value={...payload,exercises:{name:fixtureExercises.find(e=>e.id===payload.exercise_id).name}};
    if(found<0)rows.push(value);else rows[found]={...rows[found],...value};
    localStorage.setItem('fixtureDB',JSON.stringify(rows));return Promise.resolve(resolve({error:null}));
   }
   const data=action==='update'?null:table==='athletes'?[fixtureAthlete]:table==='exercises'?fixtureExercises:
    table==='performances'?rows.slice(start,end+1):[];
   return Promise.resolve(resolve({data,error:null}));
  }};
}})};
document.addEventListener('DOMContentLoaded',()=>{
 const panel=document.createElement('div');panel.id='fixture-evidence';
 panel.style.cssText='padding:12px;color:#fbbf24;border:1px solid #fbbf24;font-size:14px';
 document.querySelector('.header').prepend(panel);
 setInterval(()=>{
  const rows=JSON.parse(localStorage.getItem('fixtureDB'));
  const state=JSON.parse(localStorage.getItem('seasonStateV1')||'{}');
  panel.textContent='ЛОКАЛЬНАЯ ПРОВЕРКА · Искусственные данные · История 2025: '+
   (JSON.stringify(rows.find(r=>r.id===fixtureOldRow.id))===JSON.stringify(fixtureOldRow)?'сохранена (19)':'ОШИБКА')+
   ' · Строк в базе: '+rows.length+' · В очереди: '+(state.pendingChanges||[]).length;
 },250);
});
</script>
"""


class Preview(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?')[0] in ('/', '/index.html'):
            source = (ROOT / 'index.html').read_text()
            source = re.sub(r'<script\s+id="supabase-sdk"[\s\S]*?</script>', FIXTURE, source, count=1)
            data, mime = source.encode(), 'text/html; charset=utf-8'
        elif self.path in ('/sw.js', '/manifest.json') or re.fullmatch(r'/icons/icon-\d+x\d+\.png', self.path):
            path = ROOT / self.path[1:]
            if not path.is_file():
                self.send_error(404)
                return
            data = path.read_bytes()
            mime = 'application/javascript' if path.suffix == '.js' else 'application/json' if path.suffix == '.json' else 'image/png'
        else:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header('Content-Type', mime)
        # Prevent any live API/CDN access, including accidentally retained production URLs.
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:")
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == '__main__':
    print('Synthetic-only preview: http://127.0.0.1:8765/', flush=True)
    HTTPServer(('127.0.0.1', 8765), Preview).serve_forever()
