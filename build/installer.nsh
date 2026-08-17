; electron-builder 26.15.3 normally uses a SysWOW64 WMI child process to
; check running applications. It can hang indefinitely on Windows 11 ARM64,
; leaving upgrades blocked inside old-uninstaller.exe.
; nsProcess performs the same check natively and also works for x64 apps
; running under Windows ARM64 emulation.
!macro customCheckAppRunning
  ${nsProcess::FindProcess} "${APP_EXECUTABLE_FILENAME}" $R0
  ${if} $R0 == 0
    DetailPrint "$(appClosing)"
    ${nsProcess::CloseProcess} "${APP_EXECUTABLE_FILENAME}" $R0
    Sleep 1000

    ${nsProcess::FindProcess} "${APP_EXECUTABLE_FILENAME}" $R0
    ${if} $R0 == 0
      ${nsProcess::KillProcess} "${APP_EXECUTABLE_FILENAME}" $R0
      Sleep 500
    ${endIf}
  ${endIf}
  ${nsProcess::Unload}

  ; Installers released before this marker still contain the hanging WMI
  ; check in their embedded uninstaller. Bypass that one legacy uninstaller
  ; after the app has stopped; user data lives outside $INSTDIR and is kept.
  !ifndef BUILD_UNINSTALLER
    ReadRegStr $R1 SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" "DshNativeProcessCheck"
    ${if} $R1 != "1"
    ${andIf} ${FileExists} "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
    ${andIf} ${FileExists} "$INSTDIR\${UNINSTALL_FILENAME}"
      DetailPrint "Removing legacy DSH Desktop installation..."
      RMDir /r "$INSTDIR"
      DeleteRegKey SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}"
      DeleteRegKey SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}"
    ${endIf}
  !endif
!macroend

; Future upgrades can safely run this package's native-check uninstaller.
!macro customInstall
  WriteRegStr SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" "DshNativeProcessCheck" "1"
!macroend
