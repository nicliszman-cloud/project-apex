# Security

Project Apex handles user accounts, user-generated content, chats and approximate location data.

- Never commit Supabase service-role keys.
- Client builds may use the public/publishable Supabase key only with strict Row Level Security.
- Do not expose precise home addresses in public profiles.
- Reports and blocks must be enforced server-side before production launch.
