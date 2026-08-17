using Microsoft.Playwright;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using XChrome.cs.tools.socks5;
using XChrome.cs.tools.YTools;
using XChrome.cs.win32;
using XChrome.cs.zchrome;
using XChrome.pages;

namespace XChrome.cs.xchrome
{
    public class XChromeManager
    {

        private static readonly Lazy<XChromeManager> lazyInstance =new Lazy<XChromeManager>(() => new XChromeManager());
        public static XChromeManager Instance => lazyInstance.Value;

        public ManagerCache_del _ManagerCache { get; set; }
        public ManagerJober_del _ManagerJober { get; set; }
        public ManagerControler_del _ManagerControler { get; set; }
        public ManagerTooler_del _ManagerTooler { get; set; }

        public XChromeManager()
        {
            _ManagerCache = new ManagerCache_del();
            _ManagerJober = new ManagerJober_del(_ManagerCache);
            _ManagerControler = new ManagerControler_del(_ManagerCache);
            _ManagerTooler = new ManagerTooler_del(_ManagerCache);
        }



        /// <summary>
        /// 打开一个浏览器
        /// </summary>
        /// <param name="x"></param>
        /// <returns></returns>
        public async Task OpenChrome(XChromeClient x)
        { 
            if (_ManagerCache.playwright == null)
            {
                _ManagerCache.playwright = await Playwright.CreateAsync();
            }

            //一些参数
            List<string> args = new List<string>();

            //加载插件
            LoadExtensions(args, x);

            //指纹参数
            var options = BuildContextOptions(args, x, out var headers);


            //创建context
            var context = await BuildContextAsync(x.DataPath, options, headers);

            //更新xchrome
            x.BrowserContext = context;




            #region=====绑定事件=====

            
            //当关闭时,需要通知主窗口
            context.Close += (sender, ibrowsercontext) =>
            {
                _ManagerCache.RemoveXchrome(x);
                CManager.notify_online(new List<long> { x.Id }, false);
            };
            CManager.notify_online(new List<long> { x.Id }, true);

            
            //新建页面的时候，需要更新内部page大小
            context.Page += async (_, page) =>
            {
                //Debug.WriteLine(page.Url);
                if (_ManagerCache.closeUrls.Contains(page.Url))
                {
                    await page.CloseAsync();
                    await ArrayChromes();
                    await AdjustmentView();
                    return;
                }


                var v = x.ViewportSize;
                if (v != null)
                {
                    try
                    {
                        await page.SetViewportSizeAsync(v.Width, v.Height);
                    }
                    catch (Exception ee) { }
                }



                ////if (page.Url.StartsWith("https://chromewebstore.google.com/"))
                ////{
                //    page.Download += async (_, download) =>
                //    {
                //        Debug.WriteLine("检测到下载开始！"+ download.Url);

                //        // 等待下载完成后获取临时文件路径
                //        var tempPath = await download.PathAsync();
                //        var temp2 = tempPath + ".zip";
                //        System.IO.File.Copy(tempPath, temp2);
                //        //Debug.WriteLine($"下载文件的临时路径：{tempPath}");

                //        // 如需保存到自定义位置，可以使用 SaveAsAsync 方法
                //        //string savePath = "./downloaded_file.ext"; // 根据文件类型更改扩展名
                //       // await download.SaveAsAsync(savePath);
                //        //Console.WriteLine($"下载文件已保存至: {savePath}");
                //    };
                ////}
            };

            


            #endregion



            //打开页面
            IPage? page_0 = context.Pages[0];
            IPage? page = await context.NewPageAsync();
            await page_0.CloseAsync();
            await page.SetContentAsync(_ManagerCache.GetHomePageHtml(x));



            #region=====绑定句柄=====

            //查找句柄
            string chromeName = cs.Config.chrome_path == "" ? "Chromium" : "Google Chrome";

            string className = "Chrome_WidgetWin_1";
            long xhwd = 0;
            int timeoutNum = 30;
            while (xhwd == 0)
            {
                xhwd = Win32Helper.FindWindow(className, "环境：" + x.Id.ToString() + " - " + chromeName).ToInt64();
                if (xhwd != 0) break;
                await Task.Delay(500);
                timeoutNum--;
                if (timeoutNum == 0)
                {
                    cs.Loger.Err("获取环境浏览器句柄失败！");
                    break;
                }
            }
            //查找processid

            uint processId = 0;
            uint threadId = Win32Helper.GetWindowThreadProcessId((IntPtr)xhwd, out processId);
            x.Hwnd = xhwd;
            x.ProcessId = processId;
            _ManagerCache.SetXchrome(x.Id, x);



            #endregion



            if (!_ManagerCache._is_jober_AdjustmentView)
            {
                _ManagerCache._is_jober_AdjustmentView = true;
                cs.JoberManager.AddJob(_ManagerJober.jober_AdjustmentView);
                cs.JoberManager.AddJob(_ManagerJober.jober_findExPopup);

                _ = Task.Run(async () =>
                {
                    while (true)
                    {
                        if (cs.JoberManager._isStop) break;
                        if (_ManagerCache.is_auto_array)
                        {
                            if (_ManagerCache.GetRuningXchromeCount() > 0)
                            {
                                await ArrayChromes();
                                await AdjustmentView();
                                await Task.Delay(2000);
                            }
                            else
                            {
                                await Task.Delay(2000);
                            }
                        }
                        else
                        {
                            await Task.Delay(2000);
                        }
                    }
                });
            }


            

        }


        /// <summary>
        /// 加载插件
        /// </summary>
        /// <param name="args"></param>
        /// <param name="x"></param>
        private void LoadExtensions(List<string> args, XChromeClient x)
        {

            //插件
            List<string> extensionList = new List<string>();
            //需要加载系统插件
            List<string> needChromeEx = new List<string>();
            //需要的插件
            string[] el = x.Extensions.Split("|");
            //先看插件目录
            string exPath = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "Extensions");
            foreach (var e in el)
            {
                if (e == "") continue;
                string epath = System.IO.Path.Combine(exPath, e);
                if (!Directory.Exists(epath))
                {
                    needChromeEx.Add(e.Trim());
                    continue;
                }
                var ds = System.IO.Directory.GetDirectories(epath);
                if (ds.Count() > 0)
                {
                    string _ep1 = ds[0];
                    extensionList.Add(_ep1);
                }
            }

            //在看系统目录
            if (needChromeEx.Count > 0)
            {
                string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                string expath = System.IO.Path.Combine(userProfile, "AppData", "Local", "Google", "Chrome", "User Data", "Default", "Extensions");
                foreach (var e in needChromeEx)
                {
                    if (e == "") continue;
                    string _ep = expath + "\\" + e;
                    if (System.IO.Path.Exists(_ep))
                    {
                        var ds = System.IO.Directory.GetDirectories(_ep);
                        if (ds.Count() > 0)
                        {
                            string _ep1 = ds[0];
                            extensionList.Add(_ep1);
                        }
                    }
                }
            }

            //去重
            extensionList = extensionList.Distinct().ToList();

            if (extensionList.Count() > 0)
            {
                string _exlist = string.Join(",", extensionList);
                args.Add($"--disable-extensions-except=" + _exlist);
                args.Add($"--load-extension=" + _exlist);
            }
        }

        /// <summary>
        /// 创建 contextoptions
        /// </summary>
        /// <param name="args"></param>
        /// <param name="x"></param>
        /// <param name="headers"></param>
        private BrowserTypeLaunchPersistentContextOptions BuildContextOptions(List<string> args, XChromeClient x, out Dictionary<string, string> headers)
        {
            args.Add("--disable-features=IsolateOrigins,site-per-process");
            args.Add("--disable-features=ChromeLabs");
            args.Add("--disable-blink-features=AutomationControlled");
            //args.Add("--window-position=-32000,-32000");

            args.Add("-no-first-run");
            args.Add("--no-default-browser-check");

            string chrome_exePath = "";
            if (cs.Config.chrome_path == "")
            {
                chrome_exePath = System.IO.Path.Combine(Directory.GetCurrentDirectory(), ".playwright", "chrome", "chromium-1117", "chrome-win", "chrome.exe");
            }
            else
            {
                chrome_exePath = cs.Config.chrome_path;
            }

            string _proxy = x.Proxy;
            if (x.Proxy.StartsWith("socks5://"))
            {
                
                var bb=Socks5Server.IsSocks5MustDo(x.Proxy,out var httpproxy);
                if (bb)
                {
                    _proxy = httpproxy;
                }
                else
                {
                    cs.Loger.Err("socks5代理格式错误：" + x.Proxy);
                    _proxy = "";
                }
            }

            //解读xchrome环境evns
            JObject evnJ = JObject.Parse(string.IsNullOrEmpty(x.Evns) ? "{}" : x.Evns);
            var options = new BrowserTypeLaunchPersistentContextOptions()
            {
                UserAgent = x.UserAgent,
                ExecutablePath = chrome_exePath,
                Headless = false,
                Proxy = _ManagerTooler.getProxy(_proxy),
                Args = args,
                //下载
                //AcceptDownloads = true,
                //DownloadsPath = System.IO.Path.Combine(Directory.GetCurrentDirectory(), "chrome_data", x.Id.ToString(), "downloads"),

                //Channel= "chrome",
                Env = new Dictionary<string, string>
                    {
                        { "GOOGLE_API_KEY", "AIzaSyCkfPOPZXDKNn8hhgu3JrA62wIgC93d44k" },
                        { "GOOGLE_DEFAULT_CLIENT_ID", "811574891467.apps.googleusercontent.com" },
                        { "GOOGLE_DEFAULT_CLIENT_SECRET", "kdloedMFGdGla2P1zacGjAQh" }
                    },
                //关闭
                IgnoreDefaultArgs = new[] { "--enable-automation", "--no-sandbox" }
            };
            if (evnJ["Locale"] != null)
            {
                options.Locale = evnJ["Locale"]?.ToString();
            }
            if (evnJ["TimezoneId"] != null)
            {
                options.TimezoneId = evnJ["TimezoneId"]?.ToString();
            }

            //if(x.ViewportSize!=null)
            //    options.ViewportSize = x.ViewportSize;

            if (evnJ["ViewportSize"] != null)
            {
                options.ViewportSize = new ViewportSize
                {
                    Width = Convert.ToInt32(evnJ["ViewportSize"]["width"].ToString()),
                    Height = Convert.ToInt32(evnJ["ViewportSize"]["height"].ToString())
                };
            }
            //if (evnJ["DeviceScaleFactor"] != null)
            //{
            //    options.DeviceScaleFactor = (float)Convert.ToDecimal(evnJ["DeviceScaleFactor"]?.ToString());
            //}
            if (evnJ["IsMobile"] != null)
            {
                options.IsMobile = evnJ["IsMobile"]?.ToString() == "1" ? true : false;
            }

            if (evnJ["HasTouch"] != null)
            {
                options.HasTouch = evnJ["HasTouch"]?.ToString() == "1" ? true : false;
            }
            if (evnJ["Geolocation"] != null)
            {
                var Latitude = (float)Convert.ToDecimal(evnJ["Geolocation"]["Latitude"].ToString());
                var Longitude = (float)Convert.ToDecimal(evnJ["Geolocation"]["Longitude"].ToString());
                options.Geolocation = new Geolocation { Latitude = Latitude, Longitude = Longitude };
            }
            if (evnJ["ExtraHTTPHeaders"] != null)
            {
                headers = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, string>>(evnJ["ExtraHTTPHeaders"].ToString());
            }
            else
            {
                headers = new Dictionary<string, string>();
            }
            headers.Add("User-Agent", x.UserAgent);
            return options;
        }

        /// <summary>
        /// 创建 IBrowserContext
        /// </summary>
        /// <param name="DataPath"></param>
        /// <param name="options"></param>
        /// <param name="headers"></param>
        /// <returns></returns>
        private async Task<IBrowserContext> BuildContextAsync(string DataPath, BrowserTypeLaunchPersistentContextOptions options, Dictionary<string, string> headers)
        {
            //创建context
            var context = await _ManagerCache.playwright.Chromium.LaunchPersistentContextAsync(DataPath, options);

            // 直接注入JS脚本（也可从文件读取内容）
            await context.AddInitScriptAsync(_ManagerCache. GetInitScript());


            //设置headers
            if (headers != null && headers.Count > 0)
                await context.SetExtraHTTPHeadersAsync(headers);
            return context;
        }



        /// <summary>
        /// 关闭所有浏览器
        /// </summary>
        /// <returns></returns>
        public async Task CloseAllChrome()
        {
            List<XChromeClient>? list = _ManagerCache.GetRuningXchromesList() ;
            
            if (list == null) return;
            for (int i = 0; i < list.Count; i++)
            {
                var bcontext = list[i].BrowserContext;
                try
                {
                    await bcontext?.CloseAsync();
                }
                catch (Exception ex) { }
            }
        }



        /// <summary>
        /// 重新排列窗口
        /// </summary>
        /// <param name="type">0平铺，1重叠</param>
        /// <param name="width"></param>
        /// <param name="height"></param>
        /// <param name="licount"> 列数</param>
        /// <param name="screen"></param>
        /// <returns></returns>
        public async Task ArrayChromes(int type, string width, string height, string licount, int screenIndex)
        {
            //string temp = type + "---" + width + "---" + height + "---" + licount + "---" + screenIndex;
            //_ManagerCache.ArrayChromes_temp_data = temp;
            ////获得屏幕
            //Screen screen = Screen.AllScreens[screenIndex];
            ////屏幕位置 workarea
            //var workarea = screen.WorkingArea;
            ////自定义
            //bool isCustom = (width != "" && height != "" && licount != "");
            //if (isCustom) { type = 0; }

            ////平铺
            //if (type == 0)
            //{
            //    //长宽不填，表示默认
            //    if (!isCustom)
            //    {
            //        int _screen_width = screen.Bounds.Width;
            //        int _screen_height = screen.Bounds.Height;
            //        int startTop = workarea.Top;
            //        int startLeft = workarea.Left;

            //        var windowlist = _ManagerTooler.ComputeAdaptiveWindowPositions(_screen_width, _screen_height, _ManagerCache.GetRuningXchromeCount());
            //        var idslist =_ManagerCache.GetRuningXchrome_idlist();

            //        for (int i = 0; i < windowlist.Count; i++)
            //        {
            //            var xchrome_id = idslist[i];
            //            var windowPos = windowlist[i];
            //            XChromeClient? xchrome = _ManagerCache.GetRuningXchromeById(xchrome_id);
            //            if (xchrome == null) continue;
            //            IntPtr hwd = (IntPtr)xchrome.Hwnd;
            //            Win32Helper.ChangeWindowPos(hwd, startLeft + windowPos.Left, startTop + windowPos.Top, windowPos.Width, windowPos.Height);
            //            //await Task.Delay(200);
            //        }
            //    }
            //    //自定义填写
            //    else
            //    {
            //        int _width = width.TryToInt32(100);
            //        int _height = height.TryToInt32(100);
            //        int _licount = licount.TryToInt32(3);

            //        int startTop = workarea.Top;
            //        int startLeft = workarea.Left;
            //        int current_left = startLeft;
            //        var idslist = _ManagerCache.GetRuningXchrome_idlist();
            //        for (int i = 0; i < idslist.Count; i++)
            //        {
            //            var xchrome_id = idslist[i];
            //            XChromeClient? xchrome = _ManagerCache.GetRuningXchromeById(xchrome_id);
            //            if (xchrome == null) continue;
            //            IntPtr hwd = (IntPtr)xchrome.Hwnd;
            //            current_left = startLeft + (i % _licount) * _width;
            //            //需要换行
            //            if (i % _licount == 0 && i != 0)
            //            {
            //                startTop += _height;
            //                current_left = startLeft;
            //            }
            //            Win32Helper.ChangeWindowPos(hwd, current_left, startTop, _width, _height);
            //            //await Task.Delay(200);
            //        }
            //    }
            //}
            ////重叠排序
            //else
            //{
            //    var idslist = _ManagerCache.GetRuningXchrome_idlist();
            //    int current_left = workarea.Left;
            //    int _width = workarea.Width - idslist.Count * 30;
            //    int _height = workarea.Height - 20;

            //    for (int i = 0; i < idslist.Count; i++)
            //    {
            //        var xchrome_id = idslist[i];
            //        XChromeClient xchrome = _ManagerCache.GetRuningXchromeById(xchrome_id);
            //        if (xchrome == null) continue;
            //        IntPtr hwd = (IntPtr)xchrome.Hwnd;

            //        Win32Helper.ChangeWindowPos(hwd, current_left, workarea.Top, _width, _height);
            //        current_left += 30;
            //        //await Task.Delay(200);
            //    }
            //}

        }

        public async Task ArrayChromes()
        {
            string temp = _ManagerCache.ArrayChromes_temp_data;
            if (temp == "") return;
            string[] temps = temp.Split("---");
            int type = temps[0].TryToInt32(0);
            string width = temps[1];
            string height = temps[2];
            string licount = temps[3];
            int screenIndex = temps[4].TryToInt32(0);
            await ArrayChromes(type, width, height, licount, screenIndex);
        }

        /// <summary>
        /// 手动 调整浏览器内部页面大小
        /// </summary>
        /// <returns></returns>
        public async Task AdjustmentView()
        {
            var idslist =_ManagerCache. GetRuningXchrome_idlist();
            for (int i = 0; i < idslist.Count; i++)
            {
                var xchrome_id = idslist[i];
                XChromeClient xchrome = _ManagerCache.GetRuningXchromeById(xchrome_id);
                try
                {
                    await _ManagerTooler.AdjustmentOneView(xchrome);
                }
                catch (Exception ex)
                {
                    //cs.Loger.Err("调整窗口大小失败：" + ex.Message);
                }
            }
        }
        


        /// <summary>
        /// 程序结束的时候调用
        /// </summary>
        /// <returns></returns>
        public async Task DisposePlayWright()
        {
            if (_ManagerCache. playwright == null) return;
            try { _ManagerCache.playwright.Dispose(); } catch { }
        }
    }
}
