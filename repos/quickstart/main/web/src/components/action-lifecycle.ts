import {createApp,type Component} from 'vue'

// The existing wizard entry points keep their APIs and real forms. Closing is
// idempotent and exposes a lifecycle hook to the owning homepage adapter.
export function mountAction(component:Component,input:Record<string,any>={}){
 const {onClosed,...props}=input,el=document.createElement('div');document.body.appendChild(el)
 let closed=false
 const vm=createApp(component,{...props,Close})
 function Close(){if(closed)return;closed=true;vm.unmount();el.remove();onClosed?.()}
 try{vm.mount(el)}catch(error){el.remove();throw error}
 return {Close}
}
