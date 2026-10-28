import component from './index.vue'
import {mountAction} from '../action-lifecycle'
export default (props:{setup:number;onClosed?:()=>void})=>mountAction(component,props)
