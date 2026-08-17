using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace XChrome.cs.zchrome
{
    public class XChromeExtension
    {
        /// <summary>
        /// 版本，如果需要让程序重新生成，则这里需要修改
        /// </summary>
        private string ex_ver = "1.2";
        public string ExtensionPath = "";

        public XChromeExtension(string dataPath, string id) {
            ExtensionPath = CreateTempExtension(dataPath,id);
        }


        private string CreateTempExtension(string datapath, string id)
        {
            // 创建临时目录
            var tempDir = Path.Combine(datapath,"xchrome_default_extension");

            //判断版本
            string verfile = Path.Combine(tempDir, "ver.txt");
            string vernow = "";
            if (File.Exists(verfile)) {
                vernow = System.IO.File.ReadAllText(verfile);
            }
            if (vernow == ex_ver) {
                return tempDir;
            }

            if (!Directory.Exists(tempDir)) {
                Directory.CreateDirectory(tempDir);
            }
            File.WriteAllText(
                Path.Combine(tempDir, "manifest.json"),
                GenerateManifest());

            // 生成 background.js
            File.WriteAllText(
                Path.Combine(tempDir, "content.js"),
                GenerateContentJs(id));

            File.WriteAllText(
                Path.Combine(tempDir, "background.js"),
                GenerateBackgroundJs());

            File.WriteAllText(
                Path.Combine(tempDir, "index.html"),
                GenerateHtml(id));

            //设置版本
            System.IO.File.WriteAllText(verfile,ex_ver);

            return tempDir;
        }

        private string GenerateManifest()
        {
            return @"
{
  ""manifest_version"": 3,
  ""name"": ""xchrome内置插件"",
  ""version"": ""1.0"",
  ""description"": ""xchrome内置插件 "",
  ""content_scripts"": [
    {
      ""matches"": [ ""<all_urls>"" ],
      ""js"": [ ""content.js"" ],
      ""run_at"": ""document_start""
    }
  ],
""chrome_url_overrides"": {
    ""newtab"": ""index.html""
  },
""permissions"": [
    ""tabs"",
    ""storage""
  ]

}
";
        }

        private string GenerateContentJs(string id)
        {
            return $@"


/***************************************
 * 配置信息
 ***************************************/
const titlePrefix = ""【环境-{id}】 ""; // 前缀文本
let updating = false;        // 标志：防止递归更新

/***************************************
 * 辅助函数：为标题添加前缀（如果还未添加）
 ***************************************/
function applyPrefix(title) {{
  if (typeof title !== ""string"") {{
    title = """";
  }}
  // 如果为空，不加前缀（根据需求也可以处理为空时加前缀）
  // 可选：if(title === """") return """";
  if (!title.startsWith(titlePrefix)) {{
    return titlePrefix + title;
  }}
  return title;
}}

/***************************************
 * 辅助函数：确保 <head> 与 <title> 节点存在
 ***************************************/
function ensureTitleElement(callback) {{
  if (!document.head) {{
    setTimeout(() => ensureTitleElement(callback), 50);
    return;
  }}
  let titleEl = document.querySelector(""title"");
  if (!titleEl) {{
    titleEl = document.createElement(""title"");
    document.head.appendChild(titleEl);
  }}
  callback(titleEl);
}}

/***************************************
 * 初始化：同步 _internalTitle 与 DOM 中 <title> 的内容
 ***************************************/
let _internalTitle = """";
ensureTitleElement((titleEl) => {{
  // 获取原始 title（可能为空），并加上前缀
  _internalTitle = titleEl.textContent || """";
  _internalTitle = applyPrefix(_internalTitle);
  titleEl.textContent = _internalTitle;
}});

/***************************************
 * 重写 document.title 的 getter 与 setter
 ***************************************/
Object.defineProperty(document, ""title"", {{
  configurable: true,
  enumerable: true,
  get() {{
    return _internalTitle;
  }},
  set(newTitle) {{
    newTitle = applyPrefix(newTitle);
    _internalTitle = newTitle;
    ensureTitleElement((titleEl) => {{
      if (!updating) {{
        updating = true;
        titleEl.textContent = newTitle;
        updating = false;
      }}
    }});
  }}
}});

/***************************************
 * 观察 <title> 元素的变化（可能被页面直接修改）
 ***************************************/
ensureTitleElement((titleEl) => {{
  const titleObserver = new MutationObserver(() => {{
    // 直接读取 DOM 中的内容
    const actualTitle = titleEl.textContent;
    const fixedTitle = applyPrefix(actualTitle);
    // 如果内容不符合预期，则更新 _internalTitle 及 DOM
    if (actualTitle !== fixedTitle) {{
      if (!updating) {{
        updating = true;
        _internalTitle = fixedTitle;
        titleEl.textContent = fixedTitle;
        updating = false;
      }}
    }}
  }});
  // 监视子节点和字符数据的变化，cover 直接修改 textContent 的情况
  titleObserver.observe(titleEl, {{ childList: true, characterData: true, subtree: true }});
}});

/***************************************
 * 观察 document.head 中动态添加 <title> 元素的情况
 ***************************************/
function observeHead() {{
  if (document.head) {{
    const headObserver = new MutationObserver((mutationsList) => {{
      for (const mutation of mutationsList) {{
        mutation.addedNodes.forEach((node) => {{
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.tagName.toLowerCase() === ""title""
          ) {{
            // 对新添加的 <title> 也加上前缀
            updating = true;
            node.textContent = applyPrefix(node.textContent);
            updating = false;
            // 开始监控这个新 <title> 元素
            const titleObserver2 = new MutationObserver(() => {{
              const actualTitle = node.textContent;
              const fixedTitle = applyPrefix(actualTitle);
              if (actualTitle !== fixedTitle) {{
                if (!updating) {{
                  updating = true;
                  _internalTitle = fixedTitle;
                  node.textContent = fixedTitle;
                  updating = false;
                }}
              }}
            }});
            titleObserver2.observe(node, {{ childList: true, characterData: true, subtree: true }});
          }}
        }});
      }}
    }});
    headObserver.observe(document.head, {{ childList: true }});
  }} else {{
    setTimeout(observeHead, 50);
  }}
}}
observeHead();

/***************************************
 * 调试信息（可选）：查看当前 document.title
 ***************************************/
// console.log(""content.js 已启动，当前 document.title:"", document.title);


";
        }


        private string GenerateBackgroundJs()
        {
            string js = $@"
chrome.tabs.onCreated.addListener((tab) => {{
  if (tab.url === 'chrome://newtab/') {{
    chrome.scripting.executeScript({{
      target: {{ tabId: tab.id }},
      func: () => {{
        history.replaceState({{}}, '', 'hello-home');
      }}
    }});
  }}
}});
";
            return js;
        }

        private string GenerateHtml(string id)
        {
            string js = $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"">
  <title>【环境-{id}】新页面</title>
  <link rel=""stylesheet"" href=""styles.css"">
</head>
<body>
  <div class=""container"">
    <h1 data-text=""Hello!"">Xchrome....</h1>
    <div class=""visual-effect""></div>
  </div>
  <script src=""background.js""></script>
</body>
</html>
";
            return js;
        }
        private string EscapeJsString(string input)
        {
            return input
                .Replace("\\", "\\\\")
                .Replace("'", "\\'")
                .Replace("\"", "\\\"");
        }

    }
}
