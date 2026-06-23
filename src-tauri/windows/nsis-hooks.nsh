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

  ; Clear older registry-based auto start entries from previous installers.
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "creeper-notes"

  ${If} $HAutoStartState == ${BST_CHECKED}
    CreateShortCut "$SMSTARTUP\creeper-notes.lnk" "$INSTDIR\creeper-notes.exe" "" "$INSTDIR\creeper-notes.exe" 0
  ${Else}
    Delete "$SMSTARTUP\creeper-notes.lnk"
  ${EndIf}
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  SetShellVarContext current
  Delete "$SMSTARTUP\creeper-notes.lnk"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "creeper-notes"
!macroend
