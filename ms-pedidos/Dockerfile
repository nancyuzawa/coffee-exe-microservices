FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
COPY package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node src ./src
USER node
EXPOSE 3002
HEALTHCHECK --interval=10s --timeout=4s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
