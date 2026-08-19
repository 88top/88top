using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace XChrome.cs.zchrome 
{
    /// <summary>
    /// 欢迎页
    /// </summary>
    public class WelComePage
    {
        private HttpListener _listener;
        private Thread _listenerThread;
        private string _url = $"http://localhost:{cs.Config.WellComePagePort}/";
        public static WelComePage _welComePage = null;
        public static void Start(CancellationToken cancellationToken)
        {
            if (_welComePage == null)
            {
                _welComePage = new WelComePage();
                _ = Task.Run(() => {
                    _welComePage.StartReal(cancellationToken);
                });
                
            }
        }
        public static void Stop()
        {
            if (_welComePage != null)
            {
                _welComePage.StopReal();
            }
        }
        public WelComePage()
        {
            
        }

        public void StartReal(CancellationToken ct)
        {
            int x = 0;
            while (true)
            {
                if (ct.IsCancellationRequested) { break; }
                try
                {
                    _listener = new HttpListener();
                    _listener.Prefixes.Add(_url);
                    _listener.Start();
                    Console.WriteLine("服务启动在： " + _url);

                    // 开启一个线程处理请求
                    _ = Task.Run(() => { HandleIncomingConnections(ct); });
                    break;
                }
                catch (Exception ex)
                {
                    
                    cs.Config.WellComePagePort++;
                    x++;
                    if (x >= 500)
                    {
                        cs.Loger.Err("welcomepage服务启动失败：" + ex.Message);
                        break;
                    }
                }
            }
            
            

            // 使用 Chrome 打开服务页面（确保 chrome.exe 在系统 PATH 中，否则请指定完整路径）
            //Process.Start("chrome.exe", $"--new-window {_url}");
        }

        private void HandleIncomingConnections(CancellationToken ct)
        {
            while (_listener.IsListening)
            {
                if (ct.IsCancellationRequested) { break; }
                try
                {
                    // 等待客户端请求（这里用 GetContext 是阻塞方式）
                    HttpListenerContext context = _listener.GetContext();
                    HttpListenerResponse response = context.Response;

                    // ============【修改点 3】============
                    // 从 query string 取 id（对应 ZChromeClient.cs 修改点2），标题固定为"环境：{id}"，不再被顶层跳转覆盖（见 ZChromeClient.cs 修改点1）。
                    string envId = context.Request.QueryString["id"] ?? "";
                    string title = envId != "" ? ("环境：" + envId) : "欢迎";

                    // ============【修改点 5】============
                    // 静态页改为卡片+表格的"浏览器检测"样式：UA/浏览器/版本/引擎/系统/平台基于 navigator 同步解析，
                    // IP归属地异步查询（沿用修改点4的 ipwho.is -> freeipapi.com 两级降级逻辑）。不跳转，不影响标签页标题。

                    // 构造网页内容
                    string responseString = $@"
                    <html>
                        <head>
                            <meta charset='UTF-8'>
                            <title>{title}</title>
                            <style>
                                body {{ font-family: -apple-system, 'Segoe UI', 'Microsoft YaHei', sans-serif; background:#f5f6f8; margin:0; padding:24px 16px; color:#1f2937; }}
                                h1 {{ font-size:20px; margin:0 0 4px; }}
                                .sub {{ color:#6b7280; font-size:14px; margin:0 0 20px; }}
                                .card {{ max-width:640px; margin:0; background:#fff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; box-shadow:0 1px 2px rgba(0,0,0,0.04); }}
                                .card-title {{ padding:14px 16px; font-size:16px; font-weight:600; border-left:4px solid #2f6fed; background:#fafafa; }}
                                table {{ width:100%; border-collapse:collapse; }}
                                td {{ padding:14px 16px; border-bottom:1px solid #f0f0f0; vertical-align:middle; }}
                                tr:last-child td {{ border-bottom:none; }}
                                .label-cell {{ width:110px; text-align:right; }}
                                .label-main {{ display:block; color:#374151; font-size:14px; }}
                                .label-sub {{ display:block; font-size:12px; color:#9ca3af; }}
                                .value-cell {{ color:#111827; font-size:14px; word-break:break-all; padding-right:56px; }}
                            </style>
                        </head>
                        <body>
                            <h1>{title}</h1>
                            <p class='sub'>正在准备指纹环境，进入中...</p>

                            <div class='card'>
                                <div class='card-title'>浏览器检测</div>
                                <table>
                                    <tr>
                                        <td class='label-cell'><span class='label-main'>用户代理</span><span class='label-sub'>User-Agent</span></td>
                                        <td class='value-cell' id='uaCell'>检测中...</td>
                                    </tr>
                                    <tr>
                                        <td class='label-cell'><span class='label-main'>浏览器</span><span class='label-sub'>Browser</span></td>
                                        <td class='value-cell' id='browserCell'>检测中...</td>
                                    </tr>
                                    <tr>
                                        <td class='label-cell'><span class='label-main'>版本</span><span class='label-sub'>Version</span></td>
                                        <td class='value-cell' id='versionCell'>检测中...</td>
                                    </tr>
                                    <tr>
                                        <td class='label-cell'><span class='label-main'>渲染引擎</span><span class='label-sub'>Engine</span></td>
                                        <td class='value-cell' id='engineCell'>检测中...</td>
                                    </tr>
                                    <tr>
                                        <td class='label-cell'><span class='label-main'>操作系统</span><span class='label-sub'>System</span></td>
                                        <td class='value-cell' id='osCell'>检测中...</td>
                                    </tr>
                                    <tr>
                                        <td class='label-cell'><span class='label-main'>系统平台</span><span class='label-sub'>Platform</span></td>
                                        <td class='value-cell' id='platformCell'>检测中...</td>
                                    </tr>
                                    <tr>
                                        <td class='label-cell'><span class='label-main'>IP归属地</span><span class='label-sub'>IP Location</span></td>
                                        <td class='value-cell' id='ipCell'>查询中...</td>
                                    </tr>
                                </table>
                            </div>

                            <script>
                            (function() {{
                                var ua = navigator.userAgent;

                                function setText(id, text) {{
                                    document.getElementById(id).textContent = text;
                                }}

                                // ---- 浏览器信息检测（同步，基于 navigator，不发网络请求） ----
                                setText('uaCell', ua);

                                var browser = 'Unknown', version = '', engine = 'Unknown';
                                var m;
                                if ((m = ua.match(/Edg\/([\d.]+)/))) {{ browser = 'Edge'; version = m[1]; engine = 'Blink'; }}
                                else if ((m = ua.match(/OPR\/([\d.]+)/))) {{ browser = 'Opera'; version = m[1]; engine = 'Blink'; }}
                                else if ((m = ua.match(/Chrome\/([\d.]+)/))) {{ browser = 'Chrome'; version = m[1]; engine = 'Blink'; }}
                                else if ((m = ua.match(/Firefox\/([\d.]+)/))) {{ browser = 'Firefox'; version = m[1]; engine = 'Gecko'; }}
                                else if ((m = ua.match(/Version\/([\d.]+).*Safari/))) {{ browser = 'Safari'; version = m[1]; engine = 'WebKit'; }}
                                setText('browserCell', browser);
                                setText('versionCell', version || '未知');
                                setText('engineCell', engine);

                                var os = '未知';
                                if (/Windows NT 10\.0/.test(ua)) {{ os = 'Windows 10/11'; }}
                                else if (/Windows NT 6\.3/.test(ua)) {{ os = 'Windows 8.1'; }}
                                else if (/Windows NT 6\.1/.test(ua)) {{ os = 'Windows 7'; }}
                                else if (/Windows/.test(ua)) {{ os = 'Windows'; }}
                                else if (/Mac OS X/.test(ua)) {{ os = 'macOS'; }}
                                else if (/Android/.test(ua)) {{ os = 'Android'; }}
                                else if (/iPhone|iPad/.test(ua)) {{ os = 'iOS'; }}
                                else if (/Linux/.test(ua)) {{ os = 'Linux'; }}
                                var bit = /Win64|x64|WOW64/.test(ua) ? '（64位）' : '（32位）';
                                setText('osCell', os + (os.indexOf('Windows') === 0 ? bit : ''));

                                setText('platformCell', navigator.platform || '未知');

                                // ---- IP归属地查询（异步，两级降级，逻辑与修改点4一致） ----
                                var TIMEOUT_MS = 2500;

                                function fetchWithTimeout(url) {{
                                    var timeoutPromise = new Promise(function(_, reject) {{
                                        setTimeout(function() {{ reject(new Error('timeout')); }}, TIMEOUT_MS);
                                    }});
                                    return Promise.race([fetch(url), timeoutPromise]);
                                }}

                                // 第一级：ipwho.is（免费、免 key、原生 https）
                                function tryPrimary() {{
                                    fetchWithTimeout('https://ipwho.is/?lang=zh-CN')
                                        .then(function(res) {{ return res.json(); }})
                                        .then(function(data) {{
                                            if (data && data.success !== false) {{
                                                setText('ipCell', (data.country || '') + ' ' + (data.region || '') + ' ' + (data.city || '') + '（' + data.ip + '）');
                                            }} else {{
                                                trySecondary();
                                            }}
                                        }})
                                        .catch(function() {{ trySecondary(); }});
                                }}

                                // 第二级：freeipapi.com（ipapi.co 偶发人机验证，已剔除）
                                function trySecondary() {{
                                    fetchWithTimeout('https://freeipapi.com/api/json')
                                        .then(function(res) {{ return res.json(); }})
                                        .then(function(data) {{
                                            if (data && data.ipAddress) {{
                                                setText('ipCell', (data.countryName || '') + ' ' + (data.regionName || '') + ' ' + (data.cityName || '') + '（' + data.ipAddress + '）');
                                            }} else {{
                                                setText('ipCell', '查询失败');
                                            }}
                                        }})
                                        .catch(function() {{ setText('ipCell', '查询失败'); }});
                                }}

                                tryPrimary();
                            }})();
                            </script>
                        </body>
                    </html>";
                    byte[] buffer = Encoding.UTF8.GetBytes(responseString);

                    response.ContentLength64 = buffer.Length;
                    response.OutputStream.Write(buffer, 0, buffer.Length);
                    response.OutputStream.Close();
                }
                catch (HttpListenerException)
                {
                    // 当 listener 被关闭后，GetContext 会抛出异常。此处捕获后退出循环即可。
                    break;
                }
                catch (Exception ex)
                {
                    Console.WriteLine("处理请求时发生异常：" + ex.Message);
                }
            }
        }

        public void StopReal()
        {
            try
            {
                _listener.Stop();
                _listener.Close();
                if (_listenerThread != null && _listenerThread.IsAlive)
                {
                    _listenerThread.Join();
                }
            }
            catch(Exception e)
            {
                cs.Loger.Err("welcomepage服务启动失败：" + e.Message);
            }
            
        }

        
    }
}
