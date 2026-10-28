// Capture real page content at a fixed CSS width. Current Chromium's native
// captureBeyondViewport briefly changes layout metrics and clears live canvases.
// No cloned DOM, painted replacement charts, image stitching, or CSS hiding.
module.exports=async function captureContent(page,options){
 const original=page.viewportSize();if(!original)throw new Error('Explicit preview viewport is required');
 const scroll=await page.evaluate(()=>({x:scrollX,y:scrollY}));
 const height=await page.evaluate(()=>Math.max(document.documentElement.scrollHeight,document.body.scrollHeight));
 if(height>12000)throw new Error('Preview exceeds bounded capture height');
 try{
  await page.setViewportSize({width:original.width,height});
  await page.evaluate(()=>scrollTo(0,0));
  await page.waitForFunction(size=>innerWidth===size.width&&innerHeight===size.height,{width:original.width,height});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.waitForTimeout(150);
  const footerElement=page.locator('.lab-footer').last();
  const footer=await footerElement.count()?await footerElement.boundingBox():undefined;
  if(footer&&footer.y+footer.height>height+1)throw new Error('Meaningful content extends below capture');
  return await page.screenshot({...options,fullPage:false});
 }finally{
  await page.setViewportSize(original);
  await page.evaluate(pos=>scrollTo(pos.x,pos.y),scroll);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 }
};
