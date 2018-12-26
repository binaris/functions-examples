FROM node:8.12.0

RUN mkdir /app
WORKDIR /app
COPY package.json /app/
RUN npm install

COPY functions/ /app/functions/

