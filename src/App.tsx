import { useState } from 'react'
import ChatApp from './ChatApp'
import ExcelToJsonConverter from './ExcelToJsonConverter'
import MyShopTools from './MyShopTools'
import HalloweenMovieSelector from './HalloweenMovieSelector'
import WoodworkingProjects from './WoodworkingProjects'
import './App.css'

type AppView = 'chat' | 'shop' | 'halloween' | 'woodworking' | 'converter'

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('chat')

  const navigateToShop = () => setCurrentView('shop')
  const navigateToChat = () => setCurrentView('chat')
  const navigateToHalloween = () => setCurrentView('halloween')
  const navigateToWoodworking = () => setCurrentView('woodworking')
  const navigateToConverter = () => setCurrentView('converter')

  return (
    <>
      {currentView === 'chat' && (
        <ChatApp 
          onNavigateToShop={navigateToShop}
          onNavigateToHalloween={navigateToHalloween}
          onNavigateToWoodworking={navigateToWoodworking}
          onNavigateToConverter={navigateToConverter} 
        />
      )}
      {currentView === 'shop' && (
        <MyShopTools onNavigateBack={navigateToChat} />
      )}
      {currentView === 'halloween' && (
        <HalloweenMovieSelector onNavigateBack={navigateToChat} />
      )}
      {currentView === 'woodworking' && (
        <WoodworkingProjects onNavigateBack={navigateToChat} />
      )}
      {currentView === 'converter' && (
        <ExcelToJsonConverter onNavigateBack={navigateToChat} />
      )}
    </>
  )
}
