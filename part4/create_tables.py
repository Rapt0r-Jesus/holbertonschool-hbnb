from app import create_app, db

app = create_app()  # Uses DevelopmentConfig by default

with app.app_context():
    db.create_all()
    print("✅ Database tables created successfully")
