# Kronicl

Kronicl is a personal memory management application that allows users to create, store, and organize their memories with rich media content, AI-powered enrichment, and intelligent organization.

## Features

- 📸 **Rich Media Support**: Upload and manage photos, videos, and other media files
- 🤖 **AI-Powered Insights**: Intelligent memory organization and enrichment
- 📱 **Mobile-First Design**: Optimized for mobile devices with responsive design
- 🗺️ **Location Tracking**: Associate memories with locations using Google Maps
- 🔐 **Secure Authentication**: Firebase-based authentication with Google sign-in
- ☁️ **Cloud Storage**: Secure cloud storage for all your memories
- 📊 **Analytics**: Track and analyze your memory creation patterns

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with custom components
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: Google AI integration with Genkit
- **Maps**: Google Maps API
- **UI Components**: Radix UI primitives
- **State Management**: React hooks and context

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project with Auth, Firestore, and Storage enabled
- Google Maps API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd kronicl
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with your Firebase and Google Maps configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:9002](http://localhost:9002) in your browser.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run genkit:dev` - Start Genkit development server
- `npm run genkit:watch` - Start Genkit in watch mode

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── memories/       # Memory-related components
│   └── ui/            # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
└── ai/                 # AI/Genkit integration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is private and proprietary.
