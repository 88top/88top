#region copyright
/**
// --------------------------------------------------------------------------------
// 文件名：EditGroup.xaml.cs
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
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;
using XChrome.cs.db;

namespace XChrome.forms
{
    /// <summary>
    /// EditGroup.xaml 的交互逻辑
    /// </summary>
    public partial class EditGroup : AdonisUI.Controls.AdonisWindow
    {
        private long id;
        private string name;
        private string remark;
        public bool isSuccess = false;
        public string errmsg = "";
        /// <summary>
        /// 如果id==-1 是创建
        /// </summary>
        /// <param name="id"></param>
        /// <param name="name"></param>
        /// <param name="remark"></param>
        public EditGroup(long id,string name="",string remark = "")
        {
            InitializeComponent();
            this.id = id;
            this.name = name;
            this.remark = remark;
        }

        private void AdonisWindow_Loaded(object sender, RoutedEventArgs e)
        {
            content.Text = name;    
            content2.Text = remark;
            if (id == -1)
            {
                okbtn.Content = "确定创建";
            }
            else {
                okbtn.Content = "确定修改";
            }
        }

        private async void okbtn_Click(object sender, RoutedEventArgs e)
        {
            //保存
            Group group = new Group();
            group.name = content.Text.Trim();
            group.remark =content2.Text;
            if (id == -1) { 
                //创建
                group.createTime = DateTime.Now;
                try
                {
                    var db = cs.db.MyDb.DB;
                    bool has=await db.Queryable<Group>().Where(g => g.name==group.name).AnyAsync();
                    if (has) {
                        errmsg = "已经存在！";
                        db.Close();
                        this.Close();
                        return;
                    }
                    await db.Insertable<Group>(group).ExecuteCommandAsync();
                    db.Close();
                }
                catch (Exception ee)
                {
                    cs.Loger.Err(ee.Message);
                    errmsg = ee.Message;
                    isSuccess = false;
                    this.Close();
                    return;
                }
                
            }
            else
            {
                //编辑
                group.id = id;
                try
                {
                    var db = cs.db.MyDb.DB;
                    await db.Updateable<Group>(group).WhereColumns(it => it.id).UpdateColumns(it => new { it.name, it.remark }).ExecuteCommandAsync();
                    db.Close();
                }
                catch (Exception ee)
                {
                    cs.Loger.Err(ee.Message);
                    errmsg = ee.Message;
                    isSuccess = false;
                    this.Close();
                    return;
                }
                
            }
            
            isSuccess = true;
            this.Close();
        }

        private void quxiao_Click(object sender, RoutedEventArgs e)
        {
            isSuccess = false;
            this.Close();
        }
    }
}
