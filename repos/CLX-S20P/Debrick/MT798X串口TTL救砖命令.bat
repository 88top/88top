@echo off
title=MT798X串口TTL救砖

:comSTART
set /p comPort=请关闭可能占用串口的其他程序，然后输入串口COM号：
if "%comPort%"=="" (
	echo 请重新输入串口COM号。。。
	goto comSTART
)
echo ^>^>^>已输入 串口COM号 %comPort%
echo ==================================

echo 选择mtk_uartboot上传文件的串口波特率：
echo 1. 正常波特率（--brom 921600 --bl2 1500000）
echo 2. 低波特率  （--brom 115200 --bl2 115200）
echo 默认正常波特率即可，如果你的串口承受不了再尝试低波特率。
set /p baudRate=选择波特率（输入序号）：
if "%baudRate%"=="2" (
	set "BromBaudRate=115200"
	set "Bl2BaudRate=115200"
	echo ^>^>^>已选择 低波特率  （--brom 115200 --bl2 115200）
) else (
	set "BromBaudRate=921600"
	set "Bl2BaudRate=1500000"
	echo ^>^>^>已选择 正常波特率（--brom 921600 --bl2 1500000）
)
echo ==================================

rem 设置bl2、fip文件夹路径变量
set "bl2FolderPath=.\mtk_uartboot\bl2-ram-boot"
set "fipFolderPath=.\mtk_uartboot\fip-debrick-only"

setlocal enabledelayedexpansion
set count=0
for /f "tokens=*" %%a in ('dir /b /a-d "%fipFolderPath%" ^| findstr /i "fip"') do (
	set /a count+=1
	echo !count!. %%a
	set "model[!count!]=%%a"
)
if %count% equ 0 (
    echo 请检查.\mtk_uartboot\fip-debrick-only文件夹是否有fip文件！
    goto :end
)
echo 注意：mtk_uartboot文件夹下的bl2、fip只用于救砖，不要用于正常机子
:modelSTART
set /p modelNumber=请输入需要救砖机型的fip序号：

if not defined model[%modelNumber%] (
	echo 无效的机型fip序号，请重新输入。。。
	goto modelSTART
)
set "selectedModel=!model[%modelNumber%]!"
echo ^>^>^>已选择 %selectedModel%

rem 根据fip文件名获取SOC和DDR，以便匹配ram boot bl2
rem 截取文明名前面的mt7981或者mt7986
for /f "tokens=1 delims=_" %%a in ("%selectedModel%") do (
    set "modelSOC=%%a"
)
rem 根据文件名匹配是否是DDR4，不是则默认DDR3
if "%selectedModel:mt7981_cmcc_rax3000m=%" neq "%selectedModel%" (
	set "modelDDR=ddr4"
) else if "%selectedModel:mt7981_cmcc_xr30=%" neq "%selectedModel%" (
	set "modelDDR=ddr4"
) else if "%selectedModel:mt7986_jdcloud_re-cp-03=%" neq "%selectedModel%" (
	set "modelDDR=ddr4"
) else if "%selectedModel:mt7986_glinet_gl-mt6000=%" neq "%selectedModel%" (
	set "modelDDR=ddr4"
) else if "%selectedModel:mt7986_redmi_ax6000=%" neq "%selectedModel%" (
	set "modelDDR=ddr4"
) else if "%selectedModel:mt7986_clx_s20p=%" neq "%selectedModel%" (
	set "modelDDR=ddr4"
) else if "%selectedModel:mt7986_zyxel_ex5700=%" neq "%selectedModel%" (
	set "modelDDR=ddr4"
) else (
	set "modelDDR=ddr3"
)
echo SoC type: %modelSOC%
echo DDR type: %modelDDR%

set "bl2Path=%bl2FolderPath%\%modelSOC%-%modelDDR%-bl2-ram-boot.bin"
set "fipPath=%fipFolderPath%\%selectedModel%"

echo .\mtk_uartboot\mtk_uartboot.exe -s COM%comPort% -p %bl2Path% -a -f %fipPath% --brom-load-baudrate %BromBaudRate% --bl2-load-baudrate %Bl2BaudRate%
echo ^>^>^>命令已执行，出现Handshake...信息后，请上电启动路由器开始握手
echo 【请阅读下列提示】
echo 1.Uboot会直接进入Web failsafe UI，无需操作
echo 2.不支持DHCP，请设置Web failsafe UI同网段不同主机号的固定IP
echo 3.加载的是临时uboot，需要进入相应页面重新刷写变砖的分区
echo 4.Web failsafe UI启动后可以通过按Ctrl+C回到Uboot控制台
echo 5.如无线的factory分区损坏，需要有线进系统恢复该分区
echo http://192.168.*.1			刷写固件，救砖一般不用
echo http://192.168.*.1/uboot.html		刷写uboot
echo http://192.168.*.1/bl2.html		刷写bl2，注意刷写eMMC的bl2文件不大于1MB
echo http://192.168.*.1/gpt.html		刷写eMMC机型的gpt分区表
echo http://192.168.*.1/simg.html		刷写single image镜像
echo http://192.168.*.1/initramfs.html	刷写内存启动固件initramfs
echo 注意：刷写bl2、gpt、simg不会验证文件，请一定做好原机备份并确认上传文件的有效性，特别是simg！！！
echo 关于single image：
echo SPI-NAND的是从BL2到最后一个分区的合并镜像，只合并到FIP分区也可
echo eMMC的是从gpt到最后一个分区的合并镜像，只合并到fip分区也可，不包含bl2，bl2需要单独刷写
echo 注意：eMMC从gpt到第一个分区间有段空白也要合并在内，请用我教程备份的分区bin文件进行合并
echo ==================================
.\mtk_uartboot\mtk_uartboot.exe -s COM%comPort% -p %bl2Path% -a -f %fipPath% --brom-load-baudrate %BromBaudRate% --bl2-load-baudrate %Bl2BaudRate%

echo .\mtk_uartboot\SimplySerial\ss.exe --com:%comPort% --baud:115200 --quiet
for /l %%i in (1,1,30) do echo.
.\mtk_uartboot\SimplySerial\ss.exe --com:%comPort% --baud:115200 --quiet

:end
endlocal
echo ==================================
echo 按任意键退出
pause >nul