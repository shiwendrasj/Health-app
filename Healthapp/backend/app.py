from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__, static_folder='../', static_url_path='')
CORS(app)  # Enable CORS for development flexibility

DB_FILE = 'backend/healthapp.db'
if not os.path.exists(DB_FILE):
    DB_FILE = 'healthapp.db' # Fallback if running from backend dir

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return send_from_directory('../', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../', path)

# --- API Endpoints ---

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user_id = data.get('id')
    password = data.get('password')
    
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ? AND password = ?', (user_id, password)).fetchone()
    conn.close()
    
    if user:
        return jsonify({'success': True, 'user': get_full_user_data(user_id)})
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    # Basic validation
    required = ['id', 'password', 'name']
    if not all(k in data for k in required):
        return jsonify({'success': False, 'message': 'Missing fields'}), 400
        
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO users (id, password, name, age, blood_group, emergency_contact) VALUES (?, ?, ?, ?, ?, ?)',
                     (data['id'], data['password'], data['name'], data.get('age'), data.get('bloodGroup'), data.get('emergencyContact')))
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'User ID already exists'}), 409
    finally:
        conn.close()
        
    return jsonify({'success': True, 'user': get_full_user_data(data['id'])})

@app.route('/api/user/<user_id>', methods=['GET'])
def get_user(user_id):
    user_data = get_full_user_data(user_id)
    if user_data:
        return jsonify(user_data)
    return jsonify({'success': False, 'message': 'User not found'}), 404

@app.route('/api/user/<user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    conn = get_db_connection()
    
    # Update core fields
    conn.execute('''
        UPDATE users SET name=?, age=?, blood_group=?, emergency_contact=?
        WHERE id=?
    ''', (data.get('name'), data.get('age'), data.get('bloodGroup'), data.get('emergencyContact'), user_id))
    
    # Update allergies/conditions (full replace for simplicity like frontend)
    if 'allergies' in data:
        conn.execute('DELETE FROM allergies WHERE user_id = ?', (user_id,))
        for a in data['allergies']:
            conn.execute('INSERT INTO allergies (user_id, allergy) VALUES (?, ?)', (user_id, a))
            
    if 'conditions' in data:
        conn.execute('DELETE FROM conditions WHERE user_id = ?', (user_id,))
        for c in data['conditions']:
            conn.execute('INSERT INTO conditions (user_id, condition) VALUES (?, ?)', (user_id, c))
            
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'user': get_full_user_data(user_id)})

@app.route('/api/record', methods=['POST'])
def add_record():
    data = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO records (id, user_id, name, date, type) VALUES (?, ?, ?, ?, ?)',
                 (data['id'], data['userId'], data['name'], data['date'], data['type']))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/med', methods=['POST'])
def add_med():
    data = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO medications (id, user_id, name, dosage) VALUES (?, ?, ?, ?)',
                 (data['id'], data['userId'], data['name'], data['dosage']))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/appt', methods=['POST'])
def add_appt():
    data = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO appointments (id, user_id, doctor, date, time, status) VALUES (?, ?, ?, ?, ?, ?)',
                 (data['id'], data['userId'], data['doctor'], data['date'], data['time'], data['status']))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# --- Helper ---

def get_full_user_data(user_id):
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    
    if not user:
        conn.close()
        return None
        
    user_dict = dict(user)
    # Map snake_case db to camelCase js
    user_res = {
        'id': user_dict['id'],
        'password': user_dict['password'],
        'name': user_dict['name'],
        'age': user_dict['age'],
        'bloodGroup': user_dict['blood_group'],
        'emergencyContact': user_dict['emergency_contact'],
        'allergies': [row['allergy'] for row in conn.execute('SELECT allergy FROM allergies WHERE user_id = ?', (user_id,))],
        'conditions': [row['condition'] for row in conn.execute('SELECT condition FROM conditions WHERE user_id = ?', (user_id,))],
        'records': [dict(row) for row in conn.execute('SELECT * FROM records WHERE user_id = ?', (user_id,))],
        'medications': [dict(row) for row in conn.execute('SELECT * FROM medications WHERE user_id = ?', (user_id,))],
        'appointments': [dict(row) for row in conn.execute('SELECT * FROM appointments WHERE user_id = ?', (user_id,))],
    }
    conn.close()
    return user_res

if __name__ == '__main__':
    print("Starting HealthApp Backend...")
    app.run(host='0.0.0.0', port=5000, debug=True)
