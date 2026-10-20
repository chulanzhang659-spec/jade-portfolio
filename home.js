window.createJadeHome = ({onOpen,onTick,reduced}) => {
  const scene=document.querySelector('#home-scene'),board=document.querySelector('#home-artboard');
  const stock=document.querySelector('#home-stock'),lines=document.querySelector('#home-lines');
  const keys=document.querySelector('#keys');
  const rows=[
    ['OPEN THE EDITION →','','',''],
    ['BRAND STORIES','FILM & INTERVIEWS','SOCIAL & CONTENT','FASHION EDITORIAL'],
    ['品牌故事','影像与访谈','账号运营','时尚编辑'],
    ['Narratives for','Conversations,','Brand accounts &','Visual stories at'],
    ['people, places','short films and','personal expression.','the intersection'],
    ['and products.','creative documentaries.','','of style and culture.'],
    ['为人物、地方与产品','对话、短片与创意纪录。','品牌账号与个人表达','在风格与文化的交汇处，'],
    ['讲述故事。','','','讲述视觉故事。'],
    ['','','',''],
    ['CLICK THE PAPER TO EXPLORE','','','']
  ];
  const rowEls=rows.map((cells,i)=>{
    const row=document.createElement('div');row.className='print-row'+([2,6,7].includes(i)?' print-cn':'');
    if(i===0||i===9)row.classList.add('print-wide');
    row.style.top=(90+i*28)+'px';
    cells.forEach((t,column)=>{
      const cell=document.createElement('span');cell.className='print-cell';
      [...t].forEach((char,j)=>{const glyph=document.createElement('span');glyph.textContent=char;glyph.dataset.unit=String(column*26+j);glyph.style.visibility='hidden';cell.append(glyph)});
      row.append(cell);
    });
    lines.append(row);return row;
  });
  // Coordinates are measured on the unchanged 1672 × 941 approved reference.
  const positions=[
    ['1234567890+-',[371,485,599,713,827,941,1055,1169,1283,1397,1511,1625],[746,732,718,704,690,676,662,648,634,620,606,592]],
    ['QWERTYUIOP[]',[433,542,651,760,869,978,1087,1196,1305,1414,1523,1632],[832,818,804,790,776,762,748,734,720,706,692,678]],
    ["ASDFGHJKL;'",[493,605,717,829,941,1053,1165,1277,1389,1501,1613],[925,910,895,880,865,850,835,820,805,790,775]],
    ['ZXCVBNM,./',[620,733,846,959,1072,1185,1298,1411,1524,1637],[1018,1003,988,973,958,943,928,913,898,883]]
  ];
  let active=false,raf=0,start=0,lastChar=-1,pausedAt=null;
  positions.forEach(([text,xs,ys])=>[...text].forEach((char,i)=>{
    if(xs[i]===undefined)return;
    const b=document.createElement('button'),w=84,h=64,x=xs[i]-w/2,y=ys[i]-24;
    b.className='reference-key';b.tabIndex=-1;b.dataset.key=char;b.setAttribute('aria-label','打印 '+char);
    b.dataset.cx=xs[i];b.dataset.cy=ys[i];
    Object.assign(b.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px',
      backgroundPosition:`${-x}px ${-y}px`});
    b.addEventListener('pointerenter',()=>{b.classList.add('hovered');onTick()});
    b.addEventListener('pointerleave',()=>b.classList.remove('hovered'));
    b.addEventListener('click',()=>press(char));
    keys.append(b);
  }));
  const keyEls=[...keys.children];
  window.createKeyboardSurface(document.querySelector('#reference-machine'),keyEls,reduced);
  function press(char,quiet=false){
    if(!active)return;
    const b=keyEls.find(k=>k.dataset.key===String(char).toUpperCase());
    if(b){clearTimeout(b.releaseTimer);b.classList.remove('pressed');void b.offsetWidth;b.classList.add('pressed');b.releaseTimer=setTimeout(()=>b.classList.remove('pressed'),180);}
    if(!quiet)onTick();
  }
  function size(){
    const scale=Math.max(innerWidth/1672,innerHeight/941);
    board.style.setProperty('--scene-scale',scale);
    // Narrow screens retain the same camera; only title typesetting is adapted.
    stock.style.setProperty('--title-size',innerWidth<701?Math.min(36,innerWidth/(scale*15))+'px':'36px');
  }
  size();addEventListener('resize',size);
  function render(elapsed){
    const s=window.JadeHomeMotion.stateAt(elapsed,rows.length);
    stock.style.setProperty('--paper-feed',s.feed+'px');
    stock.dataset.line=String(s.row);
    rowEls.forEach((el,i)=>{
      const p=i<s.row?1:i===s.row?s.progress:0;
      const count=p===1?999:Math.floor(p*(i===0||i===9?32:104));
      if(el.dataset.count!==String(count)){
        el.dataset.count=String(count);
        el.querySelectorAll('[data-unit]').forEach(g=>{g.style.visibility=Number(g.dataset.unit)<count?'visible':'hidden'});
      }
    });
    document.querySelector('.home-original-portrait').style.opacity=s.row>=4?'1':'0';
    if(s.row<rows.length&&s.progress>0&&s.progress<1){
      const text=rows[s.row].join('  '),n=Math.floor(s.progress*text.length);
      const signature=s.row*1000+n;
      if(signature!==lastChar){lastChar=signature;if(!keyEls.some(k=>k.classList.contains('hovered')))press(text[n]||' ',false);}
    }
    return s;
  }
  function frame(now){
    if(!active)return;
    if(document.hidden){pausedAt??=now;raf=requestAnimationFrame(frame);return;}
    if(pausedAt!==null){start+=now-pausedAt;pausedAt=null;}
    const s=render(now-start);
    if(!s.done)raf=requestAnimationFrame(frame);
  }
  function setActive(value){
    const was=active;active=value;scene.inert=!value;document.querySelector('#stage').inert=value;
    cancelAnimationFrame(raf);
    if(value&&!was){start=performance.now();lastChar=-1;pausedAt=null;render(0);if(!reduced)raf=requestAnimationFrame(frame);}
  }
  stock.addEventListener('click',()=>{if(active)onOpen()});
  stock.addEventListener('keydown',e=>{if(active&&['Enter',' '].includes(e.key)){e.preventDefault();onOpen()}});
  addEventListener('keydown',e=>{
    if(active&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&e.key.length===1&&!e.target.closest('a,input,textarea'))press(e.key);
  });
  return {setActive};
};
