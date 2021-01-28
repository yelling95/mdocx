import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Uploader from '../src/components/Uploader'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>{`MD => DOCX`}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.title}>{`MD => DOCX`}</h1>
        <Uploader/>
      </main>
    </div>
  )
}

export function getStaticProps ({ params }) {
  return {
    props: {
      
    }
  }
}