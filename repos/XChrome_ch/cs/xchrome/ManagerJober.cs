using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using XChrome.cs.win32;
using XChrome.cs.zchrome;

namespace XChrome.cs.xchrome
{
    public class ManagerJober_del
    {
        private ManagerCache_del _ManagerCache;
        public ManagerJober_del(ManagerCache_del cache) { _ManagerCache = cache; }


        /// <summary>
        /// 定时检测内部页面大小调整
        /// </summary>
        /// <returns></returns>
        public async Task jober_AdjustmentView()
        {
            //Dictionary<long, XChromeClient> runing_xchrome=_ManagerCache.getru;
            //激活窗口
            IntPtr foreHwd = (IntPtr)win32.Win32Helper.GetForegroundWindow();
            if (foreHwd == IntPtr.Zero) { return; }
            //如果激活窗口是
            bool isXchrome = false;
            XChromeClient? xchrome = null;
            var idslist = _ManagerCache.GetRuningXchrome_idlist();
            for (int i = 0; i < idslist.Count; i++)
            {
                var id = idslist[i];
                xchrome = _ManagerCache.GetRuningXchromeById(id);
                if (xchrome == null) return;
                IntPtr hwd = (IntPtr)xchrome.Hwnd;
                if (hwd == foreHwd)
                {
                    isXchrome = true;
                    break;
                }
            }
            if (!isXchrome) { return; }
            //Debug.WriteLine("开始调整1..");
            //开始检测调整窗口
            var legacywindow_hwd = Win32Helper.FindWindowEx(foreHwd, IntPtr.Zero, "Chrome_RenderWidgetHostHWND", "Chrome Legacy Window");
            if (legacywindow_hwd == IntPtr.Zero) { return; }
            Win32Helper.RECT clientRect = new Win32Helper.RECT();
            Win32Helper.GetWindowRect(legacywindow_hwd, out clientRect);
            int ww = clientRect.Right - clientRect.Left;
            int hh = clientRect.Bottom - clientRect.Top;
            //总窗口
            Win32Helper.GetWindowRect(foreHwd, out var ret);
            if (ww != xchrome.LegacyWindowWidth || hh != xchrome.LegacyWindowHeight)
            {

                xchrome.LegacyWindowWidth = ww;
                xchrome.LegacyWindowHeight = hh;
                //xchrome.ViewportSize = new ViewportSize { Width = ww, Height = hh };
                foreach (var page in xchrome.BrowserContext.Pages)
                {
                    //page.set
                    await page.SetViewportSizeAsync(ww, hh);
                }
                Win32Helper.ChangeWindowPos(foreHwd, ret.Left, ret.Top, ret.Right - ret.Left, ret.Bottom - ret.Top);
            }

            if (ControlManager.IsRunning())
            {
                ControlManager.SetMainXchrome(xchrome.Id, foreHwd, ret.Left, ret.Right, ret.Top, ret.Bottom);
            }




        }


        /// <summary>
        /// 寻找是否有插件弹窗
        /// </summary>
        /// <returns></returns>
        public async Task jober_findExPopup()
        {
            var plist = _ManagerCache.GetRuningXchromesList();

            
            //Dictionary<long, XChromeClient> runing_xchrome = _ManagerCache.runing_xchrome;

            var jblist = Win32Helper.GetAllWindowsByClass("Chrome_WidgetWin_1");
            foreach (var jb in jblist)
            {
                // 获取窗口对应的进程ID
                uint processId = 0;
                uint threadId = Win32Helper.GetWindowThreadProcessId(jb, out processId);
                if (processId == 0) continue;

                //不是进程内
                var xchrome=_ManagerCache.GetRuningXchromeByProcessId(processId);
                if(xchrome == null) continue;
                if(xchrome.ExtensionsHwnd == jb) continue;


                //// 获取窗口标题
                int titleLength = Win32Helper.GetWindowTextLength(jb);
                StringBuilder sbTitle = new StringBuilder(titleLength + 1);
                Win32Helper.GetWindowText(jb, sbTitle, sbTitle.Capacity);
                string title = sbTitle.ToString();
                if (title != "") continue;

                // 获取窗口类名，通常最大长度设定为 256
                const int maxClassNameLength = 256;
                StringBuilder sbClassName = new StringBuilder(maxClassNameLength);
                int classNameLength = Win32Helper.GetClassName(jb, sbClassName, maxClassNameLength);
                string className = classNameLength != 0 ? sbClassName.ToString() : "未知";
                if (className != "Chrome_WidgetWin_1") continue;

                //设置
                xchrome.ExtensionsHwnd = (uint)jb;
               // Debug.WriteLine($"子窗口句柄: {jb}, ClassName: {className}, 标题: {title}, 进程：{processId}");

            }
        }

    }
}
