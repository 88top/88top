#region copyright
/**
// --------------------------------------------------------------------------------
// 文件名：YToolConfig.cs
// 作者：刹那 https://x.com/chanawudi
// 公司：https://x.com/chanawudi
// 更新日期：2025，2，27，13:54
// 版权所有 © Your Company. 保留所有权利。
// --------------------------------------------------------------------------------
*/
#endregion
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace XChrome.cs.tools.YTools
{
    public class YToolConfig
    {
        public static Action<string> _loger = (s)=> { Console.WriteLine(s); };
        public static void SetLoger(Action<string> loger)
        {
            _loger = loger;
        }
    }
}
