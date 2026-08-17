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

                    // 构造网页内容
                    string responseString = @"
                    <html>
                        <head>
                            <meta charset='UTF-8'>
                            <title>欢迎</title>
                        </head>
                        <body>
                            <h1>欢迎</h1>
                            <p>正在准备指纹环境，进入中...</p>
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
