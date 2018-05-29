# Prerequisites

The CrossCloud Administrator console uses Docker for its development environment.

## Installing Docker on OSX

Please install [Docker CE for Mac](https://store.docker.com/editions/community/docker-ce-desktop-mac).

## Installing Docker on Linux

To install Docker on Linux use instructions for your distribution from
<https://docs.docker.com/engine/installation/>.
Don't use packages available in the default repositiory of your
distribution - they are outdated.
After installing the main docker package install also docker compose
according to <https://docs.docker.com/compose/install/>.
Please remember that `docker` and `docker-compose` commands should be run
as a superuser or alternativelly additional configuration is required
(<https://docs.docker.com/engine/installation/linux/ubuntulinux/#/manage-docker-as-a-non-root-user>). 

## Installing Docker on Windows

To install Docker on Windows download the installation package from
[https://docs.docker.com/docker-for-windows/](https://docs.docker.com/docker-for-windows/)
and run it. After installation, if you don't have Hyper-V enabled, agree to
enable it and restart the machine. Then right-click on the docker icon
in the taskbar, and click _settings_. In the settings window go to
_Shared Drives_, select drives where the source code of the Administator Console is,
and click _Apply_.

In order to make autoreloaders to work on windows please run the
following command:

```bash
cp .env.sample.windows .env
```

WARNING: file system events on mounted volumes don't work on Windows. Autoreloaders
use pooling instead which could be slow and cpu hungry.

# Running

Run the following command before you run the app the first time:

```bash
docker network create crosscloud-dev
```

To run the CrossCloud Administrator console use the following command:

```bash
docker-compose up
```

The first run takes some time because base images are downloaded and dependencies
are installed. Autoreloaders are configured for both api and react part of the app
so usually, there is no need to do manual restarts after changes in the source code.

The app is available on _127.0.0.1_ (port _8000_).

To stop the app press CTRL-C in the terminal. You should see messages similar
to the following:

```
Stopping crosscloudadminconsole_frontend_1 ... done
Stopping crosscloudadminconsole_api_1 ... done
Stopping crosscloudadminconsole_db_1 ... done
```

In some cases they don't appear - then another command is needed:

```bash
docker-compose stop
```

# Caveats

* Please remove folders _api/node_modules_ and _react/node_modules_ if you used
a non-dockerized version before.

# Code linting

Run `yarn install` in the root folder of the repository to install packages
required for linting. This command also install precommit hook which formats
the code using [Prettier](https://prettier.io) and checks it using
[Eslint](http://eslint.org/).

You can also run `yarn run prettier` to format code in the whole repository
and `yarn run eslint` to check all .js files before commit.
