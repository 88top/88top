/*
 * WiFiAnalyzer
 * Copyright (C) 2015 - 2026 VREM Software Development <VREMSoftwareDevelopment@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>
 */
package com.vrem.wifianalyzer.navigation.options

import com.vrem.wifianalyzer.MainContext
import com.vrem.wifianalyzer.R
import com.vrem.wifianalyzer.settings.Settings
import com.vrem.wifianalyzer.wifi.band.WiFiBand
import com.vrem.wifianalyzer.wifi.filter.Filter
import com.vrem.wifianalyzer.wifi.scanner.ScannerService

typealias Action = () -> Unit

internal fun scannerToggleAction(scannerService: () -> ScannerService = MainContext.INSTANCE::scannerService): Action =
    { scannerService().toggle() }

internal fun wiFiBandAction(
    wiFiBand: WiFiBand,
    settings: () -> Settings = MainContext.INSTANCE::settings,
): Action = { settings().wiFiBand(wiFiBand) }

internal val noAction: Action = { }

internal val filterAction: Action = { Filter.build().show() }

internal val scannerAction: Action = scannerToggleAction()

internal val wiFiBandAction2: Action = wiFiBandAction(WiFiBand.GHZ2)

internal val wiFiBandAction5: Action = wiFiBandAction(WiFiBand.GHZ5)

internal val wiFiBandAction6: Action = wiFiBandAction(WiFiBand.GHZ6)

internal enum class OptionAction(
    val key: Int,
    val action: Action,
) {
    NO_ACTION(-1, noAction),
    SCANNER(R.id.action_scanner, scannerAction),
    FILTER(R.id.action_filter, filterAction),
    WIFI_BAND_2(R.id.action_wifi_band_2ghz, wiFiBandAction2),
    WIFI_BAND_5(R.id.action_wifi_band_5ghz, wiFiBandAction5),
    WIFI_BAND_6(R.id.action_wifi_band_6ghz, wiFiBandAction6),
    ;

    companion object {
        fun findOptionAction(key: Int): OptionAction = entries.firstOrNull { it.key == key } ?: NO_ACTION
    }
}
