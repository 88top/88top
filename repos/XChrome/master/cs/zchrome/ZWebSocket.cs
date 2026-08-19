using System;
using System.Diagnostics;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace XChrome.cs.zchrome
{
    /// <summary>
    /// 一个基于 ClientWebSocket 封装的健壮 WebSocket 客户端库。
    /// 提供连接状态反馈、线程安全的消息发送、订阅式消息接收以及断线重连功能。
    /// </summary>
    public class ZWebSocket : IDisposable
    {
        private ClientWebSocket _client;
        private CancellationTokenSource _cts;
        private readonly SemaphoreSlim _sendLock = new SemaphoreSlim(1, 1);
        private Uri _uri;
        private bool _manualDisconnect = false; // 标识是否为手动断开连接

        /// <summary>
        /// 是否开启自动重连功能，默认为 false
        /// </summary>
        public bool AutoReconnect { get; set; } = false;

        /// <summary>
        /// 自动重连的延迟时间，默认为 5 秒
        /// </summary>
        public TimeSpan ReconnectDelay { get; set; } = TimeSpan.FromSeconds(5);

        /// <summary>
        /// 连接成功事件
        /// </summary>
        public event Action Connected;

        /// <summary>
        /// 断开连接事件
        /// </summary>
        public event Action Disconnected;

        /// <summary>
        /// 错误事件
        /// </summary>
        public event Action<Exception> Error;

        /// <summary>
        /// 接收到消息事件，消息以字符串形式传递
        /// </summary>
        public event Action<string> MessageReceived;

        public ZWebSocket()
        {
            _client = new ClientWebSocket();
            _cts = new CancellationTokenSource();
        }

        /// <summary>
        /// 异步连接到指定的 WebSocket 服务端
        /// </summary>
        /// <param name="uri">WebSocket 服务端地址</param>
        /// <returns></returns>
        public async Task ConnectAsync(Uri uri)
        {
            _uri = uri;
            _manualDisconnect = false; // 每次调用 ConnectAsync 都视为非手动断开

            Stopwatch sw = Stopwatch.StartNew();

            // 如果以前的取消标记已触发，则重置
            if (_cts.IsCancellationRequested)
            {
                _cts.Dispose();
                _cts = new CancellationTokenSource();
            }
            Debug.WriteLine("socket1：" + sw.ElapsedMilliseconds + " 毫秒");
            sw.Restart();
            // 重新创建WebSocket实例
            _client?.Dispose();
            _client = new ClientWebSocket();

           
            Debug.WriteLine("socket2：" + sw.ElapsedMilliseconds + " 毫秒");
            sw.Restart();
            try
            {
                await _client.ConnectAsync(uri, _cts.Token);
                
                Debug.WriteLine("socket3：" + sw.ElapsedMilliseconds + " 毫秒");
                sw.Restart();
                OnConnected();

                Debug.WriteLine("socket4：" + sw.ElapsedMilliseconds + " 毫秒");
                sw.Restart();

                // 启动后台接收消息的循环
                _ = Task.Run(ReceiveLoop);

                Debug.WriteLine("socket5：" + sw.ElapsedMilliseconds + " 毫秒");
                sw.Restart();
            }
            catch (Exception ex)
            {
                OnError(ex);
                // 如果开启自动重连且不是手动断开，则尝试重连
                if (AutoReconnect && !_manualDisconnect)
                {
                    await ReconnectAsync();
                }
            }
        }

        /// <summary>
        /// 异步发送文本消息到服务端，确保线程安全
        /// </summary>
        /// <param name="message">要发送的文本消息</param>
        /// <returns></returns>
        public async Task SendMessageAsync(string message)
        {
            if (_client.State != WebSocketState.Open)
            {
                OnError(new InvalidOperationException("WebSocket 连接未打开。"));
                return;
            }

            await _sendLock.WaitAsync();
            try
            {
                byte[] encoded = Encoding.UTF8.GetBytes(message);
                var segment = new ArraySegment<byte>(encoded);
                await _client.SendAsync(segment, WebSocketMessageType.Text, true, _cts.Token);
            }
            catch (Exception ex)
            {
                OnError(ex);
            }
            finally
            {
                _sendLock.Release();
            }
        }

        /// <summary>
        /// 接收消息的后台循环
        /// </summary>
        /// <returns></returns>
        private async Task ReceiveLoop()
        {
            var buffer = new byte[4096];

            while (!_cts.IsCancellationRequested && _client.State == WebSocketState.Open)
            {
                try
                {
                    var seg = new ArraySegment<byte>(buffer);
                    WebSocketReceiveResult result = await _client.ReceiveAsync(seg, _cts.Token);

                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        // 收到关闭消息后，先发送关闭确认
                        await _client.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                        OnDisconnected();

                        // 如果自动重连并且不是手动断开，则进行重连
                        if (AutoReconnect && !_manualDisconnect)
                        {
                            await ReconnectAsync();
                        }
                        break;
                    }
                    else
                    {
                        string message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        // 在独立 Task 中处理收到的消息，并抓取可能的异常
                        _ = Task.Run(() =>
                        {
                            try
                            {
                                OnMessageReceived(message);
                            }
                            catch (Exception ex)
                            {
                                OnError(ex);
                            }
                        });
                    }
                }
                catch (OperationCanceledException)
                {
                    // 正常取消时退出循环
                    break;
                }
                catch (Exception ex)
                {
                    OnError(ex);

                    // 如果自动重连开启且不是手动断开，则进行重连
                    if (AutoReconnect && !_manualDisconnect)
                    {
                        await ReconnectAsync();
                    }
                    break;
                }
            }
        }

        /// <summary>
        /// 手动断开连接的异步方法，断开后自动重连功能不会触发
        /// </summary>
        /// <returns></returns>
        public async Task DisconnectAsync()
        {
            _manualDisconnect = true; // 标记为手动断开，不进行自动重连

            if (_client.State == WebSocketState.Open || _client.State == WebSocketState.CloseReceived)
            {
                _cts.Cancel();
                try
                {
                    await _client.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                }
                catch (Exception ex)
                {
                    OnError(ex);
                }
                finally
                {
                    OnDisconnected();
                }
            }
        }

        /// <summary>
        /// 自动重连逻辑
        /// </summary>
        /// <returns></returns>
        private async Task ReconnectAsync()
        {
            // 等待预设的重连延时时间
            await Task.Delay(ReconnectDelay);

            // 若在等待期间被设置为手动断开，则退出重连逻辑
            if (_manualDisconnect)
                return;

            // 重新创建WebSocket实例
            _client?.Dispose();
            _client = new ClientWebSocket();

            // 如果以前的取消标记已触发，则重置
            if (_cts.IsCancellationRequested)
            {
                _cts.Dispose();
                _cts = new CancellationTokenSource();
            }

            try
            {
                await _client.ConnectAsync(_uri, _cts.Token);
                OnConnected();
                // 重连成功后，重新开启接收消息循环
                _ = Task.Run(ReceiveLoop);
            }
            catch (Exception ex)
            {
                OnError(ex);
                // 如果重连失败且自动重连仍开启，则继续尝试重连
                if (AutoReconnect && !_manualDisconnect)
                {
                    await ReconnectAsync();
                }
            }
        }

        /// <summary>
        /// 触发连接成功事件
        /// </summary>
        protected virtual void OnConnected() => Connected?.Invoke();

        /// <summary>
        /// 触发断开连接事件
        /// </summary>
        protected virtual void OnDisconnected() => Disconnected?.Invoke();

        /// <summary>
        /// 触发错误事件
        /// </summary>
        /// <param name="ex">异常</param>
        protected virtual void OnError(Exception ex) => Error?.Invoke(ex);

        /// <summary>
        /// 触发消息接收事件
        /// </summary>
        /// <param name="message">消息字符串</param>
        protected virtual void OnMessageReceived(string message) => MessageReceived?.Invoke(message);

        public void Dispose()
        {
            _cts.Cancel();
            _client?.Dispose();
            _cts?.Dispose();
            _sendLock?.Dispose();
        }
    }
}