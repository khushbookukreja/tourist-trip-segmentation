// pca.js: PCA from scratch (covariance matrix + Jacobi eigen decomposition)
function eig(A){const n=A.length;const V=A.map((_,i)=>A.map((_,j)=>i==j?1:0));A=A.map(r=>r.slice());
for(let sw=0;sw<60;sw++){let off=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)off+=A[i][j]**2;if(off<1e-14)break;
for(let p=0;p<n-1;p++)for(let q=p+1;q<n;q++){if(Math.abs(A[p][q])<1e-15)continue;
const th=(A[q][q]-A[p][p])/(2*A[p][q]),t=(th<0?-1:1)/(Math.abs(th)+Math.sqrt(th*th+1)),c=1/Math.sqrt(t*t+1),s=t*c;
for(let k=0;k<n;k++){const a=A[k][p],b=A[k][q];A[k][p]=c*a-s*b;A[k][q]=s*a+c*b}
for(let k=0;k<n;k++){const a=A[p][k],b=A[q][k];A[p][k]=c*a-s*b;A[q][k]=s*a+c*b}
for(let k=0;k<n;k++){const a=V[k][p],b=V[k][q];V[k][p]=c*a-s*b;V[k][q]=s*a+c*b}}}
return{vals:A.map((r,i)=>r[i]),vecs:V}}
function pca(X){const n=X.length,d=X[0].length,mu=Array(d).fill(0);
for(const v of X)for(let j=0;j<d;j++)mu[j]+=v[j]/n;
const C=Array.from({length:d},()=>Array(d).fill(0));
for(const v of X)for(let i=0;i<d;i++){const a=v[i]-mu[i];for(let j=i;j<d;j++)C[i][j]+=a*(v[j]-mu[j])/n}
for(let i=0;i<d;i++)for(let j=0;j<i;j++)C[i][j]=C[j][i];
const{vals,vecs}=eig(C),o=vals.map((_,i)=>i).sort((a,b)=>vals[b]-vals[a]),tot=vals.reduce((a,b)=>a+b,0);
return{mu,ratio:o.map(i=>vals[i]/tot),comps:o.map(i=>vecs.map(r=>r[i]))}}
function proj(v,k){const c=PC.comps[k];let s=0;for(let j=0;j<c.length;j++)s+=c[j]*(v[j]-PC.mu[j]);return s} 