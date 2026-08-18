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
package com.vrem.wifianalyzer.wifi.accesspoint

import android.widget.ExpandableListAdapter
import android.widget.ExpandableListView
import com.vrem.wifianalyzer.MainContextHelper.INSTANCE
import com.vrem.wifianalyzer.wifi.model.GroupBy
import com.vrem.wifianalyzer.wifi.model.WiFiDetail
import com.vrem.wifianalyzer.wifi.model.WiFiIdentifier
import com.vrem.wifianalyzer.wifi.model.WiFiSignal
import com.vrem.wifianalyzer.wifi.model.WiFiWidth
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Test
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.verifyNoMoreInteractions
import org.mockito.kotlin.whenever

class AccessPointsAdapterGroupTest {
    private val expandableListView: ExpandableListView = mock()
    private val expandableListAdapter: ExpandableListAdapter = mock()
    private val wiFiDetail = mock<WiFiDetail>()
    private val settings = INSTANCE.settings
    private val fixture = AccessPointsAdapterGroup()

    @After
    fun tearDown() {
        verifyNoMoreInteractions(expandableListView)
        verifyNoMoreInteractions(expandableListAdapter)
        verifyNoMoreInteractions(wiFiDetail)
        INSTANCE.restore()
    }

    @Test
    fun beforeUpdate() {
        assertThat(fixture.groupBy).isEqualTo(GroupBy.NONE)
        assertThat(fixture.expanded).isEmpty()
    }

    @Test
    fun afterUpdateWithGroupByChannel() {
        // Arrange
        val wiFiDetails = withWiFiDetails()
        doReturn(GroupBy.CHANNEL).whenever(settings).groupBy()
        doReturn(expandableListAdapter).whenever(expandableListView).expandableListAdapter
        doReturn(wiFiDetails.size).whenever(expandableListAdapter).groupCount
        // Act
        fixture.update(wiFiDetails, expandableListView)
        // Assert
        assertThat(fixture.groupBy).isEqualTo(GroupBy.CHANNEL)
        verify(settings).groupBy()
        verify(expandableListView).expandableListAdapter
        verify(expandableListAdapter).groupCount
        verify(expandableListView).collapseGroup(0)
        verify(expandableListView).collapseGroup(1)
        verify(expandableListView).collapseGroup(2)
    }

    @Test
    fun updateGroupBy() {
        // Arrange
        doReturn(GroupBy.SSID).whenever(settings).groupBy()
        // Act
        fixture.updateGroupBy()
        // Assert
        assertThat(fixture.groupBy).isEqualTo(GroupBy.SSID)
        verify(settings).groupBy()
    }

    @Test
    fun updateGroupByWillClearExpandedWhenGroupByIsChanged() {
        // Arrange
        fixture.expanded.add("TEST")
        doReturn(GroupBy.SSID).whenever(settings).groupBy()
        // Act
        fixture.updateGroupBy()
        // Assert
        assertThat(fixture.groupBy).isEqualTo(GroupBy.SSID)
        assertThat(fixture.expanded).isEmpty()
        verify(settings).groupBy()
    }

    @Test
    fun updateGroupByWillNotClearExpandedWhenGroupByIsSame() {
        // Arrange
        doReturn(GroupBy.SSID).whenever(settings).groupBy()
        fixture.updateGroupBy()
        fixture.expanded.add("TEST")
        // Act
        fixture.updateGroupBy()
        // Assert
        assertThat(fixture.expanded).isNotEmpty()
    }

    @Test
    fun onGroupExpanded() {
        // Arrange
        doReturn(GroupBy.SSID).whenever(settings).groupBy()
        fixture.updateGroupBy()
        val wiFiDetails = withWiFiDetails()
        // Act
        fixture.onGroupExpanded(wiFiDetails, 0)
        // Assert
        assertThat(fixture.expanded).contains(wiFiDetails[0].wiFiIdentifier.ssid)
    }

    @Test
    fun onGroupCollapsed() {
        // Arrange
        doReturn(GroupBy.SSID).whenever(settings).groupBy()
        fixture.updateGroupBy()
        val wiFiDetails = withWiFiDetails()
        fixture.onGroupExpanded(wiFiDetails, 0)
        // Act
        fixture.onGroupCollapsed(wiFiDetails, 0)
        // Assert
        assertThat(fixture.expanded).isEmpty()
    }

    @Test
    fun updateWithGroupByNoneDoesNotInteractWithExpandableListView() {
        // Arrange
        val wiFiDetails = withWiFiDetails()
        doReturn(GroupBy.NONE).whenever(settings).groupBy()
        // Act
        fixture.update(wiFiDetails, expandableListView)
        // Assert
        verify(settings).groupBy()
    }

    @Test
    fun updateWithExpandableListViewNullDoesNotThrow() {
        // Arrange
        val wiFiDetails = withWiFiDetails()
        doReturn(GroupBy.CHANNEL).whenever(settings).groupBy()
        // Act
        fixture.update(wiFiDetails, null)
        // Assert
        verify(settings).groupBy()
    }

    @Test
    fun onGroupExpandedWithGroupByNoneDoesNothing() {
        // Arrange
        val wiFiDetails = withWiFiDetails()
        doReturn(GroupBy.NONE).whenever(settings).groupBy()
        fixture.updateGroupBy()
        // Act
        fixture.onGroupExpanded(wiFiDetails, 0)
        // Assert
        assertThat(fixture.expanded).isEmpty()
    }

    @Test
    fun onGroupCollapsedWithGroupByNoneDoesNothing() {
        // Arrange
        val wiFiDetails = withWiFiDetails()
        doReturn(GroupBy.NONE).whenever(settings).groupBy()
        fixture.updateGroupBy()
        fixture.expanded.add("test")
        // Act
        fixture.onGroupCollapsed(wiFiDetails, 0)
        // Assert
        assertThat(fixture.expanded).contains("test")
    }

    @Test
    fun onGroupExpandedWithInvalidGroupPositionDoesNothing() {
        // Arrange
        doReturn(GroupBy.SSID).whenever(settings).groupBy()
        fixture.updateGroupBy()
        val wiFiDetails = withWiFiDetails()
        // Act
        fixture.onGroupExpanded(wiFiDetails, -1)
        fixture.onGroupExpanded(wiFiDetails, wiFiDetails.size)
        // Assert
        assertThat(fixture.expanded).isEmpty()
    }

    @Test
    fun onGroupCollapsedWithInvalidGroupPositionDoesNothing() {
        // Arrange
        doReturn(GroupBy.SSID).whenever(settings).groupBy()
        fixture.updateGroupBy()
        val wiFiDetails = withWiFiDetails()
        fixture.expanded.add("test")
        // Act
        fixture.onGroupCollapsed(wiFiDetails, -1)
        fixture.onGroupCollapsed(wiFiDetails, wiFiDetails.size)
        // Assert
        assertThat(fixture.expanded).contains("test")
    }

    @Test
    fun updateWithEmptyWiFiDetailsDoesNotThrow() {
        // Arrange
        doReturn(GroupBy.CHANNEL).whenever(settings).groupBy()
        doReturn(expandableListAdapter).whenever(expandableListView).expandableListAdapter
        doReturn(0).whenever(expandableListAdapter).groupCount
        // Act
        fixture.update(emptyList(), expandableListView)
        // Assert
        verify(settings).groupBy()
        verify(expandableListView).expandableListAdapter
        verify(expandableListAdapter).groupCount
    }

    @Test
    fun updateExpandsGroupWhenInExpandedSet() {
        // Arrange
        val wiFiDetails = withWiFiDetails()
        doReturn(GroupBy.CHANNEL).whenever(settings).groupBy()
        fixture.updateGroupBy()
        fixture.expanded.add(GroupBy.CHANNEL.group(wiFiDetails[0]))
        doReturn(expandableListAdapter).whenever(expandableListView).expandableListAdapter
        doReturn(wiFiDetails.size).whenever(expandableListAdapter).groupCount
        // Act
        fixture.update(wiFiDetails, expandableListView)
        // Assert
        verify(settings, times(2)).groupBy()
        verify(expandableListView).expandableListAdapter
        verify(expandableListAdapter).groupCount
        verify(expandableListView).expandGroup(0)
        verify(expandableListView).collapseGroup(1)
        verify(expandableListView).collapseGroup(2)
    }

    @Test
    fun onGroupCollapsedWithNoChildrenDoesNotRemove() {
        // Arrange
        doReturn(GroupBy.SSID).whenever(settings).groupBy()
        fixture.updateGroupBy()
        doReturn(false).whenever(wiFiDetail).hasChildren
        val wiFiDetails = listOf(wiFiDetail)
        fixture.expanded.add("test")
        // Act
        fixture.onGroupCollapsed(wiFiDetails, 0)
        // Assert
        assertThat(fixture.expanded).contains("test")
        verify(wiFiDetail).hasChildren
    }

    @Test
    fun onGroupExpandedWithNoChildrenDoesNotAdd() {
        // Arrange
        doReturn(GroupBy.SSID).whenever(settings).groupBy()
        fixture.updateGroupBy()
        doReturn(false).whenever(wiFiDetail).hasChildren
        val wiFiDetails = listOf(wiFiDetail)
        // Act
        fixture.onGroupExpanded(wiFiDetails, 0)
        // Assert
        assertThat(fixture.expanded).isEmpty()
        verify(wiFiDetail).hasChildren
    }

    @Test
    fun updateTogglesUsingEmptyWhenWiFiDetailMissing() {
        // Arrange
        val wiFiDetails = listOf(withWiFiDetail()) // size = 1
        doReturn(GroupBy.CHANNEL).whenever(settings).groupBy()
        fixture.updateGroupBy()
        doReturn(expandableListAdapter).whenever(expandableListView).expandableListAdapter
        doReturn(2).whenever(expandableListAdapter).groupCount
        fixture.expanded.add(GroupBy.CHANNEL.group(WiFiDetail.EMPTY))
        // Act
        fixture.update(wiFiDetails, expandableListView)
        // Assert
        verify(settings, times(2)).groupBy()
        verify(expandableListView).expandableListAdapter
        verify(expandableListAdapter).groupCount
        verify(expandableListView).collapseGroup(0)
        verify(expandableListView).expandGroup(1)
    }

    @Test
    fun onGroupExpandedAndCollapsedOnlyAffectsItemsWithChildren() {
        // Arrange
        doReturn(GroupBy.SSID).whenever(settings).groupBy()
        fixture.updateGroupBy()
        val parentWithChildren = withWiFiDetail() // has children
        val parentWithoutChildren = WiFiDetail(WiFiIdentifier("SSID-no-kids", "BSSID-no-kids"))
        val wiFiDetails = listOf(parentWithChildren, parentWithoutChildren)
        // Act
        fixture.onGroupExpanded(wiFiDetails, 0)
        fixture.onGroupExpanded(wiFiDetails, 1)
        // Assert
        assertThat(fixture.expanded).contains(GroupBy.SSID.group(parentWithChildren))
        assertThat(fixture.expanded).doesNotContain(GroupBy.SSID.group(parentWithoutChildren))
        // Act
        fixture.onGroupCollapsed(wiFiDetails, 0)
        fixture.onGroupCollapsed(wiFiDetails, 1)
        // Assert
        assertThat(fixture.expanded).isEmpty()
    }

    private fun withWiFiDetail(): WiFiDetail =
        WiFiDetail(
            WiFiIdentifier("SSID1", "BSSID1"),
            wiFiSignal = WiFiSignal(2255, 2255, WiFiWidth.MHZ_20, -40),
            children =
                listOf(
                    WiFiDetail(WiFiIdentifier("SSID1-1", "BSSID1-1")),
                    WiFiDetail(WiFiIdentifier("SSID1-2", "BSSID1-2")),
                    WiFiDetail(WiFiIdentifier("SSID1-3", "BSSID1-3")),
                ),
        )

    private fun withWiFiDetails(): List<WiFiDetail> =
        listOf(
            withWiFiDetail(),
            WiFiDetail(WiFiIdentifier("SSID2", "BSSID2")),
            WiFiDetail(WiFiIdentifier("SSID3", "BSSID3")),
        )
}
