/**
 * Created by Christoph on 19/09/16.
 */
import React from 'react';
import { Line } from 'react-chartjs-2';
import DataPlaceholder from './DataPlaceholder';

/**
 * widget displaying currently active users and trend
 */
export default class StorageUsageTimeChart extends React.Component {
  render() {
    // generating labels and values from result
    const usageLastWeekLabel = this.props.usageLastWeek.map(info => {
      return info.day;
    });
    const usageLastWeekValues = this.props.usageLastWeek.map(info => {
      return info.count;
    });

    // testing if relevant data to display
    const dataToDisplay = usageLastWeekValues.some(value => {
      return value > 0;
    });

    // defining body of the panel
    let panelbody = null;

    if (dataToDisplay) {
      // defining data for chart
      const lastWeekUsageData = {
        labels: usageLastWeekLabel,
        datasets: [
          {
            label: '# Operations',
            data: usageLastWeekValues,
            backgroundColor: 'rgba(18,115,255,0.6)',
            borderColor: 'rgba(18,115,255,1)',
          },
        ],
      };

      // setting panel
      panelbody = (
        <Line data={lastWeekUsageData} options={{ responsive: true }} />
      );
    } else {
      panelbody = <DataPlaceholder />;
    }

    return (
      <div className="panel">
        <div className="panel-heading">
          <h2>Recent Activity</h2>
        </div>
        <div className="panel-body">
          {panelbody}
        </div>
      </div>
    );
  }
}
