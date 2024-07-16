import NowPlayingMovies from "./(components)/NowplayMovies/NowPlayingMovies";
import styles from "./page.module.css";
import SearchBar from "@/(components)/SearchBar/SearchBar";

export default function Index() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.background} />
      <div className={styles.logoContainer}>
        <img
          src="https://media.discordapp.net/attachments/1239113879183818823/1262380692348862494/497d6bd4326300dc.png?ex=66966322&is=669511a2&hm=df79d599313ed06064248bf33abc643aa08458168872f6294eb92065ab36f935&=&format=webp&quality=lossless"
          alt="Logo"
          className={styles.logo}
        />
      </div>
      <NowPlayingMovies />
    </div>
  );
}
