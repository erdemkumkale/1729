# 1729 Teaming Ecosystem

A gift-based collaboration platform built on the philosophy of "Zahmetsiz Deha" (Effortless Genius).

## 🌟 Features

- **8-Step Onboarding Flow**: Discover your effortless genius through soul questions
- **Automatic Gift Card Creation**: Turn your answers into support offerings
- **Trust Team Management**: Build your collaboration network
- **Support Marketplace**: Give and receive support within your ecosystem
- **Promo Code System**: Invite others with discount or prepaid codes
- **Payment Integration**: Sustainable ecosystem through subscriptions

## 🏗️ Architecture

- **Frontend**: React with Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel
- **Authentication**: Supabase Auth with hex code identity system

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Supabase account

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Add your Supabase credentials to .env
# REACT_APP_SUPABASE_URL=your_url
# REACT_APP_SUPABASE_ANON_KEY=your_key

# Start development server
npm start
```

### Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── DashboardLayout.js
│   └── ...
├── contexts/           # React contexts
│   └── AuthContext.js
├── pages/              # Page components
│   ├── SimpleAuth.js   # Login/Signup
│   ├── PaymentPage.js  # Payment with promo codes
│   ├── OnboardingFlow.js # 4 soul questions
│   ├── KontrolPaneli.js  # Dashboard home
│   ├── SoruCevap.js      # Questions editor
│   ├── GuvenTakimi.js    # Trust team
│   ├── Al.js             # Receive support
│   └── Ver.js            # Give support
└── supabaseClient.js   # Supabase configuration
```

## 🗄️ Database Schema

### Core Tables
- `profiles` - User profiles with hex codes
- `onboarding_answers` - Structured answers for AI matching
- `gifts` - Support cards/offerings
- `support_transactions` - Support exchange records
- `invitations` - Promo codes and invites

## 🎨 Design Philosophy

### Zahmetsiz Deha (Effortless Genius)
The platform is built around the concept that everyone has something they do effortlessly that others find difficult. By matching these complementary skills, we create a gift-based economy.

### 4 Soul Questions
1. What would you do if you had nothing to prove?
2. What do you "cheat" at? (What's play for you but work for others?)
3. What drains your energy? (Where do you need support?)
4. What can you effortlessly give to the team?

### Hex Code Identity
Each user is represented by a unique hex color code (e.g., #CF1B9B), creating an anonymous yet identifiable presence in the ecosystem.

## 🔐 Environment Variables

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📝 Development Workflow

1. Create a feature branch
2. Make changes
3. Test locally
4. Push to GitHub
5. Vercel automatically deploys preview
6. Merge to main for production deployment

## 🚢 Deployment

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/1729-teaming-ecosystem)

## 📚 Documentation

- [Onboarding Update](./ONBOARDING_UPDATE.md) - Question flow and gift creation
- [Dashboard Restructure](./DASHBOARD_RESTRUCTURE.md) - 5-page navigation system
- [Features Completed](./FEATURES_COMPLETED.md) - Recent feature additions
- [UI Finalization](./UI_FINALIZATION.md) - Header and dashboard updates
- [Promo Code System](./PROMO_CODE_SYSTEM.md) - Invitation system
- [Vercel Deployment](./VERCEL_DEPLOYMENT.md) - Migration from Netlify

## 🤝 Contributing

This is a private project. For questions or suggestions, contact the team.

## 📄 License

Private - All rights reserved

## 🙏 Acknowledgments

Built with the philosophy of gift-based collaboration and effortless genius.

---

**Current Status**: ✅ Production Ready
**Last Updated**: February 2026
