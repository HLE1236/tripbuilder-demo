@echo off
title TripBuilder Launcher
echo ====================================================
echo   TripBuilder — He thong dat tour theo yeu cau
echo   - Backend API : http://localhost:8080
echo   - Cong Khach  : http://localhost:5173
echo   - Cong Guide  : http://localhost:5174
echo ====================================================
echo.

if not exist "%~dp0web-client\node_modules" (
    echo [1/4] Cai dat dependencies cho web-client...
    pushd "%~dp0web-client"
    call npm install
    popd
)

if not exist "%~dp0web-admin\node_modules" (
    echo [2/4] Cai dat dependencies cho web-admin...
    pushd "%~dp0web-admin"
    call npm install
    popd
)

echo [3/4] Khoi dong Backend (:8080), Client (:5173) va Guide Studio (:5174)...
start "TripBuilder Backend (8080)" cmd /k "cd /d "%~dp0backend" && mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=h2"
timeout /t 4 /nobreak > nul

start "TripBuilder Client (5173)" cmd /k "cd /d "%~dp0web-client" && npm run dev"
start "TripBuilder Admin (5174)" cmd /k "cd /d "%~dp0web-admin" && npm run dev"

echo [4/4] Dang mo 2 cong trinh duyet sau vai giay...
timeout /t 5 /nobreak > nul
start "" http://localhost:5173
start "" http://localhost:5174

echo.
echo Hoan tat! Tai khoan mau co mat khau chung: 123456
echo   Khach : an.nguyen@gmail.com
echo   Guide : binh.guide@tripbuilder.vn
echo Nhan phim bat ky de dong cua so launcher nay (3 service van chay).
pause > nul
