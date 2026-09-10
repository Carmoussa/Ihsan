import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Layout({ children }) {
  const { user, admin, deconnexion } = useAuth()

  return (
    <>
      <header className="entete">
        <div className="entete-interieur">
          <Link to="/" className="entete-titre">
            Ihsan
          </Link>
          <nav style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
            {admin ? (
              <>
                <Link to="/admin" className="entete-lien">
                  Administration
                </Link>
                <button
                  onClick={deconnexion}
                  className="entete-lien"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              <Link to="/admin" className="entete-lien">
                Espace administrateur
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main>
        <div className="conteneur">{children}</div>
      </main>
      <footer className="pied">
        <div className="conteneur">{user?.email || '\u00A0'}</div>
      </footer>
    </>
  )
}
