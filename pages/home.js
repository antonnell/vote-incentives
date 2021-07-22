import Voting from "./voting";
import { useRouter } from "next/router";

function Home({ changeTheme, ...props }) {
  const router = useRouter();
  const activePath = router.asPath;
  if (activePath.includes("/")) {
    return <Voting props={props} changeTheme={changeTheme} />;
  } else {
    return <Voting props={props} changeTheme={changeTheme} />;
  }
}

export default Home; 
