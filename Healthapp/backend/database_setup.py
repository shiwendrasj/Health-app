import sqlite3
import os

DB_FILE = 'healthapp.db'

def create_tables():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Users
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        age TEXT,
        blood_group TEXT,
        emergency_contact TEXT
    )
    ''')

    # Allergies (Many-to-One)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS allergies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        allergy TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    ''')

    # Conditions (Many-to-One)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS conditions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        condition TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    ''')

    # Records
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT,
        date TEXT,
        type TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    ''')

    # Medications
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS medications (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT,
        dosage TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    ''')

    # Appointments
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        doctor TEXT,
        date TEXT,
        time TEXT,
        status TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    ''')

    # Seed Demo User if not exists
    cursor.execute("SELECT * FROM users WHERE id = 'demo'")
    if not cursor.fetchone():
        print("Seeding demo user...")
        cursor.execute("INSERT INTO users VALUES ('demo', 'demo', 'John Doe', '45', 'O+', '9876543210')")
        cursor.execute("INSERT INTO allergies (user_id, allergy) VALUES ('demo', 'Penicillin')")
        cursor.execute("INSERT INTO allergies (user_id, allergy) VALUES ('demo', 'Peanuts')")
        cursor.execute("INSERT INTO conditions (user_id, condition) VALUES ('demo', 'Type 2 Diabetes')")
        cursor.execute("INSERT INTO conditions (user_id, condition) VALUES ('demo', 'Hypertension')")
        cursor.execute("INSERT INTO medications VALUES ('med1', 'demo', 'Aspirin', '100mg')")
        cursor.execute("INSERT INTO medications VALUES ('med2', 'demo', 'Metformin', '500mg')")
        cursor.execute("INSERT INTO records VALUES ('rec1', 'demo', 'Blood Test Report.pdf', '2023-10-25', 'Lab Report')")
    
    conn.commit()
    conn.close()
    print("Database initialized.")

if __name__ == '__main__':
    create_tables()
