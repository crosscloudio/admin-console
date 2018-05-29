# Production Dockerfile

FROM node:6

WORKDIR /source

COPY package.json /source
# TODO: move build-time dependencies required to make a production build
# from devDependencies to dependencies and set NODE_ENV=production
# before invoking `npm install`
RUN npm install

ENV NODE_ENV production

COPY ./ /source

# make a production build and move source map to a separate folder
RUN npm run dist &&\
    mkdir source-maps &&\
    mv dist/assets/*.map source-maps/
