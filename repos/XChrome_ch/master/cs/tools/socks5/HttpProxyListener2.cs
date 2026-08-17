using System;
using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using XChrome.cs.tools.socks5;

namespace HttpToSocks5Proxy
{
    internal class HttpProxyListener2
    {
        private readonly IPEndPoint _endPoint;
        private readonly int _backlog;

        private string? _authorization;
        private string? _username = "";
        ITunnelFactory _tunnel;

        public HttpProxyListener2(IPEndPoint endPoint, int backlog, ITunnelFactory _tunnel)
        { 
            this._tunnel = _tunnel;
            _endPoint = endPoint ?? throw new ArgumentNullException(nameof(endPoint));
            _backlog = backlog;
        }



        public async Task RunAsync(CancellationToken cancellationToken = default)
        {
            var socket = new Socket(SocketType.Stream, ProtocolType.Tcp);
            if (_endPoint.AddressFamily == AddressFamily.InterNetworkV6)
            {
                socket.DualMode = true;
            }
            socket.Bind(_endPoint);
            socket.Listen(_backlog);
            _ = Task.Run(async () =>
            {
                using (cancellationToken.UnsafeRegister(s => { ((IDisposable)s!).Dispose(); }, socket))
                {
                    while (!cancellationToken.IsCancellationRequested)
                    {
                        if (Socks5Server._isStop) break;
                        Socket incoming = await socket.AcceptAsync();
                        _ = Task.Run(() => ProcessSocketAsync(incoming, cancellationToken));
                    }
                    //Debug.WriteLine("HttpProxyListener2=====>close");

                }
               // Debug.WriteLine("HttpProxyListener2=====>close2");
            });
            //Debug.WriteLine("HttpProxyListener2=====>close3");
        }

        private async Task ProcessSocketAsync(Socket socket, CancellationToken cancellationToken)
        {
            if (XChrome.cs.Config.isZChrome)
            {
                using (var ns = new NetworkStream(socket, ownsSocket: true))
                {
                    var processor = new HttpProxyProcessor2(ns, _tunnel);
                    if (!(_authorization is null))
                    {
                        processor.SetCredential(_authorization);
                    }
                    try
                    {
                        await processor.RunAsync(cancellationToken);
                    }
                    catch (Exception)
                    {
                        // Ignore
                    }

                }
                return;
            }
            
           
        }
    }
}
