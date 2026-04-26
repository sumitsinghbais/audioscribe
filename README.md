# AudioScribe

A modern, full-stack Next.js application that transcribes short audio files using the Gemini API.

## Features
- **Next.js 15 App Router** for dynamic rendering and routing.
- **Tailwind CSS** for a premium, responsive UI.
- **PostgreSQL & Prisma ORM** for transcript and user storage.
- **Custom JWT Authentication** using `jose` and `bcryptjs`.
- **Gemini API** for ultra-fast audio transcription without keeping files on the server.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup Environment Variables:
   Create a `.env` file from the example structure:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/audioscribe"
   GEMINI_API_KEY="your-google-gemini-api-key"
   AUTH_SECRET="a-very-long-random-string-for-jwt"
   ```

3. Run Database Migrations and Seed:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
   *(Note: The seed script creates the default admin user: `admin` / `admin123`)*

4. Start Development Server:
   ```bash
   npm run dev
   ```

## Railway Deployment

Deploying to Railway is incredibly seamless. Follow these steps:

1. **Connect your GitHub Repository**:
   - Log in to your [Railway Dashboard](https://railway.app/).
   - Click **New Project** -> **Deploy from GitHub repo** and select your `audioscribe` repository.

2. **Add PostgreSQL Database**:
   - In your new Railway project, click **New** -> **Database** -> **Add PostgreSQL**.
   - Railway will automatically provision a Postgres database.

3. **Configure Environment Variables**:
   - Navigate to your Web Service in Railway -> **Variables** tab.
   - Add the following keys:
     - `DATABASE_URL`: Set the value to `${{Postgres.DATABASE_URL}}` (Railway's internal reference) or grab the connection URL from the Database service variables.
     - `GEMINI_API_KEY`: Your real Google AI API key.
     - `AUTH_SECRET`: A secure, randomly generated string (e.g. run `openssl rand -base64 32`).

4. **Deploy and Migrate**:
   - The app will automatically build because of the `"postinstall": "prisma generate"` script added to `package.json`.
   - Before your first sign-in, you must apply the schema to the Railway database. Go to your Web Service -> **Settings** -> **Deployments**.
   - Modify the custom build command or use Railway's CLI to execute:
     ```bash
     npx prisma migrate deploy
     npx prisma db seed
     ```

5. **Access Your App**:
   - Railway will generate a public domain for your web service under the **Settings** -> **Networking** tab. Click it to use your live app!
