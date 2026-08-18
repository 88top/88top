#region copyright
/**
// --------------------------------------------------------------------------------
// 文件名：MyDictionary.cs
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
    public class MyDictionary<TKey,TValue>:Dictionary<TKey,TValue>
    {
        private readonly List<TKey> _orderedKeys = new List<TKey>();

        public new void Add(TKey key, TValue value)
        {
            if (!ContainsKey(key))
            {
                _orderedKeys.Add(key);
            }
            base.Add(key, value);
        }

        public new bool Remove(TKey key)
        {
            if (base.Remove(key))
            {
                _orderedKeys.Remove(key);
                return true;
            }
            return false;
        }

        public new void Clear()
        {
            base.Clear();
            _orderedKeys.Clear();
        }

        public new IEnumerator<KeyValuePair<TKey, TValue>> GetEnumerator()
        {
            foreach (var key in _orderedKeys)
            {
                yield return new KeyValuePair<TKey, TValue>(key, this[key]);
            }
        }

        public IEnumerable<TKey> OrderedKeys => _orderedKeys.AsReadOnly();
    }
}
