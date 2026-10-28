import {computed,ref,shallowRef,type CSSProperties} from 'vue'
import type {OrderedRow} from './orderedLayout'

type RowBox={id:string;top:number;height:number;gap:number}
type Preview={id:string;from:number;to:number;dy:number;height:number;top:number;offsets:Record<string,number>}
type Options={rows:()=>OrderedRow[];root:()=>HTMLElement|null;enabled:()=>boolean;beforeStart:()=>void;commit:(id:string,to:number)=>void;announce:(from:number,to:number,cancelled?:boolean)=>void}

// One vertical list gesture. Preview positions never mutate the layout draft.
export function useRowSorting(options:Options){
  const preview=shallowRef<Preview|null>(null),busy=ref(false),active=computed(()=>Boolean(preview.value))
  let session:{pointer:number;id:string;from:number;x:number;y:number;startY:number;scroll:number;maxScroll:number;hash:string;boxes:RowBox[];rootTop:number;width:number;viewport:number[];element:HTMLElement}|undefined
  let frame:number|undefined,lastTime=0,skipClick=false
  function suppressNextClick(){skipClick=true;setTimeout(()=>skipClick=false,0)}
  function clean(){
    const old=session;session=undefined
    if(frame!==undefined)cancelAnimationFrame(frame);frame=undefined;lastTime=0
    window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancelEvent);window.removeEventListener('blur',cancelEvent);window.removeEventListener('resize',cancelEvent)
    old?.element.removeEventListener('lostpointercapture',cancelEvent)
    if(old?.element.hasPointerCapture?.(old.pointer))old.element.releasePointerCapture(old.pointer)
    preview.value=null;busy.value=false
  }
  function cancel(notify=false){const old=preview.value;clean();if(old){suppressNextClick();if(notify)options.announce(old.from,old.to,true)}}
  function cancelEvent(){cancel(true)}
  function valid(){return Boolean(session&&options.enabled()&&options.root()?.isConnected&&options.root()!.clientWidth===session.width&&innerWidth===session.viewport[0]&&innerHeight===session.viewport[1]&&JSON.stringify(options.rows())===session.hash)}
  function update(){
    if(!session||!valid()){cancel(true);return}
    const s=session,remaining=s.boxes.filter(b=>b.id!==s.id),to=remaining.filter(b=>s.y+scrollY>b.top+b.height/2).length
    const order=[...remaining];order.splice(to,0,s.boxes[s.from])
    const offsets:Record<string,number>={};let cursor=s.boxes[0].top,top=cursor
    for(const box of order){if(box.id===s.id)top=cursor;else offsets[box.id]=cursor-box.top;cursor+=box.height+box.gap}
    // A translated source must not extend document overflow and chase its own
    // new scroll boundary forever. Keep the floating row inside the list.
    const source=s.boxes[s.from],last=s.boxes[s.boxes.length-1],dy=Math.max(s.boxes[0].top-source.top,Math.min(last.top+last.height-source.height-source.top,s.y-s.startY+scrollY-s.scroll)),old=preview.value
    if(!old||old.to!==to||old.dy!==dy){preview.value={id:s.id,from:s.from,to,dy,height:s.boxes[s.from].height,top:top-s.rootTop,offsets};if(!old||old.to!==to)options.announce(s.from,to)}
  }
  function animate(time:number){
    frame=undefined;if(!session||!preview.value)return
    if(!valid()){cancel(true);return}
    const toolbar=document.querySelector<HTMLElement>('.direct-toolbar'),top=Math.max(8,(toolbar?.getBoundingClientRect().bottom||0)+12),bottom=innerHeight-24,edge=72
    const root=options.root()!.getBoundingClientRect(),x=session.x
    // Velocity is in pixels/second and capped, independent of screen refresh rate.
    const dt=lastTime?Math.min(.032,(time-lastTime)/1000):0;lastTime=time
    const ratio=session.y<top+edge?-Math.min(1,Math.max(0,(top+edge-session.y)/edge)):session.y>bottom-edge?Math.min(1,Math.max(0,(session.y-bottom+edge)/edge)):0
    if(x>=root.left&&x<=root.right&&ratio)window.scrollTo(0,Math.max(0,Math.min(session.maxScroll,scrollY+Math.sign(ratio)*ratio*ratio*720*dt)))
    update();if(session)frame=requestAnimationFrame(animate)
  }
  function move(event:PointerEvent){
    if(!session||event.pointerId!==session.pointer)return
    session.x=event.clientX;session.y=event.clientY
    if(!preview.value&&Math.abs(event.clientY-session.startY)<6)return
    event.preventDefault();update();if(session&&frame===undefined)frame=requestAnimationFrame(animate)
  }
  function up(event:PointerEvent){
    if(!session||event.pointerId!==session.pointer)return
    const root=options.root()?.getBoundingClientRect(),good=valid()&&root&&event.clientX>=root.left&&event.clientX<=root.right&&event.clientY>=0&&event.clientY<=innerHeight
    session.y=event.clientY;if(preview.value&&good)update()
    const old=preview.value;clean()
    if(old){suppressNextClick();if(good){options.commit(old.id,old.to)}else options.announce(old.from,old.to,true)}
  }
  function start(event:PointerEvent,id:string){
    if(event.button!==0||event.isPrimary===false||!options.enabled())return
    options.beforeStart();clean();skipClick=false
    const root=options.root();if(!root)return
    const elements=Array.from(root.querySelectorAll<HTMLElement>('[data-overview-row]')),boxes=elements.map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.overviewRow!,top:r.top+scrollY,height:r.height,gap:parseFloat(getComputedStyle(e).marginBottom)||0}}),from=boxes.findIndex(b=>b.id===id)
    if(from<0)return
    const element=event.currentTarget as HTMLElement;element.focus({preventScroll:true})
    session={pointer:event.pointerId,id,from,x:event.clientX,y:event.clientY,startY:event.clientY,scroll:scrollY,maxScroll:Math.max(0,document.documentElement.scrollHeight-innerHeight),hash:JSON.stringify(options.rows()),boxes,rootTop:root.getBoundingClientRect().top+scrollY,width:root.clientWidth,viewport:[innerWidth,innerHeight],element};busy.value=true
    element.setPointerCapture?.(event.pointerId);element.addEventListener('lostpointercapture',cancelEvent)
    window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cancelEvent);window.addEventListener('blur',cancelEvent);window.addEventListener('resize',cancelEvent)
  }
  function style(id:string):CSSProperties{
    const p=preview.value;if(!p)return {}
    return id===p.id?{transform:`translate3d(0,${p.dy}px,0)`,zIndex:80,transition:'none',pointerEvents:'none'}:{transform:`translate3d(0,${p.offsets[id]||0}px,0)`,pointerEvents:'none'}
  }
  function consumeClick(){const skip=skipClick;skipClick=false;return skip}
  return {preview,busy,active,start,cancel,style,consumeClick,debug:()=>({pending:busy.value,active:active.value,id:preview.value?.id,from:preview.value?.from,to:preview.value?.to,frame:frame!==undefined})}
}
