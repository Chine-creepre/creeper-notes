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

  ${NSD_CreateCheckbox} 0 36u 100% 18u "开机自启"
  Pop $HAutoStartCheckbox
  ${NSD_SetState} $HAutoStartCheckbox ${BST_UNCHECKED}

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
