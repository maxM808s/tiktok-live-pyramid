@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\browser-launcher.ps1" -Action Setup
set "PYRAMID_EXIT=%ERRORLEVEL%"
if not "%PYRAMID_EXIT%"=="0" (
  echo.
  echo See the message above. Your settings have not been deleted.
  if not defined CI pause
)
exit /b %PYRAMID_EXIT%
