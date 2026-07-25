# Nittiva - Task Management System

A full-stack task management application built with Django REST Framework backend and React frontend.

## 🚀 Features

- **User Authentication**: JWT-based authentication with Google OAuth support
- **Project Management**: Create and manage multiple projects
- **Task Management**: Create, assign, and track tasks with status and priority
- **Team Collaboration**: Add team members to projects with different roles
- **Time Tracking**: Track time spent on tasks
- **Dashboard**: Overview of projects, tasks, and team statistics
- **Client Management**: Manage clients and their projects

## 📁 Project Structure

```
Nittiva-main-with-django/
├── nittiva-backend/          # Django REST API backend
│   ├── api/                   # Main application
│   ├── nittiva_backend/       # Django project settings
│   ├── manage.py
│   └── requirements.txt
└── Nittiva-main/              # React frontend
    ├── src/                   # Source code
    ├── public/                # Static assets
    └── package.json
```

## 🛠️ Tech Stack

### Backend
- **Django 5.0.6**: Web framework
- **Django REST Framework**: API development
- **PostgreSQL/SQLite**: Database
- **JWT Authentication**: Token-based auth
- **Google OAuth**: Social authentication

### Frontend
- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool
- **React Router**: Routing
- **TailwindCSS**: Styling
- **Radix UI**: Component library

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (optional, SQLite for development)
- Git

## 🔧 Installation

### Backend Setup

```bash
# Navigate to backend directory
cd nittiva-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example if available)
# Set environment variables:
# - SECRET_KEY
# - POSTGRES_HOST (if using PostgreSQL)
# - POSTGRES_DB
# - POSTGRES_USER
# - POSTGRES_PASSWORD
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - DJANGO_ENVIRONMENT=development

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Seed initial data (optional)
python manage.py seed_data

# Run development server
python manage.py runserver
```

Backend will be available at: `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd Nittiva-main

# Install dependencies
npm install

# Create .env file (if needed)
# Set VITE_API_BASE_URL=http://localhost:8000/api

# Run development server
npm run dev
```

Frontend will be available at: `http://localhost:8080`

## 📚 API Documentation

Once the backend is running, access the API documentation at:
- **Swagger UI**: `http://localhost:8000/api/docs/`
- **Admin Panel**: `http://localhost:8000/admin/`

## 🔐 Default Admin Credentials

If you ran `seed_data` command:
- **Email**: `admin@nittiva.local`
- **Password**: `Admin@123`

## 🌐 Production Deployment

### Backend (EC2)
- Deploy Django backend to AWS EC2
- Use Gunicorn as WSGI server
- Configure Nginx as reverse proxy
- Set up Application Load Balancer

### Frontend (S3 + CloudFront)
- Build production bundle: `npm run build`
- Upload `dist/` folder to S3
- Configure CloudFront distribution
- Set up custom domain with SSL

See deployment documentation for detailed steps.

## 📝 Environment Variables

### Backend (.env)
```
DJANGO_ENVIRONMENT=production
DEBUG=False
SECRET_KEY=your-secret-key
POSTGRES_HOST=your-rds-endpoint
POSTGRES_DB=nittiva
POSTGRES_USER=nittiva
POSTGRES_PASSWORD=your-password
POSTGRES_PORT=5432
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Frontend (.env)
```
VITE_API_BASE_URL=https://api.nittiva.com/api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Authors

- **Sagar** - Project Owner
- **Development Team**

## 🙏 Acknowledgments

- Django REST Framework
- React Community
- All open-source contributors
