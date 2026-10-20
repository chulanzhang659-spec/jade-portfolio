(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const cats = window.PORTFOLIO.categories;
  const paper = $('#paper-directory'), category = $('#category'), anchor = $('#paper-anchor');
  const back = $('#back'), reader = $('#reader');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let view = 'home', busy = false, lastFocus = null, typed = 0, sound = false, audio;
  history.scrollRestoration = 'manual';
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  $('#columns').innerHTML = cats.map((c,i) => `
    <section class="column" data-category="${c.id}" aria-label="${escape(c.zh)}">
      <h2>${escape(c.title)}</h2><p class="cn-title">${c.zh}</p>
      <div class="intro"><p class="en-copy" data-copy="${escape(c.en)}"></p><p class="translation">${c.translation}</p></div>
      <p class="hint">${c.hint}</p>
      <div class="illustration" style="background-position:${i*100/3}% 0" role="img" aria-label="${['书页与山茶花','复古电影摄影机','社交媒体内容与互动','时尚编辑剪报'][i]}"></div>
      <button class="read-link" data-open="${c.id}">翻阅专栏 →</button>
    </section>`).join('') + `
    <aside class="contact" aria-label="联系方式">
      <img src="jade-original.jpg" class="portrait" alt="Jade 的原始肖像照片，仅作复古调色">
      <h3>CONTACT</h3><dl><dt>Email</dt><dd><a href="mailto:z603117521@gmail.com">z603117521@gmail.com</a></dd>
      <dt>Phone</dt><dd><a href="tel:19145689058">19145689058</a></dd></dl>
    </aside>`;
  const copies = [...document.querySelectorAll('.en-copy')];
  const maxCopy = copies.reduce((n,e) => n + e.dataset.copy.length, 0);
  function paintCopy() {
    let remaining = typed;
    copies.forEach(e => {
      const text = e.dataset.copy, count = Math.max(0, Math.min(text.length, remaining));
      e.innerHTML = escape(text.slice(0,count)) + `<span class="untyped">${escape(text.slice(count))}</span>`;
      remaining -= text.length;
    });
  }
  paintCopy();
  function tick() {
    if(!sound || !audio) return;
    const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate*.025), audio.sampleRate);
    const d=buffer.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(d.length*.16));
    const src=audio.createBufferSource(), gain=audio.createGain(), filter=audio.createBiquadFilter();
    src.buffer=buffer; gain.gain.value=.075; filter.type='highpass'; filter.frequency.value=1100;
    src.connect(filter).connect(gain).connect(audio.destination);src.start();
  }
  $('#sound').onclick=()=>{
    sound=!sound;
    if(sound){audio ??= new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}
    $('#sound').textContent=sound?'SOUND ON':'SOUND OFF';$('#sound').setAttribute('aria-pressed',String(sound));tick();
  };
  const home=window.createJadeHome({onOpen:openEdition,onTick:tick,reduced});
  // The reference camera is fixed; clicking the paper opens its complete edition.
  function setView(next) {
    view=next;document.body.dataset.view=next;
    paper.hidden=next==='category';category.hidden=next!=='category';
    back.hidden=next==='home';back.querySelector('span').textContent=next==='category'?'返回专栏目录':'返回首页';
    $('#edition').textContent=next==='home'?'OPEN THE EDITION →':'SELECT A COLUMN ↓';
    home.setActive(next==='home');
    if(next!=='home'){typed=maxCopy;paintCopy();}
  }
  async function openEdition() {
    if(busy||view!=='home')return;
    busy=true;
    setView('directory');history.pushState({view:'directory'},'', '#directory');
    window.scrollTo({top:0,behavior:'instant'});
    if(!reduced){
      document.body.classList.add('opening-paper');
      await paper.animate([
        {transform:'perspective(1600px) rotateY(-100deg)',filter:'brightness(.72)'},
        {transform:'perspective(1600px) rotateY(-45deg)',filter:'brightness(.9)',offset:.55},
        {transform:'perspective(1600px) rotateY(0deg)',filter:'brightness(1)'}
      ],{duration:2200,easing:'cubic-bezier(.35,0,.2,1)'}).finished;
      document.body.classList.remove('opening-paper');
    }
    busy=false;
  }
  document.querySelectorAll('.enter').forEach(b=>b.onclick=()=>{if(view==='home')openEdition();else paper.querySelector('.read-link').focus()});
  function projectHTML(p,i) {
    return `<article class="project">
      ${p.image?`<img src="${p.image}" alt="${escape(p.title+' '+p.subtitle)} 原稿封面" loading="lazy">`:''}
      <p class="project-number">${String(i+1).padStart(2,'0')} / ${p.pdf?'PROJECT PROPOSAL':'SELECTED WORK'}</p>
      <h3>${escape(p.title)}</h3>${p.subtitle?`<p class="subtitle">${escape(p.subtitle)}</p>`:''}
      <p class="description">${escape(p.description)}</p>${p.tags?`<p class="tags">${p.tags}</p>`:''}
      <div class="actions">${p.pdf?`<button data-pdf="${p.pdf}" data-title="${escape(p.title)}">在线阅读 ↗</button><a href="${p.pdf}" download="${escape(p.title)}.pdf">下载 PDF ↓</a>`:`<a href="${p.url}" target="_blank" rel="noopener noreferrer">阅读原文 ↗</a>`}</div>
    </article>`;
  }
  function renderCategory(id) {
    const c=cats.find(c=>c.id===id);if(!c)return false;
    const groups=[...new Set(c.projects.map(p=>p.group))];
    category.dataset.category=id;
    category.innerHTML=`<header class="category-header"><span class="mini-brand">JADE’S PORTFOLIO</span><h1 tabindex="-1">${escape(c.title)}</h1><p>${c.zh}</p><div class="category-deck">${c.translation}</div></header>`+
      groups.map(g=>`<section class="project-group"><h2 class="group-label">${g}</h2><div class="projects">${c.projects.filter(p=>p.group===g).map(p=>projectHTML(p,c.projects.indexOf(p))).join('')}</div></section>`).join('')+
      (c.archive?`<section class="project-group"><h2 class="group-label">微信公众号作品</h2><div class="archive">${c.archive.map(a=>`<a href="${a.url}" target="_blank" rel="noopener noreferrer">${a.title} ↗</a>`).join('')}</div></section>`:'')+
      `<footer class="paper-footer"><span>JADE’S PORTFOLIO · ${escape(c.title.toUpperCase())}</span><span>03 / ${c.zh}</span></footer>`;
    category.querySelectorAll('[data-pdf]').forEach(b=>b.onclick=()=>openPDF(b.dataset.pdf,b.dataset.title,b));
    return true;
  }
  async function flip(destination,reverse=false) {
    if(busy)return;busy=true;
    const source=view==='category'?category:paper;
    const rect=source.getBoundingClientRect();
    const snapshot=source.cloneNode(true);
    if(source===paper)snapshot.classList.add('directory-clone');
    destination();
    if(!reduced){
      const target=view==='category'?category:view==='directory'?paper:null;
      const targetCopy=target?.cloneNode(true);
      if(target===paper)targetCopy.classList.add('directory-clone');
      const frame=document.createElement('div');frame.className='fold-newspaper';
      Object.assign(frame.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});
      const half=rect.width/2;
      function content(copy,offset){
        const c=copy.cloneNode(true);c.removeAttribute('id');c.hidden=false;c.inert=true;
        c.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
        c.querySelectorAll('img').forEach(e=>e.loading='eager');
        Object.assign(c.style,{position:'absolute',top:'0',left:-offset+'px',width:rect.width+'px',margin:'0',transform:'none'});
        return c;
      }
      const stationary=document.createElement('div');stationary.className='fold-stationary';
      Object.assign(stationary.style,{left:reverse?half+'px':'0',width:half+'px',height:'100%'});
      stationary.append(content(snapshot,reverse?half:0));frame.append(stationary);
      const strips=[],count=28,sw=half/count;
      for(let i=0;i<count;i++){
        const strip=document.createElement('div');strip.className='fold-segment';
        Object.assign(strip.style,{width:sw+.6+'px',height:'100%',transformOrigin:reverse?'right top':'left top'});
        const front=document.createElement('div'),rear=document.createElement('div');
        front.className='fold-front';rear.className='fold-back';
        front.append(content(snapshot,reverse?half-(i+1)*sw:half+i*sw));
        if(targetCopy)rear.append(content(targetCopy,reverse?half+i*sw:half-(i+1)*sw));
        strip.append(front,rear);frame.append(strip);strips.push(strip);
      }
      $('#turn-layer').append(frame);
      await new Promise(resolve=>{
        const start=performance.now();
        function tick(now){
          const raw=Math.min(1,(now-start)/2400),p=raw*raw*(3-2*raw);
          let x=half,z=0;
          strips.forEach((strip,i)=>{
            const a=Math.PI*p+Math.sin(Math.PI*p)*.32*Math.sin(i/count*Math.PI);
            const sign=reverse?1:-1;
            strip.style.left=(reverse?x-sw:x)+'px';
            strip.style.transform=`translateZ(${z}px) rotateY(${sign*a}rad)`;
            strip.style.setProperty('--fold-shade',String(Math.sin(a)*.23));
            x+=(reverse?-1:1)*sw*Math.cos(a);z+=sw*Math.sin(a);
          });
          if(raw<1)requestAnimationFrame(tick);else{frame.remove();resolve()}
        }requestAnimationFrame(tick);
      });
    }
    busy=false;
    (view==='home'?document.querySelector('#home-stock'):view==='category'?category.querySelector('h1'):paper.querySelector('.read-link')).focus({preventScroll:true});
  }
  function openCategory(id,push=true){
    if(busy)return;
    flip(()=>{renderCategory(id);setView('category');if(push)history.pushState({view:'category',id},'','#'+id)});
  }
  paper.querySelectorAll('.column').forEach(col=>{
    col.addEventListener('click',e=>{
      if(view!=='directory')return;
      if(e.target.closest('.read-link')){openCategory(col.dataset.category);return;}
      if(matchMedia('(hover: none)').matches){col.classList.toggle('revealed');return;}
      openCategory(col.dataset.category);
    });
  });
  back.onclick=()=>{
    if(busy)return;
    if(view==='category')flip(()=>{setView('directory');history.pushState({view:'directory'},'','#directory')},true);
    else{
      flip(()=>{setView('home');history.pushState({view:'home'},'','#home')},true);
    }
  };
  function openPDF(url,title,trigger){
    lastFocus=trigger;$('#reader-title').textContent=title;
    $('#reader-download').href=url;$('#reader-download').download=title+'.pdf';
    $('#reader-open').href=url;$('#pdf-frame').src=url+'#view=FitH';
    reader.showModal();document.body.style.overflow='hidden';$('#close-reader').focus();
  }
  function closePDF(){reader.close();}
  $('#close-reader').onclick=closePDF;
  reader.addEventListener('click',e=>{if(e.target===reader)closePDF()});
  reader.addEventListener('close',()=>{$('#pdf-frame').removeAttribute('src');document.body.style.removeProperty('overflow');lastFocus?.focus()});
  addEventListener('popstate',()=>{
    if(reader.open)reader.close();
    const hash=location.hash.slice(1);
    if(cats.some(c=>c.id===hash)){renderCategory(hash);setView('category')}
    else setView(hash==='directory'?'directory':'home');
    window.scrollTo(0,0);
  });
  const hash=location.hash.slice(1);
  if(cats.some(c=>c.id===hash)){renderCategory(hash);setView('category')}
  else if(hash==='directory')setView('directory');
  else if(reduced){typed=maxCopy;paintCopy();}
  if(view==='home')home.setActive(true);
})();
