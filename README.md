# B8 Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## Overview

B8 is a comprehensive web platform that integrates multiple business units including B8 League, B8 World, B8 Marketing, B8 Clothing, B8 Car Club, and more. Built with React, TypeScript, and Firebase, it offers a modern, responsive user experience with secure authentication, real-time data, and integrated payment processing.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Business Units](#business-units)
- [Authentication](#authentication)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **Multi-business Integration**: Single platform for multiple B8 business units
- **Tournament Management**: Create, join, and manage sports tournaments through B8 League
- **User Authentication**: Secure Firebase authentication with user profiles and permissions
- **Responsive Design**: Optimized for mobile and desktop experiences
- **Payment Processing**: Integrated payment solutions including Stripe, PayPal, and Google Pay
- **Real-time Updates**: Firebase-backed real-time database updates
- **Permission-based Access**: Role-based content visibility and functionality
- **Admin Portal**: Comprehensive admin tools for business management

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **Styling**: CSS with responsive design
- **Authentication**: Firebase Authentication
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Analytics**: Firebase Analytics
- **Payment Processing**: Stripe, PayPal, Google Pay
- **Routing**: React Router Dom v7
- **State Management**: React Context API
- **Icons**: React Icons
- **Notifications**: React Toastify
- **Visualization**: Chart.js, Three.js, React Globe
- **Tournament UI**: React Tournament Brackets

## 📁 Project Structure

```
b8/
├── src/
│   ├── assets/         # Static assets (images, icons, etc.)
│   │   ├── animations/ # Loading and animation components
│   │   ├── overlays/   # Modal and overlay components
│   │   ├── tournament/ # Tournament-related components
│   │   └── ui/         # General UI components
│   ├── contexts/       # React context providers
│   ├── firebase/       # Firebase configuration and services
│   ├── hooks/          # Custom React hooks
│   ├── navigation/     # Routing and navigation components
│   ├── pages/          # Top-level page components
│   │   ├── authPages/  # Authentication pages
│   │   ├── businessPages/ # B8 business unit pages
│   │   └── utilPages/  # Utility pages (profile, settings)
│   ├── scripts/        # Utility scripts
│   ├── services/       # API services
│   ├── styles/         # CSS styles
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── public/             # Public assets
├── .env                # Environment variables
├── package.json        # Dependencies and scripts
└── vite.config.ts      # Vite configuration
```

## 💻 Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/b8.git
cd b8
```

2. Install dependencies:

```bash
npm install --legacy-peer-deps
```

3. Set up environment variables by creating a `.env` file based on the required Firebase configuration.

## 🔐 Environment Setup

Create a `.env` file in the root directory with the following Firebase configuration:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 🚀 Development

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 🏢 Business Units

The B8 platform integrates several business units:

- **B8 League**: Sports tournament management platform
- **B8 World**: Global community and events platform
- **B8 Marketing**: Digital marketing services
- **B8 Clothing**: Fashion and apparel
- **B8 Car Club**: Automotive community
- **BGr8**: B8 group umbrella
- **Bgr8r**: [Description]
- **B8 Podcast**: Audio content platform
- **BGr8 Medical**: Healthcare services

Each business unit has its own dedicated section within the application, accessible through the main navigation.

## 🔒 Authentication

User authentication is powered by Firebase with various permission levels:

- **Regular Users**: Basic access to public content
- **Business Members**: Access to specific business unit content (e.g., League, World)
- **Administrators**: Full access to admin portal and management tools

User profiles store membership status and permissions for different B8 business units.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<p align="center">Made with ❤️ by B8 Team</p>
