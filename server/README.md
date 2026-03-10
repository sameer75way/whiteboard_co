# Backend built with Express, Node.js, and MongoDB

## Setup
1. Create a `.env` file referencing `.env.example`:
    ```env
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/whiteboard-app
    JWT_SECRET=supersecret123
    JWT_REFRESH_SECRET=refreshsecret456
    CLIENT_URL=http://localhost:5173
    SMTP_HOST=smtp.mailtrap.io
    SMTP_PORT=2525
    SMTP_USER=user
    SMTP_PASS=pass
    SMTP_FROM=noreply@example.com
    ```
2. Run `npm install`
3. Run `npm run dev` to start the server

## Build
```bash
npm run build
```
