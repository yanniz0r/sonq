import { QueryClient, QueryClientProvider } from 'react-query'
import '../styles/globals.css'
import "tailwindcss/tailwind.css";

function MyApp({ Component, pageProps }) {
  return <QueryClientProvider client={new QueryClient()}>
    <Component {...pageProps} />
  </QueryClientProvider>
}

export default MyApp
