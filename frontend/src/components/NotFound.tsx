import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import NotFoundFile from "@/assets/error404.lottie?url";
import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className=" bg-white rounded-xl max-w-md flex flex-col items-center p-6 shadow-md text-center space-y-4">
        <DotLottieReact
          src={NotFoundFile}
          autoplay
          loop
          style={{ width: 300, height: 300 }}
        />
        <h2 className="text-3xl text-[#193326]">Page Not Found</h2>
        <p className="text-[#193326]/80 text-sm">
          Sorry, we couldn't find the page you're looking for. The page might
          have been removed or the URL might be incorrect.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-1 rounded-full text-[#193326] bg-background hover:bg-gray-200 transition-all duration-150 cursor-pointer"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-1 rounded-full text-white bg-primary-400 hover:bg-primary-500 transition-all duration-150 cursor-pointer"
          >
            Back to Home
          </button>
        </div>
        <div className="border-t border-gray-100 pt-4 text-sm text-[#193326]/60">
          If you believe this is an error, please contact support.
        </div>
      </div>
    </div>
  );
}

export default NotFound;
