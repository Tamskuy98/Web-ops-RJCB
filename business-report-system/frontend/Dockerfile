##################################################
# STAGE 1
# Build React
##################################################

FROM node:20-alpine AS build



WORKDIR /app



COPY package*.json ./



RUN npm install



COPY . .



# menghasilkan folder build/dist
RUN npm run build





##################################################
# STAGE 2
# Serve menggunakan Nginx
##################################################

FROM nginx:alpine



##################################################
# Hapus default nginx
##################################################

RUN rm -rf /usr/share/nginx/html/*



##################################################
# Copy hasil build React
##################################################

COPY --from=build \
/app/dist \
/usr/share/nginx/html



EXPOSE 80



CMD ["nginx","-g","daemon off;"]