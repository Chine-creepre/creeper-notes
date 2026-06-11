!include LogicLib.nsh

Var HAutoStartState

!macro NSIS_HOOK_PREINSTALL
  MessageBox MB_YESNO|MB_ICONQUESTION "是否允许 creeper-notes 随 Windows 登录后自动启动？开启后，笔记环境会自动准备好，方便你随时记录和查看。" IDYES enable_auto_start IDNO disable_auto_start

  enable_auto_start:
    StrCpy $HAutoStartState 1
    Goto auto_start_done

  disable_auto_start:
    StrCpy $HAutoStartState 0
    Goto auto_start_done

  auto_start_done:
!macroend

!macro NSIS_HOOK_POSTINSTALL
  ${If} $HAutoStartState == 1
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "creeper-notes" "$INSTDIR\creeper-notes.exe"
  ${Else}
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "creeper-notes"
  ${EndIf}
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "creeper-notes"
!macroend
