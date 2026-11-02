@echo off
cd /d "%~dp0"
echo Ballighni - temporary HTTPS sharing
echo Keep this computer awake and this terminal open.
call npm run start:shared
pause
