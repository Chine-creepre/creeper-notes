!include LogicLib.nsh
!include nsDialogs.nsh
!include WinMessages.nsh

Var HAutoStartState
Var HAutoStartCheckbox

Page custom HAutoStartPage HAutoStartPageLeave

Function HAutoStartPage
  nsDialogs::Create 1018
  Pop $0

  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0u 100% 18u "开机自启"
  Pop $0

  ${NSD_CreateLabel} 0 22u 100% 36u "开启后，creeper-notes 会在 Windows 登录后自动启动，并默认收起到系统托盘。这样可以随时通过托盘菜单或快捷键打开笔记。"
  Pop $0

  ${NSD_CreateCheckbox} 0 72u 100% 18u "安装后启用开机自启"
  Pop $HAutoStartCheckbox
  ${NSD_SetState} $HAutoStartCheckbox ${BST_UNCHECKED}

  ${NSD_CreateLabel} 0 104u 100% 30u "该设置只会写入当前用户的启动项，不影响其他 Windows 用户。你也可以安装完成后在应用设置中心重新开启或关闭。"
  Pop $0

  nsDialogs::Show
FunctionEnd

Function HAutoStartPageLeave
  ${NSD_GetState} $HAutoStartCheckbox $HAutoStartState
FunctionEnd

!macro NSIS_HOOK_POSTINSTALL
  SetShellVarContext current

  ; Remove old startup-folder based auto start entries from previous installers.
  Delete "$SMSTARTUP\creeper-notes.lnk"

  ${If} $HAutoStartState == ${BST_CHECKED}
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "creeper-notes" '"$INSTDIR\creeper-notes.exe" --start-in-tray'
  ${Else}
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "creeper-notes"
  ${EndIf}
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  SetShellVarContext current
  Delete "$SMSTARTUP\creeper-notes.lnk"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "creeper-notes"
!macroend
