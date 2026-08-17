#region copyright
/**
// --------------------------------------------------------------------------------
// 文件名：EditChrome.xaml.cs
// 作者：刹那 https://x.com/chanawudi
// 公司：https://x.com/chanawudi
// 更新日期：2025，2，27，13:55
// 版权所有 © Your Company. 保留所有权利。
// --------------------------------------------------------------------------------
*/
#endregion
using log4net.Config;
using log4net;
using Microsoft.Playwright;
using Microsoft.Win32;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;
using XChrome.controls;
using XChrome.cs;
using XChrome.cs.db;
using XChrome.cs.tools.socks5;
using XChrome.cs.tools.YTools;
using XChrome.pages;

namespace XChrome.forms
{
    /// <summary>
    /// EditChrome.xaml 的交互逻辑
    /// </summary>
    public partial class MCreateChrome : AdonisUI.Controls.AdonisWindow
    {
       
        //是否点击了确认按钮
        public bool isSuccess = false;
        public MCreateChrome()
        {
            InitializeComponent();
           
        }

        private async void AdonisWindow_LoadedAsync(object sender, RoutedEventArgs e)
        {
            NumericTextBoxWarp.Convent(num_text,1);
            NumericTextBoxWarp.Convent(titleend_num,1);

            var db = cs.db.MyDb.DB;
            var list = await db.Queryable<cs.db.Group>().OrderBy(it => it.id, SqlSugar.OrderByType.Asc).ToListAsync();
            db.Close();

            foreach (cs.db.Group group in list)
            {
                groupList.Items.Add(group);
            }
        }

        private async void Button_Click(object sender, RoutedEventArgs e)
        {
            int num = num_text.Text.TryToInt32(1);
            string titlepre = titlepre_text.Text.Trim();
            int titleendStart=titleend_num.Text.TryToInt32(1);
            long groupId = groupList.SelectedItem == null ? 1 : (groupList.SelectedItem as cs.db.Group).id;
            string remark = remark_text.Text;
            bool isr = isRandom.IsChecked??false;

            Func<Task> load = async () => {
                await api.XChrome.CreateXChrome(num, groupId, titlepre, titleendStart,remark, isr, isr);
            };
            Loading l = new Loading(this, load,"批量创建中");
            l.ShowDialog();

            
            if (CManager._cmanager != null)
            {
                await CManager._cmanager.addOver();
            }
            

        }
    }



}
