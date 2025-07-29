# AI Task Board - Database Setup Instructions

## Prerequisites
- Node.js 18+ installed
- Supabase account (free tier available)
- Google Gemini API key (optional, for AI features)

## Step 1: Set up Supabase Project

1. **Create a new Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Sign up or log in
   - Click "New Project"
   - Choose your organization
   - Enter project name: "ai-task-board"
   - Set a database password (save this!)
   - Choose a region close to you
   - Click "Create new project"

2. **Get your project credentials:**
   - In your Supabase dashboard, go to Settings → API
   - Copy the "Project URL" and "anon public" key
   - Save these for the next step

## Step 2: Configure Environment Variables

1. **Create `.env.local` file in the `web-app` directory:**
   ```bash
   cd web-app
   touch .env.local
   ```

2. **Add your environment variables:**
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Google Gemini API (optional)
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Replace the placeholder values:**
   - `your_supabase_project_url`: Your Supabase project URL
   - `your_supabase_anon_key`: Your Supabase anon key
   - `your_gemini_api_key`: Your Google Gemini API key (optional)

## Step 3: Set up Database Schema

1. **In your Supabase dashboard, go to SQL Editor**

2. **Run the schema script:**
   - Copy the contents of `supabase-schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

3. **Verify the tables were created:**
   - Go to Table Editor in your Supabase dashboard
   - You should see `tasks` and `user_profiles` tables

## Step 4: Configure Authentication

1. **In your Supabase dashboard, go to Authentication → Settings**

2. **Configure email authentication:**
   - Enable "Enable email confirmations" (optional)
   - Set your site URL (e.g., `http://localhost:3000` for development)
   - Add redirect URLs if needed

3. **Optional: Configure email templates**
   - Go to Authentication → Templates
   - Customize email templates for signup/confirmation

## Step 5: Test the Application

1. **Install dependencies:**
   ```bash
   cd web-app
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   - Go to `http://localhost:3000`
   - You should see the login/signup page
   - Create an account and test the application

## Step 6: Optional - Set up Google Gemini API

1. **Get a Gemini API key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key

2. **Add to environment variables:**
   ```env
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Restart your development server**

## Troubleshooting

### Common Issues:

1. **"Failed to load tasks from database"**
   - Check your Supabase URL and anon key
   - Verify the database schema was created correctly
   - Check the browser console for detailed error messages

2. **Authentication not working**
   - Verify your Supabase project settings
   - Check that the site URL is configured correctly
   - Ensure email confirmations are set up properly

3. **Environment variables not loading**
   - Make sure `.env.local` is in the `web-app` directory
   - Restart your development server after adding environment variables
   - Check that the variable names match exactly

### Database Schema Verification:

Run this query in your Supabase SQL Editor to verify the schema:

```sql
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('tasks', 'user_profiles')
ORDER BY table_name, ordinal_position;
```

## Production Deployment

When deploying to production:

1. **Update environment variables** with production values
2. **Set up proper redirect URLs** in Supabase Auth settings
3. **Configure your domain** in Supabase project settings
4. **Enable Row Level Security** (already configured in schema)
5. **Set up proper CORS** if needed

## Security Notes

- The application uses Row Level Security (RLS) to ensure users can only access their own data
- All database operations are authenticated
- Environment variables are properly configured for client-side access
- Supabase handles authentication securely

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are set correctly
4. Check that the database schema was created properly 