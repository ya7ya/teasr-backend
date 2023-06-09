FROM node:18 as build-packages

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
COPY src/storage/schema.sql /app/dist/storage/schema.sql

RUN npm ci
RUN npm run build

# FROM node:18
# COPY ./src/storage/schema.sql /app/dist/storage/schema.sql
# # COPY --from=build-packages node_modules /app/node_modules
# # COPY --from=build-packages packages /app/packages
# COPY --from=build-packages . /app/packages

USER node













