import React from 'react';
import { Link } from 'react-router';
import filesize from 'filesize';
import { graphql } from 'react-apollo';
import keyBy from 'lodash/keyBy';
import sumBy from 'lodash/sumBy';

import DashboardWidget from './DashboardWidget';
import STATS_QUERY from 'queries/StatsQuery.graphql';
import StorageUsageChart from './StorageUsageChart';
import StorageUsageTimeChart from './StorageUsageTimeChart';
import StorageUsageFileTypeChart from './StorageUsageFileTypeChart';
import SyncTaskResultChart from './SyncTaskResultChart';
import LoadingIndicator from '../LoadingIndicator';
import withTourSteps from '../onboarding/withTourSteps.js';

/**
 * dashboard for widgets indicating different things about the application status
 */
@graphql(STATS_QUERY, {
  // refreshing every two second
  options: { pollInterval: 2000 },
  props: ({ data: { stats } }) => ({ stats }),
})
@withTourSteps(
  [
    {
      title: 'Active Users',
      text: 'For example: See how many team members were active today...',
      selector: '[data-tour-step="activeUsers"]',
      position: 'bottom',
      type: 'hover',
    },
    {
      title: 'Used Storages',
      text: '...or what storages are in use. 📈',
      selector: '[data-tour-step="usedStorages"]',
      position: 'right',
      type: 'hover',
    },
  ],
  'Dashboard'
)
export default class Dashboard extends React.Component {
  /**
   * displays all configured widgets
   * @returns {XML}
   */
  render() {
    const { stats } = this.props;
    if (!stats) {
      return <LoadingIndicator />;
    }

    const trafficDataByType = keyBy(stats.traffic_stats, 'type');

    // getting download traffic data
    const downloadData = trafficDataByType.DownloadSyncTask || {
      traffic: 0,
      count: 0,
    };

    // getting upload traffic data
    const uploadData = trafficDataByType.UploadSyncTask || {
      traffic: 0,
      count: 0,
    };

    // getting today active users count
    const activeUsersToday = stats.active_users_today || '0';

    // getting file type data
    const fileTypeUsage = stats.file_type_usage || [];

    // getting policy usage information
    const policyUsageList = stats.policy_usage || [];
    const policyUsage = keyBy(policyUsageList, 'type');

    // making sure required field are defined
    ['fileextension', 'mimetype'].forEach(policyType => {
      if (!policyUsage[policyType]) {
        policyUsage[policyType] = { count: 0 };
      }
    });

    // getting number of encrypted files
    const fileEncryptionInfo = stats.encryption_status || {
      encrypted_files: 0,
      not_encrypted_files: 0,
    };

    // getting data for sync rule violations
    const syncOperationStatus = stats.sync_operations_status;

    // filtering out policy violations and failed operations
    let policyViolations = 0;
    let failedOperations = 0;
    if (syncOperationStatus) {
      const syncOperationStatusByType = keyBy(syncOperationStatus, 'type');
      if (syncOperationStatusByType.blocked) {
        policyViolations = syncOperationStatusByType.blocked.count;
      } else if (syncOperationStatus.failed) {
        failedOperations = syncOperationStatusByType.failed.count;
      }
    }

    // getting total operations
    const totalOperations = sumBy(syncOperationStatus, 'count');

    // getting failed percentage
    const failedPercentage =
      totalOperations > 0 ? failedOperations / totalOperations * 100 : 0;

    // getting data for used storage doughnut diagram
    const storageUsage = stats.used_storages;
    const storageUsageData = storageUsage ? keyBy(storageUsage, 'name') : {};

    // getting data for last 7 days usage
    const usageLastWeek = stats.usage_last_week || [];

    // rendering out all dashboard elements based on data
    return (
      <div>
        <h1>Dashboard</h1>
        <div className="row">
          <div className="col-md-3">
            <DashboardWidget
              title="Upload Traffic"
              iconId="ti-angle-double-up"
              value={filesize(uploadData.traffic)}
            />
          </div>

          <div className="col-md-3">
            <DashboardWidget
              title="Download Traffic"
              iconId="ti-angle-double-down"
              value={filesize(downloadData.traffic)}
            />
          </div>

          <div className="col-md-3">
            <DashboardWidget
              value={activeUsersToday}
              title="Active Users Today"
              iconId="ti-pulse"
              tourSelector="activeUsers"
            />
          </div>

          <div className="col-md-3">
            <Link to="/analytics">
              <DashboardWidget
                value={policyViolations}
                title="Potential Rule Violations"
                iconId="ti-alert"
              />
            </Link>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <StorageUsageChart
              storageUsageData={storageUsageData}
              tourSelector="usedStorages"
            />
          </div>

          <div className="col-md-6">
            <StorageUsageTimeChart usageLastWeek={usageLastWeek} />
          </div>

          <div className="col-md-3">
            <DashboardWidget
              title="Extension Policies Configured"
              value={
                policyUsage.fileextension != null
                  ? policyUsage.fileextension.count
                  : 0
              }
              iconId="ti-file"
            />
          </div>

          <div className="col-md-3">
            <DashboardWidget
              title="MIME-Type Policies Configured"
              value={
                policyUsage.mimetype != null ? policyUsage.mimetype.count : 0
              }
              iconId="ti-dashboard"
            />
          </div>

          <div className="col-md-3">
            <DashboardWidget
              title="Files Encrypted"
              value={fileEncryptionInfo.encrypted_files}
              iconId="ti-lock"
              footer="AES-256"
            />
          </div>

          <div className="col-md-3">
            <DashboardWidget
              title="Failed Operations"
              value={`${failedPercentage} %`}
              iconId="ti-plug"
              footer=""
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <StorageUsageFileTypeChart fileTypeUsage={fileTypeUsage} />
          </div>

          <div className="col-md-6">
            <SyncTaskResultChart
              syncTaskResultData={stats.sync_operations_status}
            />
          </div>
        </div>
      </div>
    );
  }
}
