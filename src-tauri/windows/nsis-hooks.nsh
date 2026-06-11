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

  ${NSD_CreateLabel} 0 0 100% 24u "登录 Windows 后自动启动 creeper-notes。推荐开启，可更快访问你的笔记和工作内容。"
  Pop $0

  ${NSD_CreateCheckbox} 0 34u 100% 16u "登录 Windows 后自动启动 creeper-notes"
  Pop $HAutoStartCheckbox
  ${NSD_Check} $HAutoStartCheckbox

  nsDialogs::Show

  ${NSD_GetState} $HAutoStartCheckbox $HAutoStartState
!macroend
