import { useState } from 'react'
import ChatApp from './ChatApp'
import ExcelToJsonConverter from './ExcelToJsonConverter'
import MyShopTools from './MyShopTools'
import './App.css'

type AppView = 'chat' | 'converter' | 'shop'

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('chat')

  const navigateToConverter = () => setCurrentView('converter')
  const navigateToShop = () => setCurrentView('shop')
  const navigateToChat = () => setCurrentView('chat')

  return (
    <>
      {currentView === 'chat' && (
        <ChatApp 
          onNavigateToConverter={navigateToConverter} 
          onNavigateToShop={navigateToShop}
        />
      )}
      {currentView === 'converter' && (
        <ExcelToJsonConverter onNavigateBack={navigateToChat} />
      )}
      {currentView === 'shop' && (
        <MyShopTools onNavigateBack={navigateToChat} />
      )}
    </>
  )
}
