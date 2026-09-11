import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Accueil from './pages/Accueil'
import ListePersonnes from './pages/ListePersonnes'
import Personne from './pages/Personne'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/temoignages" element={<ListePersonnes />} />
        <Route path="/personne/:pageId" element={<Personne />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<p className="vide">Page introuvable.</p>} />
      </Routes>
    </Layout>
  )
}
