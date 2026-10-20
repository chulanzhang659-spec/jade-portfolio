(() => {
let pending;
function original(){return pending??=Promise.all(['hoka.part1','hoka.part2'].map(async p=>{const r=await fetch(p);if(!r.ok)throw Error('PDF download failed');return r.arrayBuffer()})).then(parts=>URL.createObjectURL(new Blob(parts,{type:'application/pdf'}))).catch(e=>{pending=null;throw e})}
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-pdf="hoka.pdf"],a[href="hoka.pdf"]');if(!b)return;
 e.preventDefault();e.stopImmediatePropagation();if(b.dataset.loading)return;
 const label=b.textContent;b.dataset.loading='true';b.textContent='正在载入原稿…';
 try{const url=await original();if(b.hasAttribute('data-pdf')){b.dataset.pdf=url;b.click()}else{const a=document.createElement('a');a.href=url;a.download=b.download||'HOKA × 恩利.pdf';a.click()}}
 catch{alert('原稿载入失败，请稍后重试。')}
 finally{b.textContent=label;delete b.dataset.loading}
},true);
})();