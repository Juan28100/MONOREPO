@echo off
echo Abriendo proyecto en VS code...
cd /d "%~dpo"
code .
exit
REM Si VS no esta en la variable del retorno PATH, hay que colocar la ruta para que se ejecute.