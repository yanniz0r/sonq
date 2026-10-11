import { MAX_PLAYERS, ROUND_OPTIONS } from '@sonq/game'

// The explanatory copy below the home page form. It's what search engines
// read to learn what sonq is, so it stays plain, crawlable text. FAQ also
// feeds the page's structured data.

const [FEW, SOME, MANY] = ROUND_OPTIONS

const STEPS = [
  {
    title: 'Open a room',
    text: 'Create a room and send the link or the four-letter code to your friends. No account, no app.',
  },
  {
    title: 'Pick a playlist',
    text: "Choose one of Deezer's featured playlists, search for any genre, artist or decade, or paste a link to your own public Deezer playlist.",
  },
  {
    title: 'Guess the song',
    text: 'Every round plays the same 30-second preview for everyone. Find the song in the search. The faster you are, the more points you get.',
  },
]

export const FAQ = [
  {
    question: 'Is sonq free?',
    answer:
      "Yes. sonq is free to play in your browser on phone, tablet and desktop. There's no sign-up and nothing to install.",
  },
  {
    question: 'How many people can play?',
    answer: `Up to ${MAX_PLAYERS} players per room. You can also play on your own to practise.`,
  },
  {
    question: 'Which songs are in the game?',
    answer:
      "Songs from any public Deezer playlist: the charts, a genre, a decade, an artist or a playlist you made yourself. You don't need a Deezer account.",
  },
  {
    question: 'How does scoring work?',
    answer:
      "A correct guess is worth up to 1,000 points when the music starts, dropping to 100 by the end of the round. Live and remastered versions of the right song count too. Wrong guesses don't cost points, but you have to wait two seconds before guessing again.",
  },
  {
    question: 'How long is a game?',
    answer: `The host picks ${FEW}, ${SOME} or ${MANY} rounds. Each round lasts at most 30 seconds, so a game of 10 rounds takes up to about seven minutes.`,
  },
  {
    question: 'Can we play together remotely?',
    answer:
      'Yes. Everyone hears the preview on their own device at the same time, so sonq works on a video call or Discord just as well as on the couch.',
  },
]

export function About() {
  return (
    <div className="mt-10 flex flex-col gap-12 text-neutral-300">
      <section aria-labelledby="how-to-play">
        <h2
          id="how-to-play"
          className="font-display text-2xl font-black text-neutral-100"
        >
          How to play
        </h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-white/10 bg-white/3 p-4"
            >
              <span className="font-display text-sm font-bold text-fuchsia-400">
                {i + 1}
              </span>
              <h3 className="mt-1 font-semibold text-neutral-100">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-neutral-400">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="faq">
        <h2
          id="faq"
          className="font-display text-2xl font-black text-neutral-100"
        >
          Frequently asked questions
        </h2>
        <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {FAQ.map((item) => (
            <div key={item.question}>
              <dt className="font-semibold text-neutral-100">
                {item.question}
              </dt>
              <dd className="mt-1 text-sm text-neutral-400">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="border-t border-white/10 pt-6 text-center text-xs text-neutral-500">
        Song previews and playlists provided by{' '}
        <a
          href="https://www.deezer.com"
          className="underline hover:text-neutral-300"
        >
          Deezer
        </a>
        . sonq is{' '}
        <a
          href="https://github.com/yanniz0r/sonq"
          className="underline hover:text-neutral-300"
        >
          open source
        </a>
        .
      </footer>
    </div>
  )
}
