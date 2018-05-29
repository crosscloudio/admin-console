q## Infrastructure
### nginx
Frontend server dlivering static content and a reverse proxy to our wsgi server

### flask
Gunicorn as wsgi container server

### mongodb
Mongodb our document database

## Users
One for each adminstrator: Yes, that makes sense. So we can add more granularity if we need, everyone can manage their own environment and sudo is there for us to provide root privileges.

### `www-data`
This is the user all services should run with, in this case it is `nginx` and `gunicorn`. Important: *Files which are served should never be owned by the `www-data` user. Owning the file usually means the user can delete and edit them, this is not what we want. Read-only access is usually enough!*


### `cc-backend`
This should be the owner of all files.

## Staging

A small setup in the style of our productive system.

Strong inspiration from [here](https://realpython.com/blog/python/kickstarting-flask-on-ubuntu-setup-and-deployment/).


### Install all the stuff:

```
sudo apt-get install -y python python-pip python-virtualenv nginx git mongodb python-dev libxml2-dev libz-dev libxslt1-dev
```

### User

Create a user, which is the owner of all files:
```
sudo useradd --home-dir /srv/cc-backend --create-home cc-backend
```

To act as this user, we can use the `su -` command:
```
sudo su - cc-backend
```


### Git Checkout

Now we generate a deployment key, for Gitlab. That one should checkout the source from our Gitlab server. This should be done as the cc-web-portal user:
```
ssh-keygen -f ~/.ssh/gl-deploy -N '' -C "GitLab Deloyment STAGING"
```
Enter that key into the Gitlab installation. 

Now we need a ssh config which refers to our key(`~/.ssh/config`):
```
Host gitlab.crosscloud.me
        IdentityFile ~/.ssh/gl-deploy

```


Try to clone our repository:
```
git clone git@gitlab.crosscloud.me:Web/backend.git
```

If that is working the directory is `/srv/cc-backend/`.

### Virtualenv and Deps
Go to the directory and change to the user. Now we create a virtualenv with python3Ö
```
virtualenv --python=/usr/bin/python venv
```


Now we install all deps for our app:
```
pip install -r requirements.txt
```
### Flask Config
In the reposetory is already a debug.cfg. That one should be adapted to the
live system. Most important is to regenerate the secret in the file and disable
the debug mode. First copy
the file to the homedirectory:

```
cp web-portal/debug.cfg flask-config.cfg
```


### Gunicorn Systemd
Next we configure systemd for our gunicorn. If the app crashes systemd will restart it automatically. I used [these Instructions](http://gunicorn-docs.readthedocs.org/en/latest/deploy.html#systemd).
The following config files should be created then:

 - `/etc/tmpfiles.d/gunicorn.conf`
 - `/etc/systemd/system/gunicorn.service`
 - `/etc/systemd/system/gunicorn.socket`

all files are in the repository in the `INSTALL-ubuntu` directory.

Afterwards you need to reload systemd: 
```
sudo systemctl daemon-reload
sudo systemd-tmpfiles --create
sudo systemd enable gunicorn
sudo systemd enable nginx 
sudo systemd start nginx 
```
