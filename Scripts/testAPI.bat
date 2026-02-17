@echo off
echo ========================================
echo Testing Simplified Drone Training API
echo ========================================
echo.

echo TEST 1: Complete Tutorial ^> Start (FPV Drone)
echo Request: studentId=1, classId=1, moduleId=62, submoduleId=151
echo.

curl -X POST http://localhost:5000/drone-training/progress ^
  -H "Content-Type: application/json" ^
  -d "{\"studentId\":1,\"classId\":1,\"moduleId\":62,\"submoduleId\":151}"

echo.
echo.
echo ========================================
echo.

echo TEST 2: Complete Intermediate ^> City ^> Rain (FPV Drone)
echo Request: studentId=1, classId=1, moduleId=63, submoduleId=156, subsubmoduleId=121
echo.

curl -X POST http://localhost:5000/drone-training/progress ^
  -H "Content-Type: application/json" ^
  -d "{\"studentId\":1,\"classId\":1,\"moduleId\":63,\"submoduleId\":156,\"subsubmoduleId\":121}"

echo.
echo.
echo ========================================
echo DONE! Check if modules show checkmarks in frontend
echo ========================================
pause
