# 📈 Stock Prediction

A full-stack web application for predicting stock prices and analyzing market trends using modern technologies and data visualization.

![JavaScript](https://img.shields.io/badge/javascript-%23F7DF1E.svg?style=for-the-badge&logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![FastAPI](https://img.shields.io/badge/fastapi-009688?style=for-the-badge&logo=fastapi&logoColor=white)

## ✨ Features

- 🎯 **Stock Price Predictions** - Advanced ML algorithms with sentiment analysis for accurate market forecasting
- 📊 **Interactive Visualizations** - Beautiful charts and real-time data visualization
- 🔐 **Secure Authentication** - JWT-based user authentication with secure password handling
- 💾 **Data Persistence** - Reliable data storage and management
- 🔄 **Real-time Updates** - Live market data synchronization
- 📧 **Smart Notifications** - Market alerts and price notifications
- 🎨 **Modern UI** - Responsive, intuitive design with React and TailwindCSS
- ⚡ **Hot Module Replacement** - Instant development experience with Vite
- 🧠 **Sentiment Analysis** - NLP-powered financial sentiment analysis using FinBERT

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
├── ai_service/              # FastAPI ML prediction service
│   ├── app/
│   │   └── app.py           # FastAPI application with /predict endpoint
│   ├── model.py             # Stock prediction with sentiment analysis
│   ├── requirements.txt      # Python dependencies
│   └── README.md
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

**AI Service** (FastAPI ML predictions on port 8000):
```bash
cd ai_service
pip install -r requirements.txt
uvicorn app.app:app --reload
```

The frontend will be available at `http://localhost:5173`, the backend at `http://localhost:5000`, and the AI service at `http://localhost:8000`.

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

### AI/ML Service
- **FastAPI** - Modern Python web framework for ML APIs
- **PyTorch** - Deep learning framework
- **Transformers (Hugging Face)** - Pre-trained NLP models
- **FinBERT** - Financial sentiment analysis model (ProsusAI/finbert)
- **yfinance** - Real-time financial data retrieval
- **pandas** - Data manipulation
- **numpy** - Numerical computing
- **scikit-learn** - Machine learning algorithms

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

### AI Service Configuration
The AI service runs on `http://localhost:8000` with the following endpoints:
- `/predict` - POST endpoint for stock price predictions with sentiment analysis
- `/docs` - Interactive API documentation (Swagger UI)

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

### AI Service Routes
```
POST   /predict                - Stock price prediction with sentiment analysis
  Request body: { "symbol": "AAPL", "timeframe": 7 }
  Response: { "symbol": "AAPL", "predictedPrice": 150.25, "confidence": 0.85, "currentPrice": 145.50 }
GET    /docs                   - Interactive API documentation (Swagger UI)
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

### Stock Predictions with Sentiment Analysis
The AI service combines technical analysis with natural language processing:
- **Historical Trend Analysis** - Calculates price movement patterns from 3-month historical data
- **Financial Sentiment Analysis** - Uses FinBERT (fine-tuned BERT model) to analyze financial news sentiment
- **Confidence Scoring** - Provides confidence levels based on sentiment strength
- **Time Horizon Scaling** - Adjusts predictions based on requested forecast period (1-30 days)

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
# Change port for AI service
uvicorn app.app:app --reload --port 8001
```

### Module Not Found (Python)
```bash
# Clear virtual environment and reinstall dependencies
cd ai_service
pip install --upgrade pip
pip install -r requirements.txt
```

### Module Not Found (Node)
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Connection Issues
- Verify backend is running on port 5000
- Verify AI service is running on port 8000
- Check VITE_API_BASE in frontend .env
- Ensure CORS is properly configured
- Check AI service logs: `uvicorn app.app:app --reload`

### PyTorch/Transformers Issues
If you encounter issues installing PyTorch, ensure you have the correct version for your system:
```bash
# For CPU only (recommended for development)
pip install torch --index-url https://download.pytorch.org/whl/cpu

# For GPU support, visit https://pytorch.org/get-started/locally/
```

## 📧 Contact & Support

For questions, suggestions, or collaboration opportunities:
- GitHub: [@A-Ela](https://github.com/A-Ela)
- Open an issue: [GitHub Issues](https://github.com/A-Ela/stock-prediction/issues)

## 🙏 Acknowledgments

- React and Vite teams for amazing tools
- FastAPI and Uvicorn for excellent ML API framework
- Hugging Face for FinBERT model and Transformers library
- Open-source community for valuable libraries
- Contributors and testers

---

**Made with ❤️ by [A-Ela](https://github.com/A-Ela)**

*Last updated: 2026*
