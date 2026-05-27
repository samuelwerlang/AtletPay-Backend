# Base image for building the application - using Node.js 22.18.0 on Alpine Linux for a smaller image size
FROM node:22.18.0-slim AS builder

#Setting up the working directory in the container
WORKDIR /app

# Copying package.json to the working directory and installing dependencies
COPY package*.json ./
RUN npm install

# Copying the rest of the application code to the working directory
COPY . .
RUN npx prisma generate
RUN npm run build

# Base image for running the application - using Node.js 22.18.0 on Alpine Linux for a smaller image size
FROM node:22.18.0-slim

WORKDIR /app
COPY package*.json ./

# Installing only production dependencies to keep the final image smaller
RUN npm install --production

# Copying the built application and generated Prisma client from the builder stage to the final image
COPY --from=builder /app/build ./build
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY .env .env

# Exposing the port that the application will run on
EXPOSE 8080

# Starting the application using the built server.js file
CMD ["npm", "run", "start"]