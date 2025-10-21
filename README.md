# Match Betting App

A full-stack MERN betting web application where users can bet on matches between teams.

## Features

- 🔐 **Authentication**: Simple username/password login (password = username for MVP)
- 🎯 **Match Betting**: Place bets on upcoming matches with 30-minute cutoff before start
- ⚡ **Real-time Updates**: Auto-refresh every 30 seconds and sync with Google Sheets every 5 minutes
- 🏆 **Results Tracking**: View detailed results and betting statistics after matches end
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🤖 **Auto Betting**: Default bets automatically assigned if no manual bet placed

## Tech Stack

- **Frontend**: React + Vite, React Router, CSS3
- **Backend**: Node.js + Express
- **Data Storage**: JSON files (synced with Google Sheets)
- **Authentication**: JWT tokens

## Quick Start

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn

### Installation

1. **Clone and setup**:
   ```bash
   git clone <repo-url>
   cd match_betting_app
   npm run install-all
   ```

2. **Configure environment** (optional):
   ```bash
   # Edit server/.env for custom settings
   # Edit client/.env for custom API URL
   ```

3. **Start development servers**:
   ```bash
   npm run dev
   ```

   This starts:
   - Backend server on http://localhost:5000
   - Frontend app on http://localhost:5173

4. **Login with demo users**:
   - Username: `alice`, Password: `alice`
   - Username: `bob`, Password: `bob`
   - Username: `charlie`, Password: `charlie`

## Project Structure

```
/match_betting_app
├── /client                 # React frontend (Vite)
│   ├── /src
│   │   ├── /components     # Reusable components
│   │   ├── /pages          # Page components
│   │   ├── /context        # React context (auth)
│   │   └── /api            # API client
│   └── package.json
├── /server                 # Node.js + Express backend
│   ├── /routes             # API routes
│   ├── /middleware         # Auth middleware
│   ├── /utils              # Data utilities & Google Sheets sync
│   └── package.json
├── /data                   # JSON data files
│   ├── users.json          # User accounts
│   ├── teams.json          # Team definitions
│   ├── matches.json        # Match data
│   └── bets.json           # Betting data
└── package.json            # Root package with dev scripts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| GET | `/matches` | List all matches |
| GET | `/matches/:id` | Get match details |
| POST | `/matches/:id/bet` | Place/update bet |
| DELETE | `/matches/:id/bet` | Remove bet |
| GET | `/bets` | List all bets |

## Data Models

### Match States
- `planned` → `started` → `ended`
- Real-time state transitions based on system clock
- 30-minute betting cutoff before match start

### Betting Rules
- One bet per user per match
- Bets can be changed before cutoff
- Auto-default bets assigned at match end if no manual bet placed
- Default bets assigned to losing team

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
```bash
# server/.env
PORT=5000
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
GOOGLE_SHEETS_API_KEY=your_api_key
GOOGLE_SHEET_ID=your_sheet_id
NODE_ENV=production
```

### Docker (Optional)
```dockerfile
# Dockerfile example for production deployment
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## Development

### Available Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run client` - Start only the React development server
- `npm run server` - Start only the Node.js server
- `npm run build` - Build production React app
- `npm run install-all` - Install all dependencies

### Adding New Features

1. **Backend**: Add routes in `/server/routes/`
2. **Frontend**: Add components in `/client/src/components/`
3. **Data**: Modify JSON files in `/data/`

## Dummy Data

The app comes with pre-populated demo data:

- **Users**: alice, bob, charlie
- **Teams**: Lions, Tigers, Eagles, Sharks  
- **Matches**: 6 matches with various states (planned, started, ended)
- **Bets**: Mix of manual and auto-assigned bets

## Google Sheets Integration

The app syncs with Google Sheets every 5 minutes:

1. Configure Google Sheets API credentials
2. Set `GOOGLE_SHEET_ID` in server/.env
3. Create sheets with tabs: `users`, `teams`, `matches`
4. Sheet data overwrites local JSON files

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in .env files
2. **CORS issues**: Check client/server URL configuration
3. **Auth problems**: Clear localStorage and re-login
4. **Build issues**: Delete node_modules and reinstall

### Logs

- Backend logs: Check terminal running server
- Frontend logs: Check browser developer console
- Data issues: Check /data/*.json files

## License

MIT License - feel free to use this project as a starting point for your own betting applications!
