# Local Development Setup

This guide will help you set up the Debug Partner app on your local machine.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- A Supabase account (free tier works)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd debug-partner
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is ready, go to Project Settings → API
3. Copy your project URL and anon/public key

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   ```
   VITE_SUPABASE_PROJECT_ID=your_project_id
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
   VITE_SUPABASE_URL=https://your_project_id.supabase.co
   ```

### 5. Set Up Database Schema

Run all migration files in the `supabase/migrations/` folder in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in order (by filename/timestamp)

### 6. Configure Supabase Authentication

1. In your Supabase dashboard, go to Authentication → Settings
2. Enable Email provider
3. Disable "Confirm email" for easier testing (optional)
4. Add your local development URL to Site URL: `http://localhost:8080`
5. Add redirect URLs:
   - `http://localhost:8080/**`

### 7. Set Up Edge Functions (Optional)

If you want to use the AI reasoning features:

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your_project_id
   ```

3. Set up secrets:
   ```bash
   supabase secrets set RESEND_API_KEY=your_resend_key
  
   ```

4. Deploy functions:
   ```bash
   supabase functions deploy
   ```

### 8. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Building for Production

```bash
npm run build
```

## Mobile Apps with Capacitor

### iOS Setup (macOS only)

```bash
npx cap add ios
npx cap sync
npx cap open ios
```

### Android Setup

```bash
npx cap add android
npx cap sync
npx cap open android
```

## Troubleshooting

### Database Connection Issues
- Verify your Supabase credentials in `.env`
- Check that your IP is not blocked in Supabase project settings

### Authentication Issues
- Ensure redirect URLs are configured in Supabase Auth settings
- Check that email confirmation is disabled for testing

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist`

## Environment Variables Reference

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| VITE_SUPABASE_PROJECT_ID | Your Supabase project ID | Supabase Dashboard → Settings → General |
| VITE_SUPABASE_PUBLISHABLE_KEY | Anon/public key | Supabase Dashboard → Settings → API |
| VITE_SUPABASE_URL | Your project URL | Supabase Dashboard → Settings → API |

## Support

For issues or questions, please check the documentation or open an issue in the repository.
