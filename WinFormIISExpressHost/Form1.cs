﻿using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using CefSharp;
using CefSharp.WinForms;

namespace WinFormIISExpressHost
{
    
    public partial class Form1 : Form
    {
        ChromiumWebBrowser chromeBrowser = null;
        public string DirMain = Environment.CurrentDirectory + @"\";
        public Form1()
        {
            foreach (System.Diagnostics.Process p in System.Diagnostics.Process.GetProcessesByName("iisexpress"))
            {
                KillProcess(p.ProcessName);
            }
            InitializeComponent();
            this.Load += Form1_Load;
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            var plist = System.Diagnostics.Process.GetProcessesByName("iisexpress");
            if (plist.Count() <= 0)
            {
                string para = $@"/config:{DirMain}IISExpress\AppServer\applicationhost.config";
                Start($@"{DirMain}IISExpress\iisexpress", para);

            }
            chromeBrowser = new ChromiumWebBrowser("http://localhost:5180/");
            chromeBrowser.LifeSpanHandler = new OpenPageSelf();
            panelParent.Controls.Add(chromeBrowser);
        }
        public static bool Start(string programPath, string para)
        {
            try
            {
                Process myProcess = new Process();
                myProcess.StartInfo.WindowStyle = System.Diagnostics.ProcessWindowStyle.Hidden;
                myProcess.StartInfo.UseShellExecute = false;
                myProcess.StartInfo.FileName = programPath;
                myProcess.StartInfo.CreateNoWindow = true;
                myProcess.StartInfo.Arguments = para;
                myProcess.EnableRaisingEvents = false;
                bool boo = myProcess.Start();
                return boo;
            }
            catch (Exception ex)
            {
                return false;
            }

        }
        public static void KillProcess(string monitor_ProcessName)
        {
            
            try
            {
                Process[] ps = Process.GetProcesses();
                string processNameStrList = string.Join(",", (ps.Select(p => p.ProcessName).ToArray()));
               
                foreach (Process item in ps)
                {
                    string processName = item.ProcessName.ToLower();
                    monitor_ProcessName = monitor_ProcessName.ToLower();
                    if (monitor_ProcessName.Contains(processName))
                    { 
                        if (!item.HasExited)
                        { 
                            item.Kill();
                            break;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
               
            }
            
        }
        /// <summary>
        /// 在自己窗口打开链接
        /// </summary>
        
    }
    internal class OpenPageSelf : ILifeSpanHandler
    {
        public bool DoClose(IWebBrowser browserControl, IBrowser browser)
        {
            return false;
        }

        public void OnAfterCreated(IWebBrowser browserControl, IBrowser browser)
        {

        }

        public void OnBeforeClose(IWebBrowser browserControl, IBrowser browser)
        {

        }

        public bool OnBeforePopup(IWebBrowser browserControl, IBrowser browser, IFrame frame, string targetUrl, string targetFrameName, WindowOpenDisposition targetDisposition, bool userGesture, IPopupFeatures popupFeatures, IWindowInfo windowInfo, IBrowserSettings browserSettings, ref bool noJavascriptAccess, out IWebBrowser newBrowser)
        {
            newBrowser = null;
            var chromiumWebBrowser = (ChromiumWebBrowser)browserControl;
            chromiumWebBrowser.Load(targetUrl);
            return true; //Return true to cancel the popup creation copyright by codebye.com.
        }
    }
}
