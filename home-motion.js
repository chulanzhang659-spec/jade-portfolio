/* Pure timeline: the camera never participates in the animation. */
window.JadeHomeMotion = {
  stateAt(elapsed, rows) {
    const hold=400, cycle=4500/rows, feedTime=100, printTime=310;
    if(elapsed<hold)return {row:0,progress:0,feed:300,done:false};
    const time=elapsed-hold, row=Math.min(rows,Math.floor(time/cycle));
    if(row>=rows)return {row:rows,progress:1,feed:300-rows*28,done:true};
    const phase=time-row*cycle, f=Math.min(1,phase/feedTime);
    const easing=f*f*(3-2*f);
    return {row,progress:Math.max(0,Math.min(1,(phase-feedTime)/printTime)),
      feed:300-(row+easing)*28,done:false};
  }
};
