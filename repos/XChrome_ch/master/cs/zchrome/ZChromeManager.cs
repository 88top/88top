using Microsoft.Playwright;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Documents;
using System.Windows.Forms;
using XChrome.cs.tools.YTools;
using XChrome.cs.win32;
using XChrome.cs.xchrome;
using XChrome.pages;
using static AdonisUI.Helpers.HwndInterop;
using static System.Windows.Forms.Design.AxImporter;

namespace XChrome.cs.zchrome
{
    public class ZChromeManager
    {
        private static readonly Lazy<ZChromeManager> lazyInstance = new Lazy<ZChromeManager>(() => new ZChromeManager());
        public static ZChromeManager Instance => lazyInstance.Value;
        public ZJob _zJob;
        public ManagerCache? _ManagerCache { get; set; }
        public ManagerTooler? _ManagerTooler { get; set; }
        public ManagerControler? _ManagerControler { get; set; }

        public ManagerJober? _ManagerJober { get; set; }
        public ZChromeManager() {
            _zJob = new ZJob();
            _ManagerCache=new ManagerCache();
            _ManagerTooler=new ManagerTooler(_ManagerCache);
            _ManagerControler=new ManagerControler(_ManagerCache);
            _ManagerJober=new ManagerJober(_ManagerCache);
        }

        public async Task ArrayChromes(int type, string width, string height, string licount, int screenIndex)
        {
            string temp = type + "---" + width + "---" + height + "---" + licount + "---" + screenIndex;
            _ManagerCache.ArrayChromes_temp_data = temp;
            //获得屏幕
            Screen screen = Screen.AllScreens[screenIndex];
            //屏幕位置 workarea
            var workarea = screen.WorkingArea;
            //自定义
            bool isCustom = (width != "" && height != "" && licount != "");
            if (isCustom) { type = 0; }

            //平铺
            if (type == 0)
            {
                //长宽不填，表示默认
                if (!isCustom)
                {
                    int _screen_width = screen.WorkingArea.Width;
                    int _screen_height = screen.WorkingArea.Height;
                    int startTop = workarea.Top;
                    int startLeft = workarea.Left;

                    var windowlist = _ManagerTooler.ComputeAdaptiveWindowPositions(_screen_width, _screen_height, _ManagerCache.GetRuningXchromeCount());
                    var idslist = _ManagerCache.GetRuningXchrome_idlist();

                    for (int i = 0; i < windowlist.Count; i++)
                    {
                        var xchrome_id = idslist[i];
                        var windowPos = windowlist[i];
                        XChromeClient? xchrome = _ManagerCache.GetRuningXchromeById(xchrome_id);
                        if (xchrome == null) continue;
                        IntPtr hwd = (IntPtr)xchrome.Hwnd;
                        Win32Helper.ChangeWindowPos(hwd, startLeft + windowPos.Left, startTop + windowPos.Top, windowPos.Width, windowPos.Height);
                        //await Task.Delay(200);
                    }
                }
                //自定义填写
                else
                {
                    int _width = width.TryToInt32(100);
                    int _height = height.TryToInt32(100);
                    int _licount = licount.TryToInt32(3);

                    int startTop = workarea.Top;
                    int startLeft = workarea.Left;
                    int current_left = startLeft;
                    var idslist = _ManagerCache.GetRuningXchrome_idlist();
                    for (int i = 0; i < idslist.Count; i++)
                    {
                        var xchrome_id = idslist[i];
                        XChromeClient? xchrome = _ManagerCache.GetRuningXchromeById(xchrome_id);
                        if (xchrome == null) continue;
                        IntPtr hwd = (IntPtr)xchrome.Hwnd;
                        current_left = startLeft + (i % _licount) * _width;
                        //需要换行
                        if (i % _licount == 0 && i != 0)
                        {
                            startTop += _height;
                            current_left = startLeft;
                        }
                        Win32Helper.ChangeWindowPos(hwd, current_left, startTop, _width, _height);
                        //await Task.Delay(200);
                    }
                }
            }
            //重叠排序
            else if(type==1)
            {
                var idslist = _ManagerCache.GetRuningXchrome_idlist();
                int current_left = workarea.Left;
                int _width = workarea.Width - idslist.Count * 30;
                int _height = workarea.Height - 20;


                for (int i = 0; i < idslist.Count; i++)
                {
                    var xchrome_id = idslist[i];
                    XChromeClient xchrome = _ManagerCache.GetRuningXchromeById(xchrome_id);
                    if (xchrome == null) continue;
                    IntPtr hwd = (IntPtr)xchrome.Hwnd;

                    Win32Helper.ChangeWindowPos(hwd, current_left, workarea.Top, _width, _height);
                    current_left += 30;
                    //await Task.Delay(200);
                }
            }else if (type == 2)
            {
                int _screen_width = screen.WorkingArea.Width;
                int _screen_height = screen.WorkingArea.Height;
                var idslist = _ManagerCache.GetRuningXchrome_idlist();
                int startTop = workarea.Top;
                int startLeft = workarea.Left;


                for (int i = 0; i < idslist.Count; i++)
                {
                    var xchrome_id = idslist[i];
                    XChromeClient xchrome = _ManagerCache.GetRuningXchromeById(xchrome_id);
                    if (xchrome == null) continue;
                    IntPtr hwd = (IntPtr)xchrome.Hwnd;
                    Win32Helper.ChangeWindowPos(hwd, startLeft +10, startTop +10, _screen_width-20, _screen_height-20);
                    //urrent_left += 30;
                    //await Task.Delay(200);
                }
               
            }
        }

        public async Task CloseAllChrome()
        {
            List<XChromeClient>? list = _ManagerCache.GetRuningXchromesList();

            if (list == null) return;
            for (int i = 0; i < list.Count; i++)
            {
                var zchrome = list[i].ZChromeClient;
                try
                {
                    zchrome?.CloseBrowserAsync();
                }
                catch (Exception ex) { }
            }
        }

        public async Task CloseChrome(long id)
        {
            XChromeClient? zchrome = _ManagerCache.GetRuningXchromeById(id);
            if (zchrome != null)
            {
                try
                {
                    zchrome.ZChromeClient?.CloseBrowserAsync();
                }
                catch (Exception ex) { }

            }
        }

        public async Task OpenChrome(XChromeClient xchrome)
        {

            // 实例化 zchrome socket 对象
            var zchrome =await CreateZChromeClient(xchrome);
            //指纹
            var fing = await CreateFingerprintConfig(xchrome);
            if (fing == null)
            {
                MainWindow.Toast_Error("初始化指纹错误，请详见logs文件夹日志");
                return;
            }
            // chrome 路径
            string chrome_exePath = GetChromeExePath();
            try
            {
                //启动并打开首页
                var res = await zchrome.LaunchChromeAsync(chrome_exePath, userDataDir: xchrome.DataPath, xchrome: xchrome, finger: fing);
                if (!res.isSuccess)
                {
                    cs.Loger.Err(res.errMsg ?? "");
                    MainWindow.Toast_Error(res.errMsg ?? "");
                }
                _ManagerCache?.SetXchrome(xchrome.Id, xchrome);
            }
            catch (Exception ex) {
                cs.Loger.ErrException(ex);
                MainWindow.Toast_Error(ex.Message);
            }
            


            //jober
            if (!_ManagerCache._is_jober_AdjustmentView)
            {
                _ManagerCache._is_jober_AdjustmentView = true;
                cs.JoberManager.AddJob(_ManagerJober.jober_AdjustmentView);
                cs.JoberManager.AddJob(_ManagerJober.jober_findExPopup);
            }

        }


        //================
        private async Task<ZChromeClient> CreateZChromeClient(XChromeClient xchrome)
        {
            // 实例化 ChromeDevToolsClient 
            var zchrome = new ZChromeClient(_zJob);
            xchrome.ZChromeClient = zchrome;

            // 订阅日志和各种事件
            zchrome.Log += (msg) => Debug.WriteLine("[Log] " + msg);

            //关闭socket链接的时候
            zchrome.ChromeClose += (id) =>
            {
                _ManagerCache.RemoveXchrome(xchrome);
                CManager.notify_online(new List<long> { id }, false);
            };
            //通知启动
            CManager.notify_online(new List<long> { xchrome.Id }, true);

            // 设置全局注入的 JavaScript，注意每个新页面打开时都会先执行该脚本
            string jsInjection = _ManagerCache.GetInitScript();
            zchrome.SetJsInjection(jsInjection);

            return zchrome;
        }


        private async Task<FingerprintConfig?> CreateFingerprintConfig(XChromeClient xchrome)
        {
            // 设置浏览器指纹伪装参数，例如自定义 User-Agent、分辨率和语言
            try
            {
                JObject evnJ = JObject.Parse(string.IsNullOrEmpty(xchrome.Evns) ? "{}" : xchrome.Evns);
                bool ismobile = Convert.ToBoolean(evnJ["IsMobile"]?.ToString() ?? "false");
                var fingerprint = new FingerprintConfig
                {
                    UserAgent = xchrome.UserAgent,
                    Local = evnJ["Locale"]?.ToString() ?? "",
                    TimezoneId = evnJ["TimezoneId"]?.ToString() ?? "",
                    Mobile = ismobile,
                    HasTouch = ismobile || Convert.ToBoolean(evnJ["HasTouch"]?.ToString() ?? "false"),
                    Latitude = evnJ["Geolocation"] == null ? 0 : ((float)Convert.ToDecimal(evnJ["Geolocation"]["Latitude"].ToString())),
                    Longitude = evnJ["Geolocation"] == null ? 0 : ((float)Convert.ToDecimal(evnJ["Geolocation"]["Longitude"].ToString())),
                    ExtraHTTPHeaders = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, string>>(evnJ["ExtraHTTPHeaders"].ToString()),
                    proxy = xchrome.Proxy,
                };
                return fingerprint;
            }catch(Exception eev)
            {
                cs.Loger.ErrException(eev);
                return null;
            }
            
        }

        private string GetChromeExePath()
        {
            string chrome_exePath = "";
            if (cs.Config.chrome_path == "")
            {
                chrome_exePath = System.IO.Path.Combine(Directory.GetCurrentDirectory(), ".playwright", "chrome", "chromium-1117", "chrome-win", "chrome.exe");
            }
            else
            {
                chrome_exePath = cs.Config.chrome_path;
            }
            return chrome_exePath;
        }
    }
}
