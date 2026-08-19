using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace XChrome.cs.db
{
    public class Config
    {
        public Config() { }
        private System.Int64 _id;
        /// <summary>
        /// id
        /// </summary>
        public System.Int64 id { get { return this._id; } set { this._id = value; } }

        private System.String _key;
        /// <summary>
        /// name
        /// </summary>
        public System.String key { get { return this._key; } set { this._key = value; } }

        private System.String _val;
        /// <summary>
        /// remark
        /// </summary>
        public System.String val { get { return this._val; } set { this._val = value; } }
    }
}
