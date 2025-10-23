<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Kondisca - Player Performance Tracking App

Kondisca is a comprehensive player performance tracking application designed for conditioners and coaches to monitor and analyze their players' physical metrics, daily surveys, and training schedules.

## Features

- **Player Management**: Track player information, positions, and contact details
- **Metrics Tracking**: Monitor physical measurements like height, weight, body fat percentage, and performance metrics
- **Daily Surveys**: Collect player feedback on sleep, recovery, and pain levels
- **Injury Tracking**: Monitor and manage player injuries and recovery progress
- **Training Schedule**: Plan and track team and individual training sessions
- **Analytics Dashboard**: Visualize player progress with charts and graphs
- **Role-based Access**: Separate interfaces for conditioners and players

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Netlify
- **Authentication**: Supabase Auth

## Quick Start

### Prerequisites
- Node.js 18 or higher
- Supabase account
- Netlify account (for deployment)

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd kondisca
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp env.example env.local
   
   # Edit env.local with your Supabase credentials
   # VITE_SUPABASE_URL=your_supabase_project_url
   # VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

### Setup Script
For automated setup, run:
```bash
node setup.js
```

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Deploy to Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy!

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `VITE_APP_ENV` | Environment (development/production) | No |

## Database Schema

The application uses the following main entities:
- **Users**: Authentication and role management
- **Players**: Player profiles and information
- **Metrics**: Physical measurement definitions
- **Measurements**: Actual measurement data
- **Daily Surveys**: Player feedback and wellness data
- **Injuries**: Injury tracking and recovery
- **Schedule Events**: Training and team events
- **Notes**: Coach notes and observations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
1. Check the [DEPLOYMENT.md](./DEPLOYMENT.md) for common issues
2. Review the Supabase documentation
3. Check the Netlify deployment logs

## License

This project is private and proprietary.
