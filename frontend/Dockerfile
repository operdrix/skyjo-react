FROM node:20 as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# S'assurer que la variable est définie au moment du build
ARG VITE_BACKEND_HOST
ENV VITE_BACKEND_HOST=${VITE_BACKEND_HOST}

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Add a script to inject environment variables at runtime if needed
COPY --from=builder /app/entrypoint.sh /docker-entrypoint.d/40-replace-env-variables.sh
RUN chmod +x /docker-entrypoint.d/40-replace-env-variables.sh
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
