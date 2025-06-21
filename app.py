from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import sqlite3
import os

app = Flask(__name__)
load_dotenv()

GOOGLE_MAPS_API_KEY=os.getenv("MY_API_KEY")

# Initialize DB
def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL,
            longitude REAL
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html', api_key=GOOGLE_MAPS_API_KEY)

@app.route('/save-location', methods=['POST'])
def save_location():
    data = request.get_json()
    lat = data.get('lat')
    lng = data.get('lng')
    
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('INSERT INTO locations (latitude, longitude) VALUES (?, ?)', (lat, lng))
    conn.commit()
    conn.close()
    
    return jsonify({'status': 'success', 'lat': lat, 'lng': lng})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
