FROM node:6

RUN wget https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64.deb &&\
    dpkg -i dumb-init_*.deb &&\
    rm dumb-init_*.deb

WORKDIR /app
USER 1000
