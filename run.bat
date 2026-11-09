@echo off
REM Chay Backend (:8080) va Web App (:5173 - tich hop nut gat chuyen vai Khach hang <-> Tour Guide).
REM   run.bat       -> dung SQL Server (neu dang tat tu chuyen sang H2 luu file)
REM   run.bat h2    -> dung H2 luu file (khong can cai database)

cd /d %~dp0

set PROFILE_ARG=
if /i "%1"=="h2" goto use_h2

sc query MSSQL$SQLEXPRESS | find "RUNNING" >nul
if errorlevel 1 (
  echo SQL Server dang tat, dang thu bat len...
  net start MSSQL$SQLEXPRESS >nul 2>&1
)
sc query MSSQL$SQLEXPRESS | find "RUNNING" >nul
if errorlevel 1 (
  echo [!] Khong bat duoc SQL Server. Tu dong chuyen sang H2 luu file.
  goto use_h2
)
echo SQL Server dang chay.
goto start_all

:use_h2
set PROFILE_ARG=-Dspring-boot.run.profiles=h2
echo Backend se dung H2 luu file (backend\data\tripbuilder.mv.db).

:start_all
if not exist web-client\node_modules (cd web-client && call npm install && cd ..)

start "Backend :8080" cmd /k "cd /d %~dp0backend && mvnw.cmd spring-boot:run %PROFILE_ARG%"
start "TripBuilder Web :5173" cmd /k "cd /d %~dp0web-client && npm run dev"

echo.
echo Da mo Backend (:8080) va Giao dien Web (:5173).
echo Doi Backend bao "Started BackendApplication" roi truy cap:
echo   👉 http://localhost:5173  (Co nut gat chuyen vai [Khach hang] va [Tour Guide] ngay tren Header)
pause
