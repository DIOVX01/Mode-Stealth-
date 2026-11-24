@echo off
cd /d "%~dp0"
start "HiveMind server" /min python serve.py
timeout /t 1 /nobreak >nul
start "" http://127.0.0.1:8742/
