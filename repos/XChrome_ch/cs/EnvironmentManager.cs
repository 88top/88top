using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace XChrome.cs
{
    public class EnvironmentManager
    {
        public static Dictionary<string, string> Get_locales()
        {
            var locales = new Dictionary<string, string>
            {
                { "zh-CN", "中文" },
                { "en-US", "英语" },
                { "fr-FR", "法语" },
                { "es-ES", "西班牙语" },
                { "de-DE", "德语" },
                { "ja-JP", "日语" },
                { "ko-KR", "韩语" },
                { "it-IT", "意大利语" },
                { "pt-PT", "葡萄牙语" },
                { "ru-RU", "俄语" },
                { "ar-SA", "阿拉伯语" },
                { "hi-IN", "印地语" },
                { "nl-NL", "荷兰语" },
                { "sv-SE", "瑞典语" },
                { "no-NO", "挪威语" },
            };
            return locales;
        }

        public static Dictionary<string, string> Get_timezones()
        {
            var timezones = new Dictionary<string, string>
            {
                { "Asia/Shanghai", "(UTC+08:00) 北京" },
                { "Asia/Tokyo", "(UTC+09:00) 东京" },
                { "Australia/Darwin", "(UTC+09:30) 达尔文" },
                { "Australia/Sydney", "(UTC+10:00) 悉尼" },
                { "Pacific/Noumea", "(UTC+11:00) 努美阿" },
                { "Pacific/Auckland", "(UTC+12:00) 奥克兰" },
                { "Pacific/Tongatapu", "(UTC+13:00) 努库阿洛法" },
                { "Pacific/Kiritimati", "(UTC+14:00) 基里蒂马蒂" },
                { "Pacific/Midway", "(UTC-11:00) 中途岛" },
                { "Pacific/Honolulu", "(UTC-10:00) 檀香山" },
                { "America/Anchorage", "(UTC-09:00) 安克雷奇" },
                { "America/Los_Angeles", "(UTC-08:00) 洛杉矶" },
                { "America/Denver", "(UTC-07:00) 丹佛" },
                { "America/Chicago", "(UTC-06:00) 芝加哥" },
                { "America/New_York", "(UTC-05:00) 纽约" },
                { "America/Caracas", "(UTC-04:30) 加拉加斯" },
                { "America/Halifax", "(UTC-04:00) 哈利法克斯" },
                { "America/St_Johns", "(UTC-03:30) 圣约翰斯" },
                { "America/Argentina/Buenos_Aires", "(UTC-03:00) 布宜诺斯艾利斯" },
                { "America/Noronha", "(UTC-02:00) 诺罗尼亚" },
                { "Atlantic/Cape_Verde", "(UTC-01:00) 佛得角" },
                { "Europe/London", "(UTC+00:00) 伦敦" },
                { "Europe/Berlin", "(UTC+01:00) 柏林" },
                { "Europe/Athens", "(UTC+02:00) 雅典" },
                { "Europe/Moscow", "(UTC+03:00) 莫斯科" },
                { "Asia/Tehran", "(UTC+03:30) 德黑兰" },
                { "Asia/Dubai", "(UTC+04:00) 迪拜" },
                { "Asia/Kabul", "(UTC+04:30) 喀布尔" },
                { "Asia/Karachi", "(UTC+05:00) 卡拉奇" },
                { "Asia/Kolkata", "(UTC+05:30) 加尔各答" },
                { "Asia/Kathmandu", "(UTC+05:45) 加德满都" },
                { "Asia/Dhaka", "(UTC+06:00) 达卡" },
                { "Asia/Yangon", "(UTC+06:30) 仰光" },
                { "Asia/Bangkok", "(UTC+07:00) 曼谷" },
            };
            return timezones;
        }

        public static Dictionary<string, string> Get_resolution()
        {
            var resolution = new Dictionary<string, string>
            {
                { "640x480", "640x480" },
                { "800x600", "800x600" },
                { "1024x768", "1024x768" },
                { "1152x864", "1152x864" },
                { "1280x720", "1280x720" },
                { "1280x800", "1280x800" },
                { "1280x1024", "1280x1024" },
                { "1366x768", "1366x768" },
                { "1440x900", "1440x900" },
                { "1600x900", "1600x900" },
                { "1680x1050", "1680x1050" },
                { "1920x1080", "1920x1080" },
                { "1920x1200", "1920x1200" },
                { "2560x1080", "2560x1080" },
                { "2560x1440", "2560x1440" },
                { "2560x1600", "2560x1600" },
                { "3440x1440", "3440x1440" },
                { "3840x2160", "3840x2160" },
                { "4096x2160", "4096x2160" },
                { "5120x2880", "5120x2880" },
                { "7680x4320", "7680x4320" }
            };
            return resolution;
        }

        public static Dictionary<string, string> Get_isPhone()
        {
            var isp = new Dictionary<string, string>()
            {
                { "true", "是" },
                { "false", "否"}
            };
            return isp;
        }

        public static Dictionary<string, string> Get_isTouch()
        {
            var isp = new Dictionary<string, string>()
            {
                { "true", "是" },
                { "false", "否"}
            };
            return isp;
        }

        public static Dictionary<string, string> Get_locations()
        {
            var isp = new Dictionary<string, string>() {
                { "39.9042,116.4074", "北京" },
                { "31.2304,121.4737", "上海" },
                { "23.1291,113.2644", "广州" },
                { "22.5431,114.0579", "深圳" },
                { "22.3193,114.1694", "香港" },
                { "35.6895,139.6917", "东京" },
                { "1.3521,103.8198", "新加坡" },
                { "13.7563,100.5018", "曼谷" },
                { "28.6139,77.2090", "新德里" },
                { "19.0760,72.8777", "孟买" },
                { "30.0444,31.2357", "开罗" },
                { "41.0082,28.9784", "伊斯坦布尔" },
                { "51.5074,-0.1278", "伦敦" },
                { "48.8566,2.3522", "巴黎" },
                { "52.5200,13.4050", "柏林" },
                { "40.7128,-74.0060", "纽约" },
                { "34.0522,-118.2437", "洛杉矶" },
                { "43.6532,-79.3832", "多伦多" },
                { "-23.5505,-46.6333", "圣保罗" },
                { "19.4326,-99.1332", "墨西哥城" },
                { "55.7558,37.6176", "莫斯科" },
                { "25.2048,55.2708", "迪拜" },
                { "-33.8688,151.2093", "悉尼" },
                { "-22.9068,-43.1729", "里约热内卢" },
                { "37.5665,126.9780", "首尔" },
                { "41.9028,12.4964", "罗马" },
                { "40.4168,-3.7038", "马德里" },
                { "34.6937,135.5023", "大阪" },
                { "48.2082,16.3738", "维也纳" },
                { "59.3293,18.0686", "斯德哥尔摩" },
                { "55.6761,12.5683", "哥本哈根" },
                { "52.3676,4.9041", "阿姆斯特丹" },
                { "50.8503,4.3517", "布鲁塞尔" },
                { "41.8781,-87.6298", "芝加哥" },
                { "37.7749,-122.4194", "旧金山" },
                { "-34.6037,-58.3816", "布宜诺斯艾利斯" },
                { "-26.2041,28.0473", "约翰内斯堡" },
                { "-1.2921,36.8219", "内罗毕" },
                { "45.4642,9.1900", "米兰" },
                { "41.3851,2.1734", "巴塞罗那" },
                { "-37.8136,144.9631", "墨尔本" },
                { "24.7136,46.6753", "利雅得" },
                { "25.2854,51.5310", "多哈" },
                { "29.3759,47.9774", "科威特城" },
                { "52.2297,21.0122", "华沙" },
                { "24.8607,67.0011", "卡拉奇" },
                { "-41.2865,174.7762", "惠灵顿" },
                { "-33.4489,-70.6693", "圣地亚哥" },
                { "25.7617,-80.1918", "迈阿密" },
                { "-12.0464,-77.0428", "利马" },
                { "14.5995,120.9842", "马尼拉" },
                { "-6.2088,106.8456", "雅加达" },
            };
            return isp;
        }

        public static string GetAcceptLanguageFromLocales(string locales)
        {
            string acceptLanguage;
            switch (locales)
            {
                case "zh-CN":
                    acceptLanguage = "zh-CN,zh;q=0.9,en;q=0.8";
                    break;
                case "en-US":
                    acceptLanguage = "en-US,en;q=0.9";
                    break;
                case "fr-FR":
                    acceptLanguage = "fr-FR,fr;q=0.9,en;q=0.8";
                    break;
                case "de-DE":
                    acceptLanguage = "de-DE,de;q=0.9,en;q=0.8";
                    break;
                case "ja-JP":
                    acceptLanguage = "ja-JP,ja;q=0.9,en;q=0.8";
                    break;
                case "es-ES":
                    acceptLanguage = "es-ES,es;q=0.9,en;q=0.8";
                    break;
                default:
                    acceptLanguage = locales;
                    break;
            }
            return acceptLanguage;
        }


        public static Dictionary<string, string> Get_Os()
        {
            var locales = new Dictionary<string, string>
            {
                { "Windows NT 10.0; Win64; x64", "Windows" },
                { "Macintosh; Intel Mac OS X 10_15_7", "Mac" },
                { "X11; Linux x86_64", "Linux" }
            };
            return locales;
        }
    }
}