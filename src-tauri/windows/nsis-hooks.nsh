!include LogicLib.nsh

Var HAutoStartState

!macro NSIS_HOOK_PREINSTALL
  MessageBox MB_YESNO|MB_ICONQUESTION "是否在登录 Windows 后自动启动 creeper-notes？这样你可以在进入桌面后立即访问笔记，并使用默认快捷键 Ctrl+N 快速新建笔记，无需手动启动应用。" IDYES enable_auto_start IDNO disable_auto_start

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
