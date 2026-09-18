package com.wakeru.tripsplit.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import com.wakeru.tripsplit.R
import org.json.JSONObject

object TripSplitWidgetDataManager {
    private const val PREFS_NAME = "TripSplitWidgetPrefs"
    private const val KEY_WIDGET_DATA = "widget_data_json"

    fun saveWidgetData(context: Context, jsonString: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_WIDGET_DATA, jsonString).apply()
    }

    fun clearWidgetData(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().remove(KEY_WIDGET_DATA).apply()
    }

    fun getWidgetData(context: Context): JSONObject? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val json = prefs.getString(KEY_WIDGET_DATA, null) ?: return null
        return try {
            JSONObject(json)
        } catch (e: Exception) {
            null
        }
    }

    // ─────────────────────────────────────────────────────────────
    // QUICK ADD EXPENSE WIDGET
    // ─────────────────────────────────────────────────────────────
    fun updateQuickAddWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val data = getWidgetData(context)
        val activeTrip = data?.optJSONObject("activeTrip")
        val rawId = activeTrip?.optString("id") ?: ""
        val hasTrip = rawId.isNotEmpty() && rawId != "active"
        val tripTitle = if (hasTrip) activeTrip?.optString("title") ?: "Active Trip" else "No Active Trip"
        val tripId = if (hasTrip) rawId else ""

        for (widgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_quick_add_expense)
            views.setTextViewText(R.id.widget_trip_title, tripTitle)

            // Deep link Intent to open Add Expense screen (or quick-actions if no active trip)
            val deepLinkUri = if (hasTrip) {
                Uri.parse("wakeru://trips/$tripId/add-expense")
            } else {
                Uri.parse("wakeru://quick-actions")
            }
            val intent = Intent(Intent.ACTION_VIEW, deepLinkUri).apply {
                setPackage(context.packageName)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                widgetId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            views.setOnClickPendingIntent(R.id.widget_btn_add_expense, pendingIntent)
            views.setOnClickPendingIntent(R.id.widget_quick_add_root, pendingIntent)

            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }

    // ─────────────────────────────────────────────────────────────
    // TRIP SUMMARY WIDGET
    // ─────────────────────────────────────────────────────────────
    fun updateTripSummaryWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val data = getWidgetData(context)
        val activeTrip = data?.optJSONObject("activeTrip")
        val rawId = activeTrip?.optString("id") ?: ""
        val hasTrip = rawId.isNotEmpty() && rawId != "active"

        val title = if (hasTrip) activeTrip?.optString("title") ?: "Active Trip" else "No Active Trip"
        val tripId = if (hasTrip) rawId else ""
        val spent = if (hasTrip) activeTrip?.optString("spent") ?: "₹0" else "₹0"
        val budget = if (hasTrip) activeTrip?.optString("budget") ?: "₹0" else "Tap to plan"
        val userShare = if (hasTrip) activeTrip?.optString("userShare") ?: "₹0" else "₹0"
        val percent = if (hasTrip) activeTrip?.optInt("percent", 0) ?: 0 else 0

        for (widgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_trip_summary)
            views.setTextViewText(R.id.widget_trip_summary_title, title)
            views.setTextViewText(R.id.widget_trip_spent_text, spent)
            views.setTextViewText(R.id.widget_trip_share_text, userShare)
            views.setTextViewText(
                R.id.widget_trip_budget_text,
                if (hasTrip) "Budget: $budget" else "Tap to open TripSplit"
            )
            views.setTextViewText(
                R.id.widget_trip_percent_text,
                if (hasTrip) "$percent% used" else "Start trip"
            )
            views.setTextViewText(
                R.id.widget_trip_summary_badge,
                if (hasTrip) "ACTIVE" else "PLAN"
            )

            val deepLinkUri = if (hasTrip) {
                Uri.parse("wakeru://trips/$tripId")
            } else {
                Uri.parse("wakeru://home")
            }
            val intent = Intent(Intent.ACTION_VIEW, deepLinkUri).apply {
                setPackage(context.packageName)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                widgetId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            views.setOnClickPendingIntent(R.id.widget_trip_summary_root, pendingIntent)
            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }

    // ─────────────────────────────────────────────────────────────
    // BALANCES WIDGET
    // ─────────────────────────────────────────────────────────────
    fun updateBalancesWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val data = getWidgetData(context)
        val balances = data?.optJSONObject("balances")
        val totalOwed = balances?.optString("totalOwed") ?: "₹0"
        val debtorsArray = balances?.optJSONArray("topDebtors")

        for (widgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_balances)
            views.setTextViewText(R.id.widget_balances_total_text, totalOwed)

            // Debtor 1
            if (debtorsArray != null && debtorsArray.length() > 0) {
                val d1 = debtorsArray.optJSONObject(0)
                views.setViewVisibility(R.id.widget_debtor_row_1, View.VISIBLE)
                views.setTextViewText(R.id.widget_debtor_name_1, d1?.optString("name") ?: "")
                views.setTextViewText(R.id.widget_debtor_amount_1, d1?.optString("amount") ?: "")
            } else {
                views.setViewVisibility(R.id.widget_debtor_row_1, View.GONE)
            }

            // Debtor 2
            if (debtorsArray != null && debtorsArray.length() > 1) {
                val d2 = debtorsArray.optJSONObject(1)
                views.setViewVisibility(R.id.widget_debtor_row_2, View.VISIBLE)
                views.setTextViewText(R.id.widget_debtor_name_2, d2?.optString("name") ?: "")
                views.setTextViewText(R.id.widget_debtor_amount_2, d2?.optString("amount") ?: "")
            } else {
                views.setViewVisibility(R.id.widget_debtor_row_2, View.GONE)
            }

            val deepLinkUri = Uri.parse("wakeru://expenses")
            val intent = Intent(Intent.ACTION_VIEW, deepLinkUri).apply {
                setPackage(context.packageName)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                widgetId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            views.setOnClickPendingIntent(R.id.widget_balances_root, pendingIntent)
            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }

    // ─────────────────────────────────────────────────────────────
    // RELOAD ALL ACTIVE WIDGETS
    // ─────────────────────────────────────────────────────────────
    fun notifyAllWidgets(context: Context) {
        val appWidgetManager = AppWidgetManager.getInstance(context)

        // Quick Add
        val quickAddIds = appWidgetManager.getAppWidgetIds(
            ComponentName(context, QuickAddExpenseWidgetProvider::class.java)
        )
        if (quickAddIds.isNotEmpty()) {
            updateQuickAddWidget(context, appWidgetManager, quickAddIds)
        }

        // Trip Summary
        val tripSummaryIds = appWidgetManager.getAppWidgetIds(
            ComponentName(context, TripSummaryWidgetProvider::class.java)
        )
        if (tripSummaryIds.isNotEmpty()) {
            updateTripSummaryWidget(context, appWidgetManager, tripSummaryIds)
        }

        // Balances
        val balancesIds = appWidgetManager.getAppWidgetIds(
            ComponentName(context, BalancesWidgetProvider::class.java)
        )
        if (balancesIds.isNotEmpty()) {
            updateBalancesWidget(context, appWidgetManager, balancesIds)
        }
    }
}
