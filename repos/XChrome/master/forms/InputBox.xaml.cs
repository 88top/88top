#region copyright
/**
// --------------------------------------------------------------------------------
// 文件名：InputBox.xaml.cs
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
    /// InputBox.xaml 的交互逻辑
    /// </summary>
    public partial class InputBox : AdonisUI.Controls.AdonisWindow
    {
        public string str_value = "";
        public ComboBoxItem select_value = null;

        public InputBox(Window owner)
        {
            InitializeComponent();
            this.Owner = owner;
        }
        public InputBox(Page owner)
        {
            InitializeComponent();
            this.Owner =Window.GetWindow(owner);
        }

        /// <summary>
        /// 创建输入单行文本
        /// </summary>
        /// <param name="title">标题</param>
        /// <param name="tip">提示</param>
        /// <param name="button1"></param>
        /// <param name="button2">留空表示不显示这个按钮</param>
        /// <returns></returns>
        public InputBox CreateInput(string tip,string button1="确定",string button2="取消",int height=254)
        {
            this.Height = height;
            //this.Title = title;
            this.tip.Content = tip;
            this.okbtn.Content = button1;
            if (button2 == "")
            {
                this.quxiao.Visibility = Visibility.Hidden;
            }
            else
            {
                this.quxiao.Content = button2;
            }
            this.content.AcceptsReturn = false;
            return this;
        }
        /// <summary>
        /// 创建输入多行文本
        /// </summary>
        /// <param name="tip"></param>
        /// <param name="button1"></param>
        /// <param name="button2"></param>
        /// <param name="height"></param>
        /// <returns></returns>
        public InputBox CreateInputMuli(string tip, string button1 = "确定", string button2 = "取消", int height = 254)
        {
            CreateInput(tip, button1, button2, height);
            this.content.AcceptsReturn = true;
            return this;
        }


        public InputBox CreateSelect(string tip, List<ComboBoxItem> list, string button1 = "确定", string button2 = "取消", int height = 254)
        {
            this.Height = height;
            //this.Title = title;
            this.tip.Content = tip;
            this.okbtn.Content = button1;
            if (button2 == "")
            {
                this.quxiao.Visibility = Visibility.Hidden;
            }
            else
            {
                this.quxiao.Content = button2;
            }
            content.Visibility = Visibility.Hidden;
            combobox.Visibility = Visibility.Visible;
            foreach (ComboBoxItem item in list) { 
                combobox.Items.Add(item);
            }
            combobox.SelectedIndex = 0; 
            return this;
        }

        public string GetStrValue()
        {
            return str_value;
        }

        private void quxiao_Click(object sender, RoutedEventArgs e)
        {
            str_value = "";
            this.Close();   
        }

        private void okbtn_Click(object sender, RoutedEventArgs e)
        {
            if (combobox.Visibility == Visibility.Visible)
            {
                select_value =(ComboBoxItem) combobox.SelectedItem;
                this.Close();
                return;
            }
            str_value = this.content.Text;
            this.Close();
        }
    }
}
