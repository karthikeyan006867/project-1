@echo off
echo ========================================
echo Event Manager Setup - Hack Club Edition
echo ========================================
echo.

echo [1/4] Installing backend dependencies...
cd server
call npm install
if errorlevel 1 (
    echo Error installing dependencies!
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
echo.

echo [2/4] Creating .env file...
if not exist .env (
    copy .env.example .env
    echo ✓ .env file created - Please edit it with your API keys
) else (
    echo ✓ .env file already exists
)
echo.

echo [3/4] Checking MongoDB...
echo Please make sure MongoDB is running!
echo.

echo [4/4] Setup complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Edit server\.env with your API keys:
echo    - WAKATIME_API_KEY
echo    - HACKATIME_API_KEY
echo    - CLOUDINARY credentials (optional)
echo.
echo 2. Start MongoDB if not running
echo.
echo 3. Start the server:
echo    cd server
echo    npm start
echo.
echo 4. Open client\index.html in your browser
echo.
echo 5. Install Chrome extension from chrome-extension folder
echo.
echo 📚 See QUICKSTART.md for detailed instructions
echo ========================================
pause
