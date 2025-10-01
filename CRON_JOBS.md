# OpenCATI Cron Job System

This document explains the automated cron job system for calculating CATI rewards.

## Overview

The CATI reward calculation system has been moved from being calculated during pack opening to being handled by automated cron jobs that run every 5 minutes. This improves performance and ensures consistent reward calculations.

## Components

### 1. Cron Manager (`/src/lib/cron-manager.ts`)
- Manages all scheduled cron jobs
- Automatically initializes when the application starts
- Schedules reward calculation to run every 5 minutes
- Provides manual trigger functionality

### 2. Reward Calculation Endpoint (`/src/app/api/cron/rewards/route.ts`)
- Processes all active seasons
- Calculates and updates CATI rewards for user cards
- Updates season rewards for all users
- Protected by `CRON_SECRET` authentication

### 3. Cron Initialization (`/src/app/api/cron/init/route.ts`)
- Manual initialization endpoint for cron jobs
- Returns status of all scheduled jobs
- Protected by `CRON_SECRET` authentication

### 4. Manual Trigger (`/src/app/api/cron/trigger/route.ts`)
- Allows manual triggering of reward calculation
- Useful for testing and immediate updates
- Protected by `CRON_SECRET` authentication

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Cron Jobs Configuration
CRON_SECRET="your-super-secret-cron-key-here-change-in-production"

# Required for internal API calls
NEXTAUTH_URL="http://localhost:3000"
```

### Cron Schedule

- **Reward Calculation**: Runs every 5 minutes (`*/5 * * * *`)
- **Timezone**: UTC

## API Endpoints

### Check Cron Status
```bash
GET /api/cron/init
```

### Initialize Cron Jobs (if needed)
```bash
POST /api/cron/init
Authorization: Bearer <CRON_SECRET>
```

### Manual Trigger Reward Calculation
```bash
POST /api/cron/trigger
Authorization: Bearer <CRON_SECRET>
```

### Health Check Reward Endpoint
```bash
GET /api/cron/rewards
```

## Changes Made to Pack Opening

The pack opening endpoint (`/src/app/api/cards/open-pack/route.ts`) has been modified:

1. **Removed**: Immediate reward calculation during pack opening
2. **Simplified**: User cards are created with `catiReward: 0`
3. **Performance**: Pack opening is now much faster
4. **Consistency**: All rewards are calculated uniformly by cron jobs

## Automatic Initialization

The cron jobs are automatically initialized when the Next.js application starts:

- Imported in `src/app/layout.tsx` via `src/lib/startup.ts`
- Runs only on the server side
- Handles initialization errors gracefully

## Development and Testing

### Local Development

1. Set `CRON_SECRET` in your `.env.local` file
2. Start the development server: `npm run dev`
3. Cron jobs will initialize automatically

### Manual Testing

```bash
# Check cron status
curl http://localhost:3000/api/cron/init

# Trigger reward calculation manually
curl -X POST http://localhost:3000/api/cron/trigger \
  -H "Authorization: Bearer your-cron-secret"
```

### Monitoring

Check the console logs for cron job activity:
- `[CRON MANAGER]` - Cron manager operations
- `[CRON]` - Reward calculation execution
- `[STARTUP]` - Application startup initialization

## Production Considerations

1. **Security**: Use a strong, random `CRON_SECRET` in production
2. **Monitoring**: Set up log monitoring for cron job failures
3. **Performance**: Monitor database performance during reward calculations
4. **Scaling**: Consider database optimization if you have many users/cards

## Troubleshooting

### Cron Jobs Not Running
1. Check if `CRON_SECRET` is set
2. Verify console logs for initialization errors
3. Manually trigger via API to test

### Reward Calculation Errors
1. Check database connectivity
2. Verify season data integrity
3. Review console logs for specific errors

### Performance Issues
1. Monitor database query performance
2. Consider adding database indexes
3. Implement rate limiting if needed
