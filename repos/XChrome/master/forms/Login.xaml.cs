#region copyright
/**
// --------------------------------------------------------------------------------
// 文件名：Login.xaml.cs
// 作者：刹那 https://x.com/chanawudi
// 公司：https://x.com/chanawudi
// 更新日期：2025，2，27，13:55
// 版权所有 © Your Company. 保留所有权利。
// --------------------------------------------------------------------------------
*/
#endregion
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
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
using System.Windows.Navigation;
using System.Windows.Shapes;
using XChrome.cs.tools.YTools;

namespace XChrome.forms
{
    /// <summary>
    /// Login.xaml 的交互逻辑
    /// </summary>
    public partial class Login : AdonisUI.Controls.AdonisWindow
    {
        public bool isLoginSuccess = false;
 
        public Login()
        {
            InitializeComponent();
        }

        private void AdonisWindow_Loaded(object sender, RoutedEventArgs e)
        {



            string dbp= System.IO.Path.Combine(Directory.GetCurrentDirectory(), "db");
            if (!Directory.Exists(dbp)) { 
                Directory.CreateDirectory(dbp);
            }
            string p=System.IO.Path.Combine(dbp, "logincode.txt");
            if (System.IO.Path.Exists(p)) { 
                string code=System.IO.File.ReadAllText(p);
                loginma.Text = code;
            }
        }

      

        private void gogithub_url_RequestNavigate(object sender, RequestNavigateEventArgs e)
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = cs.Config.github_url,
                    UseShellExecute = true 
                };
                Process.Start(psi);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"无法打开链接: {ex.Message}");
                MessageBox.Show($"请手动打开: {cs.Config.github_url}");
            }
            e.Handled = true;
        }

        private void goqq_url_RequestNavigate(object sender, RequestNavigateEventArgs e)
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = cs.Config.community_url,
                    UseShellExecute = true 
                };
                Process.Start(psi);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"无法打开链接: {ex.Message}");
                MessageBox.Show($"请手动打开: {cs.Config.community_url}");
            }
            e.Handled = true;
        }

        private async void Button_Click(object sender, RoutedEventArgs e)
        {
            string ma = loginma.Text.Trim();
            var b = (Button)sender;
            b.IsEnabled = false;
            bool iss = false;
            string errmsg = "";
            await Task.Run(async () =>
            {
                string dbp = System.IO.Path.Combine(Directory.GetCurrentDirectory(), "db", "logincode.txt");
                File.WriteAllText(dbp, ma);
                string url = "https://web3tool.vip/xchrome/login?code=" + ma;
                try
                {
                    var s = await new YHttp().Url(url).Get().GetAsync_String();
                    if (s.StartsWith("success"))
                    {
                        iss = true;
                    }
                    else if(s=="o!")
                    {
                        iss=false;
                        errmsg = "登陆码错误或者已经失效，请在社群公告获取最新登陆码！";
                    }
                    else
                    {
                        iss = false;
                        errmsg = "可能网络错误！";
                    }
                }
                catch (Exception ee)
                {
                    iss = false;
                    errmsg=ee.Message;
                    return;
                }
            });
            b.IsEnabled = true;
            if (iss) { isLoginSuccess = true; }
            if (!iss) { 
                MessageBox.Show(errmsg);
                return;
            }

            this.Close();

            
        }
    }
}
