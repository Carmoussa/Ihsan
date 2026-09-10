import { Link } from 'react-router-dom'

// Texte de bienvenue, version resserrée validée avec Malika — la traduction
// arabe corrige "nos souvenirs" (ذِكْرَيَاتِنَا) par rapport à la première
// version auto-traduite. La phrase de fin arabe reprend son texte d'origine.
export default function Accueil() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 0' }}>
      <section lang="ar" dir="rtl" className="texte-arabe" style={{ textAlign: 'right' }}>
        <h1 style={{ fontFamily: 'var(--arabe)', fontSize: '1.6rem', marginBottom: '0.8em' }}>
          مَرْحَبًا بِكُمْ فِي إِحْسَان
        </h1>
        <p>
          لِأَنَّ مَنْ يُفَارِقُنَا يَبْقَى حَيًّا فِي ذِكْرَيَاتِنَا، خُصِّصَ هَذَا الفَضَاءُ
          لِذِكْرِهِمْ، وَالتَّوَاصُلِ، وَالإِحْسَانِ بِاسْمِهِمْ.
        </p>
        <p>
          شَارِكُونَا هُنَا ذِكْرَى أَوْ مَوْقِفًا أَوْ كَلِمَةً فِي حَقِّ مَنْ تَرَكُوا أَثَرًا فِي
          حَيَاتِنَا. ادْخُلُوا بِاحْتِرَامٍ، وَاقْرَؤُوا بِعَاطِفَةٍ، وَاكْتُبُوا مِنَ القَلْبِ.
        </p>
        <p>نَسْأَلُ اللَّهَ أَنْ يَرْحَمَ الأَحْيَاءَ مِنَّا وَالأَمْوَاتَ.</p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '16px 0' }} />

      <section lang="fr" dir="ltr" style={{ lineHeight: 1 }}>
        <h2 style={{ marginBottom: '0.6em' }}>Bienvenue sur Ihsan</h2>
        <p>
          Parce que ceux qui nous quittent continuent de vivre à travers nos
          souvenirs, cet espace leur est dédié : pour se souvenir, rester en
          lien, et faire le bien en leur nom.
        </p>
        <p>
          Partagez ici une anecdote, un souvenir, un mot pour celles et ceux
          qui nous ont marqués. Entrez avec respect, lisez avec émotion,
          écrivez avec le cœur.
        </p>
        <p>Puisse Allah accorder Sa miséricorde aux vivants ainsi qu'aux défunts.</p>
      </section>

      <div style={{ textAlign: 'center' }}>
        <Link
          to="/temoignages"
          className="bouton"
          style={{ display: 'inline-block', marginTop: 16, textDecoration: 'none' }}
        >
          Voir les témoignages
        </Link>
      </div>
    </div>
  )
}
