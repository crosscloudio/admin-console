/**
 * Created by Christoph on 19/09/16.
 */
import React from 'react';
import { Radar } from 'react-chartjs-2';
import DataPlaceholder from './DataPlaceholder';

/**
 * widget displaying currently active users and trend
 */
export default class StorageUsageFileTypeChart extends React.Component {
  render() {
    // preparing data for radar filetype diagram
    let filetypes = this.props.fileTypeUsage.map(info => {
      return info.type;
    });

    let fileTypeUsageCount = this.props.fileTypeUsage.map(info => {
      return info.count;
    });

    // body of panel
    let panelbody = null;

    // only display chart if more than two types are present
    if (filetypes.length > 2) {
      // if a lot of file extensions, only taking the 10 first ones
      // (as sorted descending, these will be the most important ones)
      if (filetypes.length > 10) {
        filetypes = filetypes.slice(0, 10);
        fileTypeUsageCount = fileTypeUsageCount.slice(0, 10);
      }

      // define data for chart
      const radarData = {
        labels: filetypes,
        datasets: [
          {
            label: 'Overall File Types',
            backgroundColor: 'rgba(18,115,255,0.6)',
            borderColor: 'rgba(18,115,255,1)',
            pointBackgroundColor: '#000',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: 'rgba(18,115,255,1)  ',
            pointHoverBorderColor: 'rgba(179,181,198,1)',
            data: fileTypeUsageCount,
          },
        ],
      };

      // configuring chart options (legend)
      const radarOptions = {
        responsive: true,
        legend: {
          display: false,
          position: 'right',
        },
      };

      // setting body to chart
      panelbody = <Radar data={radarData} options={radarOptions} />;
    } else {
      // setting body to text
      panelbody = <DataPlaceholder />;
    }

    return (
      <div className="panel">
        <div className="panel-heading">
          <h2>Used Filetypes (MIME)</h2>
        </div>
        <div className="panel-body">
          {panelbody}
        </div>
      </div>
    );
  }
}
