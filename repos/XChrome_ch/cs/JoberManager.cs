#region copyright
/**
// --------------------------------------------------------------------------------
// 文件名：JoberManager.cs
// 作者：刹那 https://x.com/chanawudi
// 公司：https://x.com/chanawudi
// 更新日期：2025，2，27，13:55
// 版权所有 © Your Company. 保留所有权利。
// --------------------------------------------------------------------------------
*/
#endregion
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace XChrome.cs
{
    public class JoberManager
    {
        public static bool _isStop=false;
        private static List<Func<Task>> joblist= new List<Func<Task>>();
        private static object _lock = new object();

        public static void AddJob(Func<Task> action) {
            lock (_lock) { 
                joblist.Add(action);
            }
        }

        public static void Start(int spanTime=100)
        {
            Task.Run(async () =>
            {
                while (true) {
                    if(_isStop) break;
                    for (int i = 0; i < joblist.Count; i++)
                    {
                        try
                        {
                            await joblist[i]();
                        }
                        catch (Exception ex) { }
                    }
                    await Task.Delay(spanTime);
                }
                
            });
        }
        public static void Stop() { _isStop = true; }

    }
}
