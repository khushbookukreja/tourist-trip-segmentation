// data.js: constants, seeded random numbers, synthetic trip generator, feature encoding
const PUR=['Leisure','Business','Adventure','Pilgrimage','Medical','Visit family'];
const NUMLBL=['Duration (days)','Spend (USD)','Group size','Age','Booking lead (days)','Hotel stars','Activities','Distance (km)'];
const TR=['car','train','air','bus'],SE=['spring','summer','autumn','winter'],CO=['solo','family','friends','group'];
const PR=[
{p:.28,m:[7,2500,3,38,60,4,8,3000],t:[.1,0,.85,.05],s:[.2,.5,.2,.1],c:1},
{p:.18,m:[3,1800,1.3,40,10,4.2,2,1800],t:[0,0,.9,.1],s:[.25,.25,.25,.25],c:0},
{p:.16,m:[10,2200,3.5,29,90,2.8,14,4000],t:[.3,.1,.5,.1],s:[.1,.5,.3,.1],c:2},
{p:.14,m:[5,900,8,55,45,2.5,5,800],t:[.1,.6,.1,.2],s:[.3,.1,.2,.4],c:3},
{p:.10,m:[14,4500,2,50,30,4.5,3,2500],t:[0,0,.9,.1],s:[.25,.25,.25,.25],c:1},
{p:.14,m:[9,1200,2.5,45,20,2,3,1500],t:[.1,.1,.5,.3],s:[.15,.15,.2,.5],c:1}];
const SD=[2.5,700,.8,7,20,.5,2.5,900],LO=[1,100,1,18,0,1,0,50],HI=[40,20000,20,85,365,5,30,12000];
let D,X,Z,T,S,mean,sd,PC,labels,sil1=0,sil2=null,ari1=0,ari2=null,Qry=null;

function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function gauss(r){return Math.sqrt(-2*Math.log(1-r()))*Math.cos(2*Math.PI*r())}
function pick(r,w){const u=r();let c=0;for(let i=0;i<w.length;i++){c+=w[i];if(u<c)return i}return w.length-1}
function gen(n,seed){const r=rng(seed),ps=PR.map(p=>p.p),tot=ps.reduce((a,b)=>a+b);
return Array.from({length:n},()=>{const y=pick(r,ps.map(p=>p/tot)),pr=PR[y];
const x=pr.m.map((m,i)=>Math.min(HI[i],Math.max(LO[i],m+SD[i]*gauss(r))));x[2]=Math.round(x[2]);
return{x,tr:pick(r,pr.t),se:pick(r,pr.s),co:r()<.7?pr.c:Math.floor(r()*4),y}})}
function feat(row){const v=row.x.map((a,i)=>(a-mean[i])/sd[i]);
for(let k=0;k<4;k++)v.push(+(row.tr==k));for(let k=0;k<4;k++)v.push(+(row.se==k));for(let k=0;k<4;k++)v.push(+(row.co==k));return v}