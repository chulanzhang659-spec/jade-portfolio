// Rigid full-key compositing: erase the old silhouette, then move cap + sidewall together.
window.createKeyboardSurface = (image, keys, reduced) => {
  const canvas=document.createElement('canvas');
  canvas.width=1672;canvas.height=941;
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false});
  if(!gl)return;
  const shader=(type,source)=>{
    const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=vec2((p.x+1.)*.5,(1.-p.y)*.5);gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`
    precision highp float;varying vec2 uv;uniform sampler2D photo;uniform vec3 keys[48];
    float silhouette(vec2 d){
      d.y-=clamp(d.y,0.,16.);
      return 1.-smoothstep(.96,1.,length(d/vec2(42.,23.)));
    }
    void main(){
      vec2 size=vec2(1672.,941.),pixel=uv*size;
      vec4 color=texture2D(photo,uv);
      for(int i=0;i<48;i++){
        float travel=-keys[i].z;
        vec2 d=pixel-keys[i].xy;
        if(travel>.01 && abs(d.x)<49. && d.y>-25. && d.y<49.){
          float oldMask=silhouette(d);
          float movedMask=silhouette(d-vec2(0.,travel));
          vec3 well=(texture2D(photo,(keys[i].xy+vec2(-49.,10.))/size).rgb+
                     texture2D(photo,(keys[i].xy+vec2(49.,10.))/size).rgb)*.36;
          color.rgb=mix(color.rgb,well,oldMask*(1.-movedMask));
          vec4 wholeKey=texture2D(photo,(pixel-vec2(0.,travel))/size);
          color=mix(color,wholeKey,movedMask);
        }
      }
      gl_FragColor=color;
    }`));
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
  gl.useProgram(program);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const values=new Float32Array(48*3),location=gl.getUniformLocation(program,'keys[0]');
  keys.forEach((key,i)=>{values[i*3]=parseFloat(key.style.left)+41;values[i*3+1]=parseFloat(key.style.top)+24});
  let ready=false,raf=0,last=0;
  function frame(now){
    raf=0;let moving=false;
    const dt=Math.min(50,now-last||16);last=now;
    keys.forEach((key,i)=>{
      // Negative sampling offset moves the visible key down; release returns to zero.
      const target=reduced?0:key.classList.contains('pressed')?-7:key.classList.contains('hovered')?-5:0;
      const old=values[i*3+2],next=old+(target-old)*(1-Math.exp(-dt/65));
      values[i*3+2]=Math.abs(next-target)<.015?target:next;
      moving ||= values[i*3+2]!==target;
    });
    gl.uniform3fv(location,values);gl.drawArrays(gl.TRIANGLES,0,6);
    if(moving)raf=requestAnimationFrame(frame);
  }
  const wake=()=>{if(ready&&!raf){last=performance.now();raf=requestAnimationFrame(frame)}};
  const observer=new MutationObserver(wake);keys.forEach(key=>observer.observe(key,{attributes:true,attributeFilter:['class']}));
  function load(){
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    canvas.id=image.id;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',image.alt);
    image.replaceWith(canvas);ready=true;wake();
  }
  if(image.complete&&image.naturalWidth)load();else image.addEventListener('load',load,{once:true});
};
