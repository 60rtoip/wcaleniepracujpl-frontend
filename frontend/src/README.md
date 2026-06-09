docker compose exec api python -c "
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import hash_password

db = SessionLocal()

u = User(
    email='admin@gmail.com',
    hashed_password=hash_password('password123'),
    role='admin'
)

db.add(u)
db.commit()
db.close()

print('admin account created')
"