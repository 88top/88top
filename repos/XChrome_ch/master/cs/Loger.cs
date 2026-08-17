#region copyright
/**
// --------------------------------------------------------------------------------
// 文件名：Loger.cs
// 作者：刹那 https://x.com/chanawudi
// 公司：https://x.com/chanawudi
// 更新日期：2025，2，27，13:55
// 版权所有 © Your Company. 保留所有权利。
// --------------------------------------------------------------------------------
*/
#endregion
using log4net;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace XChrome.cs
{
    public class Loger
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);


        public static void ErrException(Exception ev)
        {
            Loger.Err(ev.Message);
            Loger.Err(ev.StackTrace ?? "");
            if (ev.InnerException != null)
            {
                Loger.Err("---------------------------------");
                Loger.Err(ev.InnerException.Message ?? "");
                Loger.Err(ev.InnerException.StackTrace ?? "");
            }
        }
        public static void Err(string message)
        {
            try
            {
                log.Error(message);
            }
            catch (Exception e)
            {

            }

            Debug.WriteLine(message);
        }
        public static void Info(string message)
        {
            try
            {
                log.Info(message);
            }
            catch (Exception e) { }
            Debug.WriteLine(message);
            //Console.WriteLine(message);
        }
        public static void Info(string message, string message_onlyIntoFile)
        {
            try
            {
                log.Info(message);
                log.Info(message_onlyIntoFile);
            }
            catch (Exception e) { }

            Debug.WriteLine(message);
        }

        public static void only_loginfor(string message)
        {
            try
            {
                log.Info(message);
            }
            catch (Exception e) { }
        }

        public static void DeleteMoreLogers()
        {
            string path = Directory.GetCurrentDirectory() + "\\Log\\";
            if (!Directory.Exists(path)) { return; }
            var ii = new DirectoryInfo(path);
            var flist = ii.GetFiles();
            if (flist.Length == 0) return;
            List<string> list = new List<string>();
            foreach (var item in flist)
            {
                DateTime d = item.LastWriteTimeUtc;
                var sp = DateTime.UtcNow - d;
                if (sp.TotalDays > 10)
                {
                    list.Add(item.FullName);
                }
            }
            foreach (var v in list)
            {
                try
                {
                    System.IO.File.Delete(v);
                }
                catch (Exception ee) { }
            }

        }
    }
}
