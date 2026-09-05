package com.dc16.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Manifest 声明的 WAP_PUSH_DELIVER 接收器占位实现。
 * 保证 manifest 组件可解析（默认短信应用资格要求该组件存在）；
 * 完整 MMS 解析入库超出本应用范围，暂不处理。
 */
class MmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Log.d("MmsReceiver", "MMS push received, action=${intent.action} (not stored)")
    }
}
