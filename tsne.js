// tsne.js: exact t-SNE (perplexity search, symmetric P, gradient descent with momentum and gains)
function tsneInit(A,perp,Z2){const n=A.length,d2=new Float64Array(n*n);let m=0;
for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){let s=0;for(let k=0;k<A[i].length;k++){const t=A[i][k]-A[j][k];s+=t*t}d2[i*n+j]=d2[j*n+i]=s;m+=2*s}
m/=n*(n-1);for(let i=0;i<d2.length;i++)d2[i]/=m;
const P=new Float64Array(n*n),tgt=Math.log(perp);
for(let i=0;i<n;i++){let beta=1,lo=0,hi=Infinity;const r=i*n;
for(let it=0;it<60;it++){let sum=0,sdp=0;
for(let j=0;j<n;j++){if(j==i)continue;const p=Math.exp(-d2[r+j]*beta);P[r+j]=p;sum+=p;sdp+=d2[r+j]*p}
const H=Math.log(sum)+beta*sdp/sum;
if(!isFinite(H)){hi=beta;beta/=2;continue}
if(Math.abs(H-tgt)<1e-4)break;
if(H>tgt){lo=beta;beta=hi==Infinity?beta*2:(beta+hi)/2}else{hi=beta;beta=(beta+lo)/2}}
let s=0;for(let j=0;j<n;j++)s+=P[r+j];for(let j=0;j<n;j++)P[r+j]/=s||1}
const PS=new Float64Array(n*n);
for(let i=0;i<n;i++)for(let j=0;j<n;j++)PS[i*n+j]=Math.max((P[i*n+j]+P[j*n+i])/(2*n),1e-12);
const Y=new Float64Array(2*n);let s0=0;for(let i=0;i<n;i++){Y[2*i]=Z2[i][0];Y[2*i+1]=Z2[i][1];s0+=Z2[i][0]**2}
s0=Math.sqrt(s0/n)||1;for(let i=0;i<2*n;i++)Y[i]*=1e-2/s0;
return{n,P:PS,Y,U:new Float64Array(2*n),G:new Float64Array(2*n).fill(1),W:new Float64Array(n*n),it:0,total:600}}
function step(S){const{n,P,Y,U,G,W}=S,ex=S.it<200?12:1,mom=S.it<200?.5:.8,lr=150;let sum=0;
for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const dx=Y[2*i]-Y[2*j],dy=Y[2*i+1]-Y[2*j+1],w=1/(1+dx*dx+dy*dy);W[i*n+j]=W[j*n+i]=w;sum+=2*w}
for(let i=0;i<n;i++){let gx=0,gy=0;
for(let j=0;j<n;j++){if(j==i)continue;const w=W[i*n+j],m=(ex*P[i*n+j]-w/sum)*w;gx+=m*(Y[2*i]-Y[2*j]);gy+=m*(Y[2*i+1]-Y[2*j+1])}
for(let c=0;c<2;c++){const k=2*i+c,g=4*(c?gy:gx);G[k]=Math.sign(g)!==Math.sign(U[k])?G[k]+.2:Math.max(G[k]*.8,.01);U[k]=mom*U[k]-lr*G[k]*g}}
let mx=0,my=0;for(let i=0;i<n;i++){Y[2*i]+=U[2*i];Y[2*i+1]+=U[2*i+1];mx+=Y[2*i]/n;my+=Y[2*i+1]/n}
for(let i=0;i<n;i++){Y[2*i]-=mx;Y[2*i+1]-=my}S.it++}
 