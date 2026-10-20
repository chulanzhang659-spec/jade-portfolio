// One solid key: the face, rim, sidewall and glyph share the same transform.
window.createKeyboardSurface=(image,keys,reduced)=>{
  const canvas=document.createElement('canvas');canvas.width=1672;canvas.height=941;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const plate=new Image();
  const states=keys.map(el=>({el,x:+el.dataset.cx,y:+el.dataset.cy,travel:0}));
  let ready=false,raf=0,last=0;
  const ellipse=(x,y,rx,ry)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2)};
  function drawKey(k){
    const {x,y}=k,t=k.travel,rx=42,ry=21,wall=23,cy=y+t;
    ctx.save();
    ctx.fillStyle='#171410a0';ellipse(x+4,y+wall+15,rx+6,ry*.7);ctx.fill();
    const stem=ctx.createLinearGradient(x-6,0,x+7,0);
    stem.addColorStop(0,'#211f19');stem.addColorStop(.45,'#817761');stem.addColorStop(.7,'#4c4639');stem.addColorStop(1,'#24211a');
    ctx.fillStyle=stem;ctx.fillRect(x-5,cy+wall,10,Math.max(3,22-t));
    ctx.translate(x,cy);ctx.rotate(-.12);
    const side=ctx.createLinearGradient(-rx,0,rx,0);
    [[0,'#6e695e'],[.07,'#c0b7a2'],[.23,'#e8dfcb'],[.46,'#c7bca5'],[.69,'#b0a58e'],[.86,'#ded6c3'],[1,'#6d685e']].forEach(([v,c])=>side.addColorStop(v,c));
    ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,Math.PI,0);ctx.lineTo(rx,wall);
    ctx.ellipse(0,wall,rx,ry,0,0,Math.PI);ctx.closePath();ctx.fillStyle=side;ctx.fill();
    ctx.save();ctx.clip();ctx.globalAlpha=.13;ctx.strokeStyle='#5b5346';
    for(let j=-39;j<40;j+=3){ctx.beginPath();ctx.moveTo(j,4);ctx.lineTo(j,wall+ry);ctx.stroke()}
    ctx.restore();
    const rim=ctx.createLinearGradient(-rx,-ry,rx,ry);
    [[0,'#fcf9ee'],[.23,'#8c877c'],[.4,'#e9e5d8'],[.62,'#777369'],[.8,'#fffdf3'],[1,'#c0b8a7']].forEach(([v,c])=>rim.addColorStop(v,c));
    ellipse(0,0,rx,ry);ctx.fillStyle=rim;ctx.fill();
    ellipse(0,0,rx-3,ry-2);ctx.fillStyle='#8b8474';ctx.fill();
    const face=ctx.createLinearGradient(0,-ry,8,ry);
    face.addColorStop(0,'#e3dccb');face.addColorStop(.35,'#fbf8ee');face.addColorStop(1,'#eee8d9');
    ellipse(0,0,rx-4.5,ry-3);ctx.fillStyle=face;ctx.fill();
    ctx.strokeStyle='#fffdf3a0';ctx.lineWidth=.9;ctx.stroke();
    ctx.scale(1,.78);ctx.fillStyle='#3c3a33';ctx.font='26px "Courier New",monospace';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(k.el.dataset.key,0,1);
    ctx.restore();
  }
  function draw(){
    ctx.clearRect(0,0,1672,941);ctx.drawImage(image,0,0,1672,941);
    ctx.save();ctx.beginPath();ctx.moveTo(310,715);ctx.lineTo(1672,548);
    ctx.lineTo(1672,941);ctx.lineTo(354,941);ctx.lineTo(300,790);ctx.closePath();ctx.clip();
    ctx.drawImage(plate,0,0,1672,941);ctx.restore();
    [...states].sort((a,b)=>a.y-b.y).forEach(drawKey);
  }
  function frame(now){
    raf=0;let moving=false;const dt=Math.min(40,now-last||16);last=now;
    for(const k of states){
      const target=reduced?0:k.el.classList.contains('pressed')?9:k.el.classList.contains('hovered')?7:0;
      k.travel+=(target-k.travel)*(1-Math.exp(-dt/45));
      if(Math.abs(target-k.travel)<.02)k.travel=target;else moving=true;
    }
    draw();if(moving)raf=requestAnimationFrame(frame);
  }
  function wake(){if(ready&&!raf){last=performance.now();raf=requestAnimationFrame(frame)}}
  const observer=new MutationObserver(wake);
  keys.forEach(key=>observer.observe(key,{attributes:true,attributeFilter:['class']}));
  plate.onload=()=>{
    canvas.id=image.id;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',image.alt);
    image.replaceWith(canvas);ready=true;wake();
  };
  plate.src=image.src.replace(/home-reference\.png(?:\?.*)?$/,'keyboard-clean.png');
};
