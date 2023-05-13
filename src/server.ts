import { BigNumber } from "ethers";
import { start, stop } from "./api";
start()
  .then(() => {
    console.log("Server started");
    process.on("SIGINT", (_sig) => {
      stop();
      process.exit(0);
    });
  })
  .catch((err) => {
    console.error(err);
    stop();
  });
