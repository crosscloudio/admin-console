# Adding a new organization

To add a new organization:

1. "Login" to the container (see below).

2. Run the following command to add an organization to the database:

`./node_modules/.bin/babel-node ./scripts/addOrganization.js <name>`

You'll see an ID of the created organization

3. Create an admin user:

`./node_modules/.bin/babel-node ./scripts/addUser <organization_id> <email>`

After running that command, it should be possible to log in using the credentials
of the newly created user.

# Adding a new "Resellers provider"

1. "Login" to the container (see below).

2. Run the following command:

`./node_modules/.bin/babel-node scripts/addResellersProvider.js a_name_for_your_provider`

You'll see an ID nd token of the newly created provider.

# Logging in to a docker container in Rancher/Cattle

## Method A - using UI

On the main page (_User stacks_) click "cc-admin", on the next page click "app"
and then click the "Containers" tab. You'll see a list of containers. Click
the icon with tree vertical dots and then "Execute Shell".

## Method B - using CLI

Download CLI tools from https://github.com/rancher/cli/releases and install it.
NOTE: Please use version 0.5.3 - newer versions don't work with the timewarp
installation. Create new Environment API Keys in "API/Keys" UI menu.
Run `rancher config` and use https://docker.hybrid-cloud.at/v2-beta as the URL
and the data from the newly created API Key as the access / secret tokens.
Then run `rancher exec -ti cc-admin-app-1 bash` to "login" to the container.
