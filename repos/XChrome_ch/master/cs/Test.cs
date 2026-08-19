using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Sockets;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using XChrome.cs.db;
using XChrome.cs.win32;
using XChrome.cs.zchrome;
using System.Net.Http;

namespace XChrome.cs
{
    public class Test
    {
        public static async Task<bool> TestAndGoAsync()
        {

            return true;


           


            //string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            //string expath = System.IO.Path.Combine(userProfile, "AppData", "Local", "Google", "Chrome", "User Data", "Default", "Extensions");


            //// 启动 Windows 资源管理器并打开文件夹
            //Process.Start(new ProcessStartInfo("explorer.exe", expath)
            //{
            //    UseShellExecute = true
            //});


            return false;
        }


        public static async Task SendPageViewAsync(string trackingId, string clientId, string documentHostName, string documentPath)
        {
               HttpClient client = new HttpClient();
            // Measurement Protocol 的收集地址（Universal Analytics 示例）
              string TrackingUrl = "https://www.google-analytics.com/collect";

            // 准备请求参数
            var data = new FormUrlEncodedContent(new[]
                {
                new KeyValuePair<string, string>("v", "1"),                    // API 版本
                new KeyValuePair<string, string>("tid", trackingId),             // 跟踪 ID
                new KeyValuePair<string, string>("cid", clientId),               // 客户端 ID
                new KeyValuePair<string, string>("t", "pageview"),               // 告诉 GA 这是一个页面浏览事件
                new KeyValuePair<string, string>("dh", documentHostName),        // 主机名
                new KeyValuePair<string, string>("dp", documentPath)             // 页面路径
            });

            // 发送 POST 请求
            HttpResponseMessage response = await client.PostAsync(TrackingUrl, data);
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine("Tracking successful");
            }
            else
            {
                Console.WriteLine("Tracking failed: " + response.StatusCode);
            }
        }



    }
}
