import component from './index.vue'
import {mountAction} from '../action-lifecycle'
export default (props?:{url:string;onClosed?:()=>void})=>mountAction(component,props)


