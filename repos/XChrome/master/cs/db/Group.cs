#region copyright
/**
// --------------------------------------------------------------------------------
// 文件名：Group.cs
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

namespace XChrome.cs.db
{
    public class Group
    {
        /// <summary>
        /// Group
        /// </summary>
        public Group()
        {
        }

        private System.Int64 _id;
        /// <summary>
        /// id
        /// </summary>
        public System.Int64 id { get { return this._id; } set { this._id = value; } }

        private System.String _name;
        /// <summary>
        /// name
        /// </summary>
        public System.String name { get { return this._name; } set { this._name = value; } }

        private System.String _remark;
        /// <summary>
        /// remark
        /// </summary>
        public System.String remark { get { return this._remark; } set { this._remark = value; } }

        private System.DateTime? _createTime;
        /// <summary>
        /// createTime
        /// </summary>
        public System.DateTime? createTime { get { return this._createTime; } set { this._createTime = value; } }

        public override string ToString()
        {
            return _name;
        }
    }
}
