import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import LoadingFile from "@/assets/Loading.lottie?url";

function Loading() {
  return (
    <div className="flex w-full justify-center">
      <DotLottieReact
        src={LoadingFile}
        autoplay
        loop
        style={{ width: 100, height: 100 }}
      />
    </div>
  );
}

export default Loading;
