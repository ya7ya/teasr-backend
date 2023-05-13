FROM node:18 as build-packages

COPY package*.json ./
COPY tsconfig.json ./
COPY ./packages ./packages

RUN npm ci
RUN npm run build

FROM node:18

WORKDIR /app
COPY ./src/storage/schema.sql /app/dist/storage/schema.sql
COPY --from=build-packages node_modules /app/node_modules
COPY --from=build-packages packages /app/packages

USER node













