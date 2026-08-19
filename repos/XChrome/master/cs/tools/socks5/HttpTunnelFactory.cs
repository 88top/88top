using HttpToSocks5Proxy;
using Pipelines.Sockets.Unofficial;
using System;
using System.Buffers;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Pipelines;
using System.Linq;
using System.Net;
using System.Net.Security;
using System.Net.Sockets;
using System.Security.Authentication;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;

namespace XChrome.cs.tools.socks5
{
    /// <summary>
    /// 已作废
    /// </summary>
    public class SecureDuplexPipe : IDuplexPipe
    {
        private readonly SslStream _sslStream;

        public PipeReader Input { get; }
        public PipeWriter Output { get; }

        public SecureDuplexPipe(SslStream sslStream)
        {
            _sslStream = sslStream;
            Input = PipeReader.Create(_sslStream);
            Output = PipeWriter.Create(_sslStream);
        }

        public void Dispose() => _sslStream.Dispose();
    }
    public class HttpTunnelFactory: ITunnelFactory
    {
        private readonly EndPoint _proxyEndPoint;
        private string? _authHeader;

        // 添加证书验证回调
        public RemoteCertificateValidationCallback? CertificateValidationCallback { get; set; }

        private async Task<SslStream> CreateSecureStream(Stream plainStream, string targetHost)
        {
            var sslStream = new SslStream(plainStream);
            await sslStream.AuthenticateAsClientAsync(new SslClientAuthenticationOptions
            {
                TargetHost = targetHost,
                EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13,
                CertificateRevocationCheckMode = X509RevocationMode.Online,
                ApplicationProtocols = new List<SslApplicationProtocol>
        {
            SslApplicationProtocol.Http2,
            SslApplicationProtocol.Http11
        },
                RemoteCertificateValidationCallback = CertificateValidationCallback
            });
            return sslStream;
        }


        private readonly X509Certificate2Collection _trustedRoots = new X509Certificate2Collection();

        //public HttpTunnelFactory(EndPoint proxyEndPoint)
        //{
        //    _proxyEndPoint = proxyEndPoint;

        //    // 加载可信根证书（示例）
        //    _trustedRoots.Add(new X509Certificate2("trusted_root.cer"));
        //}

        //private bool CertificateValidationCallback(
        //    object sender,
        //    X509Certificate? certificate,
        //    X509Chain? chain,
        //    SslPolicyErrors sslPolicyErrors)
        //{
        //    if (certificate == null) return false;

        //    var cert2 = new X509Certificate2(certificate);
        //    var chainPolicy = new X509ChainPolicy
        //    {
        //        RevocationMode = X509RevocationMode.Online,
        //        TrustMode = X509ChainTrustMode.CustomRootTrust,
        //        CustomTrustStore = _trustedRoots
        //    };

        //    using var customChain = new X509Chain();
        //    customChain.ChainPolicy = chainPolicy;

        //    return customChain.Build(cert2)
        //           && sslPolicyErrors == SslPolicyErrors.None;
        //}





        public HttpTunnelFactory(EndPoint proxyEndPoint)
        {
            _proxyEndPoint = proxyEndPoint;

            //using var store = new X509Store(StoreName.Root, StoreLocation.CurrentUser);
            //store.Open(OpenFlags.ReadOnly);
            //_trustedRoots.AddRange(store.Certificates);
        }

        public void SetCredential(string userInfo)
        {

            var parts = userInfo.Split(':', 2);
            if (parts.Length != 2) throw new ArgumentException("Invalid user info format");

            var credential = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{parts[0]}:{parts[1]}"));
            _authHeader = $"Proxy-Authorization: Basic {credential}\r\n"; // 注意结尾只有\r\n

            //Debug.WriteLine("设置auth："+_authHeader);
        }

        public Task<IDuplexPipe?> CreateAsync(EndPoint targetEndPoint, CancellationToken cancellationToken)
        {
            return CreateFastAsync(targetEndPoint, cancellationToken) ;
        }

        private async Task<IDuplexPipe?> CreateFastAsync(EndPoint targetEndPoint, CancellationToken cancellationToken)
        {
            var socket = await SocketConnection.ConnectAsync(_proxyEndPoint);
            try
            {
                // 分步发送请求
                await SendConnectRequestAsync(socket, targetEndPoint, cancellationToken);
                //var writer = socket.Output;
                //WriteConnectRequest(writer, targetEndPoint, _authHeader);
                //await writer.FlushAsync(cancellationToken);

                if (!await VerifyResponseAsync(socket.Input, cancellationToken))
                {
                    socket.Dispose();
                    return null;
                }

                // 清空输入缓冲区剩余数据
                // await socket.Input.CompleteAsync();

                // [3] 建立 TLS 连接
                //var rawSocket = socket.Socket; // 获取底层Socket
                //var networkStream = new NetworkStream(rawSocket, ownsSocket: false);
                //var targetHost = (targetEndPoint as DnsEndPoint)?.Host ?? "";
                //var sslStream = await CreateSecureStream(networkStream, targetHost);

                // [4] 返回安全管道
                //return new SecureDuplexPipe(sslStream);



                return Interlocked.Exchange(ref socket, null);
            }
            catch(Exception eev)
            {
                //int x = 0;
                return null;
            }
            finally
            {
                socket?.Dispose();
            }
        }

       

        private void WriteConnectRequest(IBufferWriter<byte> writer, EndPoint targetEndPoint, string? authHeader)
        {
            var target = FormatEndPoint(targetEndPoint);
            var request = new StringBuilder()
                .Append($"CONNECT {target} HTTP/1.1\r\n")
                .Append($"Host: {target}\r\n")
                .Append($"Proxy-Connection: Keep-Alive\r\n");

            if (!string.IsNullOrEmpty(authHeader))
            {
                request.Append(authHeader);
            }
            request.Append("\r\n");
            
            string rqs = request.ToString();
            //if (rqs.IndexOf("myip") > 0)
            //{
            //    int xx = 0;
            //}
            //Debug.WriteLine("WriteConnectRequest :::" +rqs);
            var bytes = Encoding.ASCII.GetBytes(rqs);
            writer.Write(bytes);
        }

        private async Task SendConnectRequestAsync(IDuplexPipe pipe, EndPoint targetEndPoint, CancellationToken ct)
        {
            var writer = pipe.Output;
            WriteConnectRequest(writer, targetEndPoint, _authHeader); // 分步发送时不带认证
            await writer.FlushAsync(ct);

            // 如果需要认证则追加发送
            //（实际实现需要更复杂的交互，此处为示例简化）
        }

        private async Task<bool> VerifyResponseAsync(PipeReader reader, CancellationToken ct)
        {
            const int maxHeaderSize = 8192;
            var response = await ReadHttpResponseAsync(reader, ct, maxHeaderSize);
            Console.WriteLine("[DEBUG] Proxy Response:\n" + response); // 添加响应日志

            var statusLine = response.Split('\n')[0];
            var statusParts = statusLine.Split(' ');
            if (statusParts.Length < 2)
            {
                Console.WriteLine("Invalid status line: " + statusLine);
                return false;
            }

            if (!int.TryParse(statusParts[1], out var statusCode))
            {
                Console.WriteLine("Invalid status code: " + statusParts[1]);
                return false;
            }

            Console.WriteLine("Received status code: " + statusCode);
            return statusCode >= 200 && statusCode < 300;
        }
        private async Task<string> ReadHttpResponseAsync(
    PipeReader reader,
    CancellationToken ct,
    int maxHeaderSize)
        {

            var headerBuffer = new byte[maxHeaderSize];
            var bytesRead = 0;

            while (bytesRead < maxHeaderSize)
            {
                var result = await reader.ReadAsync(ct);
                var buffer = result.Buffer;

                foreach (var segment in buffer)
                {
                    var length = Math.Min(segment.Length, maxHeaderSize - bytesRead);
                    segment.Slice(0, length).Span.CopyTo(headerBuffer.AsSpan(bytesRead, length));
                    bytesRead += length;

                    if (bytesRead >= 4 && // 检测 \r\n\r\n
                        headerBuffer[bytesRead - 4] == '\r' &&
                        headerBuffer[bytesRead - 3] == '\n' &&
                        headerBuffer[bytesRead - 2] == '\r' &&
                        headerBuffer[bytesRead - 1] == '\n')
                    {
                        // 保留后续数据到管道
                        var consumed = buffer.GetPosition(length - 4); // 保留最后4字节
                        var remaining = buffer.Slice(consumed);
                        reader.AdvanceTo(consumed, buffer.End);

                        return Encoding.ASCII.GetString(headerBuffer, 0, bytesRead);
                    }
                }

                reader.AdvanceTo(buffer.End);
            }
            throw new InvalidOperationException("Header too large");
        }

        private async Task<string?> ReadResponseAsync(PipeReader reader, CancellationToken ct)
        {
            var headerEnd = false;
            var responseBuilder = new StringBuilder(256);

            while (!headerEnd)
            {
                var result = await reader.ReadAsync(ct);
                var buffer = result.Buffer;

                // 查找header结束标记（\r\n\r\n）
                var headerEndPosition = buffer.PositionOf((byte)'\n');
                if (headerEndPosition == null)
                {
                    reader.AdvanceTo(buffer.Start, buffer.End);
                    continue;
                }

                // 分割缓冲区
                var headerBuffer = buffer.Slice(0, headerEndPosition.Value);
                //var headerSpan = headerBuffer.ToSpan();
                var headerArray = headerBuffer.ToArray();
                var headerString = Encoding.ASCII.GetString(headerArray);

                // 转换为ASCII字符串
                //var headerString = Encoding.ASCII.GetString(headerSpan);
                responseBuilder.AppendLine(headerString.Trim());

                // 检查是否到达header结束位置
                var nextPosition = buffer.GetPosition(1, headerEndPosition.Value);
                reader.AdvanceTo(nextPosition);

                // 简单验证（实际需要完整解析HTTP头）
                if (headerString.StartsWith("HTTP/1.") || headerString.Length == 0)
                {
                    headerEnd = true;
                }
            }

            return responseBuilder.ToString();
        }

        private string FormatEndPoint(EndPoint endPoint)
        {
            return endPoint switch
            {
                IPEndPoint ip => $"{ip.Address}:{ip.Port}",
                DnsEndPoint dns => $"{dns.Host}:{dns.Port}",
                _ => throw new NotSupportedException("Unsupported endpoint type")
            };
        }
    }
}
