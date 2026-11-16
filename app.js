const $=s=>document.querySelector(s);
const CATS=['industry','function','required_education','required_experience','employment_type'];
const FLAGS=['has_company_logo','has_questions','has_company_profile'];
const esc=t=>t.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
const nm=k=>k.replace(/_/g,' ');
let M,EX,TS,curve,SORT,CUM;
Promise.all([fetch('model.json').then(r=>r.json()),fetch('examples.json').then(r=>r.json()),fetch('test_scores.csv').then(r=>r.text())])
.then(([m,e,c])=>{M=m;EX=e.examples;const L=c.trim().split('\n'),h=L[0].split(','),yi=h.indexOf('y_true'),si=h.indexOf('score');
TS=L.slice(1).map(l=>{const p=l.split(',');return[+p[yi],+p[si]]});init()})
.catch(err=>document.body.insertAdjacentHTML('afterbegin','<p style="background:#fdd;color:#900;padding:1rem">Could not load data files ('+err+'). Open this page through a web server (GitHub Pages or python -m http.server), not by double-clicking the file.</p>'));

function score(r){
 const text=r.title+' '+r.description+' '+r.requirements,cnt={};
 for(const t of text.toLowerCase().match(/\b\w\w+\b/g)||[])if(M.vocab[t])cnt[t]=(cnt[t]||0)+1;
 let n=0;const v={};for(const w in cnt){v[w]=cnt[w]*M.vocab[w][0];n+=v[w]*v[w]}
 n=Math.sqrt(n)||1;const c={},o=[];let z=M.intercept;
 for(const w in v){c[w]=M.vocab[w][1]*v[w]/n;z+=c[w]}
 for(const k of CATS){const x=M.cats[k][r[k]]||0;z+=x;o.push([nm(k)+' = '+r[k],x])}
 for(const k of FLAGS){const x=M.flags[k]*r[k];z+=x;o.push([nm(k)+(r[k]?' = yes':' = no'),x])}
 return{p:1/(1+Math.exp(-z)),c,o,text};
}
function read(){const r={title:$('#t').value,description:$('#d').value,requirements:$('#q').value};
 CATS.forEach(k=>r[k]=$('#'+k).value);FLAGS.forEach(k=>r[k]=$('#'+k).checked?1:0);return r}
function run(){
 const r0=read(),s=score(r0),th=+$('#th').value,f=s.p>=th;$('#wi').innerHTML=FLAGS.map(k=>{const p2=score({...r0,[k]:1-r0[k]}).p;return `<div class="row2"><span>${nm(k)}: ${r0[k]?'yes':'no'} to ${r0[k]?'no':'yes'}</span><b>${(s.p*100).toFixed(0)}% to ${(p2*100).toFixed(0)}% fraud</b></div>`}).join('');$('#thv').textContent=th.toFixed(2);
 $('#verdict').innerHTML=`<b class="${f?'bad':'good'}">${f?'Likely FRAUD':'Looks genuine'}</b>: fraud probability <b>${(s.p*100).toFixed(1)}%</b> against a threshold of ${(th*100).toFixed(0)}%`;
 $('#bar').style.width=s.p*100+'%';$('#mark').style.left=th*100+'%';
 $('#hl').innerHTML=s.text.split(/(\b\w\w+\b)/).map((p,i)=>{const x=i%2&&s.c[p.toLowerCase()];if(!x)return esc(p);
  const a=(Math.min(Math.abs(x)/.25,1)*.6+.1).toFixed(2);return `<mark style="background:${x>0?'rgba(220,60,50,'+a+')':'rgba(40,160,90,'+a+')'}" title="${x.toFixed(3)}">${p}</mark>`}).join('');
 const it=[...Object.entries(s.c),...s.o].sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,10),mx=Math.abs(it[0][1])||1;
 $('#why').innerHTML=it.map(([n,x])=>`<div class="row"><span>${esc(n)}</span><span class="b"><i class="${x>0?'r':'g'}" style="width:${Math.abs(x)/mx*100}%"></i></span><em>${x>0?'+':''}${x.toFixed(2)}</em></div>`).join('');
}
function load(e){$('#t').value=e.title;$('#d').value=e.description;$('#q').value=e.requirements;
 CATS.forEach(k=>$('#'+k).value=e[k]);FLAGS.forEach(k=>$('#'+k).checked=!!e[k]);
 $('#truth').textContent=e.label?`Example type: ${e.label}. Actual label: ${e.true_label?'fraud':'genuine'}.`:'';run()}
function stats(th){let tp=0,fp=0,fn=0,tn=0;for(const[y,s]of TS){const p=s>=th;if(p&&y)tp++;else if(p)fp++;else if(y)fn++;else tn++}
 const pr=tp+fp?tp/(tp+fp):1,rc=tp/(tp+fn);return{tp,fp,fn,tn,pr,rc,f1:pr+rc?2*pr*rc/(pr+rc):0}}
function explore(){
 const th=+$('#eth').value,s=stats(th);$('#ethv').textContent=th.toFixed(2);
 $('#cm').innerHTML=`<table><tr><th></th><th>Predicted genuine</th><th>Predicted fraud</th></tr><tr><th>Actually genuine</th><td>${s.tn}</td><td>${s.fp}</td></tr><tr><th>Actually fraud</th><td>${s.fn}</td><td>${s.tp}</td></tr></table>
 <p>Precision <b>${s.pr.toFixed(3)}</b> · Recall <b>${s.rc.toFixed(3)}</b> · F1 <b>${s.f1.toFixed(3)}</b><br>Flagged ${s.tp+s.fp} of ${TS.length} postings; caught ${s.tp} of ${s.tp+s.fn} frauds.</p>`;
 const cv=$('#pr'),g=cv.getContext('2d'),W=cv.width,H=cv.height,P=46,fg=getComputedStyle(document.body).color;
 const X=r=>P+r*(W-P-10),Y=p=>H-P-p*(H-P-10);g.clearRect(0,0,W,H);g.strokeStyle=fg;g.fillStyle=fg;g.globalAlpha=.5;
 g.strokeRect(P,10,W-P-10,H-P-10);ax(g,W,H,P,'Recall','Precision',['0','0.5','1'],['0','0.5','1']);g.globalAlpha=1;
 g.strokeStyle='#2b5fd9';g.lineWidth=2;g.beginPath();curve.forEach((c,i)=>i?g.lineTo(X(c.rc),Y(c.pr)):g.moveTo(X(c.rc),Y(c.pr)));g.stroke();
 g.fillStyle='#c8372d';g.beginPath();g.arc(X(s.rc),Y(s.pr),6,0,7);g.fill();
}
function init(){
 for(const k of CATS){const o=Object.keys(M.cats[k]).sort();$('#'+k).innerHTML=o.map(x=>`<option>${esc(x)}</option>`).join('');$('#'+k).value='Missing'}
 $('#ex').innerHTML=EX.map((e,i)=>`<button data-i="${i}">${e.label}: ${esc(e.title.slice(0,24))}</button>`).join('');
 $('#ex').onclick=e=>{if(e.target.dataset.i)load(EX[e.target.dataset.i])};
 $('#form').addEventListener('input',e=>{if(e.target.id!=='th')$('#truth').textContent='';run()});
 curve=[];for(let t=0;t<=1;t+=.01)curve.push(stats(t));$('#eth').oninput=explore;
 const W=Object.entries(M.vocab).map(([w,v])=>[w,v[1]]).sort((a,b)=>b[1]-a[1]);
 $('#wf').innerHTML=W.slice(0,12).map(x=>`<li>${x[0]} (+${x[1].toFixed(1)})</li>`).join('');
 $('#wg').innerHTML=W.slice(-12).reverse().map(x=>`<li>${x[0]} (${x[1].toFixed(1)})</li>`).join('');
 SORT=[...TS].sort((a,b)=>b[1]-a[1]);CUM=[0];SORT.forEach(x=>CUM.push(CUM[CUM.length-1]+x[0]));$('#qn').oninput=queue;queue();
 $('#msel').innerHTML=MET.map((m,i)=>`<option value="${i}">${m}</option>`).join('');$('#msel').onchange=cmp;cmp();$('#wq').oninput=look;
 explore();load(EX[0]);
}

const CMP={'Baseline (always genuine)':[.957,0,0,0,.043,.5],'Logistic regression':[.965,.580,.731,.646,.711,.955],'Random forest':[.971,.954,.353,.514,.732,.956]};
const MET=['Accuracy','Precision','Recall','F1','PR-AUC','ROC-AUC'];
function cmp(){const i=+$('#msel').value;$('#mbars').innerHTML=Object.entries(CMP).map(([n,v])=>`<div class="hb"><span>${n.replace(' (always genuine)','')}</span><span class="t"><i style="width:${v[i]*100}%"></i></span><em>${v[i].toFixed(3)}</em></div>`).join('')}
function look(){const w=$('#wq').value.trim().toLowerCase(),v=M.vocab[w];$('#wo').textContent=!w?'':v?`"${w}": weight ${v[1].toFixed(2)} (${v[1]>0?'pushes toward fraud':'pushes toward genuine'}); IDF ${v[0].toFixed(2)} (higher means rarer).`:`"${w}" is not one of the model's 5,000 words (too rare, a stop word, or not in the training text).`}
function queue(){
 const n=+$('#qn').value,tot=CUM[CUM.length-1],f=CUM[n],rnd=n*tot/TS.length;$('#qnv').textContent=n+' of '+TS.length;
 $('#qo').innerHTML=`Reviewing the <b>${n}</b> highest-scoring postings finds <b>${f} of ${tot}</b> frauds (${(f/tot*100).toFixed(0)}%). Random review would find about ${rnd.toFixed(1)}, so the model is <b>${(f/rnd).toFixed(0)}x</b> better.`;
 const cv=$('#qc'),g=cv.getContext('2d'),W=cv.width,H=cv.height,P=46,Mx=600,fg=getComputedStyle(document.body).color;
 const X=i=>P+i/Mx*(W-P-10),Y=v=>H-P-v/tot*(H-P-10);g.clearRect(0,0,W,H);g.strokeStyle=fg;g.fillStyle=fg;g.globalAlpha=.5;
 g.strokeRect(P,10,W-P-10,H-P-10);ax(g,W,H,P,'Postings reviewed (highest score first)','Frauds found',['0','300','600'],['0',String(Math.round(tot/2)),String(tot)]);
 g.setLineDash([4,4]);g.beginPath();g.moveTo(X(0),Y(0));g.lineTo(X(Mx),Y(Mx*tot/TS.length));g.stroke();g.setLineDash([]);g.globalAlpha=1;
 g.strokeStyle='#2b5fd9';g.lineWidth=2;g.beginPath();for(let i=0;i<=Mx;i++)i?g.lineTo(X(i),Y(CUM[i])):g.moveTo(X(0),Y(0));g.stroke();
 g.fillStyle='#c8372d';g.beginPath();g.arc(X(n),Y(f),6,0,7);g.fill();
}
function ax(g,W,H,P,xl,yl,xt,yt){g.textAlign='center';g.fillText(xl,(P+W-10)/2,H-6);
 g.save();g.translate(12,(H-P+10)/2);g.rotate(-Math.PI/2);g.fillText(yl,0,0);g.restore();
 g.textAlign='right';yt.forEach((t,i)=>g.fillText(t,P-5,H-P-i/(yt.length-1)*(H-P-10)+4));
 g.textAlign='center';xt.forEach((t,i)=>g.fillText(t,P+i/(xt.length-1)*(W-P-10),H-P+14));g.textAlign='left'}
