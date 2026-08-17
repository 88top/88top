#region copyright
/**
// --------------------------------------------------------------------------------
// 文件名：Loading.xaml.cs
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

namespace XChrome.forms
{
    /// <summary>
    /// Loading.xaml 的交互逻辑
    /// </summary>
    public partial class Loading : AdonisUI.Controls.AdonisWindow
    {
        private Func<Task> _action;
        public Loading(Window parent,Func<Task> action,string tip="")
        {
            InitializeComponent();
            this.Owner = parent;
            this._action = action;
            if (tip != "")
            {
                tipblock.Text = "..." + tip+ "...";
            }
        }

        private async void AdonisWindow_Loaded(object sender, RoutedEventArgs e)
        {
            await Task.Run(async () => { 
               await _action();
            });
            //await _action();
            this.Close();
        }
    }
}
