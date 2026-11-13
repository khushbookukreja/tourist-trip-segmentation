// ui.js: canvas drawing, controls, tooltips, stats, loadings, predictor
const FN=NUMLBL.concat(TR.map(t=>'Transport: '+t),SE.map(t=>'Season: '+t),CO.map(t=>'Travelling: '+t));
let cbv=0;
function loadings(){$('#load').innerHTML=[0,1].map(k=>{const c=PC.comps[k],o=c.map((_,i)=>i).sort((a,b)=>Math.abs(c[b])-Math.abs(c[a])).slice(0,5);
return `<div><h3>PC${k+1} <small>${(PC.ratio[k]*100).toFixed(0)}% of variance</small></h3>`+o.map(i=>`<div class="ld"><span>${FN[i]}</span><i style="width:${Math.min(100,Math.abs(c[i])*160)}%;background:${c[i]>0?'var(--acc)':'#d6336c'}"></i><span>${c[i]>0?'+':'−'}${Math.abs(c[i]).toFixed(2)}</span></div>`).join('')+'</div>'}).join('')}
function preset(y){const p=PR[y];p.m.forEach((v,i)=>{$('#s'+i).value=v;$('#o'+i).textContent=fmt(v,i)});
$('#tr').value=p.t.indexOf(Math.max(...p.t));$('#se').value=p.s.indexOf(Math.max(...p.s));$('#co').value=p.c;predict()}
/* ---------- UI ---------- */
const $=s=>document.querySelector(s);
const COL=['#e4572e','#2e86ab','#f2a900','#8e63c9','#3fa34d','#d6336c'];
const vis=new Set([0,1,2,3,4,5]),SC=[[],[]];let hover=-1,raf=0;
const SL=[[1,40,1],[100,20000,100],[1,20,1],[18,85,1],[0,365,5],[1,5,.5],[0,30,1],[50,12000,50]],DEF=[7,2500,3,38,60,4,8,3000];
const fmt=(v,i)=>i==1?'$'+Math.round(v).toLocaleString():i==5?(+v).toFixed(1):Math.round(v).toLocaleString();

function colorOf(i){if(!cbv)return COL[D[i].y];const j=cbv-1,z=(D[i].x[j]-mean[j])/sd[j],t=Math.min(1,Math.max(0,(z+2)/4));return `hsl(${230-230*t},78%,52%)`}
function css(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()}
function draw(c,pts,k,q){
const dpr=devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;
if(c.width!=Math.round(w*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr)}
const g=c.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
let x0=1e18,x1=-1e18,y0=1e18,y1=-1e18;
for(const p of pts.concat(q?[q]:[])){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])}
const pad=18,sx=(w-2*pad)/(x1-x0||1),sy=(h-2*pad)/(y1-y0||1);
const m=p=>[pad+(p[0]-x0)*sx,h-pad-(p[1]-y0)*sy];
SC[k]=pts.map(m);g.globalAlpha=.78;
SC[k].forEach((p,i)=>{if(!vis.has(D[i].y))return;g.fillStyle=colorOf(i);g.beginPath();g.arc(p[0],p[1],3.3,0,6.283);g.fill()});
g.globalAlpha=1;
if(hover>=0&&SC[k][hover]){const p=SC[k][hover];g.lineWidth=2;g.strokeStyle=css('--ink');g.beginPath();g.arc(p[0],p[1],7,0,6.283);g.stroke()}
if(q){const p=m(q);g.beginPath();for(let i=0;i<10;i++){const a=-1.5708+i*.6283,r=i%2?5:11;g.lineTo(p[0]+r*Math.cos(a),p[1]+r*Math.sin(a))}
g.closePath();g.fillStyle=css('--ink');g.fill();g.lineWidth=2;g.strokeStyle=css('--panel');g.stroke()}}
function render(){
T=S?Array.from({length:D.length},(_,i)=>[S.Y[2*i],S.Y[2*i+1]]):Z;
let q2=null;if(Qry){q2=[0,0];Qry.nn.forEach(i=>{q2[0]+=T[i][0]/Qry.nn.length;q2[1]+=T[i][1]/Qry.nn.length})}
draw($('#c1'),Z,0,Qry&&Qry.pca);draw($('#c2'),T,1,q2)}

function stats(){const r=PC.ratio;let c=0,k=0;while(c<.95&&k<r.length)c+=r[k++];
const card=(b,s)=>`<div><b>${b}</b><span>${s}</span></div>`;
$('#stats').innerHTML=card(((r[0]+r[1])*100).toFixed(0)+'%','variance kept by 2 PCA components')+card(k,'components needed for 95%')+
card(sil1.toFixed(2),'PCA purpose separation (silhouette)')+card(sil2==null?'…':sil2.toFixed(2),'t-SNE purpose separation (silhouette)')+card(ari1.toFixed(2),'PCA clusters matching purpose (ARI)')+card(ari2==null?'…':ari2.toFixed(2),'t-SNE clusters matching purpose (ARI)')}
function profiles(){const n=D.length;
let h='<table><tr><th>Purpose</th><th>Trips</th><th>Days</th><th>Spend</th><th>Group</th><th>Age</th><th>Activities</th><th>Distance</th></tr>';
PUR.forEach((p,y)=>{const rows=D.filter(d=>d.y==y),a=i=>rows.reduce((s,d)=>s+d.x[i],0)/(rows.length||1);
h+=`<tr><td><span style="color:${COL[y]}">&#9679;</span> ${p}</td><td>${rows.length}</td><td>${a(0).toFixed(1)}</td><td>$${Math.round(a(1)).toLocaleString()}</td><td>${a(2).toFixed(1)}</td><td>${a(3).toFixed(0)}</td><td>${a(6).toFixed(1)}</td><td>${Math.round(a(7)).toLocaleString()} km</td></tr>`});
$('#prof').innerHTML=h+'</table>'}

function runTsne(){cancelAnimationFrame(raf);sil2=null;ari2=null;
const A=X.map(v=>Array.from({length:10},(_,k)=>proj(v,k))),perp=+$('#perp').value;
S=tsneInit(A,perp,Z);
const loop=()=>{for(let i=0;i<6&&S.it<S.total;i++)step(S);
$('#tsSub').textContent=`perplexity ${perp}, iteration ${S.it} of ${S.total}`;
if(S.it%60==0||S.it>=S.total){T=Array.from({length:D.length},(_,i)=>[S.Y[2*i],S.Y[2*i+1]]);if(S.it>=200){sil2=silhouette(T,labels);ari2=ari(labels,kmeans(T,6,7));stats()}}
render();if(S.it<S.total)raf=requestAnimationFrame(loop);else $('#tsSub').textContent=`perplexity ${perp}, done`};
loop()}
function build(){const n=+$('#n').value;D=gen(n,+$('#seed').value||1);labels=D.map(d=>d.y);
mean=NUMLBL.map((_,j)=>D.reduce((a,r)=>a+r.x[j],0)/n);
sd=NUMLBL.map((_,j)=>Math.sqrt(D.reduce((a,r)=>a+(r.x[j]-mean[j])**2,0)/n)||1);
X=D.map(feat);PC=pca(X);Z=X.map(v=>[proj(v,0),proj(v,1)]);S=null;
sil1=silhouette(Z,labels);ari1=ari(labels,kmeans(Z,6,7));$('#pcaSub').textContent=`PC1 ${(PC.ratio[0]*100).toFixed(0)}%, PC2 ${(PC.ratio[1]*100).toFixed(0)}% of variance`;
stats();profiles();loadings();predict();runTsne()}

function predict(){
const row={x:SL.map((_,i)=>+$('#s'+i).value),tr:+$('#tr').value,se:+$('#se').value,co:+$('#co').value},v=feat(row);
const d=X.map((u,i)=>{let s=0;for(let j=0;j<u.length;j++)s+=(u[j]-v[j])**2;return[s,i]}).sort((a,b)=>a[0]-b[0]).slice(0,15);
const pr=Array(6).fill(0);d.forEach(a=>pr[D[a[1]].y]+=1/15);
const best=pr.indexOf(Math.max(...pr));
Qry={pca:[proj(v,0),proj(v,1)],nn:d.slice(0,5).map(a=>a[1])};
$('#res').innerHTML=PUR.map((p,y)=>`<div class="${y==best?'top':''}"><span>${p}</span><i style="width:${Math.max(pr[y]*100,1)}%;background:${COL[y]}"></i><span>${Math.round(pr[y]*100)}%</span></div>`).join('');
if(D)render()}

/* wiring */
$('#sl').innerHTML=NUMLBL.map((l,i)=>`<label>${l}<span><input id="s${i}" type="range" min="${SL[i][0]}" max="${SL[i][1]}" step="${SL[i][2]}" value="${DEF[i]}"><output id="o${i}">${fmt(DEF[i],i)}</output></span></label>`).join('');
[['#tr',TR],['#se',SE],['#co',CO]].forEach(([s,a])=>{$(s).innerHTML=a.map((t,i)=>`<option value="${i}">${t}</option>`).join('')});
$('#tr').value=2;$('#se').value=1;$('#co').value=1;
NUMLBL.forEach((_,i)=>$('#s'+i).oninput=e=>{$('#o'+i).textContent=fmt(e.target.value,i);predict()});
['#tr','#se','#co'].forEach(s=>$(s).onchange=predict);
$('#n').oninput=e=>$('#nv').textContent=e.target.value;
$('#perp').oninput=e=>$('#pv').textContent=e.target.value;
$('#go').onclick=build;$('#rerun').onclick=runTsne;
$('#cb').innerHTML='<option value="0">Purpose</option>'+NUMLBL.map((l,i)=>`<option value="${i+1}">${l}</option>`).join('');
$('#cb').onchange=()=>{cbv=+$('#cb').value;$('#grad').style.display=cbv?'block':'none';render()};
$('#pre').innerHTML=PUR.map((p,y)=>`<button class="ghost" data-p="${y}">${p}</button>`).join('');
$('#pre').onclick=e=>{const b=e.target.closest('button');if(b)preset(+b.dataset.p)};
$('#legend').innerHTML=PUR.map((p,y)=>`<button data-y="${y}"><i style="background:${COL[y]}"></i>${p}</button>`).join('');
$('#legend').onclick=e=>{const b=e.target.closest('button');if(!b)return;const y=+b.dataset.y;vis.has(y)?vis.delete(y):vis.add(y);b.classList.toggle('off',!vis.has(y));render()};
[0,1].forEach(k=>{const c=$('#c'+(k+1));
c.onmousemove=e=>{const r=c.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;let b=-1,bd=100;
SC[k].forEach((p,i)=>{if(!vis.has(D[i].y))return;const d=(p[0]-mx)**2+(p[1]-my)**2;if(d<bd){bd=d;b=i}});
hover=b;const t=$('#tip');
if(b>=0){const d=D[b];t.style.display='block';t.style.left=Math.min(e.clientX+14,innerWidth-270)+'px';t.style.top=(e.clientY+14)+'px';
t.textContent=`${PUR[d.y]}: ${d.x[0].toFixed(0)} days, $${Math.round(d.x[1]).toLocaleString()}, group of ${d.x[2]}, age ${d.x[3].toFixed(0)}, ${d.x[7].toFixed(0)} km by ${TR[d.tr]}, ${SE[d.se]}, ${CO[d.co]}`}else t.style.display='none';
render()};
c.onmouseleave=()=>{hover=-1;$('#tip').style.display='none';render()}});
addEventListener('resize',()=>D&&render());
matchMedia('(prefers-color-scheme:dark)').addEventListener('change',()=>D&&render());
build(); 