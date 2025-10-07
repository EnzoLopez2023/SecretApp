import { useState } from 'react'
import ChatApp from './ChatApp'
import ExcelToJsonConverter from './ExcelToJsonConverter'
import MyShopTools from './MyShopTools'
import HalloweenMovieSelector from './HalloweenMovieSelector'
import WoodworkingProjects from './WoodworkingProjects'
import './App.css'

type AppView = 'chat' | 'converter' | 'shop' | 'halloween' | 'woodworking'

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('chat')

  const navigateToConverter = () => setCurrentView('converter')
  const navigateToShop = () => setCurrentView('shop')
  const navigateToChat = () => setCurrentView('chat')
  const navigateToHalloween = () => setCurrentView('halloween')
  const navigateToWoodworking = () => setCurrentView('woodworking')

  return (
    <>
      {currentView === 'chat' && (
        <ChatApp 
          onNavigateToConverter={navigateToConverter} 
          onNavigateToShop={navigateToShop}
          onNavigateToHalloween={navigateToHalloween}
          onNavigateToWoodworking={navigateToWoodworking}
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
      {currentView === 'woodworking' && (
        <WoodworkingProjects onNavigateBack={navigateToChat} />
      )}
    </>
  )
}
