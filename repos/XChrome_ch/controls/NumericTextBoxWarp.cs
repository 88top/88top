using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace XChrome.controls
{
    public class NumericTextBoxWarp
    {
        public static void Convent(TextBox textbox,int defaultValue=0)
        {
            
            if (textbox.Tag?.ToString() == "n")
            {
                EventManager.RegisterClassHandler(typeof(TextBox), DataObject.PastingEvent, new DataObjectPastingEventHandler(OnPaste));
                textbox.Tag = "n";
            }
            

            // 如果不需要输入法（如中文），可选择禁用输入法
            InputMethod.SetIsInputMethodEnabled(textbox, false);
            textbox.PreviewTextInput += Textbox_PreviewTextInput;
            textbox.Text = defaultValue.ToString();
        }

        private static void Textbox_PreviewTextInput(object sender, TextCompositionEventArgs e)
        {
            TextBox textBox = sender as TextBox;
            // 计算插入新文本后整体的内容
            string currentText = textBox.Text;
            int selectionStart = textBox.SelectionStart;
            int selectionLength = textBox.SelectionLength;

            string newText = currentText.Remove(selectionStart, selectionLength)
                                        .Insert(selectionStart, e.Text);

            // 如果新内容不符合全数字，则拦截此次输入
            if (!IsTextValid(newText))
            {
                e.Handled = true;
            }
            
            
        }

        /// <summary>
        /// 粘贴事件的处理程序，处理复制粘贴的内容是否符合要求。
        /// </summary>
        private static void OnPaste(object sender, DataObjectPastingEventArgs e)
        {
            if (sender is TextBox ntb)
            {
                if (ntb.Tag?.ToString() == "n")
                {
                    if (e.DataObject.GetDataPresent(DataFormats.UnicodeText))
                    {
                        // 获取粘贴内容
                        string pasteText = e.DataObject.GetData(DataFormats.UnicodeText) as string;

                        string currentText = ntb.Text;
                        int selectionStart = ntb.SelectionStart;
                        int selectionLength = ntb.SelectionLength;

                        // 计算粘贴后的新文本
                        string newText = currentText.Remove(selectionStart, selectionLength)
                                                    .Insert(selectionStart, pasteText);

                        // 如果新文本不合法，则取消粘贴命令
                        if (!IsTextValid(newText))
                        {
                            e.CancelCommand();
                        }
                    }
                    else
                    {
                        e.CancelCommand();
                    }
                }
                
            }
        }

        /// <summary>
        /// 校验整个文本是否符合只包含数字的要求（允许空字符串）。
        /// </summary>
        /// <param name="text"></param>
        /// <returns></returns>
        private static bool IsTextValid(string text)
        {
            // 这里允许空字符串（用户删除所有内容时），也可根据需要调整
            return Regex.IsMatch(text, @"^\d*$");
        }
    }
}
