!include LogicLib.nsh

Var HAutoStartCheckbox
Var HAutoStartState

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

!macro NSIS_HOOK_COMPONENTS_PAGE
  nsDialogs::Create 1018
  Pop $0

  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 24u "推荐开启开机自启，creeper-notes 会在你进入系统后自动准备好笔记环境。"
  Pop $0

  ${NSD_CreateCheckbox} 0 34u 100% 16u "强烈建议开启：登录 Windows 后自动启动 creeper-notes"
  Pop $HAutoStartCheckbox
  ${NSD_Check} $HAutoStartCheckbox

  nsDialogs::Show

  ${NSD_GetState} $HAutoStartCheckbox $HAutoStartState
!macroend
