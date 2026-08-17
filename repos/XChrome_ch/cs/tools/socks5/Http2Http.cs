using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Security;
using System.Net.Sockets;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Diagnostics;

namespace XChrome.cs.tools.socks5
{
    /// <summary>
    /// http 2 http
    /// </summary>
    public class Http2Http
    {
        string upstreamProxyHost = "";  // 上游代理地址
        int upstreamProxyPort = 0;                    // 上游代理端口
        string proxyUsername = "";           // 上游代理用户名
        string proxyPassword = "";           // 上游代理密码
        string ProxyAuthHeader="";
        public Http2Http(string toHost,int toPort,string tousername,string topass) {
            upstreamProxyHost = toHost;
            upstreamProxyPort = toPort;
            proxyUsername = tousername;
            proxyPassword = topass;
            if(tousername!="")
                ProxyAuthHeader = "Proxy-Authorization: Basic " + Convert.ToBase64String(Encoding.ASCII.GetBytes($"{proxyUsername}:{proxyPassword}"));
        }

        public async Task<int?> StartAndGetPort(object _lock, CancellationToken cancellationToken)
        {
            ServicePointManager.ServerCertificateValidationCallback += (sender, certificate, chain, sslPolicyErrors) => true;

            cs.Config.ProxySocks5Server_Port = 10668;
            int listenPort = 0;
            TcpListener? listener;
            while (true) {
                lock (_lock)
                {
                    cs.Config.ProxySocks5Server_Port++;
                    listenPort = cs.Config.ProxySocks5Server_Port;
                    if (listenPort > 15666)
                    {
                        cs.Config.ProxySocks5Server_Port = 10666;
                        listenPort = cs.Config.ProxySocks5Server_Port;
                    }
                }
                listener = new TcpListener(IPAddress.Any, listenPort);
                try
                {
                    listener.Start();
                    break;
                }catch(SocketException e)
                {
                    //这里怎么判断是端口被占用了呢？
                    if (e.ErrorCode == 10048)
                    {
                        //cs.Loger.Err("socks5端口冲突，从新加1来过..");
                        await Task.Delay(500);

                    }
                    else
                    {
                        cs.Loger.Err("h2p转发服务启动失败！");
                        cs.Loger.Err(e.Message);
                        break;
                    }
                }
                catch (Exception ee)
                {
                    cs.Loger.Err("h2p转发服务启动失败！");
                    cs.Loger.Err(ee.Message);
                    break;
                }
            }
            Debug.WriteLine($"h2p 代理服务启动，监听端口 {listenPort}");

            if (listener == null) return 0;
            _ = Task.Run(async () =>
            {
                try
                {
                    while (!cancellationToken.IsCancellationRequested)
                    {
                        // 接收客户端连接
                        TcpClient client = await listener.AcceptTcpClientAsync(cancellationToken);
                        _ = Task.Run(() => ProcessClient(client,cancellationToken));
                    }
                }
                finally
                {
                    listener.Stop();
                }

            });
            return listenPort;

        }



      

        // 处理客户端连接
        async Task ProcessClient(TcpClient client, CancellationToken ct)
        {
            try
            {
                using (client)
                {
                    NetworkStream clientStream = client.GetStream();

                    // 用流方便读取文本内容（例如请求行、请求头）
                    using var reader = new StreamReader(clientStream, Encoding.ASCII, false, 8192, leaveOpen: true);
                    using var writer = new StreamWriter(clientStream, Encoding.ASCII, 8192, leaveOpen: true)
                    {
                        AutoFlush = true
                    };

                    // 读取请求行（例如："GET http://example.com HTTP/1.1" 或 "CONNECT www.example.com:443 HTTP/1.1"）
                    string requestLine = await reader.ReadLineAsync();
                    if (string.IsNullOrWhiteSpace(requestLine))
                        return;
                    Console.WriteLine("请求：" + requestLine);

                    // 读取请求头（以空行结束）
                    StringBuilder headerBuilder = new StringBuilder();
                    string line;

                    while (!string.IsNullOrEmpty(line = await reader.ReadLineAsync()) && !ct.IsCancellationRequested)
                    {
                        headerBuilder.AppendLine(line);
                    }
                    string headers = headerBuilder.ToString();

                    // 根据请求判断是 CONNECT 类型还是普通 HTTP 请求
                    if (requestLine.StartsWith("CONNECT", StringComparison.OrdinalIgnoreCase))
                    {
                        await HandleConnect(clientStream, requestLine, headers);
                    }
                    else
                    {
                        await HandleHttpRequest(clientStream, requestLine, headers);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("处理客户端请求出错: " + ex.Message);
            }
        }

        // 处理普通 HTTP 请求
        async Task HandleHttpRequest(NetworkStream clientStream, string requestLine, string headers)
        {
            // 连接上游代理
            using TcpClient upstreamClient = new TcpClient();
            await upstreamClient.ConnectAsync(upstreamProxyHost, upstreamProxyPort);
            NetworkStream upstreamStream = upstreamClient.GetStream();
            using var upstreamWriter = new StreamWriter(upstreamStream, Encoding.ASCII, 8192, leaveOpen: true)
            {
                AutoFlush = true
            };

            // 如果请求头中不包含代理认证字段，则添加
            if (ProxyAuthHeader != "")
            {
                if (!headers.Contains("Proxy-Authorization", StringComparison.OrdinalIgnoreCase))
                {
                    headers += ProxyAuthHeader + "\r\n";
                }
            }
            

            // 构造完整的请求内容
            string fullRequest = requestLine + "\r\n" + headers + "\r\n";
            await upstreamWriter.WriteAsync(fullRequest);

            // 如有请求体（例如 POST），需要进一步处理，这里简化处理假设无数据或数据后续自行转发

            // 开始双向转发客户端与上游代理之间的数据
            await RelayStreams(clientStream, upstreamStream);
        }

        // 处理 HTTPS CONNECT 请求（隧道方式）
        async Task HandleConnect(NetworkStream clientStream, string requestLine, string headers)
        {
            // 从 CONNECT 请求中解析目标主机和端口，例如 "CONNECT www.example.com:443 HTTP/1.1"
            string[] parts = requestLine.Split(' ');
            if (parts.Length < 2)
                return;
            string targetHostPort = parts[1];

            // 连接上游代理
            using TcpClient upstreamClient = new TcpClient();
            await upstreamClient.ConnectAsync(upstreamProxyHost, upstreamProxyPort);
            NetworkStream upstreamStream = upstreamClient.GetStream();
            using var upstreamWriter = new StreamWriter(upstreamStream, Encoding.ASCII, 8192, leaveOpen: true)
            {
                AutoFlush = true
            };

            // 构造并发送 CONNECT 请求给上游代理，同时加上认证信息
            string connectRequest = $"CONNECT {targetHostPort} HTTP/1.1\r\n" +
                                    $"Host: {targetHostPort}\r\n";
            if (ProxyAuthHeader != "")
            {
                connectRequest += ProxyAuthHeader + "\r\n";
            }
            connectRequest += "\r\n";

            await upstreamWriter.WriteAsync(connectRequest);

            // 读取上游代理的响应
            using var upstreamReader = new StreamReader(upstreamStream, Encoding.ASCII, false, 8192, leaveOpen: true);
            string responseLine = await upstreamReader.ReadLineAsync();
            if (responseLine == null)
                return;
            // 简单检查是否返回 200 状态码
            if (!responseLine.Contains("200"))
            {
                // 如果不成功，则将错误响应发给客户端
                byte[] errorBytes = Encoding.ASCII.GetBytes(responseLine + "\r\n");
                await clientStream.WriteAsync(errorBytes, 0, errorBytes.Length);
                return;
            }
            // 消耗完所有响应头
            while (!string.IsNullOrEmpty(await upstreamReader.ReadLineAsync())) { }

            // 告诉客户端隧道建立成功
            byte[] establishedBytes = Encoding.ASCII.GetBytes("HTTP/1.1 200 Connection Established\r\n\r\n");
            await clientStream.WriteAsync(establishedBytes, 0, establishedBytes.Length);

            // 隧道建立后开始双向转发
            await RelayStreams(clientStream, upstreamStream);
        }

        // 双向转发方法：分别从 A->B 和 B->A 转发数据
        async Task RelayStreams(NetworkStream clientStream, NetworkStream upstreamStream)
        {
            Task t1 = Task.Run(() => CopyStreamAsync(clientStream, upstreamStream));
            Task t2 = Task.Run(() => CopyStreamAsync(upstreamStream, clientStream));
            await Task.WhenAny(t1, t2);
        }

        // 从输入流复制数据到输出流
        async Task CopyStreamAsync(NetworkStream input, NetworkStream output)
        {
            byte[] buffer = new byte[8192];
            try
            {
                int bytesRead;
                while ((bytesRead = await input.ReadAsync(buffer, 0, buffer.Length)) > 0)
                {
                    await output.WriteAsync(buffer, 0, bytesRead);
                    await output.FlushAsync();
                }
            }
            catch(Exception ee)
            {
                int x = 0;
                // 如果出现异常（如连接关闭），退出循环即可
            }
        }


    }
}
