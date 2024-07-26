# Chọn image cơ sở (base image) từ Docker Hub
FROM node:18

# Tạo thư mục ứng dụng trong container
WORKDIR /usr/src/app

# Sao chép file package.json và package-lock.json vào thư mục làm việc
COPY package*.json ./

# Cài đặt các phụ thuộc
RUN npm install

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Expose port mà ứng dụng của bạn sẽ chạy trên đó
EXPOSE 3000

# Chạy ứng dụng khi container khởi động
CMD ["npx", "nodemon", "app.js"]