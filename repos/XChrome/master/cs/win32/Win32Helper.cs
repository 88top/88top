#region copyright
/**
// --------------------------------------------------------------------------------
// 文件名：Win32Helper.cs
// 作者：刹那 https://x.com/chanawudi
// 公司：https://x.com/chanawudi
// 更新日期：2025，2，27，13:55
// 版权所有 © Your Company. 保留所有权利。
// --------------------------------------------------------------------------------
*/
#endregion
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace XChrome.cs.win32
{
    public class Win32Helper
    {
        // 定义 RECT 结构，与 Win32 RECT 结构保持一致
        [StructLayout(LayoutKind.Sequential)]
        public struct RECT
        {
            public int Left;   // 左边缘坐标 
            public int Top;    // 顶边缘坐标
            public int Right;  // 右边缘坐标
            public int Bottom; // 底边缘坐标
        }
        [DllImport("user32.dll")]
        public static extern bool IsWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        public static extern bool IsWindowVisible(IntPtr hWnd);
        /// <summary>
        /// 找窗口
        /// </summary>
        /// <param name="lpClassName"></param>
        /// <param name="lpWindowName"></param>
        /// <returns></returns>
        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        // 在指定父窗口下查找子窗口句柄
        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        public static extern IntPtr FindWindowEx(IntPtr hwndParent, IntPtr hwndChildAfter, string lpszClass, string lpszWindow);

        // 引入 ClientToScreen 函数
        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool ClientToScreen(IntPtr hWnd, ref POINT lpPoint);

        // 相关标志
        const uint SWP_NOZORDER = 0x0004;  // 不改变 Z 顺序
        const uint SWP_NOACTIVATE = 0x0010;  // 不激活窗口

        public const int WM_LBUTTONDOWN = 0x0201;
        public const int WM_LBUTTONUP = 0x0202;

        public const int WM_RBUTTONDOWN = 0x0204;
        public const int WM_RBUTTONUP = 0x0205;

        // 定义 WM_MOUSEWHEEL 消息（鼠标滚轮消息）代码
        private const int WM_MOUSEWHEEL = 0x020A;
        // WHEEL_DELTA 表示滚轮单步标准值
        private const int WHEEL_DELTA = 120;

        // 获取当前鼠标在屏幕上的坐标
        [DllImport("user32.dll")]
        private static extern bool GetCursorPos(out POINT lpPoint);
        [DllImport("user32.dll", SetLastError = true)]
        public static extern IntPtr GetWindow(IntPtr hWnd, uint uCmd);

        // 发送消息给指定窗口（不要求窗口处于激活或聚焦状态）
        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool PostMessage(IntPtr hWnd, int Msg, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        public static extern IntPtr SendMessage(IntPtr hWnd,uint Msg, IntPtr wParam,IntPtr lParam);

        [DllImport("user32.dll")]
        public static extern bool LockSetForegroundWindow(uint uLockCode);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);


        // 定义 POINT 结构，用于获取坐标
        [StructLayout(LayoutKind.Sequential)]
        public struct POINT
        {
            public int X;
            public int Y;
        }


        // 导入 user32.dll 中的 SetWindowPos 方法，调整窗口大小和位置
        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool SetWindowPos(
            IntPtr hWnd,
            IntPtr hWndInsertAfter,
            int X,
            int Y,
            int cx,
            int cy,
            uint uFlags
        );

        // 导入 user32.dll 中的 GetForegroundWindow 方法，获取当前前台窗口句柄
        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool GetClientRect(IntPtr hWnd, out RECT lpRect);

        // 导入 GetWindowRect，用于获取整个窗口的矩形
        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

        [DllImport("user32.dll")]
        public static extern uint MapVirtualKey(uint uCode, uint uMapType);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        public static extern int ToUnicode(uint wVirtKey, uint wScanCode, byte[] lpKeyState,
            [Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pwszBuff, int cchBuff, uint wFlags);

        // 定义回调委托
        public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        // 从 user32.dll 导入 EnumWindows 函数
        [DllImport("user32.dll")]
        private static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

        [DllImport("dwmapi.dll")]
        public static extern int DwmSetWindowAttribute(
            IntPtr hwnd,
            uint dwAttribute,
            ref uint pvAttribute,
            uint cbAttribute);

        /// <summary>
        /// 改变窗口位置大小
        /// </summary>
        /// <param name="intptr"></param>
        /// <param name="x"></param>
        /// <param name="y"></param>
        /// <param name="w"></param>
        /// <param name="h"></param>
        public static void ChangeWindowPos(IntPtr intptr, int x,int y ,int w,int h)
        {
            try
            {
                SetWindowPos(intptr, IntPtr.Zero, x, y, w, h, SWP_NOZORDER | SWP_NOACTIVATE);
            }catch(Exception ev) { }
           
        }
        public enum DWMWINDOWATTRIBUTE : uint
        {
            DWMWA_BORDER_COLOR = 34
        }

        [DllImport("user32.dll")]
        public static extern IntPtr ChildWindowFromPointEx(IntPtr hwndParent, POINT pt, uint flags);
        [DllImport("user32.dll")]
        public static extern bool ScreenToClient(IntPtr hWnd, ref POINT lpPoint);
        [DllImport("user32.dll")]
        public static extern bool SetForegroundWindow(IntPtr hWnd);

        // 获取窗口的类名
        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

        // 导入 EnumChildWindows
        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool EnumChildWindows(IntPtr hWndParent, EnumWindowsProc lpEnumFunc, IntPtr lParam);

        // 获取窗口标题长度
        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        public static extern int GetWindowTextLength(IntPtr hWnd);

        // 获取窗口标题
        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);




        // 常量定义
        private const int PS_SOLID = 0; // 实线画笔样式



        // Win32 API 声明
        [DllImport("user32.dll")]
        private static extern IntPtr GetWindowDC(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);

        [DllImport("gdi32.dll")]
        private static extern IntPtr CreatePen(int fnPenStyle, int nWidth, int crColor);

        [DllImport("gdi32.dll")]
        private static extern IntPtr SelectObject(IntPtr hDC, IntPtr hGdiObj);

        [DllImport("gdi32.dll")]
        private static extern bool DeleteObject(IntPtr hObject);


        [DllImport("user32.dll")]
        private static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);


        public static List<IntPtr> GetAllWindowsByClass(string targetClassName)
        {

            // 初始 parent 为顶级窗口（IntPtr.Zero），并从第一个窗口开始查找（hwndChildAfter 为 IntPtr.Zero）
            IntPtr hwndFound = IntPtr.Zero;
            int count = 0;
            List<IntPtr> list = new List<IntPtr>();
            // 循环查找所有匹配的窗口
            do
            {
                hwndFound = FindWindowEx(IntPtr.Zero, hwndFound, targetClassName, null);
                if (hwndFound != IntPtr.Zero)
                {
                    count++;
                    list.Add(hwndFound);
                    //Console.WriteLine($"找到第 {count} 个窗口，句柄：{hwndFound}");
                }
            }
            while (hwndFound != IntPtr.Zero);

            //Console.WriteLine($"总共找到 {count} 个类名为 \"{targetClassName}\" 的窗口。");
            //Console.ReadLine();
            return list;
        }

        /// <summary>
        /// 遍历指定父窗口的所有子窗口
        /// </summary>
        /// <param name="parent">父窗口句柄</param>
        /// <returns>子窗口句柄列表</returns>
        public static List<IntPtr> GetAllChildWindows(IntPtr parent)
        {
            List<IntPtr> childWindows = new List<IntPtr>();

            // 定义回调委托，枚举到每个子窗口时将它加入列表中
            EnumWindowsProc callback = (hWnd, lParam) =>
            {
                childWindows.Add(hWnd);
                // 返回 true 以继续枚举
                return true;
            };

            // 执行子窗口枚举
            EnumChildWindows(parent, callback, IntPtr.Zero);
            return childWindows;
        }


        /// <summary>
        /// 给窗口设置带颜色和粗细的边框
        /// </summary>
        /// <param name="hWnd">窗口句柄</param>
        /// <param name="borderColor">边框颜色</param>
        /// <param name="borderWidth">边框宽度（像素）</param>
        public static void SetWindowBorder(IntPtr hWnd, Color borderColor, int borderWidth)
        {
            // 1. 获取窗口设备上下文 (Device Context)
            IntPtr hDC = GetWindowDC(hWnd);
            if (hDC == IntPtr.Zero)
            {
                Debug.WriteLine("获取窗口设备上下文失败!");
                return;
            }

            // 2. 创建画笔
            IntPtr hPen = CreatePen(PS_SOLID, borderWidth, ColorTranslator.ToWin32(borderColor));
            if (hPen == IntPtr.Zero)
            {
                ReleaseDC(hWnd, hDC);
                Debug.WriteLine("创建画笔失败!");
                return;
            }

            // 3. 选择画笔到设备上下文
            IntPtr hOldPen = SelectObject(hDC, hPen);

            // 4. 获取窗口矩形
            RECT windowRect;
            GetWindowRect(hWnd, out windowRect);

            // 5. 绘制矩形 (注意: 坐标是窗口相对于屏幕的坐标)
            // MoveWindow 函数会调整窗口大小以容纳边框
            MoveWindow(hWnd, windowRect.Left, windowRect.Top, windowRect.Right - windowRect.Left, windowRect.Bottom - windowRect.Top, true);

            //6. 使用DrawRectangle绘制边框
            using (Graphics g = Graphics.FromHdc(hDC))
            {
                g.DrawRectangle(new Pen(borderColor, borderWidth), 0, 0, windowRect.Right - windowRect.Left - 1, windowRect.Bottom - windowRect.Top - 1);
            }

            // 7. 恢复旧画笔
            SelectObject(hDC, hOldPen);

            // 8. 清理资源
            DeleteObject(hPen);
            ReleaseDC(hWnd, hDC);
        }
    }

}


