# Nittiva Django API

## Run (SQLite)
```
cd nittiva_django
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_data
python manage.py runserver 0.0.0.0:8000
```
## Docs
- http://localhost:8000/api/docs/