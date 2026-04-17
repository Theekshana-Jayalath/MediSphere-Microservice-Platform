payment-service:
  build: ./services/payment-service
  ports:
    - "5004:5004"  # Changed from "5004:5003" for consistency
  environment:
    - NODE_ENV=production
    - MONGODB_URI=mongodb://mongo:27017/medisphere
    - API_GATEWAY_URL=http://api-gateway:5015
  restart: unless-stopped
  depends_on:
    - mongo