# How to Start the Backend Server

## Quick Start (If virtual environment is already set up)

1. **Navigate to the backend directory:**
   ```powershell
   cd nittiva-backend
   ```

2. **Activate the virtual environment:**
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   
   If you get an execution policy error, run this first:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Run migrations (if not already done):**
   ```powershell
   python manage.py migrate
   ```

4. **Seed initial data (optional, for first-time setup):**
   ```powershell
   python manage.py seed_data
   ```

5. **Start the development server:**
   ```powershell
   python manage.py runserver 0.0.0.0:8000
   ```
   
   Or for localhost only:
   ```powershell
   python manage.py runserver
   ```

6. **Access the API:**
   - API Root: http://localhost:8000/api/
   - API Docs: http://localhost:8000/api/docs/

---

## Full Setup (First Time)

If you need to set up from scratch:

1. **Navigate to the backend directory:**
   ```powershell
   cd nittiva-backend
   ```

2. **Create and activate virtual environment:**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```powershell
   python manage.py migrate
   ```

5. **Seed initial data:**
   ```powershell
   python manage.py seed_data
   ```

6. **Start the server:**
   ```powershell
   python manage.py runserver 0.0.0.0:8000
   ```

---

## Notes

- The server will use SQLite database by default (db.sqlite3)
- To use PostgreSQL, set the `POSTGRES_HOST` environment variable
- The server runs on port 8000 by default
- API documentation is available at `/api/docs/` when the server is running

