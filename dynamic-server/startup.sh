#!/bin/bash
cd /home/site/wwwroot
python -m pip install -r requirements.txt
export FLASK_APP=main.py
export PORT="${PORT:-8000}"
gunicorn --bind=0.0.0.0:$PORT --timeout 600 main:app