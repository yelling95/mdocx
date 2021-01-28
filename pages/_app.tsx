import { AppProps } from 'next/app'
import '../styles/globals.css'
import '../styles/editor.css'

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
