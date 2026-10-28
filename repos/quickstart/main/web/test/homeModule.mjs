// Exercise the actual shared production modules under Node. Vite's pinned
// esbuild resolves the same extensionless TypeScript imports used in the app.
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
const require=createRequire(import.meta.url)
const {buildSync}=require('esbuild')
export async function homeModule(path){
 const result=buildSync({entryPoints:[fileURLToPath(new URL(path,import.meta.url))],bundle:true,write:false,format:'esm',platform:'node',logLevel:'silent'})
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
}
