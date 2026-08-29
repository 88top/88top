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
package com.vrem.wifianalyzer.wifi.band

import androidx.annotation.StringRes
import com.vrem.wifianalyzer.MainContext
import com.vrem.wifianalyzer.R
import com.vrem.wifianalyzer.wifi.manager.WiFiManagerWrapper

typealias Available = () -> Boolean

internal fun bandSupportGHZ5(
    wiFiManagerWrapper: () -> WiFiManagerWrapper = MainContext.INSTANCE::wiFiManagerWrapper,
): Available = { wiFiManagerWrapper().is5GHzBandSupported() }

internal fun bandSupportGHZ6(
    wiFiManagerWrapper: () -> WiFiManagerWrapper = MainContext.INSTANCE::wiFiManagerWrapper,
): Available = { wiFiManagerWrapper().is6GHzBandSupported() }

internal val availableGHZ2: Available = { true }
internal val availableGHZ5: Available = bandSupportGHZ5()
internal val availableGHZ6: Available = bandSupportGHZ6()

enum class WiFiBand(
    @get:StringRes @param:StringRes val textResource: Int,
    val wiFiChannels: WiFiChannels,
    val available: Available,
) {
    GHZ2(R.string.wifi_band_2ghz, wiFiChannelsGHZ2, availableGHZ2),
    GHZ5(R.string.wifi_band_5ghz, wiFiChannelsGHZ5, availableGHZ5),
    GHZ6(R.string.wifi_band_6ghz, wiFiChannelsGHZ6, availableGHZ6),
    ;

    val ghz2: Boolean get() = GHZ2 == this
    val ghz5: Boolean get() = GHZ5 == this
    val ghz6: Boolean get() = GHZ6 == this

    companion object {
        fun find(frequency: Int): WiFiBand = WiFiBand.entries.firstOrNull { it.wiFiChannels.inRange(frequency) } ?: GHZ2
    }
}
