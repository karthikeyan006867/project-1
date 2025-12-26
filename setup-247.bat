@echo off
echo ========================================
echo   Event Manager 24/7 Server Setup
echo ========================================
echo.

echo [1/5] Installing server dependencies...
cd server
call npm install

echo.
echo [2/5] Installing PM2 globally...
call npm install -g pm2

echo.
echo [3/5] Setting up environment...
if not exist .env (
    copy .env.example .env
    echo .env file created. Please configure it with your settings.
) else (
    echo .env file already exists.
)

echo.
echo [4/5] Creating logs directory...
if not exist logs mkdir logs

echo.
echo [5/5] Setup complete!
echo.
echo ========================================
echo   Next Steps:
echo ========================================
echo 1. Edit server/.env with your configuration
echo 2. Start server: npm run pm2:start
echo 3. Check status: npm run pm2:status
echo 4. View logs: npm run pm2:logs
echo.
echo For 24/7 operation, use PM2 commands:
echo   - Start: npm run pm2:start
echo   - Stop: npm run pm2:stop
echo   - Restart: npm run pm2:restart
echo   - Monitor: npm run pm2:monit
echo.
echo ========================================
pause
