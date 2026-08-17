#region copyright
/**
// --------------------------------------------------------------------------------
// 文件名：GroupManager.xaml.cs
// 作者：刹那 https://x.com/chanawudi
// 公司：https://x.com/chanawudi
// 更新日期：2025，2，27，13:56
// 版权所有 © Your Company. 保留所有权利。
// --------------------------------------------------------------------------------
*/
#endregion
using CommunityToolkit.Mvvm.ComponentModel;
using SqlSugar;
using SqlSugar.Extensions;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
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
using XChrome.forms;

namespace XChrome.pages
{
    /// <summary>
    /// GroupManager.xaml 的交互逻辑
    /// </summary>
    public partial class GroupManager : Page
    {
        public ObservableCollection<GroupItem> TableItems { get; set; }
        public GroupManager()
        {
            InitializeComponent();
        }
        /// <summary>
        /// 更新内容
        /// </summary>
        private async Task UpdateDb()
        {
            var dic=new Dictionary<long, GroupItem>();
            foreach (var item in TableItems)
            {
                dic.Add(item.Id, item); 
            }
            var db = cs.db.MyDb.DB;
            var list =await db.Queryable<Group>().OrderBy(it => it.id, SqlSugar.OrderByType.Asc).ToListAsync();
            db.Close();

            //更新或者添加
            foreach (var item in list) {
                long id = item.id;
                if (dic.ContainsKey(id)) { 
                    var ii=dic[id];
                    ii.Name = item.name;
                    ii.Remark = item.remark;
                    //更新后删除，这样dic剩下的就是需要删除的
                    dic.Remove(id);
                }
                else
                {
                    GroupItem gi = new GroupItem();
                    gi.Id = item.id;
                    gi.Name = item.name;
                    gi.Remark = item.remark;
                    gi.CreateDate = item.createTime ?? DateTime.Now;
                    gi.Check = false;
                    TableItems.Add(gi);
                }
            }
            //删除
            if (dic.Count > 0) {
                foreach (var item in dic) {
                    TableItems.Remove(item.Value);
                }
            }
        }

        /// <summary>
        /// 刷新按钮状态
        /// </summary>
        private void flushButtons()
        {
            //默认分组不能编辑
            if (TableItems.Count == 0 || TableItems[0].Check){
                edit_button.IsEnabled = false;
                copy_button.IsEnabled = false;
                del_button.IsEnabled = false;
                return;
            }
            var c=TableItems.Where(it => it.Check==true).Count();
            if (c == 0)
            {
                edit_button.IsEnabled = false;
                copy_button.IsEnabled = false;
                del_button.IsEnabled = false;
            }
            else if (c == 1) {
                edit_button.IsEnabled = true;
                copy_button.IsEnabled = true;
                del_button.IsEnabled = true;
            }
            else
            {
                edit_button.IsEnabled = false;
                copy_button.IsEnabled = false;
                del_button.IsEnabled = true;
            }
        }

        private async Task Search(string key)
        {
            var db = cs.db.MyDb.DB;
            //先统计分组内环境数量
            var group_list =await db.Queryable<Chrome>().GroupBy(it => it.groupId).Select(t => new
            {
                GroupId = t.groupId,
                Count = SqlFunc.AggregateCount(t.groupId)
            }).ToListAsync();


            var group_count= group_list.ToDictionary(x => x.GroupId.Value, x => x.Count);
            //查询group
            var list =await db.Queryable<Group>().WhereIF(key!="",it => it.name.Contains(key)).OrderBy(it => it.id, SqlSugar.OrderByType.Asc).ToListAsync();
            db.Close();


            DataContext = null;
            TableItems = new ObservableCollection<GroupItem>();
            foreach (var item in list)
            {
                GroupItem gi = new GroupItem();
                gi.Id = item.id;
                gi.Name = item.name;
                gi.Remark = item.remark;
                gi.CreateDate = item.createTime ?? DateTime.Now;
                gi.Check = false;
                gi.ChromeNumber = group_count.ContainsKey(item.id) ? group_count[item.id] : 0;
                TableItems.Add(gi);
            }

            // 设置数据上下文
            DataContext = this;
        }


        private async void Page_Loaded(object sender, RoutedEventArgs e)
        {
            await Search("");
        }

        /// <summary>
        /// 选中shijian
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void dataGrid_SelectedCellsChanged(object sender, SelectedCellsChangedEventArgs e)
        {

            int row = -1;
            var _dataGrid = (DataGrid)sender;
            // 遍历新选中的单元格
            foreach (DataGridCellInfo cellInfo in e.AddedCells)
            {
                object rowData = cellInfo.Item;
                row = _dataGrid.Items.IndexOf(rowData);
                break;
            }
            if (row == -1) return;
            DataGridRow r = (DataGridRow)dataGrid.ItemContainerGenerator.ContainerFromIndex(row);
            //不然选中
            r.IsSelected = false;
            //改变数据
            var t = TableItems[row];
            t.Check = !t.Check;

            //判断按钮显示
            flushButtons();

        }
        /// <summary>
        /// 全选勾选
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void CheckAll_Click(object sender, RoutedEventArgs e)
        {
            bool ischeck = ((CheckBox)sender).IsChecked ?? false;
            for (int i = 0; i < TableItems.Count; i++)
            {
                TableItems[i].Check = ischeck;
            }

            //判断按钮显示
            flushButtons();
        }

        /// <summary>
        /// 点击创建分组按钮
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private async void add_button_Click(object sender, RoutedEventArgs e)
        {
            EditGroup eg = new EditGroup(-1);
            eg.Owner=Window.GetWindow(this);
            eg.ShowDialog();
            if (!eg.isSuccess) {
                MainWindow.Toast_Error(eg.errmsg);
                return;
            }
        
            MainWindow.Toast_Success("添加成功！");
            await UpdateDb();
            

        }

        /// <summary>
        /// 编辑按钮
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private async void edit_button_Click(object sender, RoutedEventArgs e)
        {
            var i= TableItems.Where(it => it.Check == true).First();
            if (i == null) return;
            EditGroup eg = new EditGroup(i.Id, i.Name, i.Remark);
            eg.Owner=Window.GetWindow(this); 
            eg.ShowDialog();
            if (!eg.isSuccess)
            {
                MainWindow.Toast_Error(eg.errmsg);
                return;
            }
            MainWindow.Toast_Success("编辑成功！");
            await UpdateDb();
        }

        /// <summary>
        /// 复制按钮
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private async void copy_button_Click(object sender, RoutedEventArgs e)
        {
            var i = TableItems.Where(it => it.Check == true).First();
            if (i == null) return;
            string n="_"+i.Name;
            Group g= new Group();
            g.name= n;
            g.remark = i.Remark;
            g.createTime=DateTime.Now;
            var db = cs.db.MyDb.DB;
            try
            {
                db.Insertable<Group>(g).ExecuteCommand();
            }
            catch (Exception ee)
            {
                db.Close();
                MainWindow.Toast_Error(ee.Message);
                return;
            }
            
            db.Close();
            MainWindow.Toast_Success("复制成功！");
            await UpdateDb();
        }

        /// <summary>
        /// 删除按钮
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private async void del_button_Click(object sender, RoutedEventArgs e)
        {
            var ilist = TableItems.Where(it => it.Check == true).Select(it=>it.Id).ToList();
            if (ilist == null) return;
            //先判断是否有不能删除的
            var db = cs.db.MyDb.DB;
            var h= await db.Queryable<Chrome>().Where(it => ilist.Contains(it.groupId.Value)).AnyAsync();
            if (h) { 
                db.Close();
                MainWindow.Toast_Error("分类下有环境，不能删除");
                return;
            }

            //开始删除
            try
            {
               await db.Deleteable<Group>().Where(it => ilist.Contains(it.id)).ExecuteCommandAsync();
            }
            catch (Exception ex) {
                db.Close();
                MainWindow.Toast_Error(ex.Message);
                return;
            }
            db.Close();
            MainWindow.Toast_Success("删除成功！");
            await UpdateDb();
        }


        /// <summary>
        /// 搜索按钮
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private async void Button_Click(object sender, RoutedEventArgs e)
        {
            string key=sText.Text;
            await Search(key);



        }
    }
    public partial class GroupItem : ObservableObject
    {
        [ObservableProperty]
        private bool check;
        [ObservableProperty]
        private long id;
        [ObservableProperty]
        private string name;
        [ObservableProperty]
        private int chromeNumber=0;
        [ObservableProperty]
        private DateTime createDate;
        [ObservableProperty]
        private string remark;

    }
}
