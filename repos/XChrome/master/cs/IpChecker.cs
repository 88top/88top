using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using XChrome.cs.tools.YTools;

namespace XChrome.cs
{
    
    /// <summary>
    /// 检测ip
    /// </summary>
    public class IpChecker 
    {
        private static int timeout = -1;
        public static async Task<(bool,string)> CheckAsync(ChecKUrl u,string proxy="")
        {


            switch (u)
            {
                case ChecKUrl.Ipip_net:
                    return await Check_ipip_net(proxy);
                case ChecKUrl.Ip_cn:
                    return await Check_ip_cn(proxy);
                case ChecKUrl.Vore_top:
                    return await Check_vore_top(proxy);
                case ChecKUrl.Ip_sb:
                    return await Check_ip_sb(proxy);
                case ChecKUrl.ip2location_io:
                    return await Check_ip2location_io(proxy);
                case ChecKUrl.ip__api_io:
                    return await Check_ip__api_io(proxy);
                case ChecKUrl.ipapi_co:
                    return await Check_ipapi_co(proxy);
                case ChecKUrl.api_ipapi_is:
                    return await Check_api_ipapi_is(proxy);
                default:
                    return (false,"没有查询接口了");
            }

        }

        /// <summary>
        /// myip.ipip.net
        /// </summary>
        /// <returns></returns>
        private static async Task<(bool,string)> Check_ipip_net(string proxy)
        {
            try
            {
                string x = await new YHttp().Get().Url("https://myip.ipip.net/").Proxy(proxy).GetAsync_String(timeout);
                x = x.Replace("\r\n", "\n").Replace("\n", "");
                if (x.IndexOf("来自于：") >= 0)
                {
                    string ss = x.Substring(x.IndexOf("来自于：") + 4);
                    return (true, ss);
                }
                return (false, x);
            }
            catch (Exception ee)
            {
                return (false,ee.Message);
            }
            
        }


        private static async Task<(bool,string)> Check_ip_cn(string proxy)
        {
            string url = "https://www.ip.cn/api/index?ip=&type=0";
            try
            {
                Dictionary<string, string> header = new Dictionary<string, string>();
                header.Add("user-agent", cs.tools.YTools.YUtils.GetRandomUserAgent(DateTime.Now.ToShortTimeString()));
                var http = new YHttp();
                http.Headers(header);
                var x = await http.Get().Url(url).Proxy(proxy).Retry_number(1).Retry_time(0).GetAsync_WaitJson("address");
                if (x == null)
                {
                    return (false, http.LastHtml());
                }
                return (true, x["address"]?.ToString() ?? x.ToString());
            }catch(Exception ev)
            {
                return (false, ev.Message); 
            }
        }

        private static async Task<(bool, string)> Check_vore_top(string proxy)
        {
            string url = "https://api.vore.top/api/IPdata";
            try
            {
                Dictionary<string, string> header = new Dictionary<string, string>();
                header.Add("user-agent", cs.tools.YTools.YUtils.GetRandomUserAgent(DateTime.Now.ToShortTimeString()));
                var http = new YHttp();
                http.Headers(header);
                var x = await http.Get().Url(url).Proxy(proxy).Retry_number(1).Retry_time(0).GetAsync_WaitJson("ipdata");
                if (x == null)
                {
                    return (false, http.LastHtml());
                }

                return (true, x["ipdata"]["info1"].ToString() + " " + x["ipdata"]["info2"].ToString());
            }
            catch (Exception ev)
            {
                return (false, ev.Message);
            }
        }

        private static async Task<(bool, string)> Check_ip_sb(string proxy)
        {
            string url = "https://api.ip.sb/geoip/";
            try
            {
                Dictionary<string, string> header = new Dictionary<string, string>();
                header.Add("user-agent", cs.tools.YTools.YUtils.GetRandomUserAgent(DateTime.Now.ToShortTimeString()));
                var http = new YHttp();
                http.Headers(header);
                var x = await http.Get().Url(url).Proxy(proxy).Retry_number(1).Retry_time(0).GetAsync_WaitJson("country");
                if (x == null)
                {
                    return (false, http.LastHtml());
                }

                return (true, (x["country"]?.ToString()??"-") + " " + (x["region"]?.ToString()??"-") + " " + (x["city"]?.ToString()??"-"));
            }
            catch (Exception ev)
            {
                return (false, ev.Message);
            }
        }


        private static async Task<(bool, string)> Check_ip2location_io(string proxy)
        {
            string url = "https://api.ip2location.io/";
            try
            {
                Dictionary<string, string> header = new Dictionary<string, string>();
                header.Add("user-agent", cs.tools.YTools.YUtils.GetRandomUserAgent(DateTime.Now.ToShortTimeString()));
                var http = new YHttp();
                http.Headers(header);
                var x = await http.Get().Url(url).Proxy(proxy).Retry_number(1).Retry_time(0).GetAsync_WaitJson("country_name");
                if (x == null)
                {
                    return (false, http.LastHtml());
                }

                return (true, (x["country_name"]?.ToString() ?? "-") + " " + (x["region_name"]?.ToString() ?? "-") + " " + (x["city_name"]?.ToString() ?? "-"));
            }
            catch (Exception ev)
            {
                return (false, ev.Message);
            }
        }


        private static async Task<(bool, string)> Check_ip__api_io(string proxy)
        {
            string url = "https://ip-api.io/json";
            try
            {
                Dictionary<string, string> header = new Dictionary<string, string>();
                header.Add("user-agent", cs.tools.YTools.YUtils.GetRandomUserAgent(DateTime.Now.ToShortTimeString()));
                var http = new YHttp();
                http.Headers(header);
                var x = await http.Get().Url(url).Proxy(proxy).Retry_number(1).Retry_time(0).GetAsync_WaitJson("countryName");
                if (x == null)
                {
                    return (false, http.LastHtml());
                }

                return (true, (x["countryName"]?.ToString() ?? "-") + " " + (x["regionName"]?.ToString() ?? "-") + " " + (x["city"]?.ToString() ?? "-"));
            }
            catch (Exception ev)
            {
                return (false, ev.Message);
            }
        }

        private static async Task<(bool, string)> Check_ipapi_co(string proxy)
        {
            string url = "https://ipapi.co/json/";
            try
            {
                Dictionary<string, string> header = new Dictionary<string, string>();
                header.Add("user-agent", cs.tools.YTools.YUtils.GetRandomUserAgent(DateTime.Now.ToShortTimeString()));
                var http = new YHttp();
                http.Headers(header);
                var x = await http.Get().Url(url).Proxy(proxy).Retry_number(1).Retry_time(0).GetAsync_WaitJson("country_name");
                if (x == null)
                {
                    return (false, http.LastHtml());
                }

                return (true, (x["country_name"]?.ToString() ?? "-") + " " + (x["region"]?.ToString() ?? "-") + " " + (x["city"]?.ToString() ?? "-"));
            }
            catch (Exception ev)
            {
                return (false, ev.Message);
            }
        }

        private static async Task<(bool, string)> Check_api_ipapi_is(string proxy)
        {
            string url = "https://ipapi.co/json";
            try
            {
                Dictionary<string, string> header = new Dictionary<string, string>();
                header.Add("user-agent", cs.tools.YTools.YUtils.GetRandomUserAgent(DateTime.Now.ToShortTimeString()));
                var http = new YHttp();
                http.Headers(header);
                var x = await http.Get().Url(url).Proxy(proxy).Retry_number(1).Retry_time(0).GetAsync_WaitJson("country_name");
                if (x == null)
                {
                    return (false, http.LastHtml());
                }

                return (true, (x["country_name"]?.ToString() ?? "-") + " " + (x["region"]?.ToString() ?? "-") + " " + (x["city"]?.ToString() ?? "-"));
            }
            catch (Exception ev)
            {
                return (false, ev.Message);
            }
        }

    }

    public enum ChecKUrl
    {
        Ipip_net,
        Ip_cn,
        Vore_top,
        Ip_sb,
        ip2location_io,
        ip__api_io,
        ipapi_co,
        api_ipapi_is

    }
}
