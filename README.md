# Domainbase

A modern domain management platform with subdomain management, DNS configuration, link shortening, and real-time analytics.

## Features

- Dynamic Subdomain Management - Create and manage unlimited subdomains
- Link Shortener - Built-in URL shortener with click tracking
- Real-time Analytics - Track visits, devices, browsers, and geographic data
- Google OAuth - Secure authentication
- DNS Management - Manage DNS records, nameservers, and domain info via NameSilo API
- Clean UI - Vercel-inspired minimal design with dark mode
- Fast & Reliable - Built with Next.js 14 and MongoDB

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB database
- NameSilo account with API access
- Google OAuth credentials

### Installation

1. Clone and install:
```bash
git clone <your-repo>
cd subdomain-creator
npm install
```

2. Create `.env.local`:
```env
# Domain Configuration
NEXT_PUBLIC_ROOT_DOMAIN=app.yourdomain.com
NAMESILO_DOMAIN=yourdomain.com
ROOT_DOMAIN=app.yourdomain.com

# NameSilo API
NAMESILO_API_KEY=your_namesilo_api_key

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Authentication
JWT_SECRET=your_random_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

3. Run development server:
```bash
npm run dev
```

Visit `http://localhost:3000`

## Deployment (Vercel)

### 1. Vercel Setup

1. Import your project to Vercel

2. Add domains in Project Settings → Domains:
   - `app.yourdomain.com`
   - `*.app.yourdomain.com`

3. Add environment variables (copy all from `.env.local`)

4. Deploy

### 3. Google OAuth Setup

In Google Cloud Console → Credentials, add redirect URIs:
```
https://app.yourdomain.com/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

## Usage

### Creating Subdomains

1. Login with Google
2. Click "Create Subdomain"
3. Fill in subdomain details
4. Your subdomain is live at `https://yourname.app.yourdomain.com`

### Link Shortener

1. Navigate to "Link Shortener"
2. Create short links with custom slugs
3. Access via `https://url.app.yourdomain.com/[slug]`
4. Track clicks in real-time

### Domain Management

1. Go to "Domain Manager"
2. View domain info and expiry
3. Add/edit/delete DNS records
4. Manage nameservers

## Tech Stack

- Frontend: Next.js 14, React, TypeScript
- Styling: CSS Modules
- Backend: Next.js API Routes
- Database: MongoDB
- Authentication: JWT + Google OAuth
- DNS: NameSilo API
- Analytics: Recharts
- Maps: react-simple-maps
- Icons: Lucide React

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   ├── subdomain/        # Subdomain pages
│   ├── url/              # Link shortener redirects
│   └── page.tsx          # Main app
├── components/           # React components
├── lib/                  # Utilities & database
└── middleware.ts         # Subdomain routing
```

## API Endpoints

- `POST /api/subdomains` - Create subdomain
- `GET /api/subdomains` - List subdomains
- `PUT /api/subdomains/[subdomain]` - Update subdomain
- `DELETE /api/subdomains/[subdomain]` - Delete subdomain
- `GET/POST /api/dns/namesilo` - Manage DNS records
- `GET /api/domain/info` - Get domain information
- `GET/POST /api/links` - Manage short links
- `GET /api/links/redirect/[slug]` - Handle redirects
- `POST /api/analytics/track` - Track page views

## Development

```bash
# Run dev server
npm run dev

# Build production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
