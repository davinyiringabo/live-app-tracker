# App Live Tracker

A comprehensive application monitoring system built with Next.js, SQLite, and email notifications. Monitor your applications and get instant alerts when they go down.

## Features

- **Real-time Monitoring**: Automatically checks your applications every hour
- **Email Notifications**: Get instant alerts when apps go down or come back online
- **Beautiful Dashboard**: Modern, responsive UI with real-time status updates
- **Manual Checks**: Run health checks on-demand
- **Detailed Logs**: View comprehensive check history for each application
- **SQLite Database**: File-based database for easy deployment
- **Customizable Intervals**: Set different check intervals for each app

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with better-sqlite3
- **Email**: Nodemailer
- **Monitoring**: Axios for HTTP requests, node-cron for scheduling
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd app-live-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:

```env
# Email Configuration
# For Gmail, you'll need to use an App Password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=your-email@gmail.com
```

### Email Setup

For Gmail:
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password in your `SMTP_PASS` environment variable

For other email providers, adjust the SMTP settings accordingly.

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Add your first application to monitor!

## Usage

### Adding Applications

1. Click "Add App" button
2. Enter the application name and URL
3. Set the check interval (default: 60 minutes)
4. Click "Add App"

### Monitoring Features

- **Automatic Checks**: Apps are checked every hour automatically
- **Manual Checks**: Click the refresh icon on any app card to run a manual check
- **Status Tracking**: View real-time status (Up/Down/Unknown) for all apps
- **Detailed Logs**: Click the eye icon to view check history and error details

### Email Notifications

- **Down Alerts**: Receive emails when apps go down
- **Recovery Notifications**: Get notified when apps come back online
- **Error Details**: Emails include specific error messages and timestamps

## API Endpoints

### Apps Management
- `GET /api/apps` - Get all apps
- `POST /api/apps` - Add new app
- `GET /api/apps/[id]` - Get specific app
- `PUT /api/apps/[id]` - Update app
- `DELETE /api/apps/[id]` - Delete app

### Monitoring
- `GET /api/monitor/check` - Get monitoring status
- `POST /api/monitor/check` - Run manual check

### Logs
- `GET /api/apps/[id]/logs` - Get check logs for an app

## Database Schema

### Apps Table
```sql
CREATE TABLE apps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_check DATETIME,
  last_status TEXT CHECK(last_status IN ('up', 'down')),
  check_interval INTEGER DEFAULT 60
);
```

### Check Logs Table
```sql
CREATE TABLE check_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('up', 'down')),
  response_time INTEGER,
  error_message TEXT,
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES apps (id) ON DELETE CASCADE
);
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The application uses SQLite, so it works on any platform that supports Node.js. Make sure to:

1. Set up environment variables
2. Ensure the `data/` directory is writable
3. Configure your email settings

## Configuration

### Check Intervals

You can customize check intervals per application:
- Minimum: 1 minute
- Maximum: 1440 minutes (24 hours)
- Default: 60 minutes

### Email Templates

Email templates are customizable in `src/lib/email.ts`. You can modify:
- HTML and text templates
- Subject lines
- Styling and branding

## Troubleshooting

### Common Issues

1. **Email not sending**: Check your SMTP settings and app passwords
2. **Database errors**: Ensure the `data/` directory is writable
3. **Apps not being checked**: Check the console for monitoring service logs

### Logs

Check the console output for detailed logs about:
- Health check results
- Email sending status
- Database operations
- Error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
