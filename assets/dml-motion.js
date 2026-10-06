
const reduceMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer=matchMedia("(pointer:fine)").matches;

function spring({from=0,to=1,velocity=0,stiffness=380,damping=32,mass=1,precision=.001,onUpdate,onComplete}){
  let x=from,v=velocity,last=performance.now(),raf=0,stopped=false;
  function frame(now){
    if(stopped)return;
    const dt=Math.min((now-last)/1000,.032);last=now;
    const force=-stiffness*(x-to),accel=(force-damping*v)/mass;
    v+=accel*dt;x+=v*dt;onUpdate?.(x,v);
    if(Math.abs(x-to)<precision&&Math.abs(v)<precision*10){onUpdate?.(to,0);onComplete?.();return}
    raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  return()=>{stopped=true;cancelAnimationFrame(raf)};
}
function st(el){if(!el._motion)el._motion={x:0,y:0,s:1,o:1,vx:0,vy:0,vs:0};return el._motion}
function draw(el){const m=st(el);el.style.transform=`translate3d(${m.x}px,${m.y}px,0) scale(${m.s})`;el.style.opacity=m.o}
function prop(el,key,to,opt={}){
  const m=st(el);el._springs??={};el._springs[key]?.();
  const vk=key==="x"?"vx":key==="y"?"vy":key==="s"?"vs":null;
  el._springs[key]=spring({
    from:m[key],to,velocity:vk?(m[vk]||0):0,stiffness:opt.stiffness??390,damping:opt.damping??33,
    onUpdate:(v,vel)=>{m[key]=v;if(vk)m[vk]=vel;draw(el)}
  });
}
function move(el,target,opt={}){Object.entries(target).forEach(([k,v])=>prop(el,k,v,opt))}
function prep(el,x=0,y=11,s=.99){const m=st(el);m.x=x;m.y=y;m.s=s;m.o=0;draw(el)}
function reveal(el,delay=0,opt={}){
  setTimeout(()=>{
    if(reduceMotion){el.animate([{opacity:0},{opacity:1}],{duration:180,easing:"cubic-bezier(.16,1,.3,1)",fill:"forwards"});return}
    move(el,{x:0,y:0,s:1,o:1},{stiffness:opt.stiffness??330,damping:opt.damping??31})
  },delay)
}
function group(sel,{base=0,step=42,x=0,y=10,s=.99}={}){
  document.querySelectorAll(sel).forEach((el,i)=>{prep(el,x,y,s);reveal(el,base+i*step)})
}

/* pointer-down response */
document.querySelectorAll(".pressable,.btn,.mini-btn,.choice,.nav-item").forEach(el=>{
  el.addEventListener("pointerdown",()=>move(el,{s:.965},{stiffness:470,damping:35}));
  const release=()=>move(el,{s:1},{stiffness:420,damping:32});
  el.addEventListener("pointerup",release);el.addEventListener("pointercancel",release);el.addEventListener("pointerleave",release);
});

/* hover lift */
if(finePointer&&!reduceMotion){
  document.querySelectorAll(".lift,.stat,.panel,.front-card").forEach(el=>{
    el.addEventListener("pointerenter",()=>move(el,{y:-3,s:1.006},{stiffness:390,damping:32}));
    el.addEventListener("pointerleave",()=>move(el,{y:0,s:1},{stiffness:365,damping:33}));
  });
}

/* entrance choreography */
document.addEventListener("DOMContentLoaded",()=>{
  group(".topbar",{base:15,y:-8,step:0,s:1});
  group(".sidebar .brand",{base:25,x:-8,y:0,step:0});
  group(".sidebar .nav-item",{base:65,x:-9,y:0,step:28,s:.985});
  group(".page-head",{base:90,y:12,step:0});
  group(".stat",{base:135,y:13,step:40,s:.982});
  group(".panel",{base:205,y:12,step:52,s:.99});
  group(".form-card",{base:165,y:14,step:0,s:.985});
  group("tbody tr",{base:255,y:6,step:20,s:.996});
  group(".auth-logo",{base:20,x:-7,y:0,step:0});
  group(".auth-kicker",{base:75,y:8,step:0});
  group(".auth-content h1",{base:115,y:12,step:0,s:.985});
  group(".auth-content p",{base:160,y:9,step:0});
  group(".auth-form",{base:205,y:12,step:0,s:.992});
  group(".auth-note",{base:245,y:7,step:0});
  group(".front-card",{base:120,y:12,step:24,s:.985});

  document.querySelectorAll(".modal-backdrop").forEach(back=>{
    if(reduceMotion){back.animate([{opacity:0},{opacity:1}],{duration:160,fill:"both"});return}
    back.style.opacity=0;
    back.animate([{opacity:0},{opacity:1}],{duration:180,easing:"cubic-bezier(.16,1,.3,1)",fill:"forwards"});
    const modal=back.querySelector(".modal");prep(modal,0,16,.945);reveal(modal,45,{stiffness:395,damping:29});
  });

  document.querySelectorAll("[data-count]").forEach((el,i)=>{
    const target=Number(el.dataset.count||0),suffix=el.dataset.suffix||"";
    if(reduceMotion){el.textContent=target+suffix;return}
    setTimeout(()=>spring({from:0,to:target,stiffness:92,damping:18,precision:.01,onUpdate:v=>el.textContent=Math.max(0,Math.round(v))+suffix}),160+i*42);
  });

  document.querySelectorAll(".bar").forEach((bar,i)=>{
    const h=bar.dataset.h||"60";bar.style.height=h+"%";bar.style.transform="scaleY(0)";
    if(reduceMotion){bar.style.transform="scaleY(1)";return}
    setTimeout(()=>spring({from:0,to:1,stiffness:180,damping:22,onUpdate:v=>bar.style.transform=`scaleY(${Math.max(0,v)})`}),280+i*52);
  });

  document.querySelectorAll("[data-progress]").forEach((p,i)=>{
    const target=Number(p.dataset.progress||0);p.style.width="0%";
    if(reduceMotion){p.style.width=target+"%";return}
    setTimeout(()=>spring({from:0,to:target,stiffness:95,damping:19,precision:.02,onUpdate:v=>p.style.width=Math.max(0,Math.min(100,v))+"%"}),260+i*60);
  });
});

/* modals */
document.querySelectorAll("[data-modal-close]").forEach(btn=>btn.addEventListener("click",()=>{
  const back=btn.closest(".modal-backdrop");if(!back)return;
  if(reduceMotion){back.style.display="none";return}
  const modal=back.querySelector(".modal");move(modal,{y:8,s:.97,o:0},{stiffness:380,damping:33});
  back.animate([{opacity:1},{opacity:0}],{duration:150,easing:"cubic-bezier(.4,0,1,1)",fill:"forwards"}).onfinish=()=>back.style.display="none";
}));

/* success feedback */
document.querySelectorAll("[data-success]").forEach(btn=>btn.addEventListener("click",()=>{
  const old=btn.innerHTML;btn.innerHTML="Listo ✓";btn.style.background="linear-gradient(135deg,#2fb574,#23915c)";btn.style.color="#fff";
  move(btn,{s:1.018},{stiffness:440,damping:31});
  setTimeout(()=>{move(btn,{s:1},{stiffness:390,damping:32});btn.innerHTML=old;btn.style.background="";btn.style.color=""},1250);
}));

/* choice cards */
document.querySelectorAll(".choice").forEach(c=>c.addEventListener("click",()=>{
  c.parentElement.querySelectorAll(".choice").forEach(x=>x.classList.remove("active"));c.classList.add("active")
}));

/* auth ambient movement */
if(!reduceMotion){
  const orbit=document.querySelector(".security-orbit");
  const towers=[...document.querySelectorAll(".tower")];
  const visual=document.querySelector(".auth-visual");
  let t0=performance.now(),mx=0,my=0,tx=0,ty=0;
  if(visual&&finePointer){
    visual.addEventListener("pointermove",e=>{const r=visual.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5)*10;ty=((e.clientY-r.top)/r.height-.5)*7});
    visual.addEventListener("pointerleave",()=>{tx=0;ty=0});
  }
  function ambient(now){
    const t=(now-t0)/1000;mx+=(tx-mx)*.06;my+=(ty-my)*.06;
    if(orbit)orbit.style.transform=`translate(-50%,-50%) translate3d(${mx*.18}px,${my*.18+Math.sin(t*.85)*2}px,0) rotate(${Math.sin(t*.22)*1.3}deg)`;
    towers.forEach((tower,i)=>{const base=i===0?"rotateY(8deg)":i===2?"rotateY(-8deg)":"";tower.style.transform=`${base} translate3d(${mx*(.11+i*.04)}px,${my*(.09+i*.035)+Math.sin(t*.75+i)*1.5}px,0)`});
    requestAnimationFrame(ambient);
  }
  requestAnimationFrame(ambient);
}
