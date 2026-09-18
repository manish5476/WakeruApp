package com.wakeru.tripsplit.widget

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TripSplitWidgetModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "TripSplitWidgetModule"
    }

    @ReactMethod
    fun updateWidgetData(jsonString: String, promise: Promise) {
        try {
            TripSplitWidgetDataManager.saveWidgetData(reactApplicationContext, jsonString)
            TripSplitWidgetDataManager.notifyAllWidgets(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_UPDATE_WIDGET", e.message, e)
        }
    }

    @ReactMethod
    fun reloadAllWidgets(promise: Promise) {
        try {
            TripSplitWidgetDataManager.notifyAllWidgets(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_RELOAD_WIDGETS", e.message, e)
        }
    }

    @ReactMethod
    fun clearWidgetData(promise: Promise) {
        try {
            TripSplitWidgetDataManager.clearWidgetData(reactApplicationContext)
            TripSplitWidgetDataManager.notifyAllWidgets(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_CLEAR_WIDGET", e.message, e)
        }
    }
}
