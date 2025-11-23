FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=3001
ENV UPLOADS_DIR=/usr/src/app/uploads

EXPOSE 3001

CMD ["node", "server.js"]
