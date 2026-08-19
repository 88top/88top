#region copyright
/**
// --------------------------------------------------------------------------------
// 文件名：YHttp.cs
// 作者：刹那 https://x.com/chanawudi
// 公司：https://x.com/chanawudi
// 更新日期：2025，2，27，13:54
// 版权所有 © Your Company. 保留所有权利。
// --------------------------------------------------------------------------------
*/
#endregion
using Newtonsoft.Json.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;

namespace XChrome.cs.tools.YTools
{
    public class YHttp
    {
        private string method = "get";
        private string url = "";
        private string postdata = "";
        private List<KeyValuePair<string, string>> post_formdata=null;
        private Dictionary<string, string> headers1 = new Dictionary<string, string>();
        private Dictionary<string, string> cookies1 = new Dictionary<string, string>();
        private string proxy = "";
        private int retry_time = 2500;
        private int retry_number = 5;
        private Func<string, int> waitJsonErrorAction;
        private string contentType = "application/json";
        private string lastHtml = "";
        private int lastStatusCode;
        private string lastReasonPhrase;
        private HttpRequestMessage? lastRequestMessage;
        private HttpResponseMessage? lastResponse;
        private bool set_CookieToCookie=false;
        public string Remark = "";//随便的注释
        private Action<string>? ThisLoger = null;
        private void LogText(string str)
        {
            if (ThisLoger != null)
            {
                ThisLoger(str);
            }
            else
            {
                YToolConfig._loger(str);
            }
        }

        public string LastHtml() { return lastHtml; }
        public void Set_CookieToCookie(bool set_CookieToCookie) { this.set_CookieToCookie = set_CookieToCookie; }
        public int LastStatusCode() { return lastStatusCode; }
        public string LastReasonPhrase() { return lastReasonPhrase; }
        public HttpRequestMessage? LastRequestMessage() { return lastRequestMessage; }
        public void Loger(Action<string> loger)
        {
            this.ThisLoger = loger;
        }
        public HttpResponseMessage? LastResponse() { return lastResponse; }
        public YHttp ContentType(string contentType) { if (contentType == "") { this.contentType = "application/json"; } else { this.contentType = contentType; } return this; }
        public YHttp Get() { method = "get"; return this; }
        public YHttp Post(string post) { method = "post"; postdata = post; return this; }

        public YHttp PostFormdata(List<KeyValuePair<string, string>> ll) { method = "post"; post_formdata =ll; return this; }

        public YHttp PostFormdata(string str) { 
            var l=str.Split("&");
            List<KeyValuePair<string, string>> ll = new List<KeyValuePair<string, string>>();
            foreach(var o in l)
            {
                var g = o.Split("=");
                KeyValuePair<string, string> kp = new KeyValuePair<string, string>( g[0], g[1] );
                ll.Add(kp);
            }
            return PostFormdata(ll);
            }

        public void DebugLastRequest()
        {
            LogText(lastStatusCode.ToString());
            LogText(lastReasonPhrase.ToString());
            LogText(lastHtml);
        }
        public YHttp Url(string url) { this.url = url;return this; }

        public YHttp Proxy(string proxy) { this.proxy = proxy;return this; }
        public string Proxy() { return proxy; }

        public YHttp Headers(Dictionary<string,string> headers) { this.headers1 = headers;return this; }
        
        public Dictionary<string, string> Headers() { return headers1; }

        public YHttp Cookies(Dictionary<string,string> cookies) { this.cookies1 = cookies;return this; }
        public Dictionary<string, string> Cookies() { return this.cookies1; }

        /// <summary>
        /// 针对 GetAsync_WaitJson 方法设定的重试间隔 默认2500
        /// </summary>
        /// <param name="retry_time"></param>
        /// <returns></returns>
        public YHttp Retry_time(int retry_time) { this.retry_time = retry_time;return this; }
        /// <summary>
        /// 针对 GetAsync_WaitJson 方法设定的重试次数 默认5
        /// </summary>
        /// <param name="retry_number"></param>
        /// <returns></returns>
        public YHttp Retry_number(int retry_number) { this.retry_number = retry_number; return this; }

        /// <summary>
        /// 正对GetAsync_WaitJson 方法，对于某些特殊的返回内容，进行外部处理，
        /// 传入的是 html返回； 返回的是毫秒时间，告诉系统接下来需要等待时间
        /// 一般用于返回内容包含了等待时间，比如请求太频繁，要自定义处理
        /// </summary>
        /// <param name="waitJsonErrorAction"></param>
        /// <returns></returns>
        public YHttp WaitJsonErrorFun(Func<string,int> waitJsonErrorAction) { this.waitJsonErrorAction = waitJsonErrorAction; return this; }
        /// <summary>
        /// 获得内容，如果错误按[err]开头
        /// </summary>
        /// <returns></returns>
        public async Task<string> GetAsync_String(int timeout=-1)
        {
            //是否绕盾
            bool isja3 = false;
            //如果绕盾，就不需要proxy，需要射到head中
            var p = isja3?null: GetWebProxy(proxy);

            //string ss = Newtonsoft.Json.JsonConvert.SerializeObject(GetWebProxy(proxy));

            HttpClientHandler httpClientHandler=(p==null)? new HttpClientHandler(): new HttpClientHandler() { Proxy = p };
           

            httpClientHandler.AllowAutoRedirect = true;

            //httpClientHandler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
            //// 忽略证书验证错误
            //httpClientHandler.ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true;

            //// 指定允许的 TLS 版本
            // httpClientHandler.SslProtocols = System.Security.Authentication.SslProtocols.Tls13 | System.Security.Authentication.SslProtocols.Tls12 | System.Security.Authentication.SslProtocols.Tls11 | System.Security.Authentication.SslProtocols.Tls;

            //// 指定允许的加密套件
            //// 可根据需要设置具体的加密套件列表
            //httpClientHandler.SslProtocols = new[] { "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384" };


            CookieContainer cookieContainer = new CookieContainer();
            //加cookies
            if (cookies1 != null)
            {
                httpClientHandler.CookieContainer = cookieContainer;
                foreach (var k in cookies1.Keys)
                {
                    try
                    {
                        cookieContainer.Add(new Uri(url), new Cookie(k, cookies1[k]));
                    }catch(Exception ev) { }
                    
                }
            }

            try
            {
                //cs.Loger.Info("1");
                using (var httpClient = new HttpClient(httpClientHandler))
                {
                    if (timeout != -1)
                    {
                        httpClient.Timeout = TimeSpan.FromMilliseconds(timeout);
                    }
                   // cs.Loger.Info("2");
                    string _thisurl = url;
                    headers1?.RemoveIfHas("_gourl");
                    headers1?.RemoveIfHas("_doproxy");
                    //cs.Loger.Info("3");
                    
                    //cs.Loger.Info("4");


                    if (headers1 != null)
                    {
                        foreach (var v in headers1)
                        {
                           httpClient.DefaultRequestHeaders.Add(v.Key, v.Value);
                        }
                    }
                   // cs.Loger.Info("5");
                    //默认这个
                    string contentType = this.contentType;
                    httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue(contentType));

                    //cs.Loger.Info("6");
                    HttpResponseMessage? response = null;
                    if (method == "get")
                    {
                        response = await httpClient.GetAsync(_thisurl);
                    }else if (method == "post")
                    {
                        if (post_formdata == null)
                        {
                            var content = new StringContent(postdata, Encoding.UTF8, "application/json");
                            response = await httpClient.PostAsync(_thisurl, content);
                        }
                        else
                        {
                            var content = new FormUrlEncodedContent(post_formdata);
                            response = await httpClient.PostAsync(_thisurl, content);
                        }
                       
                    }
                    //cs.Loger.Info("7");


                    //cs.Loger.Info(cookies1!=null?cookies1.Count.ToString():"...");
                    if (cookies1 != null)
                    {
                        //cs.Loger.Info("77");
                        List<Cookie> var = cookieContainer.GetCookies(new Uri(_thisurl)).Cast<Cookie>().ToList();
                        
                        
                        //cs.Loger.Info("777");
                        //try
                        //{
                            foreach (var v in var)
                            {
                                //cs.Loger.Info(v.Name);
                                //cs.Loger.Info(v.Value);
                                if (!cookies1.ContainsKey(v.Name))
                                {
                                    //cs.Loger.Info("77711");
                                    cookies1.Add(v.Name, v.Value);
                                }
                                else
                                {
                                    //cs.Loger.Info("77722");
                                    cookies1[v.Name] = v.Value;
                                }
                            }
                        //}
                        //catch (Exception eee)
                        //{
                        //    cs.Loger.Info("777vv " + eee.Message);
                        //}
                        
                    }
                    //cs.Loger.Info("8");
                    lastResponse =response;
                    if (response == null) return "";
                    lastStatusCode = ((int)response.StatusCode);
                    lastReasonPhrase = response.ReasonPhrase??"";
                    lastRequestMessage = response.RequestMessage ?? null;
                    //cs.Loger.Info("9");
                    if (set_CookieToCookie && cookies1!=null)
                    {
                        if (response.Headers.TryGetValues("Set-Cookie", out var cc))
                        {
                            foreach (var c in cc)
                            {
                                string[] v = c.Split(";");
                                foreach (var o in v)
                                {
                                    string[] pp = o.Split("=");
                                    if (pp.Length == 2)
                                        cookies1.AddOrSetValue(pp[0].Trim(), pp[1].Trim());
                                }
                                //Console.WriteLine("Set-Cookie: " + c);
                            }


                        }
                    }
                    //cs.Loger.Info("10");


                    if (!response.IsSuccessStatusCode)
                    {
                        string s1 = await response.Content.ReadAsStringAsync();
                        if (!string.IsNullOrEmpty(s1))
                        {
                            lastHtml = s1;
                            return s1;
                        }
                        lastHtml = "";
                        return "[err]" + ((int)response.StatusCode)+" | "+response.ReasonPhrase;
                    }
                    //cs.Loger.Info("11");
                    string s = await response.Content.ReadAsStringAsync();
                    //cs.Loger.Info("12");
                    lastHtml = s;
                    return s;
                }
            }catch(Exception ev)
            {
                
                lastHtml = "[err]" + ev.Message;
                return "[err]" + ev.Message;
            }
        }

        

        /// <summary>
        /// 等待返回，等待json里面某个参数的值
        /// </summary>
        /// <param name="JsonParmName">参数名字</param>
        /// <param name="JsonParmValue">值，可以为null</param>
        /// <returns></returns>
        public async Task<JObject?> GetAsync_WaitJson(string JsonParmName,string? JsonParmValue=null)
        {
            //string v =await GetAsync_String();
            JObject? jobj = null;
            int retnumber = 0;
            while (true)
            {
                if (retnumber >= retry_number)
                {
                    LogText("超过重试次数 " + retry_number);
                    LogText("放弃");
                    break;
                }
                string ss =await GetAsync_String();
                if (ss.StartsWith("[err]"))
                {
                    LogText("发生错误1：" + ss);
                    LogText("等待重试：");
                    await Task.Delay(retry_time);
                    retnumber++;
                    continue;
                }
                JObject jj = ConventToJobject(ss);
                if (jj == null)
                {
                    LogText("发生错误1：" + ss);
                    LogText("等待重试：");
                    await Task.Delay(retry_time);
                    retnumber++;
                    continue;
                }
                bool err2 = false;
                if (JsonParmValue == null)
                {
                    if (jj[JsonParmName] == null)
                    {
                        err2 = true;
                    }
                }
                else
                {
                    if (jj[JsonParmName] == null || jj[JsonParmName].ToString() != JsonParmValue)
                    {
                        err2 = true;
                    }
                }
                if (err2)
                {
                    LogText("发生错误2：" + ss);
                    LogText("等待重试：");
                    if (waitJsonErrorAction != null)
                    {
                        int xx=waitJsonErrorAction(ss);
                        if (xx != 0)
                        {
                            LogText("等待：" + xx);
                            await Task.Delay(xx);
                        }
                        else
                        {
                            await Task.Delay(retry_time);
                        }
                        
                    }
                    else
                    {
                        await Task.Delay(retry_time);
                    }
                    
                   

                    retnumber++;
                    continue;
                }


                jobj = jj;
                break;
            }
            return jobj;
        }


        //public async Task<JObject?> GetAsync_WaitJson(Func<Task<string>> getstringFun, string JsonParmName, string? JsonParmValue = null)
        //{
        //    //string v =await GetAsync_String();
        //    JObject jobj = null;
        //    int retnumber = 0;
        //    while (true)
        //    {
        //        if (retnumber >= retry_number)
        //        {
        //            LogText("超过重试次数 " + retry_number);
        //            LogText("放弃");
        //            break;
        //        }
        //        string ss = await getstringFun();
        //        if (ss.StartsWith("[err]"))
        //        {
        //            LogText("发生错误1：" + ss);
        //            LogText("等待重试：");
        //            await Task.Delay(retry_time);
        //            retnumber++;
        //            continue;
        //        }
        //        JObject jj = ConventToJobject(ss);
        //        if (jj == null)
        //        {
        //            LogText("发生错误1：" + ss);
        //            LogText("等待重试：");
        //            await Task.Delay(retry_time);
        //            retnumber++;
        //            continue;
        //        }
        //        bool err2 = false;
        //        if (JsonParmValue == null)
        //        {
        //            if (jj[JsonParmName] == null)
        //            {
        //                err2 = true;
        //            }
        //        }
        //        else
        //        {
        //            if (jj[JsonParmName] == null || jj[JsonParmName].ToString() != JsonParmValue)
        //            {
        //                err2 = true;
        //            }
        //        }
        //        if (err2)
        //        {
        //            LogText("发生错误2：" + ss);
        //            LogText("等待重试：");
        //            if (waitJsonErrorAction != null)
        //            {
        //                int xx = waitJsonErrorAction(ss);
        //                if (xx != 0)
        //                {
        //                    LogText("等待：" + xx);
        //                    await Task.Delay(xx);
        //                }
        //                else
        //                {
        //                    await Task.Delay(retry_time);
        //                }

        //            }
        //            else
        //            {
        //                await Task.Delay(retry_time);
        //            }



        //            retnumber++;
        //            continue;
        //        }


        //        jobj = jj;
        //        break;
        //    }
        //    return jobj;
        //}



        private WebProxy? GetWebProxy(string proxy)
        {
            if (proxy == "") return null;
            proxy = proxy.Trim();
            if (proxy.StartsWith("http:"))
            {
                proxy = proxy.Replace("http://", "");
            }
            if (proxy.StartsWith("socks5:"))
            {
                proxy = proxy.Replace("socks5:", "socks5_");
            }
            //string[] pl = proxy.Split(new char[] { ':' });
            string[] pl = proxy.Split(new char[] { ':', '：' });
            if (pl.Length == 2)
            {
                var p = new WebProxy(pl[0].Replace(" ", "") + ":" + pl[1].Replace(" ", ""));
                return p;
            }
            else
            {
                var p = new WebProxy(pl[0].Trim().Replace("socks5_", "socks5:") + ":" + pl[1].Trim());
                p.Credentials = new NetworkCredential(pl[2].Trim(), pl[3].Trim());
                return p;
            }
        }

      


        private JObject ConventToJobject(string html)
        {
            JObject j = null;
            try
            {
                j = Newtonsoft.Json.JsonConvert.DeserializeObject<JObject>(html) as JObject;
            }
            catch (Exception ev)
            {
                //Loger.Info(ev.Message);
                //Loger.Info(html);
                j = null;
            }
            return j;
        }


        /// <summary>
        /// 注意这个拷贝不会拷贝返回的html等数据，只会相当于把这个环境拷贝一份
        /// </summary>
        /// <returns></returns>
        public YHttp DeepCopy()
        {
            var h = new YHttp();
            h.method = method;
            h.url = url;    
            h.postdata  = postdata;
            h.proxy = proxy;
            h.retry_number = retry_number;
            h.retry_number=retry_number;
            h.set_CookieToCookie = set_CookieToCookie;
            h.Remark=Remark;
            h.contentType = contentType;
            h.waitJsonErrorAction = waitJsonErrorAction;
            if (post_formdata != null)
                h.post_formdata = Newtonsoft.Json.JsonConvert.DeserializeObject<List<KeyValuePair<string, string>>>(
                    Newtonsoft.Json.JsonConvert.SerializeObject(post_formdata)
                    );

            if (headers1 != null)
                h.headers1 = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, string>>(
                    Newtonsoft.Json.JsonConvert.SerializeObject(headers1)
                    );
            if (cookies1 != null)
                h.cookies1 = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, string>>(
                    Newtonsoft.Json.JsonConvert.SerializeObject(cookies1)
                    );

            return h;

        }

        public static void test()
        {
            new YHttp().Get().Url("https://www.baidu.com");
        }
    }
}
