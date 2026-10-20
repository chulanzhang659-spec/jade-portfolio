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
      <a class="cv-download" href="jade-cv.pdf" download="郑玉婷jade-CV.pdf"><span>DOWNLOAD CV ↓</span><small>下载简历 · PDF</small></a>
      <a class="cv-download portfolio-download" href="jade-portfolio.pdf" download="JadeZheng_ portfolio.pdf"><span>PORTFOLIO ↓</span><small>下载完整作品集 · PDF</small></a>
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
    if(!reduced) {
      const opening=turnSheet(paper, paper.getBoundingClientRect(), true);
      paper.style.visibility='hidden';
      await opening;
      paper.style.removeProperty('visibility');
    }
    busy=false;
  }
  document.querySelectorAll('.enter').forEach(b=>b.onclick=()=>{if(view==='home')openEdition();else paper.querySelector('.read-link').focus()});
  function projectHTML(p,i) {
    return `<article class="project">
      ${p.screenshot?`<a class="profile-capture" href="${p.screenshot}" target="_blank" rel="noopener" aria-label="查看${escape(p.title)}主页截图"><img src="${p.screenshot}" alt="${escape(p.title)}小红书主页实景截图"></a><p class="capture-caption">PROFILE / 账号主页 · 点击查看全图</p>`:''}
      ${p.image?`<img src="${p.image}" alt="${escape(p.imageAlt || (p.title+' '+(p.subtitle||'')+' 原稿封面'))}" loading="lazy">`:''}
      <p class="project-number">${String(i+1).padStart(2,'0')} / ${p.pdf?'PROJECT PROPOSAL':'SELECTED WORK'}</p>
      <h3>${escape(p.title)}</h3>${p.subtitle?`<p class="subtitle">${escape(p.subtitle)}</p>`:''}
      <p class="description">${escape(p.description)}</p>${p.excerpt?`<div class="excerpt-label">${escape(p.excerptLabel)}</div><blockquote class="editorial-excerpt">${escape(p.excerpt)}</blockquote>`:''}${p.tags?`<p class="tags">${p.tags}</p>`:''}
      <div class="actions">${p.pdf?`<button data-pdf="${p.pdf}" data-title="${escape(p.title)}">READ PDF ↗ <small>在线阅读</small></button><a href="${p.pdf}" download="${escape(p.title)}.pdf">DOWNLOAD ↓ <small>下载原稿</small></a>`:`<a href="${p.url}" target="_blank" rel="noopener noreferrer">READ MORE ↗ <small>阅读原文</small></a>`}</div>
    </article>`;
  }
  function renderCategory(id) {
    const c=cats.find(c=>c.id===id);if(!c)return false;
    const featured=c.projects.filter(p=>p.pdf), related=c.projects.filter(p=>!p.pdf);
    category.dataset.category=id;
    category.innerHTML=`<header class="category-header"><span class="mini-brand">JADE’S PORTFOLIO</span><h1 tabindex="-1">${escape(c.title)}</h1><p>${c.zh}</p><div class="category-deck">${c.translation}</div></header>`+
      `<div class="edition-projects">${(featured.length?featured:related).map((p,i)=>projectHTML(p,i)).join('')}</div>`+
      (featured.length&&related.length?`<section class="related-strip"><h2 class="group-label">RELATED WORK<small>相关作品</small></h2>${related.map(p=>`<a href="${p.url}" target="_blank" rel="noopener noreferrer"><strong>${escape(p.title)}</strong><span>${escape(p.description)}</span><small>READ MORE ↗ / 阅读原文</small></a>`).join('')}</section>`:'')+
      (c.archive?`<section class="archive-strip"><h2 class="group-label">THE ARCHIVE<small>微信作品</small></h2><div class="archive">${c.archive.map(a=>`<a href="${a.url}" target="_blank" rel="noopener noreferrer">${a.title} ↗</a>`).join('')}</div></section>`:'')+
      `<footer class="paper-footer"><span>JADE’S PORTFOLIO · ${escape(c.title.toUpperCase())}</span><span>03 / ${c.zh}</span></footer>`;
    category.querySelectorAll('[data-pdf]').forEach(b=>b.onclick=()=>openPDF(b.dataset.pdf,b.dataset.title,b));
    return true;
  }
  // A continuous flexible sheet, pinned to its top edge. Reverse uses the same geometry.
  async function turnSheet(source, rect, reverse=false) {
    const frame=document.createElement('div');frame.className='fold-newspaper';
    document.querySelector('#turn-layer').style.perspective=Math.max(2400,rect.height*4)+'px';
    Object.assign(frame.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});
    const snapshot=source.cloneNode(true);
    if(source.id==='paper-directory')snapshot.classList.add('directory-clone');
    const count=72,sh=rect.height/count,strips=[];
    function content(offset,back=false){
      const c=snapshot.cloneNode(true);c.removeAttribute('id');c.hidden=false;c.inert=true;
      c.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
      c.querySelectorAll('img').forEach(e=>e.loading='eager');
      Object.assign(c.style,{position:'absolute',top:-(back?rect.height-offset-sh:offset)+'px',left:'0',width:rect.width+'px',
        height:rect.height+'px',margin:'0',transform:back?'scaleY(-1)':'none',opacity:back?'.12':'1'});
      return c;
    }
    for(let i=0;i<count;i++){
      const strip=document.createElement('div');strip.className='fold-segment';
      Object.assign(strip.style,{width:'100%',height:sh+.65+'px',left:'0',transformOrigin:'center top'});
      const front=document.createElement('div'),rear=document.createElement('div');
      front.className='fold-front';rear.className='fold-back';
      front.append(content(i*sh));rear.append(content(i*sh,true));
      strip.append(front,rear);frame.append(strip);strips.push(strip);
    }
    document.querySelector('#turn-layer').append(frame);
    await new Promise(resolve=>{
      const start=performance.now();
      function step(now){
        const raw=Math.min(1,(now-start)/500),ease=raw*raw*(3-2*raw),p=reverse?1-ease:ease;
        const settle=Math.max(0,(p-.8)/.2);
        const radius=Math.min(85,rect.height*.105)*(1-.8*settle*settle*(3-2*settle));
        const bend=rect.height-(rect.height+radius*.3)*p;
        // The bend travels from bottom to top. Everything ahead of it stays flat;
        // the free part curls through a semicircle and lies over the back.
        function point(s){
          const d=s-bend;
          if(d<=0)return {y:s,z:0,a:0};
          if(d<Math.PI*radius){
            const a=d/radius;return {y:bend+radius*Math.sin(a),z:radius*(1-Math.cos(a)),a};
          }
          return {y:bend-(d-Math.PI*radius),z:2*radius,a:Math.PI};
        }
        strips.forEach((strip,i)=>{
          const pos=point(i*sh),end=point((i+1)*sh),a=Math.atan2(end.z-pos.z,end.y-pos.y);
          strip.style.top=pos.y+'px';
          strip.style.transform=`translateZ(${pos.z}px) rotateX(${a}rad)`;
          strip.style.setProperty('--fold-shade',String(Math.abs(Math.sin(a))*.2));
        });
        if(raw<1)requestAnimationFrame(step);else{frame.remove();resolve()}
      }requestAnimationFrame(step);
    });
  }
  async function flip(destination,reverse=false) {
    if(busy)return;busy=true;
    window.scrollTo({top:0,behavior:'instant'});
    const source=view==='category'?category:paper;
    const rect=source.getBoundingClientRect(),snapshot=source.cloneNode(true);
    if(source===paper)snapshot.classList.add('directory-clone');
    destination();
    if(!reduced){
      const target=view==='category'?category:view==='directory'?paper:null;
      if(reverse&&target){
        const under=document.createElement('div');under.className='turn-under';
        Object.assign(under.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});
        snapshot.removeAttribute('id');snapshot.hidden=false;snapshot.inert=true;under.append(snapshot);
        document.querySelector('#turn-layer').append(under);
        await turnSheet(target,target.getBoundingClientRect(),true);under.remove();
      }else await turnSheet(snapshot,rect,false);
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
    const next=cats.some(c=>c.id===hash)?'category':hash==='directory'?'directory':'home';
    const rank={home:0,directory:1,category:2};
    flip(()=>{if(next==='category')renderCategory(hash);setView(next)},rank[next]<rank[view]);
  });
  const hash=location.hash.slice(1);
  if(cats.some(c=>c.id===hash)){renderCategory(hash);setView('category')}
  else if(hash==='directory')setView('directory');
  else if(reduced){typed=maxCopy;paintCopy();}
  if(view==='home')home.setActive(true);
})();
