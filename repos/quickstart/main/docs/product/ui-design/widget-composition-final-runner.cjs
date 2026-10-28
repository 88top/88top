const {spawnSync}=require('node:child_process'),path=require('node:path');
const suites=[
 'widget-composition-review','widget-composition-long-review','widget-composition-boundary-review','widget-composition-access-review',
 'widget-body-matrix-review','widget-body-services-review','widget-body-network-disk-review','widget-body-system-review',
 'widget-body-warning-review','widget-body-touch-review','widget-body-contrast-review','widget-body-resource-review',
 'header-action-interaction-review','business-widgets-review','business-actions-review','network-interaction-review',
 'launcher-actions-review','launcher-home-review','launcher-editor-review',
 'launchpad-browser-review','launchpad-links-review','launchpad-capacity-review','launchpad-resource-review',
 'home-widget-chart-review','boundary-interaction-review','row-sort-review','structure-interaction-review','structure-resource-review',
];
module.exports={suites};
if(require.main===module){const result=spawnSync('rtk',['proxy','node',path.join(__dirname,'launcher-final-runner.cjs'),...suites],{env:{...process.env,QS_DESIGN_EVIDENCE_ROOT:process.env.QS_DESIGN_EVIDENCE_ROOT||'docs/archive/evidence/m66/widget-composition/81-review'},stdio:'inherit'});process.exitCode=result.status??1}
