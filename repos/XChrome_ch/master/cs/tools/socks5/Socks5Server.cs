using HttpToSocks5Proxy;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using XChrome.cs.tools.YTools;

namespace XChrome.cs.tools.socks5
{
    /// <summary>
    /// 已作废
    /// </summary>
    public class Socks5Server
    {
        public static bool _isStop = false;

        public static Dictionary<string, (string Address, int Port, string name, string pass)> Socks5Mapping = new Dictionary<string, (string, int, string, string)>
        {
            //{ "user1", ("167.100.105.168", 7737,"pedtlikx","m7c7u409rqx9") },
            //{ "user2", ("37.44.219.27", 5992,"pedtlikx","m7c7u409rqx9") }
        };

        /// <summary>
        /// 设置对应
        /// </summary>
        /// <param name="username"></param>
        /// <param name="sock5s"></param>
        public static void SetMapping(string username, (string Address, int Port, string name, string pass) sock5s)
        {
            if (Socks5Mapping.ContainsKey(username))
            {
                Socks5Mapping[username] = sock5s;
            }
            else { Socks5Mapping.Add(username, sock5s); }
        }


        public static bool IsSocks5MustDo(string proxy,out string httpproxy)
        {
            httpproxy = "";
            if (proxy == "") return false;
            proxy = proxy.Trim();
            if (!proxy.StartsWith("socks5:"))
            {
                return false;
            }

            string ip = "", user = "", pass = "";
            int port = 0;

            string[] pl = proxy.Split(new char[] { ':', '：' });
            if (pl.Length == 3)
            {
                ip = pl[1].Trim().Replace("//", "");
                port = pl[2].Trim().TryToInt32(0);
            }
            else if (pl.Length == 5)
            {
                ip = pl[1].Trim().Replace("//", "");
                port = pl[2].Trim().TryToInt32(0);
                user = pl[3].Trim();
                pass = pl[4].Trim();
            }
            else
            {
                return false;
            }
            string usname = "u" + cs.tools.YTools.YUtils.GetMD5(proxy, true);
            SetMapping(usname, (ip, port, user, pass));
            httpproxy = "http://127.0.0.1:"+cs.Config.ProxySocks5Server_Port+":"+usname+":111";
            return true;
        }

        /// <summary>
        /// 启动
        /// </summary>
        /// <param name="cancellationToken"></param>
        public static void Start(CancellationToken cancellationToken)
        {
            if (cs.Config.isZChrome)
            {
                Proxy2ProxyPools.Start(cancellationToken);
                return;
            }


            //Task.Run(async () =>
            //{
                
            //    while (true)
            //    {
            //        int port = cs.Config.ProxySocks5Server_Port;
            //        string url = "http://user1:pass1@[::]:" + port;
            //        Uri.TryCreate(url, UriKind.Absolute, out Uri? inboundUri);
            //        IPAddress.TryParse(inboundUri.Host, out IPAddress ip);
            //        IPEndPoint inboundEP = new IPEndPoint(ip, inboundUri.Port);

            //        var listener = new HttpProxyListener(inboundEP, 0);
            //        try
            //        {
            //            await listener.RunAsync(cancellationToken);
            //            break;
            //        }
            //        catch (SocketException e)
            //        {
            //            //这里怎么判断是端口被占用了呢？
            //            if (e.ErrorCode == 10048)
            //            {
            //                cs.Loger.Err("socks5端口冲突，从新加1来过..");
            //                await Task.Delay(500);
            //                cs.Config.ProxySocks5Server_Port++;
            //            }
            //            else
            //            {
            //                cs.Loger.Err("socks5转发服务启动失败！");
            //                cs.Loger.Err(e.Message);
            //                break;
            //            }
            //        }
            //        catch (Exception ee)
            //        {
            //            cs.Loger.Err("socks5转发服务启动失败！");
            //            cs.Loger.Err(ee.Message);
            //            break;
            //        }
            //    }

            //});

            
        }

        public static void Stop()
        {
            if (cs.Config.isZChrome)
            {
                Proxy2ProxyPools.Stop();
                return;
            }
            //已经用 CancellationToken 实现
            _isStop = true;
        }
    }
}
