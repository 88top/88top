package com.dc16.sms

import android.content.BroadcastReceiver
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log

/**
 * Manifest 声明的 SMS_DELIVER 接收器。
 * 仅当本应用是默认短信应用时，把收到的短信写入系统短信库；
 * 非默认状态下直接忽略，避免与系统默认应用重复入库。
 */
class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_DELIVER_ACTION) return
        if (Telephony.Sms.getDefaultSmsPackage(context) != context.packageName) return
        try {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
            val resolver = context.contentResolver
            for (msg in messages) {
                val values = ContentValues().apply {
                    put(Telephony.Sms.ADDRESS, msg.originatingAddress)
                    put(Telephony.Sms.BODY, msg.messageBody)
                    put(Telephony.Sms.DATE, msg.timestampMillis)
                    put(Telephony.Sms.READ, 0)
                    put(Telephony.Sms.SEEN, 0)
                }
                resolver.insert(Telephony.Sms.Inbox.CONTENT_URI, values)
            }
        } catch (e: Exception) {
            Log.e("SmsReceiver", "Failed to store incoming SMS", e)
        }
    }
}
