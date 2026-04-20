"""
Register generated templates into the database.
Run: docker compose exec api python register_templates.py
"""
import os
import uuid
from app.database import get_db_connection, init_db

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), 'templates')

TEMPLATES = [
    ('school_template.docx', 'School — Акт приёмки'),
    ('land_template.docx',   'Land — Акт приёмки'),
]

def register():
    init_db()
    conn = get_db_connection()
    for filename, name in TEMPLATES:
        path = os.path.join(TEMPLATES_DIR, filename)
        if not os.path.exists(path):
            print(f'❌ Файл не найден: {path}')
            continue
        size = os.path.getsize(path)
        existing = conn.execute('SELECT id FROM templates WHERE file_path = ?', (path,)).fetchone()
        if existing:
            print(f'⚠️  Уже есть: {name}')
            continue
        conn.execute(
            'INSERT INTO templates (id, name, file_path, file_size) VALUES (?, ?, ?, ?)',
            (str(uuid.uuid4()), name, path, size)
        )
        print(f'✅ Зарегистрирован: {name}')
    conn.commit()
    conn.close()

if __name__ == '__main__':
    register()
