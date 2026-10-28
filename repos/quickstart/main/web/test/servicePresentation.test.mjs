import test from 'node:test'
import assert from 'node:assert/strict'
import {homeModule} from './homeModule.mjs'
const {serviceState,domainState,stateLabel,downloadDescription}=await homeModule('../src/home/servicePresentation.ts')
test('service snapshots distinguish installed but stopped, missing and unknown, in both languages',()=>{
 for(const [raw,state,zh,en] of [['running','running','运行中','Running'],['stopped','stopped','未运行','Stopped'],['not installed','notInstalled','未安装','Not installed'],[undefined,'unknown','状态未知','Unknown'],['new-state','unknown','状态未知','Unknown']]){
  assert.equal(serviceState(raw),state);assert.equal(stateLabel(state,false),zh);assert.equal(stateLabel(state,true),en)
 }
 assert.match(downloadDescription('not installed',true),/not installed/);assert.match(downloadDescription('stopped',true),/stopped/);assert.match(downloadDescription(undefined,true),/unknown/);assert.equal(downloadDescription('running',true),'')
})
test('a configured domain never asserts observed health and DDNS sentinel states remain distinct',()=>{
 for(const raw of ['https://router.example:443','http://ipv4.example','ipv6.example']){assert.equal(domainState(raw),'configured');assert.equal(stateLabel(domainState(raw),true),'Configured')}
 assert.equal(domainState('Stopped'),'stopped');assert.equal(domainState('Disabled'),'disabled');for(const raw of ['',undefined,'  '])assert.equal(domainState(raw),'notConfigured')
})
