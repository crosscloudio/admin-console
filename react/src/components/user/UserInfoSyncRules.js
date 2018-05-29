import React from 'react';

/**
 * component displaying user sync rule information (which rules have been defined)
 */
export default class UserInfoSyncRules extends React.Component {
  render() {
    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <h2>Sync Rules</h2>
        </div>
        <div className="panel-body">
          <div className="about-area">
            <div className="table-responsive">
              <table className="table">
                <tbody>
                  <tr>
                    <th>Path</th>
                    <th>Storages</th>
                  </tr>
                  {this.props.user.sync_rules.map(syncrule => {
                    return (
                      <tr key={syncrule.id}>
                        <td>
                          {syncrule.path}
                        </td>
                        <td>
                          {syncrule.csp_ids}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
