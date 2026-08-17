#region copyright
/**
// --------------------------------------------------------------------------------
// 文件名：MyExtensions.cs
// 作者：刹那 https://x.com/chanawudi
// 公司：https://x.com/chanawudi
// 更新日期：2025，2，27，13:54
// 版权所有 © Your Company. 保留所有权利。
// --------------------------------------------------------------------------------
*/
#endregion
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace XChrome.cs.tools.YTools
{
    public static class MyExtensions
    {
        public static Dictionary<string, string> AddOrSetValue(this Dictionary<string, string> dic, string name, string value)
        {
            if (name == "origin") name = "Origin";
            if (name == "referer") name = "Referer";
            if (dic.ContainsKey(name))
                dic[name] = value;
            else
                dic.Add(name, value);
            return dic;
        }

        public static void AddOrReplace<TKey, TValue>(this IDictionary<TKey, TValue> dico, TKey key, TValue value)
        {
            if (dico.ContainsKey(key))
            {
                dico[key] = value;
            }
            else
            {
                dico.Add(key, value);
            }
        }

        public static HashSet<T> AddOrSetValue<T>(this HashSet<T> dic, T value)
        {
            if (!dic.Contains(value))
                dic.Add(value);
            
            return dic;
        }

        public static Dictionary<string, string> RemoveIfHas(this Dictionary<string, string> dic, string name)
        {
            if (dic.ContainsKey(name))
                dic.Remove(name);
            return dic;
        }

        public static string ToString2(this JObject j)
        {
            if (j == null) return "";
            return j.ToString().Replace("\r\n","").Replace("\n","");
        }

        /// <summary>
        /// 随机获取一个
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="list"></param>
        /// <returns></returns>
        public static T GetRandomOne<T>(this List<T> list)
        {
            Random r = new Random(Guid.NewGuid().GetHashCode());
            int t=r.Next(0, list.Count);
            return list[t];
        }

        public static Int32 TryToInt32(this string v,int defaultValue = -1)
        {
            try
            {
                return Convert.ToInt32(v);
            }catch(Exception ev) { return defaultValue; }
        }
        public static Int64 TryToInt64(this string v, int defaultValue = -1)
        {
            try
            {
                return Convert.ToInt64(v);
            }
            catch (Exception ev) { return defaultValue; }
        }
        public static decimal TryToDecimal(this string v, decimal defaultValue = -1)
        {
            if (v.IndexOf("e+") >= 0 || v.IndexOf("E+") >= 0)
            {
                double result;
                double.TryParse(v, System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out result);
                try
                {
                    return Convert.ToDecimal(result);
                }
                catch (Exception ev) { return defaultValue; }
            }
           


            try
            {
                return Convert.ToDecimal(v);
            }
            catch (Exception ev) { return defaultValue; }
        }

        /// <summary>
        /// 分割list
        /// </summary>
        /// <param name="dolist"></param>
        /// <param name="listNumber"></param>
        /// <returns></returns>
        public static Dictionary<int, List<T>> Split<T>(this List<T> dolist,int listNumber)
        {
            Dictionary<int, List<T>> xc_list = new Dictionary<int, List<T>>();
            int cuthreadid = 0;
            foreach (T l in dolist)
            {
                if (!xc_list.ContainsKey(cuthreadid)) xc_list.Add(cuthreadid, new List<T>());
                xc_list[cuthreadid].Add(l);
                cuthreadid++;
                if (cuthreadid >= listNumber)
                {
                    cuthreadid = 0;
                }
            }
            return xc_list;
        }
    }
}
