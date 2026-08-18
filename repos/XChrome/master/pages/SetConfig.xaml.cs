using Microsoft.Win32;
using System;
using System.Collections.Generic;
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
using XChrome.cs.db;
using XChrome.cs.tools.YTools;

namespace XChrome.pages
{
    /// <summary>
    /// SetConfig.xaml 的交互逻辑
    /// </summary>
    public partial class SetConfig : Page
    {
        public SetConfig()
        {
            InitializeComponent();
        }

        /// <summary>
        /// 打开文件夹选chrome路径
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void openFolder_btn_Click(object sender, RoutedEventArgs e)
        {
            // 创建一个 OpenFileDialog 实例
            OpenFileDialog openFileDialog = new OpenFileDialog
            {
                Title = "请选择一个 exe 文件",
                // 过滤器，仅显示 exe 文件（也可以选择 All Files）
                Filter = "Executable Files (*.exe)|*.exe|All Files (*.*)|*.*"
            };

            // 打开对话框，并判断用户是否选中文件
            if (openFileDialog.ShowDialog() == true)
            {
                // 获取用户选中的文件路径
                string selectedFile = openFileDialog.FileName;
                chromePath.Text = selectedFile;
            }
        }

        /// <summary>
        /// 提交
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private async void submit_btn_Click(object sender, RoutedEventArgs e)
        {
            string cPath = chromePath.Text.Trim();
            if (cPath != "")
            {
                if (!System.IO.File.Exists(cPath))
                {
                    MainWindow.Toast_Error("chrome路径不存在！");
                    return;
                }
            }
            string pageSize = pageSize_text.Text.Trim().TryToInt32(20).ToString();


            var db = MyDb.DB;
            var cp = await db.Queryable<cs.db.Config>().Where(it => it.key == "chromePath").FirstAsync();
            if (cp == null)
            {
                await db.Insertable<cs.db.Config>(new cs.db.Config() { key = "chromePath", val = cPath }).ExecuteCommandAsync();
            }
            else
            {
                await db.Updateable<cs.db.Config>().Where(it => it.key == "chromePath").SetColumns(it => it.val == cPath).ExecuteCommandAsync();
            }

            cp = await db.Queryable<cs.db.Config>().Where(it => it.key == "pageSize").FirstAsync();
            if (cp == null)
            {
                await db.Insertable<cs.db.Config>(new cs.db.Config() { key = "pageSize", val = pageSize }).ExecuteCommandAsync();
            }
            else
            {
                await db.Updateable<cs.db.Config>().Where(it => it.key == "pageSize").SetColumns(it => it.val == pageSize).ExecuteCommandAsync();
            }


            cs.Config.chrome_path = cPath;
            cs.Config.pageSize = pageSize.TryToInt32(20);



            db.Close();


            MainWindow.Toast_Success("保存成功");

        }


        //加载
        private void Page_Loaded(object sender, RoutedEventArgs e)
        {
            chromePath.Text = cs.Config.chrome_path;
            pageSize_text.Text=cs.Config.pageSize.ToString();
        }

        private void openFolder2_btn_Click(object sender, RoutedEventArgs e)
        {
            string path = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
            if (!File.Exists(path)) {
                MainWindow.Toast_Error("没有找到默认chrome，可能你没有安装！");
                return;
            }
            chromePath.Text = path;

        }
    }
}
