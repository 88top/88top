using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using XChrome.cs.win32;
using static XChrome.cs.win32.Win32Helper;

namespace XChrome.cs.zchrome
{
    public class ManagerControler
    {
        private ManagerCache _ManagerCache;
        public ManagerControler(ManagerCache cache) { _ManagerCache = cache; }
        /// <summary>
        /// 群控复制操作方法，已经是task内无需异步
        /// 鼠标点击
        /// </summary> 
        /// <param name="except_id"></param>
        /// <param name="xRatio">相对主控的位置比例</param>
        /// <param name="yRatio"></param>
        public void CopyControl_Click(long except_id, int x, int y, bool isExtension = false, string clickType = "Left")
        {
            var idslist = _ManagerCache.GetRuningXchrome_idlist();
            foreach (var id in idslist)
            {
                if (id == except_id) continue;
                var xchrome = _ManagerCache.GetRuningXchromeById(id);
                if (xchrome == null) continue;

                IntPtr hwd = IntPtr.Zero;
                if (isExtension)
                {
                    hwd = (IntPtr)xchrome.ExtensionsHwnd;
                }
                else
                {
                    hwd = (IntPtr)xchrome.Hwnd;
                }
                if (except_id == hwd) continue;
                int xx = x + 0;
                int yy = y + 0;
                //Debug.WriteLine("点击：" + x + "," + y);

                if (!Win32Helper.IsWindow(hwd)) continue;

                //Debug.WriteLine("hwd:" + (long)hwd);
                // Debug.WriteLine("点击2222：" + x + "," + y);

                // 构造 lParam 参数：低 16 位为 x 坐标，高 16 位为 y 坐标
                IntPtr lParam = new IntPtr((y << 16) | (x & 0xFFFF));
                IntPtr wParam = IntPtr.Zero;


                if (clickType == "Left")
                {
                    Win32Helper.PostMessage(hwd, Win32Helper.WM_LBUTTONDOWN, wParam, lParam);
                    //Thread.Sleep(150);
                    //Win32Helper.SendMessage(hwd, Win32Helper.WM_LBUTTONUP, wParam, lParam);
                }
                else
                {
                    Win32Helper.PostMessage(hwd, Win32Helper.WM_RBUTTONDOWN, wParam, lParam);
                    //Thread.Sleep(150);
                    //Win32Helper.SendMessage(hwd, Win32Helper.WM_RBUTTONUP, wParam, lParam);
                }



            }
        }


        public void CopyControl_ClickUp(long except_id, int x, int y, bool isExtension = false, string clickType = "Left")
        {
            var idslist = _ManagerCache.GetRuningXchrome_idlist();
            foreach (var id in idslist)
            {
                if (id == except_id) continue;
                var xchrome = _ManagerCache.GetRuningXchromeById(id);
                if (xchrome == null) continue;

                IntPtr hwd = IntPtr.Zero;
                if (isExtension)
                {
                    hwd = (IntPtr)xchrome.ExtensionsHwnd;
                }
                else
                {
                    hwd = (IntPtr)xchrome.Hwnd;
                }
                if (except_id == hwd) continue;
                if (!Win32Helper.IsWindow(hwd)) continue;


                // 构造 lParam 参数：低 16 位为 x 坐标，高 16 位为 y 坐标
                IntPtr lParam = new IntPtr((y << 16) | (x & 0xFFFF));

                // wParam：表示键盘修饰符（如 Ctrl、Shift 等），此处设为 0
                IntPtr wParam = IntPtr.Zero;


                if (clickType == "Left")
                {
                    // 发送鼠标左键按下消息
                    //Win32Helper.SendMessage(hwd, Win32Helper.WM_LBUTTONDOWN, wParam, lParam);
                    // 延时 10 毫秒，模拟自然点击
                    //Thread.Sleep(50);
                    // 发送鼠标左键抬起消息
                    Win32Helper.PostMessage(hwd, Win32Helper.WM_LBUTTONUP, wParam, lParam);
                }
                else
                {
                    //Win32Helper.SendMessage(hwd, Win32Helper.WM_RBUTTONDOWN, wParam, lParam);
                    //Thread.Sleep(50);
                    Win32Helper.PostMessage(hwd, Win32Helper.WM_RBUTTONUP, wParam, lParam);
                }

                //if (prevHwnd != IntPtr.Zero)
                //{
                //    Win32Helper.SetWindowPos(hwd, prevHwnd,
                //        0, 0, 0, 0,
                //         0x0002 | 0x0001 | 0x0010);
                //}

            }
        }


        /// <summary>
        /// 群控复制操作方法，已经是task内无需异步
        /// 滚轮
        /// </summary>
        /// <param name="except_id"></param>
        /// <param name="xRatio"></param>
        /// <param name="yRatio"></param>
        /// <param name="Delta"></param>
        public void CopyControl_Wheel(long except_id, int x, int y, int Delta, bool isExtension = false)
        {
            var idslist = _ManagerCache.GetRuningXchrome_idlist();
            foreach (var id in idslist)
            {
                if (id == except_id) continue;
                var xchrome = _ManagerCache.GetRuningXchromeById(id);
                if (xchrome == null) continue;
                IntPtr hwd = IntPtr.Zero;
                if (isExtension)
                {
                    hwd = (IntPtr)xchrome.ExtensionsHwnd;
                }
                else
                {
                    hwd = (IntPtr)xchrome.Hwnd;
                }
                if (except_id == hwd) continue;
                if (!Win32Helper.IsWindow(hwd)) continue;


                POINT pt = new POINT { X = x, Y = y };
                if (!ClientToScreen(hwd, ref pt))
                {
                    //Console.WriteLine("转换客户坐标到屏幕坐标失败。");
                    return;
                }

                int xx = pt.X;
                int yy = pt.Y;
                //Debug.WriteLine(xx + "," + yy);

                IntPtr lParam = new IntPtr((yy << 16) | (xx & 0xFFFF));
                // 低 16 位为键盘修饰键状态（一般设为 0）
                int wParamValue = (Delta << 16);
                IntPtr wParam = new IntPtr(wParamValue);
                // 向目标窗口发送 WM_MOUSEWHEEL 消息
                Win32Helper.SendMessage(hwd, 0x020A, wParam, lParam);


            }
        }

        public void CopyControl_keyPress(long except_id, char _char, bool isExtension = false)
        {
            bool isNiantie = false;
            if (_char == 'v')
            {
                long c = tools.YTools.YUtils.GetTime13(DateTime.Now) - control_start_time;
                if (c < 2000)
                {
                    Debug.WriteLine("触发黏贴");
                    isNiantie = true;
                }
            }
            var idslist = _ManagerCache.GetRuningXchrome_idlist();
            foreach (var id in idslist)
            {
                if (id == except_id) continue;
                var xchrome = _ManagerCache.GetRuningXchromeById(id);
                if (xchrome == null) continue;
                IntPtr hwd = IntPtr.Zero;
                if (isExtension)
                {
                    hwd = (IntPtr)xchrome.ExtensionsHwnd;
                }
                else
                {
                    hwd = (IntPtr)xchrome.Hwnd;
                }
                if (except_id == hwd) continue;
                if (!Win32Helper.IsWindow(hwd)) continue;

                //黏贴
                if (isNiantie)
                {
                    _ = Task.Run(() =>
                    {
                        // 1. 发送 Ctrl 键按下
                        Win32Helper.PostMessage(hwd, 0x0100, (IntPtr)0x11, (IntPtr)0x00000001);

                        Thread.Sleep(5);  // 加一个短暂延时

                        // 2. 发送 V 键按下
                        Win32Helper.PostMessage(hwd, 0x0100, (IntPtr)0x56, (IntPtr)0x00000001);

                        Thread.Sleep(5);

                        // 3. 发送 V 键松开
                        Win32Helper.PostMessage(hwd, 0x0101, (IntPtr)0x56, (IntPtr)0xC0000001);

                        Thread.Sleep(5);

                        // 4. 发送 Ctrl 键松开
                        Win32Helper.PostMessage(hwd, 0x0101, (IntPtr)0x11, (IntPtr)0xC0000001);

                        Thread.Sleep(5);
                    });
                    
                    


                    //bool result = Win32Helper.PostMessage(hwd, 0x0302, IntPtr.Zero, IntPtr.Zero);
                    //Debug.WriteLine(result);
                    continue;
                }

                // 将字符转换为 WM_CHAR 消息的 wParam 值
                IntPtr wParam = new IntPtr(_char);
                // 对于 WM_CHAR，此处 lParam 中包含附加信息，可简单设为 0
                IntPtr lParam = IntPtr.Zero;

                // 使用 PostMessage 发送 WM_CHAR 消息
                bool success = Win32Helper.PostMessage(hwd, 0x0102, wParam, lParam);

                

            }

        }

        long control_start_time = 0;
        public void CopyControl_keyDownOther(long except_id, Keys key, bool isExtension = false)
        {
            var idslist = _ManagerCache.GetRuningXchrome_idlist();
            foreach (var id in idslist)
            {
                if (id == except_id) continue;
                var xchrome = _ManagerCache.GetRuningXchromeById(id);
                if (xchrome == null) continue;
                IntPtr hwd = IntPtr.Zero;
                if (isExtension)
                {
                    hwd = (IntPtr)xchrome.ExtensionsHwnd;
                }
                else
                {
                    hwd = (IntPtr)xchrome.Hwnd;
                }
                if (except_id == hwd) continue;
                if (!Win32Helper.IsWindow(hwd)) continue;

                ///control 
                if (key == Keys.LControlKey)
                {
                    control_start_time = tools.YTools.YUtils.GetTime13(DateTime.Now);
                }

                Win32Helper.PostMessage(hwd, 0x0100, new IntPtr((int)key), IntPtr.Zero);

            }

        }



        public void CopyControl_MouseMove(long except_id, int x, int y, bool isExtension = false)
        {
            var idslist = _ManagerCache.GetRuningXchrome_idlist();
            foreach (var id in idslist)
            {
                if (id == except_id) continue;
                var xchrome = _ManagerCache.GetRuningXchromeById(id);
                if (xchrome == null) continue;
                IntPtr hwd = IntPtr.Zero;
                if (isExtension)
                {
                    hwd = (IntPtr)xchrome.ExtensionsHwnd;
                }
                else
                {
                    hwd = (IntPtr)xchrome.Hwnd;
                }
                if (except_id == hwd) continue;
                if (!Win32Helper.IsWindow(hwd)) continue;


                int lParam = (x & 0xFFFF) | (y & 0xFFFF) << 16;
                IntPtr lParamPtr = new IntPtr(lParam);
                // 如果需要，wParam 可以携带一些标志，如鼠标按钮状态，这里暂时设置为 0
                IntPtr wParam = IntPtr.Zero;
                //Debug.WriteLine(xRatio+",,"+yRatio);
                // 通过 SendMessage 将 WM_MOUSEMOVE 消息发送到目标窗口
                Win32Helper.SendMessage(hwd, 0x0200, wParam, lParamPtr);

            }
        }

        public void CopyControl_MouseHover(long except_id, int x, int y, bool isExtension = false)
        {
            var idslist = _ManagerCache.GetRuningXchrome_idlist();
            foreach (var id in idslist)
            {
                if (id == except_id) continue;
                var xchrome = _ManagerCache.GetRuningXchromeById(id);
                if (xchrome == null) continue;
                IntPtr hwd = IntPtr.Zero;
                if (isExtension)
                {
                    hwd = (IntPtr)xchrome.ExtensionsHwnd;
                }
                else
                {
                    hwd = (IntPtr)xchrome.Hwnd;
                }
                if (except_id == hwd) continue;
                if (!Win32Helper.IsWindow(hwd)) continue;



                //Debug.WriteLine(xRatio+","+yRatio);
                int lParam = (y | (x & 0xFFFF));
                Win32Helper.PostMessage(hwd, 0x02A1, IntPtr.Zero, new IntPtr(lParam));



            }
        }
    }


}
