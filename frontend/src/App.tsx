import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import CreateUser from './pages/admin/CreateUser'
import CreateDAO from './pages/admin/CreateDAO'
import MyDAO from './pages/admin/MyDAO'
import AllDAOs from './pages/admin/AllDAOs'
import MyTasks from './pages/admin/MyTasks'
import FinishedDAOHistory from './pages/admin/FinishedDAOHistory'
import Profile from './pages/admin/Profile'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="create-user" element={<CreateUser />} />
            <Route path="create-dao" element={<CreateDAO />} />
            <Route path="my-daos" element={<MyDAO />} />
            <Route path="all-daos" element={<AllDAOs />} />
            <Route path="my-tasks" element={<MyTasks />} />
            <Route path="history" element={<FinishedDAOHistory />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
