import { useState } from 'react'
import ChatApp from './ChatApp'
import ExcelToJsonConverter from './ExcelToJsonConverter'
import MyShopTools from './MyShopTools'
import HalloweenMovieSelector from './HalloweenMovieSelector'
import './App.css'

type AppView = 'chat' | 'converter' | 'shop' | 'halloween'

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('chat')

  const navigateToConverter = () => setCurrentView('converter')
  const navigateToShop = () => setCurrentView('shop')
  const navigateToChat = () => setCurrentView('chat')
  const navigateToHalloween = () => setCurrentView('halloween')

  return (
    <>
      {currentView === 'chat' && (
        <ChatApp 
          onNavigateToConverter={navigateToConverter} 
          onNavigateToShop={navigateToShop}
          onNavigateToHalloween={navigateToHalloween}
        />
      )}
      {currentView === 'converter' && (
        <ExcelToJsonConverter onNavigateBack={navigateToChat} />
      )}
      {currentView === 'shop' && (
        <MyShopTools onNavigateBack={navigateToChat} />
      )}
      {currentView === 'halloween' && (
        <HalloweenMovieSelector onNavigateBack={navigateToChat} />
      )}
    </>
  )
}
