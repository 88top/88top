import component from './index.vue'
import {mountAction} from '../action-lifecycle'
export default (props?:any)=>mountAction(component,{onClosed:props?.onClosed})
