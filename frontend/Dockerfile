FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_PRODUTOS_API_URL=/api/catalogo
ARG VITE_PEDIDOS_API_URL=/api/compras
ARG VITE_AVALIACOES_API_URL=/api/opinioes
ARG VITE_QUERY_API_URL=/api/consulta
ARG VITE_EVENT_BUS_API_URL=/api/eventos
ENV VITE_PRODUTOS_API_URL=$VITE_PRODUTOS_API_URL
ENV VITE_PEDIDOS_API_URL=$VITE_PEDIDOS_API_URL
ENV VITE_AVALIACOES_API_URL=$VITE_AVALIACOES_API_URL
ENV VITE_QUERY_API_URL=$VITE_QUERY_API_URL
ENV VITE_EVENT_BUS_API_URL=$VITE_EVENT_BUS_API_URL
RUN npm run build

FROM nginx:1.28-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
