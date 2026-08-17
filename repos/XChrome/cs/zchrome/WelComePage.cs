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

                    // ============【修改点 3：开始】============
                    // 原逻辑：无论哪个环境打开这个本地首页，标题都写死显示"欢迎"，
                    // 完全不区分是环境几，多开时每个标签页标题都一样，分不清对应哪个环境。
                    //
                    // 现改为：从请求地址的 query string 里取出 id
                    // （对应 ZChromeClient.cs 修改点2里拼的 ?id=xxx），
                    // 把标题固定显示为"环境：{id}"。
                    // 因为这个页面本身不会再被顶层跳转覆盖掉（见 ZChromeClient.cs 修改点1），
                    // 所以标签页从打开到关闭全程都会一直显示"环境：{id}"，
                    // 不受 web3tool.vip 这个默认地址能不能访问的影响。
                    string envId = context.Request.QueryString["id"] ?? "";
                    string title = envId != "" ? ("环境：" + envId) : "欢迎";

                    // ============【修改点 4：开始】============
                    // 需求：在页面上增加一行 IP 归属地查询结果，纯静态页面 + 前端 JS 异步查询，
                    // 不做整页跳转，不影响标签页标题和页面稳定性。
                    //
                    // 查询逻辑：
                    //   1. 依次尝试两个免费 IP 归属地查询接口（串行，不是同时发出）：
                    //      ipwho.is -> freeipapi.com
                    //      任何一级成功即停止，不再调用后面的接口。
                    //      （曾经加过 ipapi.co 作为第二级，但它偶发人机验证拦截，已剔除。）
                    //   2. 每一级都带 2.5 秒超时（用 Promise.race 实现），
                    //      超时也视为失败，直接换下一级，避免某个接口长时间不响应卡住页面。
                    //   3. 全部查询是在浏览器（该指纹环境）里发起的 fetch 请求，
                    //      会经过该环境自己的代理出口，查到的是环境实际对外暴露的 IP，
                    //      不是本机服务器的 IP。
                    //   4. 两级全部失败才显示"查询失败"。
                    //
                    // 注意：两个接口都用 https，避免 Chrome 的"始终使用安全连接"
                    // 把 http 请求强制升级到 https 导致失败（ip-api.com 免费版只支持 http，故未采用）。
                    // ============【修改点 4：结束】============

                    // 构造网页内容
                    string responseString = $@"
                    <html>
                        <head>
                            <meta charset='UTF-8'>
                            <title>{title}</title>
                        </head>
                        <body>
                            <h1>{title}</h1>
                            <p>正在准备指纹环境，进入中...</p>
                            <p id='ipInfo'>IP归属地：查询中...</p>

                            <script>
                            (function() {{
                                var el = document.getElementById('ipInfo');
                                var TIMEOUT_MS = 2500;

                                function showResult(text) {{
                                    el.textContent = 'IP归属地：' + text;
                                }}

                                // 给 fetch 加超时：超过 TIMEOUT_MS 就当作失败，走 catch 逻辑
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
                                                showResult((data.country || '') + ' ' + (data.region || '') + ' ' + (data.city || '') + '（' + data.ip + '）');
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
                                                showResult((data.countryName || '') + ' ' + (data.regionName || '') + ' ' + (data.cityName || '') + '（' + data.ipAddress + '）');
                                            }} else {{
                                                showResult('查询失败');
                                            }}
                                        }})
                                        .catch(function() {{ showResult('查询失败'); }});
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
