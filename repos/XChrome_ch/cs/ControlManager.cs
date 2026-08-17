#region copyright
/**
// --------------------------------------------------------------------------------
// 文件名：ControlManager.cs
// 作者：刹那 https://x.com/chanawudi
// 公司：https://x.com/chanawudi
// 更新日期：2025，2，27，13:55
// 版权所有 © Your Company. 保留所有权利。
// --------------------------------------------------------------------------------
*/
#endregion
using Gma.System.MouseKeyHook;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Forms;
using System.Windows.Media;
using XChrome.cs.db;
using XChrome.cs.win32;
using XChrome.cs.xchrome;
using XChrome.cs.zchrome;
using static XChrome.cs.win32.Win32Helper;

namespace XChrome.cs
{
    /// <summary>
    /// 群控控制类
    /// </summary>
    public class ControlManager
    {
        /// <summary>
        /// 是否按位置比例控制
        /// </summary>
        public static bool _isRatio = false;

        private static bool _isRunning = false;
        //主控id
        private static XChromeClient? _xchrome = null;
        private static long _main_xchrome_id = 0;
        private static IntPtr _main_hwd=IntPtr.Zero;
        //主控位置
        private static int _main_left = 0;
        private static int _main_right = 0;
        private static int _main_top = 0;
        private static int _main_bottom = 0;
        private static double _main_width = 0;
        private static double _main_height = 0;


        private static (bool,RECT?) IsInExtensions(int pointX,int pointY)
        {
            if (_xchrome == null) return (false,null);
            var exhwnd = _xchrome.ExtensionsHwnd;
            if(exhwnd==0)return (false,null);
            //判断窗口是否存在
            var iswindow= Win32Helper.IsWindow((IntPtr)exhwnd);
            if (!iswindow) return (false,null);
            var isvisb = Win32Helper.IsWindowVisible((IntPtr)exhwnd);
            if(!isvisb) return (false, null);
            Win32Helper.GetWindowRect((IntPtr)exhwnd,out var rect);
            int w = rect.Right - rect.Left;
            //Debug.WriteLine(w);
            if (pointX < _main_left || pointX > _main_right || pointY < _main_top || pointY > _main_bottom) return (false,null);
            return (true, rect);
        }

        private static void ConsumerAction(MouseEvent me)
        {
            if(!_isRunning) return;
            //是鼠标点击
            if (me.type == 0)
            {
                if (me.mouseClickArgs == null) return;
                var args = me.mouseClickArgs;
                if (_xchrome == null) return;


                //第一步，判断是否在插件内
                var isInExs= IsInExtensions(args.X, args.Y);
                if (isInExs.Item1)
                {
                    int _xx =  args.X - isInExs.Item2.Value.Left;
                    int _yy =  args.Y - isInExs.Item2.Value.Top;
                    Win32Helper.LockSetForegroundWindow(1);
                    if (args.Button == MouseButtons.Left)
                    {
                        ZChromeManager.Instance._ManagerControler.CopyControl_Click(_xchrome.ExtensionsHwnd, _xx, _yy,true);
                    }
                    else
                    {
                        ZChromeManager.Instance._ManagerControler.CopyControl_Click(_xchrome.ExtensionsHwnd, _xx, _yy,true, "Right");
                    }
                    return;
                }

                //判断是否主控内
                if (args.X < _main_left || args.X > _main_right || args.Y < _main_top || args.Y > _main_bottom) return;
                //计算点击的相对位置
                int xx = args.X - _main_left;
                int yy = args.Y - _main_top;

                Win32Helper.LockSetForegroundWindow(1);
                //传递
                if (args.Button == MouseButtons.Left)
                {

                    ZChromeManager.Instance._ManagerControler.CopyControl_Click(_main_xchrome_id, xx, yy,false);
                }
                else
                {
                    ZChromeManager.Instance._ManagerControler.CopyControl_Click(_main_xchrome_id, xx, yy,false, "Right");
                }
                return;
            }

            //滚轮
            else if (me.type == 1)
            {
                if (me.mouseWheelArgs == null) return;
                var args = me.mouseWheelArgs;
                //第一步，判断是否在插件内
                var isInExs = IsInExtensions(args.X, args.Y);
                if (isInExs.Item1)
                {
                    int _xx = args.X - isInExs.Item2.Value.Left;
                    int _yy = args.Y - isInExs.Item2.Value.Top;
                    ZChromeManager.Instance._ManagerControler.CopyControl_Wheel(_xchrome.ExtensionsHwnd, _xx, _yy, args.Delta, true);
                    return;
                }
                //Debug.WriteLine("yua:"+args.X + "," + args.Y);

                //判断是否主控内
                if (args.X < _main_left || args.X > _main_right || args.Y < _main_top || args.Y > _main_bottom) return;
                //计算点击的相对位置
                int xx = args.X - _main_left;
                int yy = args.Y - _main_top;
                ZChromeManager.Instance._ManagerControler.CopyControl_Wheel(_main_xchrome_id, xx, yy, args.Delta);
            }

            //输入char
            else if (me.type == 2)
            {
                if (me.keyChar == null) return;
                //Debug.WriteLine(me.keyChar);
                //判断是否主控内
                var qwin = (IntPtr)Win32Helper.GetForegroundWindow();
                //主窗口
                if(qwin==_main_hwd)
                {
                    ZChromeManager.Instance._ManagerControler.CopyControl_keyPress(_main_xchrome_id, me.keyChar.Value);
                    return;
                }
                //插件弹窗内
                if (qwin == _xchrome.ExtensionsHwnd)
                {
                    if (_xchrome.ExtensionsHwnd == 0) return;
                    //判断窗口是否存在
                    var iswindow = Win32Helper.IsWindow((IntPtr)qwin);
                    if (!iswindow) return;
                    ZChromeManager.Instance._ManagerControler.CopyControl_keyPress(qwin, me.keyChar.Value,true);
                }


                
                
            }

            //特殊键
            else if (me.type == 3)
            {
                if (me.keyPressArgs == null) return;
                var args = me.keyPressArgs;
                //Debug.WriteLine(args);
                //判断是否主控内
                var qwin = (IntPtr)Win32Helper.GetForegroundWindow();
                //主窗口
                if (qwin == _main_hwd)
                {
                    ZChromeManager.Instance._ManagerControler.CopyControl_keyDownOther(_main_xchrome_id, args.KeyCode);
                    return;
                }
                //插件弹窗内
                if (qwin == _xchrome.ExtensionsHwnd)
                {
                    if (_xchrome.ExtensionsHwnd == 0) return;
                    //判断窗口是否存在
                    var iswindow = Win32Helper.IsWindow((IntPtr)qwin);
                    if (!iswindow) return;
                    ZChromeManager.Instance._ManagerControler.CopyControl_keyDownOther(qwin, args.KeyCode,true);
                }


                
                
            }

            //鼠标移动
            else if (me.type == 4)
            {
                if (me.mouseEventArgs == null) return;
                var args = me.mouseEventArgs;
                //第一步，判断是否在插件内
                var isInExs = IsInExtensions(args.X, args.Y);
                if (isInExs.Item1)
                {
                    int _xx = args.X - isInExs.Item2.Value.Left;
                    int _yy = args.Y - isInExs.Item2.Value.Top;

                    ZChromeManager.Instance._ManagerControler.CopyControl_MouseMove(_xchrome.ExtensionsHwnd, _xx, _yy,true);
                    return;
                }

                if (args.X < _main_left || args.X > _main_right || args.Y < _main_top || args.Y > _main_bottom) return;
                //计算点击的相对位置
                int xx = args.X - _main_left;
                int yy = args.Y - _main_top;

                ZChromeManager.Instance._ManagerControler.CopyControl_MouseMove(_main_xchrome_id, xx, yy);
            }

            //鼠标悬停
            else if (me.type == 5) {

                //第一步，判断是否在插件内
                var isInExs = IsInExtensions(me.hoverX, me.hoverY);
                if (isInExs.Item1)
                {
                    int _xx = me.hoverX - isInExs.Item2.Value.Left;
                    int _yy = me.hoverY - isInExs.Item2.Value.Top;
                    ZChromeManager.Instance._ManagerControler.CopyControl_MouseHover(_xchrome.ExtensionsHwnd, _xx, _yy,true);
                    return;
                }

                int xx = me.hoverX - _main_left;
                int yy = me.hoverY - _main_top;

                ZChromeManager.Instance._ManagerControler.CopyControl_MouseHover(_main_xchrome_id, xx, yy);
            }

            //鼠标谈起
            else if (me.type == 6) {
                //return;
                if (me.mouseClickArgs == null) return;
                var args = me.mouseClickArgs;

                //第一步，判断是否在插件内
                var isInExs = IsInExtensions(args.X, args.Y);
                if (isInExs.Item1)
                {
                    int _xx = args.X - isInExs.Item2.Value.Left;
                    int _yy = args.Y - isInExs.Item2.Value.Top;
                    Win32Helper.LockSetForegroundWindow(1);
                    if (args.Button == MouseButtons.Left)
                    {
                        ZChromeManager.Instance._ManagerControler.CopyControl_ClickUp(_xchrome.ExtensionsHwnd, _xx, _yy, true);
                    }
                    else
                    {
                        ZChromeManager.Instance._ManagerControler.CopyControl_ClickUp(_xchrome.ExtensionsHwnd, _xx, _yy, true, "Right");
                    }
                    Win32Helper.LockSetForegroundWindow(2);
                    return;
                }


                //判断是否主控内
                if (args.X < _main_left || args.X > _main_right || args.Y < _main_top || args.Y > _main_bottom) return;
                //计算点击的相对位置
                int xx = args.X - _main_left;
                int yy = args.Y - _main_top;

                Win32Helper. LockSetForegroundWindow(1);
                //传递
                if (args.Button == MouseButtons.Left)
                {
                    ZChromeManager.Instance._ManagerControler.CopyControl_ClickUp(_main_xchrome_id, xx, yy,false);
                }
                else
                {
                    ZChromeManager.Instance._ManagerControler.CopyControl_ClickUp(_main_xchrome_id, xx, yy,false, "Right");
                }
                Win32Helper.LockSetForegroundWindow(2);
                return;
            }
        }

        /// <summary>
        /// 开启群控，可以重复调用无碍
        /// </summary>
        /// <param name="xchrome_id"></param>
        public static void StartControl(long xchrome_id)
        {
           

            _main_xchrome_id=xchrome_id;
            //获得主控xchrome
            //var xchrome = ZChromeManager.Instance._ManagerCache.GetRuningXchromeById(xchrome_id);
            //if (xchrome == null) { return; }
            


            var list = ZChromeManager.Instance._ManagerCache.GetRuningXchromesList();
            foreach (var x in list)
            {
                if (x.Id == xchrome_id)
                {
                    _xchrome = x;
                    //获取主控位置
                    IntPtr hwd = (IntPtr)x.Hwnd;
                    Win32Helper.GetWindowRect(hwd, out var rect);
                    _main_hwd = hwd;
                    _main_left = rect.Left;
                    _main_right = rect.Right;
                    _main_top = rect.Top;
                    _main_bottom = rect.Bottom;
                    _main_width = rect.Right - rect.Left;
                    _main_height = rect.Bottom - rect.Top;
                    SetBorderColor(System.Drawing.Color.Red, hwd);
                }
                else
                {
                    IntPtr hwd = (IntPtr)x.Hwnd;
                    SetBorderColor(System.Drawing.Color.Black, hwd);
                }
            }




            //Win32Helper.SetWindowBorder(hwd, Color.Red, 5);
            


            if (!_isRunning)
            {
                _isRunning = true;
                //绑定事件
                MouseHookServer.SetConsumer(ConsumerAction);
            }
            
        }

        public static void SetBorderColor(System.Drawing.Color color, IntPtr hwd)
        {
            try
            {
                uint DWMWA_BORDER_COLOR = 34;
                uint colorValue = (uint)ColorTranslator.ToWin32(color);
                int hr = DwmSetWindowAttribute(hwd, DWMWA_BORDER_COLOR, ref colorValue, (uint)Marshal.SizeOf(typeof(uint)));
            }
            catch (Exception ee)
            {

            }
        }


        /// <summary>
        /// 关闭
        /// </summary>
        public static void CloseControl()
        {
            _isRunning=false;
            MouseHookServer.SetConsumer(null);

            var list= ZChromeManager.Instance._ManagerCache.GetRuningXchromesList();
            foreach(var v in list)
            {
                IntPtr hwd = (IntPtr)v.Hwnd;
                if (hwd == IntPtr.Zero) continue;
                SetBorderColor(System.Drawing.Color.Black, hwd);
            }
        }


        /// <summary>
        /// 如果移动过浏览器，则这里设置
        /// </summary>
        /// <param name="id"></param>
        /// <param name="hwd"></param>
        /// <param name="_main_left"></param>
        /// <param name="_main_right"></param>
        /// <param name="_main_top"></param>
        /// <param name="_main_bottom"></param>
        public static void SetMainXchrome(long id, IntPtr hwd,int left,int right,int top,int bottom)
        {
            if (_main_xchrome_id != id) { return; }
            //Debug.WriteLine("调整："+left+","+right+","+top+","+bottom);
            //_main_xchrome_id = id;
            _main_hwd=hwd;
            _main_left = left;
            _main_right = right;
            _main_top = top;
            _main_bottom = bottom;
            _main_width=right-left;
            _main_height=bottom-top;
        }

        public static bool IsRunning()
        {
            return _isRunning;
        }
    }


    public class ControlTools
    {
        
    }

    /// <summary>
    /// hook服务
    /// </summary>
    public class MouseHookServer
    {
        private static MouseHook? mouseHook = null;

        //事件列表
        private static Queue<MouseEvent> list = new Queue<MouseEvent>();
        private static object _lock = new object();

        //外部发送的action
        private static Action<MouseEvent>? external_action = null;



        /// <summary>
        /// 设置消息消费者，如果要关闭，可以设置null
        /// </summary>
        /// <param name="_external_action"></param>
        public static void SetConsumer(Action<MouseEvent>? _external_action)
        {
            lock (_lock)
            {
                external_action = _external_action;
            }
        }

        /// <summary>
        /// 初始化，系统启动的时候就开始
        /// </summary>
        public static void Ini()
        {
            if (mouseHook != null) { return; }

            mouseHook = new MouseHook((me) => {
                //如果没有消费者，则不记录
                if (external_action == null) { return; }
                lock (_lock)
                {
                    list.Enqueue(me);
                }
            });
            mouseHook.Subscribe();


            //分发事件
            Task.Run(async () => {
                while (mouseHook != null)
                {
                    MouseEvent? tt = null;
                    lock (_lock)
                    {
                        if (list.Count != 0) tt = list.Dequeue();
                    }
                    if (tt == null)
                    {
                        await Task.Delay(100);
                        continue;
                    }
                    if (external_action != null)
                    {
                        external_action(tt);
                    }
                }
                list.Clear();
            });
        }

        /// <summary>
        /// 退出系统执行
        /// </summary>
        public static void UnIni()
        {
            if (mouseHook != null)
            {
                mouseHook.Unsubscribe();
                mouseHook = null;
            }
        }
    }

    public class MouseEvent
    {
        /// <summary>
        /// 0 鼠标点下，1 鼠标滚轮，2键盘输入字符串 , 3键盘输入特殊键 ,4 鼠标移动 , 5 悬停 ,6 鼠标弹起
        /// </summary>
        public int type=0; 
        public MouseEventExtArgs? mouseClickArgs = null;
        public MouseEventArgs? mouseWheelArgs = null;
        public KeyEventArgs? keyPressArgs = null;
        public MouseEventArgs? mouseEventArgs = null;
        public char? keyChar = null;
        public int hoverX;
        public int hoverY;
    }

    class MouseHook
    {
        //悬停计时器
        System.Timers.Timer _hoverTimer = new System.Timers.Timer(500);

        private IKeyboardMouseEvents _globalHook;

        public MouseHook(Action<MouseEvent> event_action)
        {
            this.event_action = event_action;
        }

        public void Subscribe()
        {
            // Note: for the application hook, use the Hook.AppEvents() instead
            
            _globalHook = Hook.GlobalEvents();
            // 订阅鼠标按下事件（包括鼠标左键、右键等）
            _globalHook.MouseDownExt += GlobalHook_MouseDownExt;
            _globalHook.MouseUpExt += _globalHook_MouseUpExt; 
            // 订阅鼠标滚轮事件
            _globalHook.MouseWheel += GlobalHook_MouseWheel;
            // 订阅键盘按键事件（按下、松开、字符输入）
            //_globalHook.KeyPress += GlobalHook_KeyPress;

            _globalHook.KeyDown += GlobalHookKeyDown;
            
             
            _globalHook.MouseMove += _globalHook_MouseMove;

            _hoverTimer.Elapsed += _hoverTimer_Elapsed;

            
        }

        private void _globalHook_MouseUpExt(object? sender, MouseEventExtArgs e)
        {
            if (event_action != null)
            {
                event_action(new MouseEvent() { type = 6, mouseClickArgs = e });
            }

        }

        private void _hoverTimer_Elapsed(object? sender, System.Timers.ElapsedEventArgs e)
        {
            if (event_action != null)
            {
                event_action(new MouseEvent() { type = 5, hoverX = last_move_x, hoverY = last_move_y });
            }

            //int lParam = (_lastY << 16) | (_lastX & 0xFFFF);
            //Win32Helper.SendMessage(_targetHwnd, Win32Helper.WM_MOUSEHOVER, IntPtr.Zero, new IntPtr(lParam));
        }

        private int last_move_x = 0;
        private int last_move_y = 0;
        private void _globalHook_MouseMove(object? sender, MouseEventArgs e)
        {
            if (event_action != null)
            {
                // 每次移动时重置计时器
                _hoverTimer.Stop();
                _hoverTimer.Start();
                last_move_x=e.X;
                last_move_y=e.Y;    
                event_action(new MouseEvent() { type = 4, mouseEventArgs = e });
            }
        }

        private Action<MouseEvent> event_action = null;

        /// <summary>
        /// 处理鼠标按下事件，输出按下的鼠标按钮和位置坐标
        /// </summary>
        private void GlobalHook_MouseDownExt(object sender, MouseEventExtArgs e)
        {
            //Debug.WriteLine($"鼠标按下: 按钮 = {e.Button}, 位置 = ({e.X}, {e.Y})");
            if (event_action != null)
            {
                event_action(new MouseEvent() { type = 0, mouseClickArgs = e });
            }
        }

        /// <summary>
        /// 处理鼠标滚轮事件，输出滚轮滚动值及鼠标滚动时的位置
        /// </summary>
        private void GlobalHook_MouseWheel(object sender, MouseEventArgs e)
        {
            //Debug.WriteLine($"鼠标滚轮: Delta = {e.Delta}, 位置 = ({e.X}, {e.Y})");
            if (event_action != null)
            {
                event_action(new MouseEvent() { type = 1, mouseWheelArgs = e });
            }
        }


        private void GlobalHookKeyDown(object? sender, KeyEventArgs e)
        {
            
            
            if (event_action != null)
            {
                char? ch = GetCharFromKey(e);
                if (ch.HasValue)
                {

                    event_action(new MouseEvent() { type = 2, keyPressArgs = e, keyChar = ch.Value });
                    return;
                    // 若按键在当前状态下会生成字符，发送 WM_CHAR 消息
                    //PostMessage(targetHwnd, WM_CHAR, new IntPtr(ch.Value), IntPtr.Zero);
                }
                else
                {
                    event_action(new MouseEvent() { type = 3, keyPressArgs = e });
                }
                
            }
        }

        /// <summary>
        /// 处理键盘字符输入事件
        /// </summary>
        //private void GlobalHook_KeyPress(object sender, KeyPressEventArgs e)
        //{
        //    //Debug.WriteLine($"键盘输入: {e.KeyChar}");
        //    if (event_action != null)
        //    {
        //        event_action(new MouseEvent() { type = 2, keyPressArgs = e });
        //    }
        //}

        public void Unsubscribe()
        {
            _globalHook.MouseDownExt -= GlobalHook_MouseDownExt;
            _globalHook.MouseUpExt -= _globalHook_MouseUpExt;
            _globalHook.MouseWheel -= GlobalHook_MouseWheel;
            _globalHook.KeyDown -= GlobalHookKeyDown;
            _globalHook.MouseMove -= _globalHook_MouseMove;
            _hoverTimer.Elapsed -= _hoverTimer_Elapsed;

            _globalHook.Dispose();
        }

        /// <summary>
        /// 使用 ToUnicode 将当前 KeyEventArgs 尝试转换为字符
        /// 若转换成功返回对应字符，否则返回 null
        /// </summary>
        private static char? GetCharFromKey(KeyEventArgs e)
        {
            // 获取当前键盘状态（包括修饰键信息）
            byte[] keyboardState = new byte[256];
            if (e.Shift) keyboardState[(int)Keys.ShiftKey] = 0x80;
            if (Control.IsKeyLocked(Keys.CapsLock))
                keyboardState[(int)Keys.Capital] = 0x01;

            // 根据 e.KeyCode 获取虚拟键码和扫描码
            uint virtualKey = (uint)e.KeyCode;
            uint scanCode =Win32Helper. MapVirtualKey(virtualKey, 0x0);

            StringBuilder sb = new StringBuilder(2);
            int result =Win32Helper. ToUnicode(virtualKey, scanCode, keyboardState, sb, sb.Capacity, 0);
            //Debug.WriteLine("-----"+sb.ToString());
            if (result == 1)
            {
                // 如果得到的字符为控制字符（例如 Backspace 产生的 '\b'），则返回 null
                if (char.IsControl(sb[0]))
                    return null;
                else
                    return sb[0];
            }
            return null;
        }
    }
}
