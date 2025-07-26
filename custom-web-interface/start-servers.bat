@echo off
echo Demarrage des serveurs...
echo Port proxy CORS: 8082
echo Port serveur web: 8888
start /B python cors-proxy-enhanced.py
start /B python -m http.server 8888
timeout /t 3 /nobreak
echo Serveurs demarres
echo Proxy CORS: http://localhost:8082
echo Interface Web: http://localhost:8888
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause
