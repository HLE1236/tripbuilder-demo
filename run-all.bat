@echo off
chcp 65001 >nul
setlocal
title TripBuilder Launcher (1 Backend + 3 Frontend)

set "ROOT=%~dp0"

echo ====================================================
echo   TripBuilder — He thong dat tour may do ban dia
echo   - Backend API        : http://localhost:8080
echo   - Cong Khach hang    : http://localhost:5173
echo   - Cong Tour Guide    : http://localhost:5174
echo   - Cong Admin Tong    : http://localhost:5175
echo ====================================================
echo.

if not exist "%ROOT%TripBuilder-frontend-client\node_modules" (
    echo [1/4] Cai dat dependencies cho TripBuilder-frontend-client...
    pushd "%ROOT%TripBuilder-frontend-client"
    call npm install
    popd
)

if not exist "%ROOT%TripBuilder-frontend-guide\node_modules" (
    echo [2/4] Cai dat dependencies cho TripBuilder-frontend-guide...
    pushd "%ROOT%TripBuilder-frontend-guide"
    call npm install
    popd
)

if not exist "%ROOT%TripBuilder-frontend-admin\node_modules" (
    echo [3/4] Cai dat dependencies cho TripBuilder-frontend-admin...
    pushd "%ROOT%TripBuilder-frontend-admin"
    call npm install
    popd
)

echo [4/4] Khoi dong Backend (:8080) va 3 Cong Frontend (:5173, :5174, :5175)...
start "TripBuilder Backend (8080)" cmd /k "cd /d "%ROOT%TripBuilder-backend" && .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=h2"
timeout /t 4 /nobreak > nul

start "TripBuilder Client (5173)" cmd /k "cd /d "%ROOT%TripBuilder-frontend-client" && npm run dev"
start "TripBuilder Guide (5174)" cmd /k "cd /d "%ROOT%TripBuilder-frontend-guide" && npm run dev"
start "TripBuilder Admin (5175)" cmd /k "cd /d "%ROOT%TripBuilder-frontend-admin" && npm run dev"

echo.
echo Dang mo 3 cong trinh duyet sau vai giay...
timeout /t 5 /nobreak > nul
start "" http://localhost:5173
start "" http://localhost:5174
start "" http://localhost:5175

echo.
echo ====================================================
echo   Khoi chay hoan tat! Mat khau mau chung: 123456
echo     - Khach hang : an.nguyen@gmail.com
echo     - Tour Guide : binh.guide@tripbuilder.vn
echo     - Admin Tong : admin@tripbuilder.vn
echo ====================================================
pause > nul
