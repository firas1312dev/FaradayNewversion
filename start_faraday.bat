@echo off
cd /d "c:\Users\LENOVO\OneDrive\Bureau\faraday\faraday"
docker-compose down
docker-compose up -d
docker-compose logs -f
