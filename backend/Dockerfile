FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY src ./src

EXPOSE 3001

ENV PORT=3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + process.env.PORT + '/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

CMD ["npm", "start"]
