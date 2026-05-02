# ClientOS

ClientOS is an AI-powered project delivery platform for agencies and client-facing teams.

## What This Website Does

ClientOS helps teams manage the full project lifecycle in one place:

- Agency and client authentication with role-aware access
- Proposal creation and approval flow
- Automatic conversion of approved proposals into projects and milestones
- Project dashboard with tasks, scope, and collaboration tools
- Client portal for milestone visibility, deliverables, and feedback
- GitHub integration with webhook-driven activity updates
- AI endpoints for scope checks, milestone planning, and update generation

## Why ClientOS Was Created

Most project teams use disconnected tools for sales, delivery, code updates, and client communication. This creates delays, context loss, and trust issues.

ClientOS was created to solve that by providing:

- A single delivery system from proposal to completion
- Better visibility for clients without exposing internal complexity
- AI assistance to speed up planning and communication
- Clear, consistent project operations for small agencies and studios

## Core User Flows

1. Agency owner signs in and creates proposals or projects.
2. Client receives access and reviews project status in a dedicated portal.
3. Team syncs development activity and uses AI for delivery updates.
4. Feedback and approvals are tracked in one system.

## Tech Stack

- Next.js (App Router) + TypeScript
- NextAuth for authentication
- MongoDB + Mongoose for data modeling and persistence
- SWR for client data fetching
- Tailwind CSS for UI styling
- Groq API (free tier) for AI features

## Environment Variables

Use .env.example as the template for required configuration:

- NEXTAUTH_URL
- NEXTAUTH_SECRET
- MONGODB_URI
- GROQ_API_KEY (free tier)
- Google OAuth keys (optional)
- SMTP email keys for magic links
- GitHub webhook and token settings

## Running Locally

Install dependencies:

npm install

Start development server:

npm run dev

Build for production:

npm run build

## Notes

Some legacy API routes may still need migration to the newer MongoDB helper naming conventions (connectToDatabase) if your build reports connectDB import errors.
"# ClientOS"  
