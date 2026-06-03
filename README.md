# 📈 Stock Prediction

A full-stack web application for predicting stock prices and analyzing market trends using modern technologies and data visualization.

![JavaScript](https://img.shields.io/badge/javascript-%23F7DF1E.svg?style=for-the-badge&logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

- 🎯 **Stock Price Predictions** - Advanced ML algorithms for accurate market forecasting
- 📊 **Interactive Visualizations** - Beautiful charts and real-time data visualization
- 🔐 **Secure Authentication** - JWT-based user authentication with secure password handling
- 💾 **Data Persistence** - Reliable data storage and management
- 🔄 **Real-time Updates** - Live market data synchronization
- 📧 **Smart Notifications** - Market alerts and price notifications
- 🎨 **Modern UI** - Responsive, intuitive design with React and TailwindCSS
- ⚡ **Hot Module Replacement** - Instant development experience with Vite

## 🏗️ Project Structure

```
stock-prediction/
├── frontend/                # React + Vite frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/                 # Express.js backend server
│   ├── server.js
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── package.json
├── ai_service/              # Python ML prediction service
│   └── [ML models and scripts]
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Python 3.8+ (for AI service)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/A-Ela/stock-prediction.git
   cd stock-prediction
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

### Running the Application

#### Development Mode (All Services)
```bash
npm run dev
```

#### Running Services Separately

**Backend** (Express server on port 5000):
```bash
npm run backend-dev
# or
cd backend && npm install && npm run dev
```

**Frontend** (React dev server on port 5173):
```bash
npm run frontend-dev
# or
cd frontend && npm install && npm run dev
```

**AI Service** (Python ML predictions):
```bash
cd ai_service
pip install -r requirements.txt
python app.py
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5000`.

## 🔧 Tech Stack

### Frontend 
- **React 19** - Modern UI library with concurrent features
- **Vite** - Next-generation frontend build tool (10x faster)
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - Promise-based HTTP client
- **React Compiler** - Enhanced performance optimizations

### Backend
- **Express.js** - Lightweight web server framework
- **Node.js** - JavaScript runtime
- **JWT** - Stateless authentication
- **CORS** - Cross-origin resource sharing
- **Environment Management** - Dotenv configuration

### Data Science 
- **Python** - ML model development
- **scikit-learn** - Machine learning algorithms
- **pandas** - Data manipulation
- **numpy** - Numerical computing

### Styling 
- **TailwindCSS** - Responsive utility classes
- **CSS3** - Custom styling

### Markup 
- **HTML5** - Semantic markup

## 📝 Configuration

### Backend Environment Variables
Create a `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
```

### Frontend Environment Variables
Create a `.env` file in the frontend directory:
```env
VITE_API_BASE=http://localhost:5000/api
VITE_APP_NAME=Stock Prediction
```

## 📚 API Documentation

### Authentication Routes
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - User login
POST   /api/auth/logout        - User logout
POST   /api/auth/refresh       - Refresh token
```

### Stock Data Routes
```
GET    /api/stocks             - List all stocks
GET    /api/stocks/:symbol     - Get stock details
POST   /api/stocks/predict     - Get price prediction
GET    /api/stocks/:symbol/history - Historical data
```

### User Routes
```
GET    /api/users/profile      - Get user profile
PUT    /api/users/profile      - Update profile
POST   /api/users/watchlist    - Add to watchlist
GET    /api/users/watchlist    - Get watchlist
```

## 🧪 Development & Testing

### Running Tests
```bash
cd backend
npm test

cd frontend
npm test
```

### Code Quality
```bash
# Lint frontend
cd frontend && npm run lint

# Format code
npm run format
```

### Building for Production
```bash
# Frontend build
cd frontend
npm run build

# Output: dist/ folder optimized for production
```

## 📊 Key Features Explained

### Stock Predictions
Uses machine learning models trained on historical market data to forecast future price movements with configurable time horizons.

### Real-time Visualization
Interactive charts powered by modern charting libraries provide instant market insights and trend analysis.

### User Authentication
Secure JWT-based authentication ensures user data privacy with encrypted password storage and session management.

### Responsive Design
Mobile-first approach ensures seamless experience across all devices - desktop, tablet, and mobile.

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in backend .env
PORT=5001

# Change port in frontend vite.config.js
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Connection Issues
- Verify backend is running on port 5000
- Check VITE_API_BASE in frontend .env
- Ensure CORS is properly configured



## 📧 Contact & Support

For questions, suggestions, or collaboration opportunities:
- GitHub: [@A-Ela](https://github.com/A-Ela)
- Open an issue: [GitHub Issues](https://github.com/A-Ela/stock-prediction/issues)

## 🙏 Acknowledgments

- React and Vite teams for amazing tools
- Open-source community for valuable libraries
- Contributors and testers

---

**Made with ❤️ by [A-Ela](https://github.com/A-Ela)**

*Last updated: 2026*
