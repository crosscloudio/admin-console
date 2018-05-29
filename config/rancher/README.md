# Required before deployment:

Create a file `.env-<stack-name>` (_.env-cc-admin_ or _.env-cc-testing_)
with environment variables. 

# Deploying a new version

1. Change `app.version` in the _docker-compose.yml_ file (actual version
doesn't matter and it's not required to be committed - it's just to force
rancher to redeploy the image).
2. Run `deploy.sh <stack-name>` (so `deploy.sh cc-testing` or `deploy.sh cc-admin`).
