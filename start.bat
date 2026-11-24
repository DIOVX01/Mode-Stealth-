@echo off
cd /d "%~dp0"
start "HiveMind server" /min python -c "import mimetypes,http.server as s;mimetypes.add_type('text/javascript','.js');s.test(s.SimpleHTTPRequestHandler,port=8742,bind='127.0.0.1')"
timeout /t 1 /nobreak >nul
start "" http://127.0.0.1:8742/
