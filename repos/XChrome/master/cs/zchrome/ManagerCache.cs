using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using XChrome.cs.tools.YTools;
using XChrome.cs.xchrome;

namespace XChrome.cs.zchrome
{
    public class ManagerCache
    {
        private readonly object _lock_runing_xchrome = new object();
        /// <summary>
        /// 打开着的浏览器,id_xchrome
        /// </summary>
        private Dictionary<long, XChromeClient> runing_xchrome = new Dictionary<long, XChromeClient>();
        /// <summary>
        /// 句柄
        /// </summary>
        private HashSet<IntPtr> runing_hwds = new HashSet<IntPtr>();

        private Dictionary<uint, XChromeClient> runing_processId_xchrome = new Dictionary<uint, XChromeClient>();

        //是否已经启动定时调整页面
        public bool _is_jober_AdjustmentView = false;
        /// <summary>
        /// 排序的临时数据，用于快速刷新
        /// </summary>
        public string ArrayChromes_temp_data = "";

        /// <summary>
        /// 是否自动排列
        /// </summary>
        //public bool is_auto_array = false;
        /// <summary>
        /// 需要关闭的弹窗
        /// </summary>
        //public HashSet<string> closeUrls = new HashSet<string>() {
        //    "chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/notification.html",
        //    "https://www.okx.com/zh-hans/web3/extension/welcome"
        //};


        public List<XChromeClient> GetRuningXchromesList()
        {
            return runing_xchrome.Select(it => it.Value).ToList();
        }

        public List<long> GetRuningXchrome_idlist()
        {
            return runing_xchrome.Keys.ToList();
        }

        public XChromeClient? GetRuningXchromeById(long id)
        {
            if (runing_xchrome.ContainsKey(id))
            {
                return runing_xchrome[id];
            }
            return null;
        }

        public int GetRuningXchromeCount()
        {
            return runing_xchrome.Count;
        }




        /// <summary>
        /// 打开一个后设置，必须包括完整的句柄等
        /// </summary>
        /// <param name="id"></param>
        /// <param name="xchrome"></param>
        public void SetXchrome(long id, XChromeClient xchrome)
        {
            lock (_lock_runing_xchrome)
            {
                runing_xchrome.AddOrReplace(id, xchrome);
                runing_hwds.AddOrSetValue((IntPtr)xchrome.Hwnd);
                runing_processId_xchrome.AddOrReplace(xchrome.ProcessId, xchrome);
            }
        }

        /// <summary>
        /// 移除
        /// </summary>
        /// <param name="xchrome"></param>
        public void RemoveXchrome(XChromeClient xchrome)
        {
            lock (_lock_runing_xchrome)
            {
                if (runing_xchrome.ContainsKey(xchrome.Id)) runing_xchrome.Remove(xchrome.Id);
                if (runing_hwds.Contains((IntPtr)xchrome.Hwnd)) runing_hwds.Remove((IntPtr)xchrome.Hwnd);
                if (runing_processId_xchrome.ContainsKey(xchrome.ProcessId)) runing_processId_xchrome.Remove(xchrome.ProcessId);
            }
        }

        public XChromeClient? GetRuningXchromeByProcessId(uint processId)
        {
            if (runing_processId_xchrome.ContainsKey(processId))
            {
                return runing_processId_xchrome[processId];
            }
            return null;
        }

        public string GetInitScript()
        {
            return @""; 
        }

        public string GetInitScript(string local="",bool isTouch=false,string id="")
        {
            string js = "";
            if (local != "")
            {
                js += $@"
Object.defineProperty(navigator, 'language', {{get: () => '{local}'}});
Object.defineProperty(navigator, 'languages', {{get: () => ['{local}', '{local.Substring(0, local.IndexOf("-"))}']}});
"; ;
            }
            if (isTouch)
            {
                js += $@"
Object.defineProperty(navigator, 'maxTouchPoints', {{
    get: function() {{
      return 5; // 根据需要调整触控点数
    }},
    configurable: true
  }});

  // 重写 navigator.msMaxTouchPoints（IE/旧版检测逻辑可能检查这个）
  Object.defineProperty(navigator, 'msMaxTouchPoints', {{
    get: function() {{
      return 5;
    }},
    configurable: true
  }});

  // 定义 window.ontouchstart，确保其不为 undefined
  if (!('ontouchstart' in window)) {{
    Object.defineProperty(window, 'ontouchstart', {{
      value: null,
      configurable: true,
      writable: true
    }});
  }}
";
            }
            return js;
            if (id != "")
            {
                //修改title
                js += @"

// 定义一个全局内部变量保存标题
var _internalTitle = document.title;

// 修改 document.title 的 getter 与 setter
Object.defineProperty(document, 'title', {
  configurable: true,
  enumerable: true,
  get: function () {
    return _internalTitle;
  },
  set: function (newTitle) {
    if (!newTitle.startsWith(""[MY] "")) {
      newTitle = ""[MY] "" + newTitle;
    }
    _internalTitle = newTitle;
    var titleElement = document.querySelector('title');
    if (titleElement) {
      titleElement.textContent = newTitle;
    } else {
      titleElement = document.createElement('title');
      titleElement.textContent = newTitle;
      document.head.appendChild(titleElement);
    }
  }
});

// 触发 setter 处理初始标题
document.title = document.title;

console.log(""Injection using top-level code via Object.defineProperty complete"");

";
            }
            return js;

            js += @"
 
// 覆盖 document.fonts 检测
const originalFontsCheck = document.fonts.check;
document.fonts.check = function(font, text) {
  const forcedFonts = ['Arial', 'SimSun', 'Times New Roman','Andale Mono']; // 伪造支持的字体列表
  return forcedFonts.some(f => font.includes(f));
};

// 覆盖 navigator.fonts.query() (如果存在)
if (navigator.fonts?.query) {
  const originalQuery = navigator.fonts.query;
  navigator.fonts.query = async () => {
    const fonts = await originalQuery.call(navigator.fonts);
    // 返回修改后的字体列表
    return fonts.concat([{ postscriptName: 'FakeFont' }]);
  };
}

// 劫持 Canvas 字体测量
const originalFillText = CanvasRenderingContext2D.prototype.fillText;
CanvasRenderingContext2D.prototype.fillText = function(...args) {
  this.font = '12px FakeFont'; // 强制修改测量字体
  return originalFillText.apply(this, args);
};

";

            return js;
            
        }
    }
}
