@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo     MARIO GAME - AUTO DEPLOYMENT & GITHUB TOOL     
echo ===================================================
echo.

:: Step 1: Git Commit
echo [1/4] Checking Git repository...
git status >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Git is not initialized. Initializing Git...
    git init
)

echo Saving and committing any local changes...
git add .
git commit -m "Auto commit: preparing for deploy" >nul 2>&1
echo Done!

:: Step 2: Push to GitHub if configured
echo.
echo [2/4] Checking GitHub remote...
git remote get-url origin >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo No GitHub remote repository is linked to this folder yet.
    echo.
    echo Please make sure you have created a repository named "mario" on GitHub:
    echo https://github.com/new
    echo.
    set /p "REPO_NAME=Enter your GitHub repository name (default: mario): "
    if "!REPO_NAME!"=="" set "REPO_NAME=mario"
    
    echo.
    echo Linking remote to: https://github.com/adarshsinghab/!REPO_NAME!.git
    git remote add origin https://github.com/adarshsinghab/!REPO_NAME!.git
    git branch -M main
)

echo.
echo Pushing code to GitHub...
echo (If prompted, please complete the sign-in/authentication in your browser)
git push -u origin main
if %ERRORLEVEL% equ 0 (
    echo Successfully pushed to GitHub!
) else (
    echo.
    echo [WARNING] Could not push to GitHub. Make sure the repository exists at:
    echo https://github.com/adarshsinghab/!REPO_NAME!
    echo (We will still proceed with Vercel deployment)
)

:: Step 3: Install Vercel CLI if needed
echo.
echo [3/4] Checking Vercel CLI...
where vercel >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Vercel CLI is not installed. Installing globally...
    call npm install -g vercel
) else (
    echo Vercel CLI is already installed.
)

:: Step 4: Deploy to Vercel
echo.
echo [4/4] Deploying to Vercel...
echo.
echo *************************************************************
echo NOTE: If this is your first time using Vercel on this computer,
echo a browser tab will open for a quick free login. 
echo After logging in, return here and the script will continue!
echo *************************************************************
echo.

:: Deploy with production flags and accept defaults automatically
call vercel --prod --yes

echo.
echo ===================================================
echo   Deployment Complete! 
echo   Copy the production link printed above to share!
echo ===================================================
echo.
pause
