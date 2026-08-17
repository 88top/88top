using HttpToSocks5Proxy;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Net;
using System.Text;
using System.Threading.Tasks;


namespace XChrome.cs.tools.socks5
{

    /// <summary>
    /// proxy代理主入口
    /// </summary>
    public class Proxy2ProxyServer
    {
        public string key = "";
        public int localPort = 0;
        public bool isUsing = false;
        private static object _lock= new object();

        string out_protocol;
        string out_Address;
        int out_Port;
        string out_name;
        string out_pass;
        public async Task<int?> Start(string key, string protocol, string Address, int Port, string name, string pass, CancellationToken cancellationToken)
        {

            ///如果不是socks5，用其他类处理
            if (protocol != "socks5")
            {

                var h2h=new Http2Http(Address, Port,name,pass);
                int? port= await h2h.StartAndGetPort(_lock, cancellationToken);
                return port;
            }




            ITunnelFactory _tunnelFactory = null;
            if (IPAddress.TryParse(Address, out IPAddress ip2))
            {
                var outboundEP = new IPEndPoint(ip2, Port);
                _tunnelFactory = new Socks5TunnelFactory(outboundEP);
              
            }
            else
            {
                var outboundEP = new DnsEndPoint(Address, Port);
                _tunnelFactory = new Socks5TunnelFactory(outboundEP);
            }
            if (protocol== "socks5" && name != "")
            {
                ((Socks5TunnelFactory)_tunnelFactory).SetCredential(name + ":" + pass);
            }
            
                
            

            await Task.Run(async () =>
            {
                while (true)
                {
                    if (cancellationToken.IsCancellationRequested)
                    {
                        break; 
                    }
                    int port = 0;
                    lock (_lock)
                    {
                        cs.Config.ProxySocks5Server_Port++;
                        port = cs.Config.ProxySocks5Server_Port;
                        if (port > 15666)
                        {
                            cs.Config.ProxySocks5Server_Port = 10666;
                            port = cs.Config.ProxySocks5Server_Port;
                        }
                    }
                    string url = "http://[::]:" + port;
                    Uri.TryCreate(url, UriKind.Absolute, out Uri? inboundUri);
                    IPAddress.TryParse(inboundUri.Host, out IPAddress ip);
                    IPEndPoint inboundEP = new IPEndPoint(ip, inboundUri.Port);

                    var listener = new HttpProxyListener2(inboundEP, 0,_tunnelFactory);
                    try
                    {
                        await listener.RunAsync(cancellationToken);
                        localPort = port;
                        break;
                    }
                    catch (SocketException e)
                    {
                        //这里怎么判断是端口被占用了呢？
                        if (e.ErrorCode == 10048)
                        {
                            //cs.Loger.Err("socks5端口冲突，从新加1来过..");
                            await Task.Delay(500);
                            
                        }
                        else
                        {
                            cs.Loger.Err("socks5转发服务启动失败！");
                            cs.Loger.Err(e.Message);
                            break;
                        }
                    }
                    catch (Exception ee)
                    {
                        cs.Loger.Err("socks5转发服务启动失败！");
                        cs.Loger.Err(ee.Message);
                        break;
                    }
                }

            });


            return this.localPort;
        }
    }

    public class Proxy2ProxyPools
    {

        public static bool _isStop = false;

        

        //public static List<Proxy2ProxyServer> serverList = new List<Proxy2ProxyServer>();

        //private static Dictionary<string, Proxy2ProxyServer> key_server = new Dictionary<string, Proxy2ProxyServer>();
        //private static object _lock=new object();


        /// <summary>
        /// 把真实的代理传入，自动构建对应，然后返回本地监听端口
        /// </summary>
        /// <param name="protocol"></param>
        /// <param name="Address"></param>
        /// <param name="Port"></param>
        /// <param name="name"></param>
        /// <param name="pass"></param>
        /// <returns></returns>
        public static async Task<int> AddMapping_BackLocalPort(string protocol, string Address, int Port, string name, string pass, CancellationToken cancellationToken)
        {
            string key = protocol+","+Address+","+Port+","+name+","+pass;
            //判断这个端口是否存在
            int? port = await new Proxy2ProxyServer().Start(key, protocol, Address, Port, name, pass, cancellationToken);
          
            return port??0;
        }





        public static void Start(CancellationToken cancellationToken)
        {

        }

        public static void Stop()
        {
            //已经用 CancellationToken 实现
            _isStop = true;
        }
    }
}

//1 通过设置的完整代理，找到 本地代理port
//2 通过本地代理port，找到目标代理