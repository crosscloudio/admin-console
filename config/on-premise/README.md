# On-premise installation process

1. Install docker and docker-compose.
2. Copy the contents of this folder.
3. Generate a secret key with the following command: `cat /dev/urandom | tr -dc 'a-zA-Z0-9@^$#!*' | fold -w 96 | head -n 1`
4. Create a file `.env` with the following contents:

```bash
APP_ROOT=<your domain>
APP_UPDATE_CHANNEL=<update channel>
SECRET_KEY=<the generated random secret key>
SMTP_SENDER_EMAIL=<sender email>
SMTP_URL=smpt://sample.address:25
```

5. Install pip with `apt-get install --no-install-recommends python-pip python-wheel`.
6. Install aws cli with `pip install awscli`.
7. Login to AWS ECR with the following command:
`$(AWS_DEFAULT_REGION=eu-central-1 AWS_ACCESS_KEY_ID=the_acces_key AWS_SECRET_ACCESS_KEY=the_secret_key  aws ecr get-login)`
8. Run `./scripts/init.sh` to prepare the environment.
9. Copy an SSL certificate, a private key and a trustchain file to nginx-data/certs/
as _crosscloud.crt_, _crosscloud.key_ and _trustchain.crt_. If you don't have
the trustchain file edit _nginx.conf_ and comment `ssl_stapling`, `ssl_stapling_verify`
and `ssl_trusted_certificate`.
10. Run `docker-compose up -d` to start containers.
11. Run `docker-compose exec app bash` to "log-in" to the app. Inside the container
run the following commmands:

```bash
./node_modules/.bin/knex migrate:latest
./node_modules/.bin/babel-node ./scripts/addOrganization.js <organization_name>
./node_modules/.bin/babel-node ./scripts/addUser.js <organizationId> <email
```

12. Type `exit` to exit from the container.
13. (Optinally) change password of the `postgres` db user.
