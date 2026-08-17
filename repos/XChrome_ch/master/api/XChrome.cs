using Microsoft.Playwright;
using Pipelines.Sockets.Unofficial.Arenas;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;
using XChrome.cs.db;
using XChrome.cs;

namespace XChrome.api
{
    public class XChrome
    {
        /// <summary>
        /// 批量创建环境
        /// </summary>
        /// <param name="number"></param>
        /// <param name="groupId"></param>
        /// <param name="titlePrefix"></param>
        /// <param name="titleEndfixStartId"></param>
        /// <param name="randomUserAgent"></param>
        /// <param name="randomEnv"></param>
        /// <returns></returns>
        public static async Task<List<long>> CreateXChrome(
            int number,long groupId, string titlePrefix="新建环境",int titleEndfixStartId=0,string remark="", bool randomUserAgent=true,bool randomEnv=true)
        {
            var list = new List<long>();
            for (int i = 0; i < number; i++) {
                int hz = titleEndfixStartId + i;
                string name = titlePrefix + hz;

                string ua = randomUserAgent?GenerateRandomChromeUserAgent():"";
                string envs =randomEnv? Newtonsoft.Json.JsonConvert.SerializeObject(GenerateRandomEnvironment()): "{}";

                Chrome c = new Chrome();
                c.name = name;
                c.userAgent = ua;
                c.proxy = "";
                c.proxyText = "";
                c.groupId = groupId;
                c.createDate = DateTime.Now;
                c.doDate = DateTime.Now;
                c.cookie = "";
                c.remark = remark;
                c.tags = "";
                c.envs = envs;
                c.datapath = "";

                long retId = 0;
                var db = MyDb.DB;
                try
                {
                    retId = await db.Insertable<Chrome>(c).ExecuteReturnBigIdentityAsync();
                }
                catch (Exception ev)
                {
                    
                }
                db.Close();
                list.Add(retId);
                await Task.Delay(200);
            }
            return list;
        }

        private static string GenerateRandomChromeUserAgent()
        {
            var random = new Random();
            // os
            var os = EnvironmentManager.Get_Os();
            var osstr = os.Keys.ToList()[random.Next(os.Keys.Count)];
            string osshow = os[osstr];
            // major：Chrome 主版本号，范围设定在 90 到 115 之间
            int major = random.Next(108, 120); // 随机范围 [90,115]
            // build：生成一个构建号，例如 4000 到 5999
            int build = random.Next(4000, 6000);
            // patch：生成一个补丁版本号，例如 10 到 149
            int patch = random.Next(10, 150);

            // 构造 Chrome 版本号，可以固定 minor 版本为 0
            string chromeVersion = $"{major}.0.{build}.{patch}";
            // 组装 User-Agent 字符串
            string userAgent = $"Mozilla/5.0 ({osstr}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chromeVersion} Safari/537.36";
            return userAgent;
        }

        private static Dictionary<string, object> GenerateRandomEnvironment()
        {
            var random = new Random();
            var environments = new Dictionary<string, object>();



            // 2. 随机区域语言 Locale
            var locales = EnvironmentManager.Get_locales();
            var locale = locales.Keys.ToList()[random.Next(locales.Keys.Count)];


            // 3. 随机时区 TimezoneId
            var timezones = EnvironmentManager.Get_timezones();
            var timezoneId = timezones.Keys.ToList()[random.Next(timezones.Count)];

            // 4. 随机视口尺寸（宽度：800-1920, 高度：600-1080）
            var fbl = EnvironmentManager.Get_resolution();
            var fb = fbl[fbl.Keys.ToList()[random.Next(fbl.Count)]];
            var fbll = fb.Split('x');
            var viewport = new Dictionary<string, int>
            {
                { "width", Convert.ToInt32(fbll[0]) },
                { "height", Convert.ToInt32(fbll[1]) }
            };


            // 6. 随机是否为移动设备 isMobile 和是否支持触摸 hasTouch
            bool isMobile = random.Next(2) == 0; // 50% 概率
                                                 // 如果是移动设备，则一般支持触摸
            bool hasTouch = isMobile || (random.Next(2) == 0);

            // 7. 根据 Locale 随机生成 Accept-Language HTTP header
            string acceptLanguage = EnvironmentManager.GetAcceptLanguageFromLocales(locale);
            var extraHTTPHeaders = new Dictionary<string, string>
            {
                { "Accept-Language", acceptLanguage }
            };

            // 8. 随机地理位置（使用一组常见城市的坐标）

            var geolocations = EnvironmentManager.Get_locations();
            var geo = geolocations.Keys.ToList()[random.Next(geolocations.Count)];
            var geos = geo.Split(",");
            var geolocation = new Dictionary<string, double>
            {
                { "Latitude", Convert.ToDouble(geos[0]) },
                { "Longitude", Convert.ToDouble(geos[1])  }
            };

            // 将所有配置参数放入字典
            environments["Locale"] = locale;
            environments["TimezoneId"] = timezoneId;
            environments["ViewportSize"] = viewport;
            //environments["DeviceScaleFactor"] = deviceScaleFactor;
            environments["IsMobile"] = isMobile;
            environments["HasTouch"] = hasTouch;
            environments["ExtraHTTPHeaders"] = extraHTTPHeaders;
            environments["Geolocation"] = geolocation;

            return environments;
        }
    }
}
