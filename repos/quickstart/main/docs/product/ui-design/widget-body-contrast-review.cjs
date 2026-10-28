const {run}=require('./direct-test-utils.cjs');
run('widget-body-contrast',async({page,assert,report,visit})=>{
  for(const theme of ['light','dark']){
    await visit('&scenario=business-all&theme='+theme);await page.locator('.native-storage .disk_infoicon').first().waitFor();
    await page.locator('.native-sharing .app-container_linkease a').last().focus();
    const contrasts=await page.evaluate(()=>{
      const rgb=value=>(value.match(/[\d.]+/g)||[]).map(Number);
      const background=n=>{if(!n)return [255,255,255];const color=rgb(getComputedStyle(n).backgroundColor),alpha=color.length===3?1:color[3]||0;if(alpha===1)return color;const parent=background(n.parentElement);return color.slice(0,3).map((c,i)=>c*alpha+parent[i]*(1-alpha))};
      const luminance=color=>{const a=color.slice(0,3).map(c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4});return .2126*a[0]+.7152*a[1]+.0722*a[2]};
      const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
      return [
        ['Selected service boundary','.native-sharing .tab>.item.active','borderTopColor'],
        ['Keyboard focus outline','.native-sharing .app-container_linkease>div>a','outlineColor'],
        ['Neutral disk action stroke','.native-storage .disk_infoicon svg [stroke]:not([stroke=none])','stroke'],
      ].map(([name,selector,property])=>{const n=document.querySelector(selector),s=getComputedStyle(n),color=s[property],bg=background(n);return {name,color,background:bg,ratio:ratio(rgb(color),bg),focused:document.activeElement===n}});
    });
    for(const sample of contrasts){assert.ok(sample.ratio>=3,JSON.stringify(sample));report.checks.push({theme,...sample})}
    assert.equal(contrasts[1].focused,true);
  }
}).catch(e=>{console.error(e);process.exitCode=1});
