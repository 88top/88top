const {spawnSync}=require('node:child_process'),path=require('node:path');
const suites=[
  'widget-body-storage-review','widget-body-services-review','widget-body-network-disk-review',
  'widget-body-system-review','widget-body-touch-review','widget-body-resource-review','widget-body-matrix-review','widget-body-contrast-review','widget-body-warning-review',
  'visual-refinement-matrix-review','visual-refinement-content-review',
  'header-action-matrix-review','header-action-interaction-review',
  'widget-actions-review','home-widget-header-review','home-widget-standard-review',
  'network-interaction-review','business-widgets-review','business-actions-review',
  'launcher-actions-review','launcher-home-review','launcher-editor-review',
  'launchpad-browser-review','launchpad-links-review','launchpad-capacity-review','launchpad-resource-review',
  'home-widget-chart-review','boundary-interaction-review','row-sort-review',
  'structure-interaction-review','structure-resource-review',
];
module.exports={suites};
if(require.main===module){
  const result=spawnSync('rtk',['proxy','node',path.join(__dirname,'launcher-final-runner.cjs'),...suites],{
    env:{...process.env,QS_DESIGN_EVIDENCE_ROOT:process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/widget-body/75-review'},stdio:'inherit',
  });process.exitCode=result.status??1;
}
