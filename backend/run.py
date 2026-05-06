import uvicorn
import subprocess
import sys
import os

def init_db():
    print("Initializing database...")
    try:
        # Run create_tables.py script
        subprocess.run([sys.executable, "create_tables.py"], check=True)
    except Exception as e:
        print(f"Error initializing database: {e}")

if __name__ == "__main__":
    init_db()
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
