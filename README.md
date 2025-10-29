# 💕 Nekay - A Love-Powered Productivity App

Built with Vue 3 + TypeScript + Vite (and lots of love! 💝)

## What's This All About?

Nekay is a delightful personal companion app I crafted for my girlfriend, because sometimes "I love you" is best expressed in code! 👩‍💻
A beautiful and cute girl needs a cute and fun app too! 💕

### Features That Make It Special:

- ⏰ **Pomodoro Timer**: Because time flies when you're being productive (or thinking about your significant other)
- 📝 **Task Management**: Keep track of todos, even if "Kiss my boyfriend" is always at the top of the list
- 📓 **Journal Entries**: A digital space to capture thoughts, dreams, and maybe a few complaints about my coding habits
- 🌡️ **Breathing Exercises**: For when I'm not around to give calming hugs
- 💧 **Water Tracker**: Stay hydrated! (Because love isn't the only thing you need to survive)

## Technical Sweet Nothings

- Built with Vue 3 + TypeScript for type-safe love declarations
- Vite for lightning-fast builds (almost as fast as my heart beats when she uses the app)
- PWA-enabled for offline functionality (because our love doesn't need an internet connection)
- IndexedDB for local data persistence (like memories, but digital)
- Firebase backend for real-time sync (keeping us connected, one commit at a time)

## Setup & Installation

1. Clone this repository
```bash
git clone https://github.com/Neil-urk12/Nekay.git
cd Nekay
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
   - Copy `.env.example` to `.env`
   - Fill in your Firebase credentials
   - Set your encryption key for messages
   - Optionally set a custom login passcode

4. Run development server
```bash
npm run dev
```

5. Build for production
```bash
npm run build
```

## Security Best Practices

### Environment Variables
- **Never commit** `.env` files to version control
- Keep Firebase API keys secure
- Use strong encryption keys (minimum 32 characters)
- Rotate encryption keys periodically

### Authentication
- Rate limiting is enabled (5 attempts per 15 minutes)
- Passwords are cleared from memory after login attempts
- Email validation is performed before authentication
- Use strong, unique passwords for Firebase authentication

### Data Protection
- Messages are encrypted using AES encryption
- All sensitive data stored in IndexedDB is synced securely
- Input validation prevents injection attacks
- Maximum length limits prevent buffer overflow

### Development Security
- TypeScript strict mode is enabled
- All async operations have proper error handling
- Network requests include timeout protection
- CORS and XSS protections are in place