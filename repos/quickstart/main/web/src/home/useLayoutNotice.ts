import {computed,ref} from 'vue'

export type LayoutNoticeKind='info'|'error'|'progress'
export type LayoutNoticeState={id:number;message:string;kind:LayoutNoticeKind}

// A new event gets a fresh identity even when its text is identical.
export function useLayoutNotice(){
 const noticeState=ref<LayoutNoticeState>({id:0,message:'',kind:'info'})
 function showNotice(message:string,kind:LayoutNoticeKind='info'){
  noticeState.value={id:noticeState.value.id+1,message,kind}
 }
 function dismissNotice(id?:number){if(id===undefined||id===noticeState.value.id)showNotice('')}
 const notice=computed({get:()=>noticeState.value.message,set:(message:string)=>showNotice(message)})
 return {noticeState,notice,showNotice,dismissNotice}
}
