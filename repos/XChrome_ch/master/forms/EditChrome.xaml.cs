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
using Microsoft.Playwright;
using Microsoft.Win32;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
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
using XChrome.cs;
using XChrome.cs.db;
using XChrome.cs.tools.socks5;
using XChrome.cs.tools.YTools;

namespace XChrome.forms
{
    /// <summary>
    /// EditChrome.xaml 的交互逻辑
    /// </summary>
    public partial class EditChrome : AdonisUI.Controls.AdonisWindow
    {
        private string proxytext = "";
        /// <summary>
        /// chrome id ，创建的时候设置-1
        /// </summary>
        private long id = -1;
        //是否点击了确认按钮
        public bool isSuccess = false;
        public EditChrome(long id)
        {
            InitializeComponent();
            this.id = id;
        }

        /// <summary>
        /// 随机生成user-agent
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void rand_useragent_Click(object sender, RoutedEventArgs e)
        {
            string ag = GenerateRandomChromeUserAgent();
            useragent_text.Text = ag;
        }

        /// <summary>
        /// 加载分组
        /// </summary>
        /// <returns></returns>
        private async Task loadGroup()
        {
            var db = cs.db.MyDb.DB;
            var list=await db.Queryable<cs.db.Group>().OrderBy(it=>it.id,SqlSugar.OrderByType.Asc).ToListAsync();
            db.Close();

            foreach (cs.db.Group group in list) { 
                groupList.Items.Add(group);
            }

            //设置检测库
            foreach (cs.ChecKUrl cu in Enum.GetValues(typeof(cs.ChecKUrl)))
            {
                proxy_check_type.Items.Add(new ComboBoxItem() { Content = cu });
            }


            //sj_locales
            sj_locales.Items.Add(new ComboBoxItem() { Content = "[语言]" });
            var locales = cs.EnvironmentManager.Get_locales();
            foreach (var locale in locales) {
                sj_locales.Items.Add(new ComboBoxItem() { Content=locale.Value+","+locale.Key,Tag=locale.Key});
            }

            //var timezones = new[] { "Asia/Shanghai", "America/New_York", "Europe/London", "Asia/Tokyo", "Europe/Berlin" };
            //sj_timezones
            sj_timezones.Items.Add(new ComboBoxItem() { Content = "[时区]" });
            foreach (var cu in cs.EnvironmentManager.Get_timezones())
            {
                sj_timezones.Items.Add(new ComboBoxItem() { Content = cu.Value+","+ cu.Key, Tag = cu.Key });
            }
            //os
            sj_os.Items.Add(new ComboBoxItem() { Content = "[操作系统]" });
            foreach (var cu in cs.EnvironmentManager.Get_Os())
            {
                sj_os.Items.Add(new ComboBoxItem() { Content = cu.Value, Tag = cu.Key });
            }


            sj_fbl.Items.Add(new ComboBoxItem() { Content = "[分辨率]" });
            foreach(var fb in cs.EnvironmentManager.Get_resolution())
            {
                sj_fbl.Items.Add(new ComboBoxItem() { Content = fb.Key,Tag=fb.Key });
            }



            sj_isPhone.Items.Add(new ComboBoxItem() { Content = "[是否手机]" });
            sj_isPhone.Items.Add(new ComboBoxItem() { Content = "否", Tag = "false" });
            sj_isPhone.Items.Add(new ComboBoxItem() { Content = "是",Tag="true" });
            

            sj_touch.Items.Add(new ComboBoxItem() { Content = "[是否触摸]" });
            sj_touch.Items.Add(new ComboBoxItem() { Content = "否", Tag = "false" });
            sj_touch.Items.Add(new ComboBoxItem() { Content = "是" ,Tag="true"});
            


            sj_jw_city.Items.Add(new ComboBoxItem() { Content = "[按城市位置]" });
            foreach (var cu in cs.EnvironmentManager.Get_locations())
            {
                sj_jw_city.Items.Add(cu);
            }

           

        }

        /// <summary>
        /// 把环境js体现出来
        /// </summary>
        /// <returns></returns>
        private async Task Evn_show(string jsobject)
        {
            JObject? je = Newtonsoft.Json.JsonConvert.DeserializeObject(jsobject) as JObject;
            if (je == null) return;
            foreach (var item in je)
            {
                string key = item.Key;
                string value = item.Value.ToString();
                switch (key)
                {
                    case "Locale":
                        sj_locales.SelectedValue = value;
                        break;
                    case "TimezoneId":
                        sj_timezones.SelectedValue = value;
                        break;
                    case "ViewportSize":
                        sj_fbl.SelectedValue = item.Value["width"] + "x" + item.Value["height"];
                        break;
                    case "IsMobile":
                        sj_isPhone.SelectedValue = value.ToLower();
                        break;
                    case "HasTouch":
                        sj_touch.SelectedValue = value.ToLower();
                        break;
                    case "ExtraHTTPHeaders":
                        break;
                    case "Geolocation":
                        //string[] ss2 = value.Split(',');
                        sj_jw_w.Text = item.Value["Latitude"]?.ToString() ?? "";
                        sj_jw_j.Text = item.Value["Longitude"]?.ToString() ?? "";
                        break;
                }
            }
        }

        /// <summary>
        /// 把界面的环境保持到js
        /// </summary>
        /// <returns></returns>
        private async Task<string> Evn_tojs()
        {


            var environments = new Dictionary<string, object>();

            environments["Locale"] = sj_locales.SelectedValue?? "zh-CN";
            environments["TimezoneId"] = sj_timezones.SelectedValue?? "Asia/Shanghai";

            var fbl=(sj_fbl.SelectedValue?.ToString()?? "1024x768").Split('x');
            environments["ViewportSize"] = new Dictionary<string, int>
            {
                { "width", Convert.ToInt32(fbl[0]) },
                { "height", Convert.ToInt32(fbl[1]) }
            }; 

            environments["IsMobile"] =Convert.ToBoolean(sj_isPhone.SelectedValue?.ToString()??"false");
            environments["HasTouch"] = Convert.ToBoolean(sj_touch.SelectedValue?.ToString()??"false");

            string acceptLanguage = EnvironmentManager.GetAcceptLanguageFromLocales(sj_locales.SelectedValue?.ToString()?? "zh-CN");
            var extraHTTPHeaders = new Dictionary<string, string>
            {
                { "Accept-Language", acceptLanguage }
            };
            environments["ExtraHTTPHeaders"] = extraHTTPHeaders;

            environments["Geolocation"] = new Dictionary<string, double>
            {
                { "Latitude", Convert.ToDouble(sj_jw_w.Text.Trim().TryToDecimal(39.5678m)) },
                { "Longitude", Convert.ToDouble(sj_jw_j.Text.Trim().TryToDecimal(116.1234m))  }
            }; 


            return JObject.FromObject(environments).ToString();
        }

        private async Task UserAgent_show(string ua)
        {
            //string chromeVersion = $"{major}.0.{build}.{patch}";

            //// 组装 User-Agent 字符串
            //string userAgent = $"Mozilla/5.0 ({osstr}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chromeVersion} Safari/537.36";


            string pattern = @"Mozilla\/5\.0 \((?<osstr>.*?)\).*?Chrome\/(?<chromeVersion>[\d\.]+)";
            Regex regex = new Regex(pattern);

            Match match = regex.Match(ua);
            if (match.Success)
            {
                string osstr = match.Groups["osstr"].Value;
                string chromeVersion = match.Groups["chromeVersion"].Value;

                sj_os.SelectedValue = osstr;
                string[] vv = chromeVersion.Split(".");
                sj_chrome_v1.Text = vv[0];
                sj_chrome_v2.Text = vv[2];
                sj_chrome_v3.Text = vv[3];

              
            }
            else
            {
                //Console.WriteLine("未能匹配到信息");
            }

        }

        private async Task UserAgent_toText()
        {
            if (sj_os.SelectedValue == null) return;
            string ss = sj_os.SelectedValue.ToString();
            string osstr = "Windows NT 10.0; Win64";
            if (ss != "null") {
                osstr = ss;
            }
            string chromeVersion = $"{sj_chrome_v1.Text}.0.{sj_chrome_v2.Text}.{sj_chrome_v3.Text}";
            // 组装 User-Agent 字符串
            string userAgent = $"Mozilla/5.0 ({osstr}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chromeVersion} Safari/537.36";
            useragent_text.Text = userAgent;
        }

        /// <summary>
        /// 修改的时候加载数据
        /// </summary>
        /// <returns></returns>
        private async Task loadData()
        {
            var db = cs.db.MyDb.DB;
            var o=await db.Queryable<Chrome>().Where(it => it.id == id).FirstAsync();
            db.Close ();
            if (o == null)
            {
                MainWindow.Toast_Error("没有找到环境");
                return;
            }

            chromeName.Text=o.name;
            useragent_text.Text=o.userAgent;
            remark_text.Text=o.remark;
            proxy_text.Text = o.proxy;
            proxytext = o.proxyText;
            chrome_id_text.Text=id.ToString();
            othertxt.Text = o.envs;
            //exlist_text.Text = (o.extensions ?? "").Replace("|","\r\n");
            datapath_text.Text=(string.IsNullOrEmpty(o.datapath)?(System.IO.Path.Combine( Directory.GetCurrentDirectory(), "chrome_data",id.ToString())):o.datapath);
            //设置分组
            long groupid = o.groupId.Value;
            var group=groupList.Items.OfType<cs.db.Group>().FirstOrDefault(it=>it.id == groupid);
            if(group != null)groupList.SelectedItem = group;

            //其他指纹
            string envs = o.envs ?? "{}";
            await Evn_show(envs);

            //user-agent
            await UserAgent_show(o.userAgent);


        }


        private async void AdonisWindow_Loaded(object sender, RoutedEventArgs e)
        {
            //exlist_text
            //加载分组
            await loadGroup();

            if (id != -1)
            {
                //加载
                okbtntxt.Text = "确定修改";
                id_tip.Visibility = Visibility.Visible;
                id_value.Visibility = Visibility.Visible;
                await loadData();
            }
            else
            {
                //创建
                //随机useragent
                //string ag = YUtils.GetRandomUserAgent(YUtils.GetTime13(DateTime.Now).ToString());
                //随机user-agent
                GenerateRandomChromeUserAgent();
                //useragent_text.Text = ag;
                okbtntxt.Text = "确定创建";
            }

        }


        

        /// <summary>
        /// 测试代理
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private async void check_proxy_btn_Click(object sender, RoutedEventArgs e)
        {

            //先找到协议 proxy_check_type
            ChecKUrl cku = ChecKUrl.Ipip_net;
            if (proxy_check_type.SelectedIndex == 0)
            {
                // 获取所有枚举的值
                Array values = Enum.GetValues(typeof(ChecKUrl));
                // 创建 Random 对象
                Random random = new Random();
                // 随机选择一个索引，并取得对应的枚举值
                cku = (ChecKUrl)values.GetValue(random.Next(values.Length));
            }
            else
            {
                cku= (ChecKUrl)Enum.Parse(typeof(ChecKUrl), proxy_check_type.Text);
            }


            string proxy = proxy_text.Text;
            if (proxy.StartsWith("["))
            {
                MainWindow.Toast_Error("暂不支持该协议..");
                return;
            }


            //if (proxy.StartsWith("socks5"))
            //{
            //    var bb =Socks5Server.IsSocks5MustDo(proxy,out string httpproxy);
            //    if (!bb) {
            //        MainWindow.Toast_Error("socks5格式不对，正确的应该是：socks5://ip:端口:用户名:密码");
            //        return;
            //    }
            //}

            proxy = proxy.Replace("：",":");
            check_proxy_btn.IsEnabled = false;
            check_proxy_btn_text.Text = "测试中....";
            check_proxy_result.Text = "等待结果..";

            var xx= await IpChecker.CheckAsync(cku, proxy);
            if (xx.Item1 == false)
            {
                check_proxy_result.Text = xx.Item2.Length>50?xx.Item2.Substring(0,49):xx.Item2;
                check_proxy_btn.IsEnabled = true;
                check_proxy_btn_text.Text = "测试代理";
                return;
            }
            check_proxy_result.Text = xx.Item2;
            check_proxy_btn.IsEnabled = true;
            check_proxy_btn_text.Text = "测试代理";

            
        }

        /// <summary>
        /// 提交
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private async void Button_Click(object sender, RoutedEventArgs e)
        {
            string jsevn= await Evn_tojs();
            othertxt.Text = jsevn;
            string name= chromeName.Text.Trim();
            string agent= useragent_text.Text.Trim();
            long groupId = groupList.SelectedItem==null?1:( groupList.SelectedItem as cs.db.Group).id;
            string remark = remark_text.Text;
            string proxy = proxy_text.Text.Trim();
            string datapath = datapath_text.Text.Trim();
            

            Chrome c = new Chrome();
            c.name = name;
            c.userAgent = agent;
            c.proxy = proxy;
            c.proxyText = proxytext;
            c.groupId = groupId;
            c.createDate = DateTime.Now;
            c.doDate = DateTime.Now;
            c.cookie = "";
            c.remark = remark;
            c.tags = "";
            c.envs=othertxt.Text.Trim();
            //c.extensions =exlist_text.Text.Trim().Replace("\r\n","|").Replace("\n","|");
            if (datapath == System.IO.Path.Combine(Directory.GetCurrentDirectory(), "chrome_data", id.ToString()))
            {
                c.datapath = "";
            }
            else
            {
                c.datapath = datapath;
            }


            //othertxt
            if (proxy == "") c.proxyText = "";

            var db = MyDb.DB;
            try
            {
                if (id == -1)
                {
                    db.Insertable<Chrome>(c).ExecuteCommand();
                }
                else
                {
                    c.id = id;
                    db.Updateable<Chrome>(c).WhereColumns(it => it.id).ExecuteCommand();
                }
            }catch(Exception ev)
            {
                db.Close();
                MainWindow.Toast_Error(ev.Message);
                return;
            }
            
            db.Close();
            MainWindow.Toast_Success("操作成功！");
            isSuccess = true;
            this.Close();

        }

        /// <summary>
        /// 随机生成其他环境
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private async void rand_other_btn_Click(object sender, RoutedEventArgs e)
        {
            var x = GenerateRandomEnvironment();
            string y=Newtonsoft.Json.JsonConvert.SerializeObject(x);
            othertxt.Text = y;
            await Evn_show(y);
        }

        /// <summary>
        /// 随机生成浏览器环境参数，返回一个 Dictionary，
        /// 包含：UserAgent、Locale、TimezoneId、ViewportSize、DeviceScaleFactor、IsMobile、HasTouch、ExtraHTTPHeaders、Geolocation 等。
        /// </summary>
        /// <returns>包含随机环境配置的 Dictionary</returns>
        private  Dictionary<string, object> GenerateRandomEnvironment()
        {
            var random = new Random();
            var environments = new Dictionary<string, object>();

           

            // 2. 随机区域语言 Locale
            var locales = EnvironmentManager.Get_locales();
            var locale = locales.Keys.ToList()[random.Next(locales.Keys.Count)];
            

            // 3. 随机时区 TimezoneId
            var timezones = EnvironmentManager.Get_timezones();
            var timezoneId = timezones.Keys.ToList()[random.Next(timezones.Count)];

            // 4. 随机视口尺寸（宽度：800-1920, 高度：600-1080）
            var fbl = EnvironmentManager.Get_resolution();
            var fb = fbl[fbl.Keys.ToList()[random.Next(fbl.Count)]];
            var fbll = fb.Split('x');
            var viewport = new Dictionary<string, int>
            {
                { "width", Convert.ToInt32(fbll[0]) },
                { "height", Convert.ToInt32(fbll[1]) }
            };


            // 6. 随机是否为移动设备 isMobile 和是否支持触摸 hasTouch
            bool isMobile = random.Next(2) == 0; // 50% 概率
                                                 // 如果是移动设备，则一般支持触摸
            bool hasTouch = isMobile || (random.Next(2) == 0);

            // 7. 根据 Locale 随机生成 Accept-Language HTTP header
            string acceptLanguage=EnvironmentManager.GetAcceptLanguageFromLocales(locale);
            var extraHTTPHeaders = new Dictionary<string, string>
            {
                { "Accept-Language", acceptLanguage }
            };

            // 8. 随机地理位置（使用一组常见城市的坐标）

            var geolocations = EnvironmentManager.Get_locations();
            var geo = geolocations.Keys.ToList()[random.Next(geolocations.Count)];
            var geos = geo.Split(",");
            var geolocation = new Dictionary<string, double>
            {
                { "Latitude", Convert.ToDouble(geos[0]) },
                { "Longitude", Convert.ToDouble(geos[1])  }
            };

            // 将所有配置参数放入字典
            environments["Locale"] = locale;
            environments["TimezoneId"] = timezoneId;
            environments["ViewportSize"] = viewport;
            //environments["DeviceScaleFactor"] = deviceScaleFactor;
            environments["IsMobile"] = isMobile;
            environments["HasTouch"] = hasTouch;
            environments["ExtraHTTPHeaders"] = extraHTTPHeaders;
            environments["Geolocation"] = geolocation;

            return environments;
        }

        /// <summary>
        /// 随机生成一个 Chrome 浏览器的 User-Agent 字符串
        /// 格式示例：
        /// Mozilla/5.0 (平台) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{major}.0.{build}.{patch} Safari/537.36
        /// </summary>
        /// <returns>随机生成的 Chrome User-Agent 字符串</returns>
        public string GenerateRandomChromeUserAgent()
        {
            var random = new Random();
            // os
            var os = EnvironmentManager.Get_Os();
            var osstr = os.Keys.ToList()[random.Next(os.Keys.Count)];
            string osshow = os[osstr];
            sj_os.SelectedValue = osstr;

            // 生成 Chrome 版本号的各个数字部分
            // major：Chrome 主版本号，范围设定在 90 到 115 之间
            int major = random.Next(108, 120); // 随机范围 [90,115]
            // build：生成一个构建号，例如 4000 到 5999
            int build = random.Next(4000, 6000);
            // patch：生成一个补丁版本号，例如 10 到 149
            int patch = random.Next(10, 150);
            sj_chrome_v1.Text = major.ToString();
            sj_chrome_v2.Text = build.ToString();
            sj_chrome_v3.Text = patch.ToString();

            // 构造 Chrome 版本号，可以固定 minor 版本为 0
            string chromeVersion = $"{major}.0.{build}.{patch}";

            // 组装 User-Agent 字符串
            string userAgent = $"Mozilla/5.0 ({osstr}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chromeVersion} Safari/537.36";
            useragent_text.Text = userAgent;
            return userAgent;
        }

        /// <summary>
        /// 打开插件文件夹目录
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void Hyperlink_Click(object sender, RoutedEventArgs e)
        {
            string path =System.IO. Path.Combine(System.IO.Directory.GetCurrentDirectory(), "Extensions");
            if (!System.IO.Directory.Exists(path))
            {
                System.IO.Directory.CreateDirectory(path);
            }
            // 启动 Windows 资源管理器并打开文件夹
            Process.Start(new ProcessStartInfo("explorer.exe", path)
            {
                UseShellExecute = true
            });
        }
        private void Hyperlink_Click2(object sender, RoutedEventArgs e)
        {
            string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string expath = System.IO.Path.Combine(userProfile, "AppData", "Local", "Google", "Chrome", "User Data", "Default", "Extensions");
            
            if (!System.IO.Directory.Exists(expath))
            {
                MainWindow.Toast_Error("没有找到系统插件目录");
                return;
            }
            // 启动 Windows 资源管理器并打开文件夹
            Process.Start(new ProcessStartInfo("explorer.exe", expath)
            {
                UseShellExecute = true
            });
        }



        private void sj_jw_city_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            ComboBox combo = sender as ComboBox;
            if (combo.SelectedItem == null) return;
            if (combo.SelectedIndex == 0) return;
            string ss = combo.SelectedItem.ToString();

            ss = ss.Replace("[","").Replace("]","");
            string[] s = ss.Split(",");
            sj_jw_w.Text = s[0];
            sj_jw_j.Text = s[1];
        }

        private void sj_jw_city_wt_Click(object sender, RoutedEventArgs e)
        {
            string w=sj_jw_w.Text.Trim();
            string j = sj_jw_j.Text.Trim();
            if (w == "" || j == "") return;

            Random rand = new Random();
            double offset = rand.NextDouble() * 10.0 - 5.0;
            double w2 = Convert.ToDouble(w) + offset;
            rand = new Random();
            double offset2 = rand.NextDouble() * 10.0 - 5.0;
            double j2 = Convert.ToDouble(j) + offset;
            sj_jw_w.Text = w2.ToString("f4");
            sj_jw_j.Text = j2.ToString("f4");
        }

        private void default_datapath_btn_Click(object sender, RoutedEventArgs e)
        {
            if(id==-1) {
                datapath_text.Text = "";
                return;
            }
            datapath_text.Text = System.IO.Path.Combine(Directory.GetCurrentDirectory(), "chrome_data", id.ToString());
        }

        private void change_datapath_btn_Click(object sender, RoutedEventArgs e)
        {
            // 创建一个 OpenFileDialog 实例
            OpenFolderDialog openFileDialog = new OpenFolderDialog
            {
                Title = "请选择一个路径",
                // 过滤器，仅显示 exe 文件（也可以选择 All Files）
                //Filter = "Executable Files (*.exe)|*.exe|All Files (*.*)|*.*"
            };

            // 打开对话框，并判断用户是否选中文件
            if (openFileDialog.ShowDialog() == true)
            {
                // 获取用户选中的文件路径
                string selectedFile = openFileDialog.FolderName;
                datapath_text.Text = selectedFile;
            }
        }

  

        private async void sj_os_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            await UserAgent_toText();
        }


        private async void sj_chrome_v1_TextChanged(object sender, TextChangedEventArgs e)
        {
            await UserAgent_toText();
        }
    }



}
