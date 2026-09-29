<div align="center">

# AIvera Reimagined

### An AI teaching assistant, rebuilt and expanded

Lesson plans · Classroom activities · Feedback · Persistent conversations

[![CI](https://github.com/artyom129/aivera-reimagined/actions/workflows/ci.yml/badge.svg)](https://github.com/artyom129/aivera-reimagined/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?logo=googlegemini&logoColor=white)

</div>

---

## About the project and its contributors

**AIvera began as a team project by AIverse.** I ([artyom129](https://github.com/artyom129)) was part of that team and contributed to the original project. This repository is my restored and expanded version: I revisited the integrations, refined the interface, and added new capabilities. The original idea and team development belong to AIverse; I do not claim to have built the entire application alone.

| Stage | Credit |
| --- | --- |
| Original AIvera | AIverse team, including artyom129 |
| This version | Restoration, changes, and further development by artyom129 |
| Current maintenance | [artyom129](https://github.com/artyom129) |

### What I changed and improved

- Prepared a complete Supabase migration for a fresh project.
- Reworked configuration, user profiles, and data access controls.
- Added server-side authentication routes, confirmation-email resend, and password recovery.
- Integrated Google Gemini through a server-side API.
- Added a dedicated lesson-plan builder whose output is saved in chat history.
- Improved the chat interface, error handling, and response-generation flow.
- Added an environment template and automated GitHub Actions checks.

## Features

| Area | Capabilities |
| --- | --- |
| AI chat | Stream Gemini responses and revisit saved conversations |
| Lesson plans | Generate structured plans from a subject, topic, grade, duration, and objectives |
| Teaching modes | General assistant, lesson plans, tests, and feedback on student work |
| Organization | Create, rename, delete, and group chats into folders |
| Templates | Work with personal and public prompt templates |
| Accounts | Sign up, confirm email, sign in, and reset a password |
| Administration | Manage users, templates, AI settings, and analytics |
| Usage controls | Track token usage and enforce user limits and request rate limits |

## Tech stack

| Layer | Technologies |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| UI | Tailwind CSS 4, Radix UI, Lucide |
| Forms and validation | React Hook Form, Zod |
| Database | Supabase PostgreSQL, SQL migration, row-level security (RLS) |
| Authentication | Supabase Auth and server-side sessions with `@supabase/ssr` |
| AI | Google Gemini through the server-side `/api/chat` route |
| Responses | Markdown, React Markdown, GFM |
| Quality checks | ESLint, TypeScript, Next.js build, GitHub Actions |

## Quick start

Use **Node.js 22** and npm to match CI. You will need a new Supabase project and a Gemini API key.

### 1. Clone and install

```bash
git clone https://github.com/artyom129/aivera-reimagined.git
cd aivera-reimagined
npm ci
```

### 2. Set up Supabase

Create a new Supabase project. In its **SQL Editor**, run the entire [initial migration](supabase/migrations/20260928000000_initial_aivera.sql). It creates the tables, types, foreign keys, indexes, constraints, functions, triggers, and RLS policies. No connection to the original project's database is required.

### 3. Configure the environment

Copy [`.env.example`](.env.example) to `.env.local`:

```bash
# macOS / Linux
cp .env.example .env.local
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env.local
```

Fill in:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=

# Optional: comma-separated hosts for accessing Next.js dev assets over a LAN
ALLOWED_DEV_ORIGINS=
```

| Variable | Source / purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from the new Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon or publishable key; the variable name is retained for compatibility |
| `GEMINI_API_KEY` | Key from Google AI Studio; used only on the server |
| `ALLOWED_DEV_ORIGINS` | Optional comma-separated local hosts for development |

The application does not require a Supabase service-role key. `.env.local` is ignored by Git.

### 4. Configure authentication redirects

Under **Supabase → Authentication → URL Configuration**, add:

| Setting | Local development value |
| --- | --- |
| Site URL | `http://localhost:3000` |
| Redirect URL | `http://localhost:3000/auth/callback**` |

The local `**` pattern also permits the `next` query parameter used by email confirmation and password recovery. For production, add callback URLs for your domain, including `?next=/chat` and `?next=/auth/update-password`. If you access the development site through another host, add its callback URL as well. See the [Supabase redirect URL guide](https://supabase.com/docs/guides/auth/redirect-urls).

### 5. Run the app

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). Sign up and confirm your email if confirmation is enabled in Supabase. A database trigger creates the corresponding `public.users` profile. Existing users can sign in or use **Forgot password?**

## Create the first administrator

Register a regular account first, then run this in the Supabase SQL Editor:

```sql
update public.users
set role = 'admin'
where email = 'you@example.com';
```

Replace the example address with your account email. Sign in again to access `/admin`.

## Database

| Table | Purpose |
| --- | --- |
| `users` | Profiles, `teacher` / `admin` roles, plans, blocks, and limits |
| `folders` | User-owned folders |
| `chats` | Conversations and selected AI modes |
| `messages` | User messages and assistant responses |
| `templates` | Personal and public prompt templates |
| `usage_logs` | Token usage accounting |
| `audit_logs` | Administrative activity log |
| `ai_request_log` | AI request rate limiting |
| `app_settings` | Application settings, including the Gemini model |

RLS is enabled on every table. Policies limit access to user-owned data, allow authenticated users to read public templates, and restrict administrative operations.

## Project layout

```text
app/
├── api/              # Server routes: AI, auth, templates, admin
├── auth/             # Sign-in, sign-up, confirmation, password recovery
├── chat/             # Chat workspace and conversation history
├── lesson-plan/      # Lesson-plan builder
├── templates/        # Template library
└── admin/            # Administration pages
components/           # UI and feature components
lib/
├── supabase/         # Clients, configuration, session refresh
├── types/            # Database types
└── ai-config.ts      # Teaching modes and system instructions
supabase/migrations/  # Complete schema for a new Supabase project
.github/workflows/    # Automated checks
```

## Gemini and data handling

Gemini requests run on the server; the API key is not sent to the browser. The interface asks for confirmation before sending text to Gemini.

| Measure | Current behavior |
| --- | --- |
| Context | Sends up to the latest 10 messages |
| Rate limit | Up to 12 AI requests per minute per user |
| Text processing | Masks email addresses, phone numbers, UUIDs, and long digit sequences |
| File uploads | Disabled |
| Images | External Markdown images are not loaded |

Masking does not catch every kind of personal information. Avoid entering confidential data, and review AI-generated teaching materials before using them.

## Commands and checks

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm run build` | Create a production build |
| `npm run start` | Serve a production build |

GitHub Actions runs installation, lint, typecheck, and build on pushes to `main` and pull requests. CI uses placeholder environment values; a successful build does not replace end-to-end testing of authentication, email delivery, or Gemini on configured external services.

## Deployment checklist

1. Apply the migration to a new Supabase project.
2. Configure the required environment variables on your hosting platform.
3. Add your production domain and authentication callback URLs in Supabase.
4. Build with `npm run build`.
5. Start with `npm run start` or a platform that supports Next.js.
6. Verify sign-up, sign-in, password recovery, saved chats, and a Gemini response.

Keep secrets and local environment files out of commits.

---

<div align="center">

**Original team project: AIverse · Reimagined, changed, and expanded by [artyom129](https://github.com/artyom129)**

</div>
