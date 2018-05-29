import { Table } from 'react-bootstrap';
import React from 'react';
import crypto from 'crypto';

/**
 * component displaying cryptographic user keys
 */
export default class UserInfoKeys extends React.Component {
  render() {
    // getting sha512 hash object and calculating hash value of user public key if set
    // todo: calculate hash when storing in database
    let keyHash = null;
    if (this.props.user.public_key) {
      const hasher = crypto.createHash('sha512');
      hasher.update(this.props.user.public_key);
      keyHash = hasher.digest('hex');
    }

    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <h2>Keys</h2>
        </div>
        <div className="panel-body">
          <div className="about-area">
            <div className="table-responsive">
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Checksum</th>
                  </tr>
                </thead>
                <tbody>
                  {this.props.user.public_key &&
                    <tr>
                      <td>
                        {this.props.user.public_key}
                      </td>
                      <td>
                        {keyHash}
                      </td>
                    </tr>}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
