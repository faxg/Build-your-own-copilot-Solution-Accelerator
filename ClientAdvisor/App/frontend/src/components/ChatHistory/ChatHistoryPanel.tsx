import { useContext } from 'react'
import React, {useState , useEffect, useCallback, MouseEvent} from 'react'
import {
  CommandBarButton,
  ContextualMenu,
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  ICommandBarStyles,
  IContextualMenuItem,
  IStackStyles,
  PrimaryButton,
  Spinner,
  SpinnerSize,
  Stack,
  StackItem,
  Text
} from '@fluentui/react'
import { useBoolean } from '@fluentui/react-hooks'

import { ChatHistoryLoadingState, historyDeleteAll } from '../../api'
import { AppStateContext } from '../../state/AppProvider'

import {ChatHistoryList} from './ChatHistoryList'

import styles from './ChatHistoryPanel.module.css'

interface ChatHistoryPanelProps {
  isLoading: boolean
}

export enum ChatHistoryPanelTabs {
  History = 'History'
}

const commandBarStyle: ICommandBarStyles = {
  root: {
    padding: '0',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  }
}

const commandBarButtonStyle: Partial<IStackStyles> = { root: { height: '50px' } }

export function ChatHistoryPanel(_props: ChatHistoryPanelProps) {
  const { isLoading} = _props
  const appStateContext = useContext(AppStateContext)
  const [showContextualMenu, setShowContextualMenu] = useState(false)
  const [hideClearAllDialog, setHideClearAllDialog] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [clearingError, setClearingError] = useState(false)
  const hasChatHistory = appStateContext?.state.chatHistory && appStateContext.state.chatHistory.length > 0;
  const clearAllDialogContentProps = {
    type: DialogType.close,
    title: !clearingError ? 'Are you sure you want to clear all chat history?' : 'Error deleting all of chat history',
    closeButtonAriaLabel: 'Close',
    subText: !clearingError
      ? 'All chat history will be permanently removed.'
      : 'Please try again. If the problem persists, please contact the site administrator.'
  }

  const toggleClearAllDialog = () =>{
    //console.log("toggleClearAllDialog called !")
    setHideClearAllDialog(!hideClearAllDialog)
  }

  const modalProps = {
    titleAriaId: 'labelId',
    subtitleAriaId: 'subTextId',
    isBlocking: true,
    styles: { main: { maxWidth: 450 } }
  }

  const menuItems: IContextualMenuItem[] = [
    { key: 'clearAll', text: 'Clear all chat history',disabled: (!hasChatHistory || isLoading), iconProps: { iconName: 'Delete' }}
  ]

  const handleHistoryClick = () => {
    appStateContext?.dispatch({ type: 'TOGGLE_CHAT_HISTORY' })
  }

  const onShowContextualMenu = useCallback((ev: MouseEvent<HTMLElement>) => {
    ev.preventDefault() // don't navigate
    setShowContextualMenu(true)
  }, [])

  const onHideContextualMenu = useCallback(() => setShowContextualMenu(false), [])

  const onClearAllChatHistory = async () => {
    setClearing(true)
    const response = await historyDeleteAll()
    if (!response.ok) {
      setClearingError(true)
    } else {
      appStateContext?.dispatch({ type: 'DELETE_CHAT_HISTORY' })
      toggleClearAllDialog()
    }
    setClearing(false)
  }

  const [users,setUsers]  = useState<String[]>([]);
  const [error, setError] = useState("")
  const onHideClearAllDialog = () => {
    toggleClearAllDialog()
    setTimeout(() => {
      setClearingError(false)
    }, 2000)
  }

  useEffect(()=>{
    fetch("https://dummy.restapiexample.com/api/v1/employees").then((res)=>{
      console.log(res);
      return res.json();
    }).then((data)=>{
      console.log(data);
      setUsers(data.data.map((user : any)=> user.employee_name ))
    })
    .catch(()=> setError("Error fetching users"));
    // .then((res)=>res.json())
    // .then((data)=>setUsers(
    //     data.map((user : any)=> user.employee_name )))
    //   .catch(()=> setError("Error fetching users"))
  },[])

  useEffect(()=>{
console.log(users);
  },[users])

  useEffect(() => { }, [appStateContext?.state.chatHistory, clearingError])

  return (
    <section className={styles.container} data-is-scrollable aria-label={'chat history panel'}>
      <>
      <h1>Users</h1>
        {error && <p>{error}</p>}
        <ul>
          {
            users.map((user,index)=>(
              <li key={index}>{user}</li>
            ))
          }
         
        </ul>
      </>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" wrap aria-label="chat history header">
        <StackItem>
          <Text
            role="heading"
            aria-level={2}
            style={{
              fontWeight: '600',
              fontSize: '16px',
              marginRight: 'auto',
              color: '#242424'
            }}>
            Chat history
          </Text>
        </StackItem>
        <Stack verticalAlign="start">
          <Stack horizontal styles={commandBarButtonStyle}>
            <CommandBarButton
              iconProps={{ iconName: 'More' }}
              title={'Clear all chat history'}
              onClick={onShowContextualMenu}
              aria-label={'clear all chat history'}
              styles={commandBarStyle}
              role="clearAll"
              id="moreButton"
            />
            <ContextualMenu
              items={menuItems}
              hidden={!showContextualMenu}
              target={'#moreButton'}
              className='testClass'
              onItemClick={toggleClearAllDialog}
              onDismiss={onHideContextualMenu}
            />
            <CommandBarButton
              iconProps={{ iconName: 'Cancel' }}
              title={'Hide'}
              onClick={handleHistoryClick}
              aria-label={'hide button'}
              styles={commandBarStyle}
              role="button"
            />
          </Stack>
        </Stack>
      </Stack>
      <Stack
        aria-label="chat history panel content">
        <Stack className={styles.chatHistoryListContainer}>
          {appStateContext?.state.chatHistoryLoadingState === ChatHistoryLoadingState.Success &&
            appStateContext?.state.isCosmosDBAvailable.cosmosDB && <ChatHistoryList />}
          {appStateContext?.state.chatHistoryLoadingState === ChatHistoryLoadingState.Fail &&
            appStateContext?.state.isCosmosDBAvailable && (
              <>
                <Stack horizontalAlign="center" verticalAlign="center" style={{ width: '100%', marginTop: 10 }}>
                  <StackItem>
                    <Text style={{ alignSelf: 'center', fontWeight: '400', fontSize: 16 }}>
                      {appStateContext?.state.isCosmosDBAvailable?.status && (
                        <span>{appStateContext?.state.isCosmosDBAvailable?.status}</span>
                      )}
                      {!appStateContext?.state.isCosmosDBAvailable?.status && <span>Error loading chat history</span>}
                    </Text>
                  </StackItem>
                  <StackItem>
                    <Text style={{ alignSelf: 'center', fontWeight: '400', fontSize: 14 }}>
                      <span>Chat history can't be saved at this time</span>
                    </Text>
                  </StackItem>
                </Stack>
              </>
            )}
          {appStateContext?.state.chatHistoryLoadingState === ChatHistoryLoadingState.Loading && (
            <>
              <Stack>
                <Stack
                  horizontal
                  horizontalAlign="center"
                  verticalAlign="center"
                  style={{ width: '100%', marginTop: 10 }}>
                  <StackItem style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Spinner
                      style={{ alignSelf: 'flex-start', height: '100%', marginRight: '5px' }}
                      size={SpinnerSize.medium}
                    />
                  </StackItem>
                  <StackItem>
                    <Text style={{ alignSelf: 'center', fontWeight: '400', fontSize: 14 }}>
                      <span style={{ whiteSpace: 'pre-wrap' }}>Loading chat history</span>
                    </Text>
                  </StackItem>
                </Stack>
              </Stack>
            </>
          )}
        </Stack>
      </Stack>
      <Dialog
        hidden={hideClearAllDialog}
        data-testid="testDialog"
        onDismiss={clearing ? () => { } : onHideClearAllDialog}
        dialogContentProps={clearAllDialogContentProps}
        modalProps={modalProps}>
        <DialogFooter>
          {!clearingError && <PrimaryButton onClick={onClearAllChatHistory} disabled={clearing} text="Clear All" />}
          <DefaultButton
            onClick={onHideClearAllDialog}
            disabled={clearing}
            text={!clearingError ? 'Cancel' : 'Close'}
          />
        </DialogFooter>
      </Dialog>
    </section>
  )
}
