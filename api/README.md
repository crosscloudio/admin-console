# Find the api container name

The api container is named like `project_folder_name_api_1`. Run the following
command to find it with _docker-compose_ already running in other tab (look at
the last column):

```docker ps | grep api```

# Adding a new organization

Run `docker exec -ti backend_api_1 bash` to "log in" into a container and run
the following command:

```./node_modules/.bin/babel-node ./scripts/addOrganization.js <name>```

You'll see an ID of the created organization

# Adding a new user


Run `docker exec -ti backend_api_1 bash` to "log in" into a container
(if not already done) the following command:

```./node_modules/.bin/babel-node ./scripts/addUser <organization_id> <email>```

# Show organizations

Run `docker exec -ti backend_api_1 bash` to "log in" into a container
(if not already done) the following command:

```./node_modules/.bin/babel-node ./scripts/listOrganizations.js```

# Set users limit for an organization

Run `docker exec -ti backend_api_1 bash` to "log in" into a container
(if not already done) the following command:

```./node_modules/.bin/babel-node ./scripts/setUsersLimit.js <organizationId> <newLimit>```

# Using GraphiQL

To use GraphiQL query tool go to http://<localhost or dockerIp>:8000 and login
to the application. Then you can use it on
http://<localhost or dockerIp>:8000/graphiql

# Sample mutations

NOTE: mutation names (e. g. _AddActivityLogMutation_) are arbitrary.

## Adding activity log

```graphql
mutation AddActivityLogMutation($input: ActivityLogInput!) {
  addActivityLog(input: $input) {
    id
    type
    timestamp
  }
}
```

## Adding a CSP

```graphql
mutation AddCspMutation($input: CloudStorageProviderInput!) {
  addCloudStorageProvider(input: $input) {
    # fields to fetch - to customize
    id
    display_name
  }
}
```

## Deleting a CSP

```graphql
mutation DeleteCspMutation($unique_id: String!) {
  deleteCloudStorageProvider(unique_id: $unique_id) {
    # fields to fetch - to customize
    id
    csps {
      id
      display_name
      unique_id
    }
  }
}

```

## Adding a sync rule

```graphql
mutation AddSyncRuleMutation($path: String!, $csp_ids: [String]!) {
	addSyncRule(path: $path, csp_ids: $csp_ids) {
    # fields to fetch - to customize
    id
    path
    csp_ids
  }
}
```

## Deleting a sync rule

```graphql
mutation DeleteSyncRuleMutation($path: String!) {
	deleteSyncRule(path: $path) {
    # fields to fetch - to customize
    id
  }
}
```

# Sample requests in python

## Query

```python
QUERY_TEXT = '''{
  currentUser {
    id
    email
    roles
  }
}'''

token = '....'

response = requests.post(
  'http://<localhost or docker ip>:3030/graphql',
  data=json.dumps({'query': QUERY_TEXT}),
  headers={
    'Authorization': 'Bearer {}'.format(token),
    'Content-Type': 'application/json'
  }
)
```

## Mutation

### Adding activity log

```python
MUTATION_TEXT = '''
mutation AddActivityLogMutation($input: ActivityLogInput!) {
  addActivityLog(input: $input) {
    id
    type
    timestamp
  }
}
'''

token = '....'
input = {
  "type": "a type",
  "timestamp": "2017-01-22T13:46:29.693Z",
  "path": ["a", "b"]
}

response = requests.post(
  'http://<localhost or docker ip>:3030/graphql',
  data=json.dumps({
    'query': MUTATION_TEXT,
    'variables': {
      'input': input
    }
  }),
  headers={
    'Authorization': 'Bearer {}'.format(token),
    'Content-Type': 'application/json'
  }
)
```

### Update user config

```python
MUTATION_TEXT = '''
mutation UpdateUserConfigMutation($machine_id: String!) {
  updateUserConfig(machine_id: $machine_id) {
    id
    machine_id
  }
}
'''

token = '....'
variables = {
  "machine_id": "a machine id"
}

response = requests.post(
  'http://<localhost or docker ip>:3030/graphql',
  data=json.dumps({
    'query': MUTATION_TEXT,
    'variables': variables,
  }),
  headers={
    'Authorization': 'Bearer {}'.format(token),
    'Content-Type': 'application/json'
  }
)
```
