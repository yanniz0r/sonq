import { QueryClientProvider } from 'react-query'
import '../styles/globals.css'
import "tailwindcss/tailwind.css";
import queryClient from '../config/query-client';

function MyApp({ Component, pageProps }) {
  return <QueryClientProvider client={queryClient}>
    <Component {...pageProps} />
  </QueryClientProvider>
}

export default MyApp
