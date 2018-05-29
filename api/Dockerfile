# Production Dockerfile

FROM node:6

RUN wget https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64.deb &&\
    dpkg -i dumb-init_*.deb &&\
    rm dumb-init_*.deb

ENV NODE_ENV production

WORKDIR /app

COPY package.json /app
RUN npm install

COPY ./ /app
RUN ./node_modules/.bin/babel src --out-dir build --source-maps &&\
    ./node_modules/.bin/copyfiles -u 1 src/email/templates/*.hbs build

USER 1000
CMD ["dumb-init", "node", "-r", "source-map-support/register", "-r", "babel-polyfill", "build/"]
