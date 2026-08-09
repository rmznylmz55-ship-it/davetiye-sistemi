const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = __dirname;
const PORT = parseInt(process.env.PORT || process.argv[2] || '3000', 10);

/* --- GIT OTOMATIK PUSH ---
   Kaydetme işlemi sonrası dosya, yerel repo klasörüne yazıldıktan sonra
   otomatik olarak git add + commit + push yapılır. Böylece kullanıcının
   token/ayar ile uğraşması gerekmez (gh CLI zaten oturum aciktir). */
function gitCommitAll(msg, cb){
  const msgSafe = String(msg||'güncelleme').replace(/\r?\n/g,' ').slice(0,120);
  execFile('git',['add','-A'],{cwd:ROOT},(errA)=>{
    if(errA)return cb(errA);
    execFile('git',['commit','-m',msgSafe],{cwd:ROOT},(errC)=>{
      // commit yoksa "nothing to commit" hatasi normaldir; yine de push deneriz
      execFile('git',['push','origin','main'],{cwd:ROOT},(errP)=>{
        if(errP)return cb(errP);
        cb(null);
      });
    });
  });
}

const MIME = {
  '.html':'text/html; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.gif':'image/gif',
  '.svg':'image/svg+xml',
  '.mp3':'audio/mpeg',
  '.mp4':'video/mp4',
  '.webm':'video/webm',
  '.ico':'image/x-icon',
  '.txt':'text/plain; charset=utf-8'
};

function safeName(name){
  name = String(name||'').replace(/\\/g,'/').split('/').pop().trim();
  if(!name || name==='.' || name==='..') return null;
  if(/[<>:"|?*\x00-\x1f]/.test(name)) return null;   // Windows yasaklı karakterler
  return name;
}

const ALLOW_DIRS = ['', 'data', 'cikti', 'import', '_yedek'];

function safeRel(rel){
  rel = String(rel||'').trim().replace(/\\/g,'/');
  if(rel==='') return {dir:'', name:''};
  const parts = rel.split('/').filter(Boolean);
  if(parts.length>2) return null;
  const dir = parts.length>1 ? parts[0] : '';
  const name = parts.length>1 ? parts[1] : parts[0];
  if(dir && ALLOW_DIRS.indexOf(dir)<0) return null;
  if(!safeName(name) || safeName(name)!==name) return null;
  return {dir, name};
}

function readMeta(dir, file){
  try{
    const p = path.join(ROOT, dir, file);
    const j = JSON.parse(fs.readFileSync(p,'utf8'));
    const v = j.veri || j;
    return {
      name: file,
      cift_adi: j.cift_adi || v['5_davet_sahibi_isimleri'] || j.davet_sahibi_isimleri || '',
      etkinlik_turu: j.etkinlik_turu || v['3_etkinlik_turu'] || '',
      tarih: (v['12_hedef_zaman_damgasi'] || j.tarih || '').substring(0,10),
      op_numarasi: j.op_numarasi || v.op_numarasi || '',
      olusturan: j.olusturan || v.olusturan || ''
    };
  }catch(e){ return null; }
}

const server = http.createServer((req,res)=>{

  if(req.method==='OPTIONS'){
    res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type'});
    res.end();
    return;
  }

  // --- KAYDETME ENDPOINTI ---
  if(req.url==='/save' && req.method==='POST'){
    let body='';
    req.on('data',c=>{ if(body.length<200*1024*1024) body+=c; });
    req.on('end',()=>{
      try{
        const data = JSON.parse(body);
        const rel = safeRel(data.name||'');
        if(!rel || !rel.name){ res.writeHead(400); res.end('gecersiz dosya adi'); return; }
        const dirPath = path.join(ROOT, rel.dir);
        if(!fs.existsSync(dirPath)) fs.mkdirSync(dirPath,{recursive:true});
        const filePath = path.join(dirPath, rel.name);
        const content = String(data.content==null ? '' : data.content);
        fs.writeFile(filePath, content, 'utf8', err=>{
          if(err){ res.writeHead(500); res.end('yazma hatasi: '+err.message); return; }
          const payload = {ok:true, file:(rel.dir?rel.dir+'/':'')+rel.name, bytes:Buffer.byteLength(content,'utf8'), path:filePath};
          gitCommitAll('davetiye guncelle: '+(data.name||rel.name), (gerr)=>{
            if(gerr){
              payload.git=null;
              payload.gitError='otomatik push yapilamadi: '+String(gerr.message||gerr).slice(0,120);
            }else{
              payload.git='pushed';
            }
            res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});
            res.end(JSON.stringify(payload));
          });
        });
      }catch(e){ res.writeHead(400); res.end('gecersiz istek'); }
    });
    return;
  }

  // --- DOSYA / KLASOR LISTESI ---
  if(req.url.indexOf('/list')===0 && req.method==='GET'){
    try{
      const q = new URL(req.url,'http://x');
      const dirName = q.searchParams.get('dir')||'import';
      const meta = q.searchParams.get('meta')==='1';
      if(ALLOW_DIRS.indexOf(dirName)<0){ res.writeHead(403); res.end('yasak'); return; }
      const dirPath = path.join(ROOT, dirName);
      if(!fs.existsSync(dirPath)){ res.writeHead(200,{'Content-Type':'application/json'}); res.end(meta?'[]':'[]'); return; }
      const files = fs.readdirSync(dirPath)
        .filter(f=>/\.(json|html)$/i.test(f))
        .sort();
      if(meta){
        const list = files.map(f=>readMeta(dirName,f)).filter(Boolean);
        res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});
        res.end(JSON.stringify(list));
      }else{
        res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});
        res.end(JSON.stringify(files));
      }
    }catch(e){ res.writeHead(500); res.end('hata'); }
    return;
  }

  // --- SILME ENDPOINTI ---
  if(req.url.indexOf('/delete')===0 && req.method==='POST'){
    let body='';
    req.on('data',c=>{ body+=c; });
    req.on('end',()=>{
      try{
        const data = JSON.parse(body||'{}');
        const rel = safeRel(data.name||'');
        if(!rel || !rel.name){ res.writeHead(400); res.end('gecersiz dosya adi'); return; }
        const filePath = path.join(ROOT, rel.dir, rel.name);
        if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});
        res.end(JSON.stringify({ok:true, file:(rel.dir?rel.dir+'/':'')+rel.name}));
      }catch(e){ res.writeHead(400); res.end('gecersiz istek'); }
    });
    return;
  }

  // --- HTML URETIM ENDPOINTI (cikti/) ---
  if(req.url.indexOf('/gen')===0 && req.method==='GET'){
    try{
      const q = new URL(req.url,'http://x');
      const op = (q.searchParams.get('op')||'').trim();
      if(!/^OP-[\w-]+$/i.test(op)){ res.writeHead(400); res.end('gecersiz op'); return; }
      const dataPath = path.join(ROOT,'data',op+'.json');
      if(!fs.existsSync(dataPath)){ res.writeHead(404); res.end('veri bulunamadi'); return; }
      const dataJSON = fs.readFileSync(dataPath,'utf8');
      let template = fs.readFileSync(path.join(ROOT,'davetiye_preview.html'),'utf8');
      template = template.replace('</head>', '<script>var DAVETIYE_DATA='+dataJSON+';<\/script>\n</head>');
      template = template.replace("window.parent.postMessage({type:'davetiyeReady'},'*');",'');
      let j;
      try{ j = JSON.parse(dataJSON); }catch(e){ j = j||{}; }
      const isim = String(j.davet_sahibi_isimleri||'davetiye');
      const sluguz = isim.toLowerCase().replace(/[çÇ]/g,'c').replace(/[ğĞ]/g,'g').replace(/[ıI]/g,'i').replace(/[öÖ]/g,'o').replace(/[şŞ]/g,'s').replace(/[üÜ]/g,'u').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||'davetiye';
      const fname = 'davetiye_'+sluguz+'_'+op+'.html';
      const ciktiDir = path.join(ROOT,'cikti');
      if(!fs.existsSync(ciktiDir)) fs.mkdirSync(ciktiDir,{recursive:true});
      fs.writeFile(path.join(ciktiDir,fname), template, 'utf8', err=>{
        if(err){ res.writeHead(500); res.end('yazma hatasi'); return; }
        res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});
        res.end(JSON.stringify({ok:true, file:fname, path:path.join(ciktiDir,fname)}));
      });
    }catch(e){ res.writeHead(500); res.end('hata'); }
    return;
  }

  // --- STATIK DOSYA SERVISI ---
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/,'');
  let fp = path.join(ROOT, rel);

  fs.stat(fp, (err,stat)=>{
    if(err || !stat.isFile()){
      res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
      res.end('Bulunamadi: '+rel);
      return;
    }
    const ext = path.extname(fp).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    res.writeHead(200,{
      'Content-Type':type,
      'Cache-Control':'no-cache'
    });
    fs.createReadStream(fp).pipe(res);
  });
});

server.listen(PORT, ()=>{
  console.log('Davetiye Sunucu: http://localhost:'+PORT);
  console.log('Klasor: '+ROOT);
});