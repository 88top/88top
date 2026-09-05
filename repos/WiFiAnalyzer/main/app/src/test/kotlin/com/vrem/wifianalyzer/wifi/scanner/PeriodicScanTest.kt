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
package com.vrem.wifianalyzer.wifi.scanner

import com.vrem.wifianalyzer.settings.Settings
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Test
import org.mockito.Mockito.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.verifyNoMoreInteractions
import org.mockito.kotlin.whenever
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Duration.Companion.seconds

private const val SCAN_SPEED = 15
private const val SCAN_SPEED_FASTER = 5
private val DELAY_INITIAL = 1.milliseconds

class PeriodicScanTest {
    private val scanner: ScannerService = mock()
    private val settings: Settings = mock()

    @After
    fun tearDown() {
        verifyNoMoreInteractions(scanner)
        verifyNoMoreInteractions(settings)
    }

    @Test
    fun runningIsFalseBeforeStart() {
        runTest {
            // Arrange
            val fixture = PeriodicScan(scanner, backgroundScope, settings)
            // Assert
            assertThat(fixture.running).isFalse
        }
    }

    @Test
    fun startDoesNotScanBeforeInitialDelay() {
        runTest {
            // Arrange
            val fixture = PeriodicScan(scanner, backgroundScope, settings)
            // Act
            fixture.start()
            testScheduler.runCurrent()
            // Assert
            assertThat(fixture.running).isTrue
            verify(scanner, never()).update()
        }
    }

    @Test
    fun startScansAfterInitialDelay() {
        runTest {
            // Arrange
            doReturn(SCAN_SPEED).whenever(settings).scanSpeed()
            val fixture = PeriodicScan(scanner, backgroundScope, settings)
            // Act
            fixture.start()
            testScheduler.advanceTimeBy(DELAY_INITIAL)
            testScheduler.runCurrent()
            // Assert
            verify(scanner).update()
            verify(settings).scanSpeed()
        }
    }

    @Test
    fun scansRepeatEveryScanInterval() {
        runTest {
            // Arrange
            doReturn(SCAN_SPEED).whenever(settings).scanSpeed()
            val fixture = PeriodicScan(scanner, backgroundScope, settings)
            // Act
            fixture.start()
            testScheduler.advanceTimeBy(DELAY_INITIAL + SCAN_SPEED.seconds * 3)
            testScheduler.runCurrent()
            // Assert
            verify(scanner, times(4)).update()
            verify(settings, times(4)).scanSpeed()
        }
    }

    @Test
    fun scanIntervalFollowsChangedScanSpeed() {
        runTest {
            // Arrange
            doReturn(SCAN_SPEED, SCAN_SPEED_FASTER).whenever(settings).scanSpeed()
            val fixture = PeriodicScan(scanner, backgroundScope, settings)
            // Act
            fixture.start()
            testScheduler.advanceTimeBy(DELAY_INITIAL)
            testScheduler.runCurrent()
            testScheduler.advanceTimeBy(SCAN_SPEED.seconds)
            testScheduler.runCurrent()
            testScheduler.advanceTimeBy(SCAN_SPEED_FASTER.seconds)
            testScheduler.runCurrent()
            // Assert
            verify(scanner, times(3)).update()
            verify(settings, times(3)).scanSpeed()
        }
    }

    @Test
    fun stopEndsTheScanLoop() {
        runTest {
            // Arrange
            doReturn(SCAN_SPEED).whenever(settings).scanSpeed()
            val fixture = PeriodicScan(scanner, backgroundScope, settings)
            fixture.start()
            testScheduler.advanceTimeBy(DELAY_INITIAL)
            testScheduler.runCurrent()
            // Act
            fixture.stop()
            testScheduler.advanceTimeBy(SCAN_SPEED.seconds * 3)
            testScheduler.runCurrent()
            // Assert
            assertThat(fixture.running).isFalse
            verify(scanner).update()
            verify(settings).scanSpeed()
        }
    }

    @Test
    fun stopBeforeStartLeavesScannerIdle() {
        runTest {
            // Arrange
            val fixture = PeriodicScan(scanner, backgroundScope, settings)
            // Act
            fixture.stop()
            testScheduler.advanceTimeBy(SCAN_SPEED.seconds * 3)
            testScheduler.runCurrent()
            // Assert
            assertThat(fixture.running).isFalse
            verify(scanner, never()).update()
        }
    }

    @Test
    fun runningIsFalseAfterScopeIsCancelled() {
        runTest {
            // Arrange
            val coroutineScope = CoroutineScope(backgroundScope.coroutineContext + SupervisorJob())
            val fixture = PeriodicScan(scanner, coroutineScope, settings)
            fixture.start()
            testScheduler.runCurrent()
            // Act
            coroutineScope.cancel()
            // Assert
            assertThat(fixture.running).isFalse
            verify(scanner, never()).update()
        }
    }

    @Test
    fun startReplacesTheRunningScanLoop() {
        runTest {
            // Arrange
            doReturn(SCAN_SPEED).whenever(settings).scanSpeed()
            val fixture = PeriodicScan(scanner, backgroundScope, settings)
            fixture.start()
            // Act
            fixture.start()
            testScheduler.advanceTimeBy(DELAY_INITIAL)
            testScheduler.runCurrent()
            // Assert
            verify(scanner).update()
            verify(settings).scanSpeed()
        }
    }
}
