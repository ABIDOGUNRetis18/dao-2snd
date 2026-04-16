import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import LayoutWrapper from './layouts/LayoutWrapper'
import AdminDashboard from './pages/admin/Dashboard'
import CreateUser from './pages/admin/CreateUser'
import CreateDAO from './pages/admin/CreateDAO'
import EditDAO from './pages/admin/EditDAO'
import DAODetails from './pages/admin/DAODetails'
import DAOTasks from './pages/admin/DAOTasks'
import MyDAO from './pages/admin/MyDAO'
import MyDAOsAsChef from './pages/admin/MyDAOsAsChef'
import AllDAOs from './pages/admin/AllDAOs'
import MyTasks from './pages/admin/MyTasks'
import AllTasks from './pages/admin/AllTasks'
import FinishedDAOHistory from './pages/admin/FinishedDAOHistory'
import Profile from './pages/admin/Profile'
import DirecteurGeneral from './pages/directeur-general/DirecteurGeneral'
import ChefProjetDashboard from './pages/chef-projet/ChefProjetDashboard'
import MesDAO from './pages/chef-projet/MesDAO'
import MesTaches from './pages/chef-projet/MesTaches'
import ChefProjetDAODetails from './pages/chef-projet/DAODetails'
import ChefProjetDAOTasks from './pages/chef-projet/DAOTasks'
import MembreEquipe from './pages/membre-equipe/MembreEquipe'
import MembreEquipeMyTasks from './pages/membre-equipe/MyTasks'
import Lecteur from './pages/lecteur/Lecteur'
import AuthenticatedLayout from './components/AuthenticatedLayout'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route element={
            <AuthenticatedLayout>
              <LayoutWrapper />
            </AuthenticatedLayout>
          }>
            <Route path="directeur-general" element={<DirecteurGeneral />} />

            <Route path="chef-projet">
              <Route index element={<ChefProjetDashboard />} />
              <Route path="dashboard" element={<ChefProjetDashboard />} />
              <Route path="mes-daos" element={<MesDAO />} />
              <Route path="mes-taches" element={<MesTaches />} />
              <Route path="dao/:id" element={<ChefProjetDAODetails />} />
              <Route path="dao/:id/tasks" element={<ChefProjetDAOTasks />} />
            </Route>

            <Route path="membre-equipe" element={<MembreEquipe />} />
            <Route path="membre-equipe/tasks" element={<MembreEquipeMyTasks />} />
            <Route path="membre-equipe/profile" element={<Profile />} />

            <Route path="lecteur" element={<Lecteur />} />

            <Route path="admin">
              <Route index element={<AdminDashboard />} />
              <Route path="create-user" element={<CreateUser />} />
              <Route path="create-dao" element={<CreateDAO />} />
              <Route path="edit-dao/:id" element={<EditDAO />} />
              <Route path="dao/:id" element={<DAODetails />} />
              <Route path="dao/:id/details" element={<DAODetails />} />
              <Route path="dao/:id/tasks" element={<DAOTasks />} />
              <Route path="my-daos" element={<MyDAO />} />
              <Route path="my-daos-as-chef" element={<MyDAOsAsChef />} />
              <Route path="all-daos" element={<AllDAOs />} />
              <Route path="my-tasks" element={<MyTasks />} />
              <Route path="all-tasks" element={<AllTasks />} />
              <Route path="history" element={<FinishedDAOHistory />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
