// metrics.js: silhouette score, KMeans (k-means++ style start) and adjusted Rand index
function silhouette(pts,lab){const n=pts.length;let tot=0;
for(let i=0;i<n;i++){const s=Array(6).fill(0),c=Array(6).fill(0);
for(let j=0;j<n;j++){if(j==i)continue;s[lab[j]]+=Math.hypot(pts[i][0]-pts[j][0],pts[i][1]-pts[j][1]);c[lab[j]]++}
const a=s[lab[i]]/(c[lab[i]]||1);let b=1e18;for(let k=0;k<6;k++)if(k!=lab[i]&&c[k])b=Math.min(b,s[k]/c[k]);
tot+=(b-a)/Math.max(a,b)}return tot/n}
function kmeans(P,k,seed){const r=rng(seed),n=P.length;let best=null,bi=1e18;
for(let rs=0;rs<8;rs++){const C=[P[Math.floor(r()*n)].slice()];
while(C.length<k){const d=P.map(p=>Math.min(...C.map(c=>(p[0]-c[0])**2+(p[1]-c[1])**2)));let u=r()*d.reduce((a,b)=>a+b),i=0;while(i<n-1&&(u-=d[i])>0)i++;C.push(P[i].slice())}
let a=[];for(let it=0;it<30;it++){a=P.map(p=>{let b=0,bd=1e18;C.forEach((c,j)=>{const d=(p[0]-c[0])**2+(p[1]-c[1])**2;if(d<bd){bd=d;b=j}});return b});
const s=C.map(()=>[0,0,0]);P.forEach((p,i)=>{s[a[i]][0]+=p[0];s[a[i]][1]+=p[1];s[a[i]][2]++});s.forEach((v,j)=>{if(v[2])C[j]=[v[0]/v[2],v[1]/v[2]]})}
let inr=0;P.forEach((p,i)=>inr+=(p[0]-C[a[i]][0])**2+(p[1]-C[a[i]][1])**2);if(inr<bi){bi=inr;best=a}}
return best}
function ari(a,b){const n=a.length,M={},ra={},rb={};
for(let i=0;i<n;i++){const k=a[i]+'_'+b[i];M[k]=(M[k]||0)+1;ra[a[i]]=(ra[a[i]]||0)+1;rb[b[i]]=(rb[b[i]]||0)+1}
const c2=x=>x*(x-1)/2;let s1=0,s2=0,s3=0;for(const k in M)s1+=c2(M[k]);for(const k in ra)s2+=c2(ra[k]);for(const k in rb)s3+=c2(rb[k]);
const e=s2*s3/c2(n);return(s1-e)/((s2+s3)/2-e)} 