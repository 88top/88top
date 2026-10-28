import type {HomeApplication} from './homeApplications'

// app-meta installs the same local PNG path on opkg and APK. Never interpret
// metadata/link values as arbitrary image URLs or execute entry scripts.
export function applicationIconPath(app:Pick<HomeApplication,'id'|'kind'>){
 return app.kind==='app'&&/^[a-zA-Z0-9][a-zA-Z0-9_.+-]{0,127}$/.test(app.id)
  ?'/luci-static/resources/app-icons/'+encodeURIComponent(app.id)+'.png':''
}
