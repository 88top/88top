const {run}=require('./direct-test-utils.cjs');
run('launcher-restore-diagnose',async({page,visit,report})=>{
 await visit();await page.locator('[data-applications-hub] [data-widget-more]').click();await page.locator('[data-widget-menu-item=favorites]').click();await page.getByRole('tab',{name:/已安装应用/}).click();await page.locator('[data-select-app=docker]').click();await page.locator('[data-remove-shortcut=tool-logs]').click();await page.locator('.applications-save').click();await page.locator('[data-applications-hub] [data-widget-more]').click();await page.locator('[data-widget-menu-item=favorites]').click();
 await page.evaluate(()=>{window.__restoreClicks=[];window.addEventListener('click',e=>window.__restoreClicks.push({target:e.target.outerHTML?.slice(0,180)}),true)});
 const snapshot=async(name)=>{const value=await page.evaluate(()=>({order:[...document.querySelectorAll('[data-editor-shortcut]')].map(e=>({id:e.dataset.editorShortcut,cls:e.className})),history:document.querySelector('[data-shortcut-history]')?.dataset.shortcutHistory,clicks:window.__restoreClicks}));report.checks.push({name,...value});console.log(JSON.stringify({name,...value}))};
 await snapshot('before');await page.locator('[data-shortcut-restore]').click();await snapshot('after');await page.waitForTimeout(500);await snapshot('settled');
}).catch(e=>{console.error(e);process.exitCode=1});
