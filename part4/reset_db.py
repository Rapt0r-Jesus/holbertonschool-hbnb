#!/usr/bin/env python3
"""
reset_db.py
---------------------------------
This script completely resets the SQLite database:
1. Deletes the existing database file
2. Recreates a new empty database
3. Runs your set_up_data.py script to insert test data
"""

import os
import sys
import subprocess

DB_PATH = "development.db"  # Update if needed
SETUP_SCRIPT = "set_up_data.py"  # Your existing script

def delete_database():
    if os.path.exists(DB_PATH):
        print(f"🗑️  Deleting database file: {DB_PATH}")
        os.remove(DB_PATH)
    else:
        print("⚠️  No database file found. Nothing to delete.")

def recreate_database():
    print("🛠️  Creating a new empty database...")

    # Create an empty database by running a tiny Python snippet
    code = (
        "from app import create_app, db; "
        "app = create_app(); "
        "app.app_context().push(); "
        "db.create_all(); "
        "print('✅ Empty database created successfully');"
    )

    subprocess.run([sys.executable, "-c", code])

def run_setup_script():
    if not os.path.exists(SETUP_SCRIPT):
        print(f"❌ ERROR: {SETUP_SCRIPT} not found!")
        return

    print(f"🚀 Running {SETUP_SCRIPT} to populate test data...")
    subprocess.run([sys.executable, SETUP_SCRIPT])

def main():
    print("=" * 60)
    print("🔥 FULL DATABASE RESET STARTED")
    print("=" * 60)

    delete_database()
    recreate_database()
    run_setup_script()

    print("=" * 60)
    print("🎉 DATABASE RESET COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    main()
