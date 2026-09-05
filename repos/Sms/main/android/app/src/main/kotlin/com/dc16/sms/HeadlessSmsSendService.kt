package com.dc16.sms

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.telephony.SmsManager
import android.util.Log

/**
 * Manifest 声明的 RESPOND_VIA_MESSAGE 服务。
 * 处理系统“快速回复”请求：从 data URI 取目标号码、从 EXTRA_TEXT 取回复内容并发送。
 */
class HeadlessSmsSendService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        try {
            val destination = intent?.data?.schemeSpecificPart
            val message = intent?.getStringExtra(Intent.EXTRA_TEXT)
            if (!destination.isNullOrEmpty() && !message.isNullOrEmpty()) {
                SmsManager.getDefault().sendTextMessage(destination, null, message, null, null)
            } else {
                Log.w("HeadlessSmsSendService", "Missing destination or text, skip send")
            }
        } catch (e: Exception) {
            Log.e("HeadlessSmsSendService", "Failed to send quick response", e)
        } finally {
            stopSelf(startId)
        }
        return START_NOT_STICKY
    }
}
