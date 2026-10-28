import {ref} from 'vue'
import {defaultPreferences} from '../home/layout/widgetPresentation'
import {documentOf} from '../home/layout/homeDocument'
import {orderedSession} from './orderedLayout'
export * from '../home/layout/homeDocument'
export const preferenceSession=ref(defaultPreferences(new URLSearchParams(location.search).get('legacy')==='0'?0:new URLSearchParams(location.search).get('legacy')==='1'?1:2))
export function initialDocument(){return documentOf(orderedSession.value,preferenceSession.value)}
