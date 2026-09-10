import { Link } from 'react-router-dom'

// Texte fourni par Malika. La version arabe est une traduction qu'elle a
// elle-même signalée comme automatique et possiblement imparfaite par
// endroits ("nos souvenirs" notamment) — laissée telle quelle, à affiner
// de son côté si besoin.
export default function Accueil() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 0' }}>
      <section lang="ar" dir="rtl" className="texte-arabe" style={{ textAlign: 'right' }}>
        <h1 style={{ fontFamily: 'var(--arabe)', fontSize: '1.6rem', marginBottom: '0.8em' }}>
          مَرْحَبًا بِكُمْ فِي إِحْسَان
        </h1>
        <p>
          لأنَّ الرَّاحِلِينَ عَنَّا يَسْتَمِرُّونَ فِي الحَيَاةِ عَبْرَ ذِكْرَاهُمْ، خُصِّصَ هَذَا
          الفَضَاءُ لِذِكْرَاهُمْ، وَالتَّوَاصُلِ، وَالبِرِّ وَالإِحْسَانِ.
        </p>
        <p>
          إِنَّ العَزِيزَ عَلَى قُلُوبِنَا يَعِيشُ عَبْرَ الإِرْثِ الثَّمِينِ الَّذِي يَتْرُكُهُ. لَقَدْ
          تَمَّ إِنْشَاءُ هَذَا المَوْقِعِ لِمُشَارَكَةِ هَذَا الإِرْثِ، وَلِكَيْ نَتَذَكَّرَ مَا خَلَّفُوهُ
          لَنَا.
        </p>
        <p>
          وَامْتِثَالاً لِذِكْرِ مَحَاسِنِ مَوْتَانَا، نَدْعُوكُمْ لِمُشَارَكَةِ قِصَصِكُمْ وَأَجْمَلِ
          ذِكْرَيَاتِكُمْ مَعَهُمْ هُنَا. ادْخُلُوا بِاحْتِرَامٍ، وَاقْرَؤُوا بِعَاطِفَةٍ، وَاكْتُبُوا مِنَ
          القَلْبِ.
        </p>
        <p>نَسْأَلُ اللَّهَ أَنْ يَرْحَمَ الأَحْيَاءَ مِنَّا وَالأَمْوَاتَ.</p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '32px 0' }} />

      <section lang="fr" dir="ltr">
        <h2 style={{ marginBottom: '0.6em' }}>Bienvenue sur Ihsan</h2>
        <p>
          Parce que les êtres qui nous quittent continuent de vivre à travers nos
          souvenirs, cet espace est dédié à leur mémoire, à la transmission et à
          la bienveillance.
        </p>
        <p>
          Un être cher vit au travers de l'héritage précieux qu'il laisse. Ce
          site a été créé pour partager ces héritages, et se rappeler ce qu'ils
          ont légué.
        </p>
        <p>
          Évoquant nos défunts par ce qu'ils avaient de meilleur, partagez ici
          vos anecdotes et vos plus beaux souvenirs avec eux. Entrez avec
          respect, lisez avec émotion, et écrivez avec le cœur.
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
