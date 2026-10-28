import defaults from '../../../backend/modules/homeconfig/defaults.json'
import {configValue,type LayoutConfig,type LauncherConfig} from './configContract'
export const defaultLayout=()=>configValue('layout',defaults.layout) as LayoutConfig
export const defaultLauncher=()=>configValue('launcher',defaults.launcher) as LauncherConfig
