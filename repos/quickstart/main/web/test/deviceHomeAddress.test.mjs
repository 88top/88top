import assert from 'node:assert/strict'
import test from 'node:test'
import {deviceHomeAddress} from '../src/pages/device/devicePresentation.ts'
const t=text=>text
const device={deviceId:'mac:aa:bb:cc:dd:ee:01',mac:'AA:BB:CC:DD:EE:01',addresses:{current:[],historical:[]}}

test('home prefers current IPv4 even when IPv6 is marked primary',()=>{
 const result=deviceHomeAddress({...device,addresses:{current:[{family:6,address:'fd00::1',primary:true},{family:4,address:'192.168.30.7'}],historical:[{family:4,address:'192.168.1.7'}]}},t)
 assert.deepEqual(result,{kind:'current',text:'192.168.30.7',description:'当前IP：192.168.30.7'})
})
test('home keeps the preferred IPv4 and never changes device identity',()=>{
 const current=[{family:4,address:'192.168.30.8'},{family:4,address:'192.168.30.9',primary:true}]
 const input={...device,addresses:{current,historical:[]}};const before=structuredClone(input)
 assert.equal(deviceHomeAddress(input,t).text,'192.168.30.9');assert.deepEqual(input,before)
})
test('historical addresses are explicitly labelled, never presented as current',()=>{
 const result=deviceHomeAddress({...device,addresses:{current:[],historical:[{family:4,address:'192.168.1.7'}]}},t)
 assert.deepEqual(result,{kind:'historical',text:'历史 192.168.1.7',description:'历史地址：192.168.1.7'})
})
test('IPv6-only keeps a distinguishing suffix and exposes the complete address',()=>{
 const address='2001:0db8:1234:5678:90ab:cdef:1234:5678'
 const result=deviceHomeAddress({...device,addresses:{current:[{family:6,address}],historical:[]}},t)
 assert.equal(result.kind,'current');assert.ok(result.text.length<=20);assert.ok(result.text.endsWith('1234:5678'));assert.ok(result.description.endsWith(address))
})
test('devices with no IP remain distinguishable by MAC or stable identity',()=>{
 assert.equal(deviceHomeAddress(device,t).text,device.mac)
 const result=deviceHomeAddress({...device,mac:''},t);assert.equal(result.kind,'identity');assert.ok(result.description.includes(device.deviceId))
})
