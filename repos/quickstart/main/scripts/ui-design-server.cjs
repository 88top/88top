// One owned Node process, no proxy to any router, strict port ownership.
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { build, preview } = require(path.join(root, 'web/node_modules/vite'));
(async () => {
  const configFile=path.join(root,'web/vite.design.config.ts');
  await build({configFile});
  const server=await preview({configFile});
  console.log('Quickstart Vue design: http://0.0.0.0:5180/');
  console.log(`Design artifacts: ${server.config.build.outDir}`);
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { server.httpServer.close(()=>process.exit(0)); });
})().catch(error => { console.error(error); process.exit(1); });
