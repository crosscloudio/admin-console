import React from 'react';

import StorageTypesEditor from './StorageTypesEditor';

export default class StorageTypes extends React.Component {
  render() {
    const { currentUser } = this.props;

    // data is not loaded yet
    if (!currentUser) {
      return null;
    }

    return <StorageTypesEditor currentUser={currentUser} />;
  }
}
