import Rewards from "./rewards";
import Add from './add';
import { useRouter } from "next/router";

function Home({ changeTheme, ...props }) {
  const router = useRouter();
  const activePath = router.asPath;
  if (activePath.includes("/")) {
    return <Rewards props={props} changeTheme={changeTheme} />;
  } else if (activePath.includes("/add")) {
    return <Add props={props} changeTheme={changeTheme} />;
  } else {
    return <Rewards props={props} changeTheme={changeTheme} />;
  }
}

export default Home;
