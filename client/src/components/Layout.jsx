import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import Toast from './Toast'

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
      <Footer />
      <Toast />
    </div>
  )
}

export default Layout
